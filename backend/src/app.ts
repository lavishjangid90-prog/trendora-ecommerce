import express from "express";
import path from "path";
import cors from "cors";
import mongoose from "mongoose";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createHmac, randomUUID } from "crypto";
import { GoogleGenAI } from "@google/genai";
import { backendDir, dataFiles, environment, envPath, frontendDist, paths } from "./config/environment";
import { createAuthMiddleware } from "./middlewares/auth.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import { readJsonFile, writeJsonFile as writeJsonRepository } from "./repositories/json.repository";
import { normalizeProductCode } from "./utils/product-code";
import { createProductController } from "./controllers/product.controller";
import { createProductRouter } from "./routes/product.routes";

console.log("Backend cwd =", process.cwd());
console.log("Backend env file =", envPath);
console.log("MONGODB_URI loaded =", Boolean(process.env.MONGODB_URI));

// Mock Data
const MOCK_PRODUCTS = [
  {
    _id: "p1",
    code: "STR-000001",
    name: "Oversized Streetwear T-Shirt",
    price: 899,
    originalPrice: 1499,
    discount: 40,
    category: "Streetwear",
    image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800",
    rating: 4.8,
    reviews: 124,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    description: "Premium oversized drop-shoulder t-shirt perfect for streetwear. Made from 100% heavy cotton.",
    isTrending: true
  },
  {
    _id: "p2",
    code: "MEN-000002",
    name: "Classic Denim Jacket",
    price: 1999,
    originalPrice: 3499,
    discount: 43,
    category: "Men's Fashion",
    image: "https://images.unsplash.com/photo-1495105787522-5334e3ffa0ebd?auto=format&fit=crop&q=80&w=800",
    rating: 4.6,
    reviews: 89,
    sizes: ["M", "L", "XL"],
    colors: ["Blue", "Black"],
    description: "A timeless classic. Rugged denim jacket perfect for layering. Features standard fit.",
    isTrending: true
  },
  {
    _id: "p3",
    code: "WOM-000003",
    name: "Women's Floral Summer Dress",
    price: 1299,
    originalPrice: 2499,
    discount: 48,
    category: "Women's Fashion",
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&q=80&w=800",
    rating: 4.9,
    reviews: 210,
    sizes: ["XS", "S", "M", "L"],
    colors: ["Floral Red", "Floral Blue"],
    description: "Lightweight and breathable. Perfect for summer outgoings.",
    isTrending: false
  },
  {
    _id: "p4",
    code: "SNE-000004",
    name: "Chunky White Sneakers",
    price: 2499,
    originalPrice: 4999,
    discount: 50,
    category: "Sneakers",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800",
    rating: 4.7,
    reviews: 342,
    sizes: ["7", "8", "9", "10", "11"],
    colors: ["White", "Off-White"],
    description: "Trend-setting chunky sneakers with maximum comfort and elevation.",
    isTrending: true
  },
  {
    _id: "p5",
    code: "HOO-000005",
    name: "Essential Pullover Hoodie",
    price: 1499,
    originalPrice: 2999,
    discount: 50,
    category: "Hoodies",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
    rating: 4.5,
    reviews: 156,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Grey", "Black", "Navy"],
    description: "Fleece-lined interior for optimal warmth.",
    isTrending: false
  },
  {
    _id: "p6",
    code: "ACC-000006",
    name: "Minimalist Crossbody Bag",
    price: 999,
    originalPrice: 1999,
    discount: 50,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=800",
    rating: 4.8,
    reviews: 94,
    sizes: ["One Size"],
    colors: ["Black", "Tan"],
    description: "Sleek and functional everyday carry bag.",
    isTrending: true
  }
];

type Product = (typeof MOCK_PRODUCTS)[number] & {
  sku?: string;
  costPrice?: number;
  lowStockThreshold?: number;
  stock?: number;
  images?: string[];
  variants?: string[];
  keywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
};
type OrderRecord = {
  _id: string;
  amount: number;
  currency: string;
  paymentMode: "razorpay" | "mock" | "cod";
  status: "created" | "placed" | "packed" | "shipped" | "delivered" | "cancelled" | "return_requested" | "returned";
  paymentStatus?: "pending" | "paid" | "failed" | "cod" | "mock";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: string;
  paymentFailureReason?: string;
  stockReleasedAt?: string;
  returnStatus?: "none" | "requested" | "approved" | "rejected" | "completed";
  shippingStatus?: "pending" | "label_created" | "in_transit" | "delivered";
  trackingId?: string;
  invoiceId?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  address?: {
    fullName?: string;
    phone?: string;
    pincode?: string;
    city?: string;
    state?: string;
    addressLine?: string;
  };
  items?: Array<{
    product?: Product;
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
  statusHistory?: Array<{ status: string; note: string; at: string }>;
  createdAt: string;
};
type AccountUser = {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: "user" | "admin" | "manager";
  blocked: boolean;
  createdAt: string;
  orders: number;
  spent: number;
  avatar?: string;
};
type Coupon = {
  _id: string;
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  expiresAt: string;
  active: boolean;
  usageLimit: number;
  used: number;
};
type Banner = {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  placement: "homepage" | "promotional";
  active: boolean;
};

type AdminNotification = {
  _id: string;
  key: string;
  type: "low_stock" | "new_order" | "pending_order" | "shipping_reminder" | "delivery_reminder" | "return_requested" | "bulk_upload" | "product_update";
  severity: "info" | "success" | "warning" | "danger";
  title: string;
  message: string;
  entityId?: string;
  entityType?: "order" | "product" | "user" | "bulk";
  link?: string;
  readAt?: string;
  createdAt: string;
};

type AiAnalyticsRecord = {
  _id: string;
  createdAt: string;
  source: "stylist";
  mode?: "style" | "room";
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  budget?: string;
  preferredStyle?: string;
  occasion?: string;
  roomType?: string;
  roomSize?: string;
  existingColors?: string;
  question?: string;
  imageUrl: string;
  productIds: string[];
  analysis: string;
};

const products: Product[] = [...MOCK_PRODUCTS];
const orders: OrderRecord[] = [];
const users: AccountUser[] = [];
const coupons: Coupon[] = [];
const banners: Banner[] = [];
const notifications: AdminNotification[] = [];
const aiAnalytics: AiAnalyticsRecord[] = [];
const frontendRoot = paths.frontendRoot;
const dataDir = paths.dataDir;
const uploadsDir = dataFiles.uploadsDir;
const productsFile = dataFiles.products;
const ordersFile = dataFiles.orders;
const usersFile = dataFiles.users;
const couponsFile = dataFiles.coupons;
const bannersFile = dataFiles.banners;
const notificationsFile = dataFiles.notifications;
const aiAnalyticsFile = dataFiles.aiAnalytics;
const { adminEmail, adminPassword, jwtSecret, geminiApiKey } = environment;

function generateProductCode(category: unknown) {
  const prefix = normalizeProductCode(category).slice(0, 3) || "TRD";
  let code = "";
  do {
    code = `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  } while (products.some((product) => product.code === code));
  return code;
}

function getPublicUser(user: AccountUser) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function makeAuthToken(user: AccountUser) {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: "7d" },
  );
}

function getRequestUser(req: express.Request) {
  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) return null;

  try {
    const payload = jwt.verify(token, jwtSecret) as { sub?: string; email?: string; role?: string };
    const user = users.find((item) => item._id === payload.sub || item.email.toLowerCase() === String(payload.email || "").toLowerCase());
    if (!user || user.blocked) return null;
    return user;
  } catch {
    return null;
  }
}

function chooseRecommendedProducts(analysisText: string, contextText = "") {
  const normalized = [analysisText, contextText].join(" ").toLowerCase();
  const selection = new Set<string>();

  const addMatches = (matcher: (product: Product) => boolean) => {
    for (const product of products) {
      if (selection.size >= 6) break;
      if (matcher(product)) selection.add(product._id);
    }
  };

  addMatches((product) =>
    product.name.toLowerCase().split(/\s+/).some((word) => normalized.includes(word))
  );

  addMatches((product) =>
    product.category.toLowerCase().split(/\s+/).some((word) => normalized.includes(word))
  );

  addMatches((product) =>
    product.colors.some((color) => normalized.includes(color.toLowerCase()))
  );

  const categoryKeywords = Array.from(new Set(products.map((product) => product.category.toLowerCase())));
  for (const category of categoryKeywords) {
    if (selection.size >= 6) break;
    if (normalized.includes(category)) {
      addMatches((product) => product.category.toLowerCase() === category);
    }
  }

  if (selection.size < 6) {
    addMatches((product) => product.isTrending);
  }
  if (selection.size < 6) {
    addMatches(() => true);
  }

  return products.filter((product) => selection.has(product._id)).slice(0, 6);
}

function buildStylistContext(query: express.Request["query"]) {
  const details = [
    query.gender ? `gender: ${query.gender}` : "",
    query.age ? `age: ${query.age}` : "",
    query.heightCm || query.height ? `height: ${query.heightCm || query.height} cm` : "",
    query.weightKg || query.weight ? `weight: ${query.weightKg || query.weight} kg` : "",
    query.budget ? `budget: ${query.budget}` : "",
    query.preferredStyle || query.style ? `preferred style: ${query.preferredStyle || query.style}` : "",
    query.occasion ? `occasion: ${query.occasion}` : "",
  ].filter(Boolean);

  return details.length ? details.join(", ") : "No extra customer preferences shared.";
}

function sanitizeAiText(value: unknown, fallback = "") {
  return String(value || fallback).trim().slice(0, 600);
}

function normalizeAdvisorMode(value: unknown): "style" | "room" {
  return String(value || "").toLowerCase() === "room" ? "room" : "style";
}

function buildAdvisorContext(input: Record<string, unknown>) {
  const mode = normalizeAdvisorMode(input.mode);
  const details = mode === "room"
    ? [
        input.roomType ? `room type: ${sanitizeAiText(input.roomType)}` : "",
        input.roomSize ? `room size: ${sanitizeAiText(input.roomSize)}` : "",
        input.existingColors ? `existing colors/materials: ${sanitizeAiText(input.existingColors)}` : "",
        input.budget ? `budget: ${sanitizeAiText(input.budget)}` : "",
        input.preferredStyle ? `decor style: ${sanitizeAiText(input.preferredStyle)}` : "",
        input.question ? `customer question: ${sanitizeAiText(input.question)}` : "",
      ].filter(Boolean)
    : [
        input.gender ? `gender: ${sanitizeAiText(input.gender)}` : "",
        input.age ? `age: ${sanitizeAiText(input.age)}` : "",
        input.heightCm ? `height: ${sanitizeAiText(input.heightCm)} cm` : "",
        input.weightKg ? `weight: ${sanitizeAiText(input.weightKg)} kg` : "",
        input.bodyType ? `fit preference/body note: ${sanitizeAiText(input.bodyType)}` : "",
        input.budget ? `budget: ${sanitizeAiText(input.budget)}` : "",
        input.preferredStyle ? `preferred style: ${sanitizeAiText(input.preferredStyle)}` : "",
        input.occasion ? `occasion: ${sanitizeAiText(input.occasion)}` : "",
        input.question ? `customer question: ${sanitizeAiText(input.question)}` : "",
      ].filter(Boolean);

  return details.length ? details.join(", ") : "No customer preferences shared.";
}

function buildLocalAdvisorAnalysis(mode: "style" | "room", context: string, recommendedProducts: Product[]) {
  const productLine = recommendedProducts.length
    ? recommendedProducts.map((product) => `${product.name} (${product.code})`).join(", ")
    : "No matching catalog products are available yet.";

  if (mode === "room") {
    return [
      `Room advisor summary: ${context}`,
      "Use a clear focal point first, then add products that match the room's color temperature, storage needs, and walking space.",
      `Trendora catalog matches: ${productLine}`,
      "For a stronger room setup, add decor/home products in admin with keywords like lamp, cushion, wall art, rug, storage, mirror, curtain, table, and plant.",
    ].join("\n\n");
  }

  return [
    `Style advisor summary: ${context}`,
    "Choose pieces that balance fit, occasion, color contrast, and comfort. Start with one main item, then add shoes or accessories that repeat one color from the look.",
    `Trendora catalog matches: ${productLine}`,
    "For best results, upload a full-length clear photo and mention the event, budget, and preferred fit.",
  ].join("\n\n");
}

function parseImageDataUrl(value: unknown) {
  const raw = String(value || "");
  const match = raw.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-z0-9+/=]+)$/i);
  if (!match) return null;
  return {
    mimeType: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function saveAdvisorImage(image: ReturnType<typeof parseImageDataUrl>) {
  if (!image || !image.buffer.length) return "";

  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = mimeToExt[image.mimeType] || "jpg";
  const filename = `${randomUUID()}.${ext}`;
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), image.buffer);
  return `/uploads/${filename}`;
}

function buildAiProductCatalog() {
  return products.slice(0, 40).map((product) => ({
    id: product._id,
    code: product.code,
    name: product.name,
    category: product.category,
    price: product.price,
    colors: product.colors,
    sizes: product.sizes,
    keywords: product.keywords || [],
    description: product.description,
  }));
}

function extractRecommendedProducts(text: string) {
  const normalized = String(text || "").toLowerCase();
  const ids = new Set((normalized.match(/\bp[0-9]+\b/g) || []).map((id) => id.toLowerCase()));
  const codes = new Set(
    (normalized.match(/\b[a-z]{3}-[0-9]{6}\b/g) || []).map((code) => code.toUpperCase()),
  );

  return products
    .filter((product) => ids.has(product._id.toLowerCase()) || codes.has(String(product.code || "").toUpperCase()))
    .slice(0, 6);
}

function mergeRecommendedProducts(primary: Product[], fallback: Product[]) {
  const merged = new Map<string, Product>();
  [...primary, ...fallback].forEach((product) => {
    if (merged.size < 6) {
      merged.set(product._id, product);
    }
  });
  return Array.from(merged.values());
}

function buildStockReservation(orderItems: OrderRecord["items"]) {
  const normalizedItems = Array.isArray(orderItems) ? orderItems : [];
  const stockChanges = new Map<string, number>();

  for (const item of normalizedItems) {
    const productId = item?.product?._id;
    const quantity = Number(item?.quantity || 0);

    if (!productId || quantity < 1) {
      throw new Error("Invalid cart item.");
    }

    const product = products.find((entry) => entry._id === productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const currentReserved = stockChanges.get(productId) || 0;
    const requested = currentReserved + quantity;
    const available = Number(product.stock ?? 0);

    if (available < requested) {
      throw new Error(`${product.name} stock is only ${available}.`);
    }

    stockChanges.set(productId, requested);
  }

  for (const [productId, quantity] of stockChanges.entries()) {
    const product = products.find((entry) => entry._id === productId);
    if (product) {
      product.stock = Math.max(0, Number(product.stock ?? 0) - quantity);
    }
  }

  return { normalizedItems, stockChanges };
}

function releaseStock(reservations: Map<string, number>) {
  for (const [productId, quantity] of reservations.entries()) {
    const product = products.find((entry) => entry._id === productId);
    if (product) {
      product.stock = Number(product.stock ?? 0) + quantity;
    }
  }
}

function releaseOrderStock(order: OrderRecord) {
  const reservations = new Map<string, number>();
  for (const item of Array.isArray(order.items) ? order.items : []) {
    const productId = item?.product?._id;
    const quantity = Number(item?.quantity || 0);
    if (!productId || quantity < 1) continue;
    reservations.set(productId, (reservations.get(productId) || 0) + quantity);
  }
  releaseStock(reservations);
}

function buildStatusHistory(status: OrderRecord["status"], note: string) {
  return [{ status, note, at: new Date().toISOString() }];
}

function notificationId() {
  return `n_${Date.now()}_${randomUUID().slice(0, 8)}`;
}

function upsertNotification(input: Omit<AdminNotification, "_id" | "createdAt"> & { createdAt?: string }) {
  const now = input.createdAt || new Date().toISOString();
  const existing = notifications.find((item) => item.key === input.key);

  if (existing) {
    const wasUnread = !existing.readAt;
    existing.type = input.type;
    existing.severity = input.severity;
    existing.title = input.title;
    existing.message = input.message;
    existing.entityId = input.entityId;
    existing.entityType = input.entityType;
    existing.link = input.link;
    existing.createdAt = now;
    if (input.readAt !== undefined) existing.readAt = input.readAt;
    else if (wasUnread && input.readAt === undefined) existing.readAt = existing.readAt;
    return existing;
  }

  const item: AdminNotification = {
    _id: notificationId(),
    key: input.key,
    type: input.type,
    severity: input.severity,
    title: input.title,
    message: input.message,
    entityId: input.entityId,
    entityType: input.entityType,
    link: input.link,
    readAt: input.readAt,
    createdAt: now,
  };
  notifications.unshift(item);
  return item;
}

async function persistNotifications() {
  await writeJsonFile(notificationsFile, notifications);
}

async function persistProducts() {
  await writeJsonFile(productsFile, products.filter((item) => !MOCK_PRODUCTS.some((mock) => mock._id === item._id)));
}

async function persistOrders() {
  await writeJsonFile(ordersFile, orders);
}

async function persistUsers() {
  await writeJsonFile(usersFile, users);
}

async function persistAiAnalytics() {
  await writeJsonFile(aiAnalyticsFile, aiAnalytics);
}

async function savePaymentRecord(record: Record<string, unknown>) {
  if (mongoose.connection.readyState !== 1) return;

  try {
    await mongoose.connection.collection("payments").updateOne(
      { orderId: record.orderId },
      { $set: { ...record, updatedAt: new Date().toISOString() }, $setOnInsert: { createdAt: new Date().toISOString() } },
      { upsert: true },
    );
  } catch (error) {
    console.error("MongoDB payment record save error:", error);
  }
}

function parseAdminTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

function ageInMinutes(value: string) {
  return (Date.now() - parseAdminTimestamp(value)) / 60000;
}

function syncAdminNotifications() {
  for (const product of products) {
    const stock = Number(product.stock ?? 0);
    const lowStockThreshold = Number(product.lowStockThreshold ?? 5);
    if (stock <= lowStockThreshold) {
      upsertNotification({
        key: `low-stock:${product._id}`,
        type: "low_stock",
        severity: stock <= Math.max(2, Math.floor(lowStockThreshold / 2)) ? "danger" : "warning",
        title: `${product.name} low stock`,
        message: stock <= 0 ? "Product sold out. Restock immediately." : `${stock} unit(s) left. Reorder point is ${lowStockThreshold}.`,
        entityId: product._id,
        entityType: "product",
        link: "/admin?tab=products",
      });
    }
  }

  for (const order of orders) {
    const orderAge = ageInMinutes(order.createdAt);
    if ((order.status === "created" || order.status === "placed") && orderAge >= 10) {
      upsertNotification({
        key: `pending-order:${order._id}`,
        type: "pending_order",
        severity: "warning",
        title: `Pending order ${order._id}`,
        message: `Order has been waiting for ${Math.round(orderAge)} min.`,
        entityId: order._id,
        entityType: "order",
        link: "/admin?tab=orders",
      });
    }

    if (order.status === "packed" && order.shippingStatus !== "in_transit") {
      upsertNotification({
        key: `shipping-reminder:${order._id}`,
        type: "shipping_reminder",
        severity: "info",
        title: `Shipping reminder for ${order._id}`,
        message: "Packed order needs shipping status update.",
        entityId: order._id,
        entityType: "order",
        link: "/admin?tab=orders",
      });
    }

    if (order.status === "shipped" && order.shippingStatus !== "delivered" && orderAge >= 24 * 60) {
      upsertNotification({
        key: `delivery-reminder:${order._id}`,
        type: "delivery_reminder",
        severity: "warning",
        title: `Delivery follow-up for ${order._id}`,
        message: "Shipped order is still not marked delivered.",
        entityId: order._id,
        entityType: "order",
        link: "/admin?tab=orders",
      });
    }

    if (order.returnStatus === "requested") {
      upsertNotification({
        key: `return-requested:${order._id}`,
        type: "return_requested",
        severity: "danger",
        title: `Return requested for ${order._id}`,
        message: "Customer has requested a return. Review it from orders.",
        entityId: order._id,
        entityType: "order",
        link: "/admin?tab=orders",
      });
    }
  }
}

function normalizeDelimitedList(value: unknown) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildProductPayload(input: Record<string, unknown>) {
  const name = String(input.name || "").trim();
  const price = Number(input.price || 0);
  const originalPrice = Number(input.originalPrice || price);
  const category = String(input.category || "").trim();
  const image = String(input.image || "").trim();
  const description = String(input.description || "").trim();
  const code = normalizeProductCode(input.code);

  if (!name || !price || !category || !image || !description) {
    throw new Error("Name, price, category, image, and description are required.");
  }

  const productCode = code || generateProductCode(category);
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  return {
    _id: String(input._id || `p${Date.now()}${Math.floor(Math.random() * 1000)}`),
    code: productCode,
    sku: String(input.sku || productCode).trim(),
    name,
    price,
    originalPrice,
    discount,
    category,
    image,
    images: Array.isArray(input.images) ? (input.images as string[]) : normalizeDelimitedList(input.images || image),
    rating: Number(input.rating || 4.5),
    reviews: Number(input.reviews || 0),
    sizes: Array.isArray(input.sizes) ? (input.sizes as string[]) : normalizeDelimitedList(input.sizes || "S,M,L,XL"),
    colors: Array.isArray(input.colors) ? (input.colors as string[]) : normalizeDelimitedList(input.colors || "Black,White"),
    costPrice: Number(input.costPrice || 0),
    stock: Number(input.stock || 0),
    lowStockThreshold: Number(input.lowStockThreshold ?? 5),
    variants: Array.isArray(input.variants) ? (input.variants as string[]) : normalizeDelimitedList(input.variants || ""),
    keywords: Array.isArray(input.keywords) ? (input.keywords as string[]) : normalizeDelimitedList(input.keywords || ""),
    description,
    seoTitle: String(input.seoTitle || "").trim(),
    seoDescription: String(input.seoDescription || "").trim(),
    isTrending: Boolean(input.isTrending ?? true),
  } satisfies Product;
}

function parseBulkProducts(content: string, format: "json" | "csv") {
  if (format === "json") {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON bulk upload must be an array.");
    }
    return parsed as Record<string, unknown>[];
  }

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce<Record<string, unknown>>((acc, header, index) => {
      acc[header] = (values[index] || "").trim();
      return acc;
    }, {});
  });
}

async function writeJsonFile(filePath: string, data: unknown) {
  await writeJsonRepository(dataDir, filePath, data);
}

export async function startServer() {
  const app = express();
  const PORT = environment.port;
  const HOST = environment.host;
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  ].filter(Boolean);
  const isVercelOrigin = (origin: string) => /^https:\/\/.*\.vercel\.(app|dev)$/.test(origin);

  // Middleware
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || isVercelOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-file-name", "x-admin-key"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }));
  app.use(express.json({ limit: "12mb" }));
  app.use("/uploads", express.static(uploadsDir));

  const savedProducts = await readJsonFile<Product[]>(productsFile, []);
  const savedOrders = await readJsonFile<OrderRecord[]>(ordersFile, []);
  const savedUsers = await readJsonFile<AccountUser[]>(usersFile, []);
  const savedCoupons = await readJsonFile<Coupon[]>(couponsFile, []);
  const savedBanners = await readJsonFile<Banner[]>(bannersFile, []);
  const savedNotifications = await readJsonFile<AdminNotification[]>(notificationsFile, []);
  const savedAiAnalytics = await readJsonFile<AiAnalyticsRecord[]>(aiAnalyticsFile, []);
  products.splice(0, products.length, ...MOCK_PRODUCTS, ...savedProducts);
  products.forEach((product) => {
    product.code ||= generateProductCode(product.category);
    product.sku ||= product.code;
    product.keywords ||= [];
    product.lowStockThreshold ??= 5;
    product.costPrice ??= 0;
  });
  orders.splice(0, orders.length, ...savedOrders);
  aiAnalytics.splice(0, aiAnalytics.length, ...savedAiAnalytics);
  const fallbackUsers: AccountUser[] = [
    {
      _id: "u_demo_1",
      name: "Lavish Vlogs",
      email: "lavishvlogs70@gmail.com",
      passwordHash: await bcrypt.hash("trendora-user", 10),
      role: "admin",
      blocked: false,
      createdAt: new Date().toISOString(),
      orders: orders.length,
      spent: orders.reduce((sum, order) => sum + order.amount / 100, 0),
    },
  ];
  users.splice(0, users.length, ...(savedUsers.length ? savedUsers : fallbackUsers));
  coupons.splice(0, coupons.length, ...savedCoupons);
  const fallbackBanners: Banner[] = [
    {
      _id: "b_home_1",
      title: "Flat 50% Off",
      subtitle: "End of season fashion sale",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200",
      link: "/categories?category=Streetwear",
      placement: "homepage",
      active: true,
    },
  ];
  banners.splice(0, banners.length, ...(savedBanners.length ? savedBanners : fallbackBanners));
  notifications.splice(0, notifications.length, ...savedNotifications);
  syncAdminNotifications();
  await persistNotifications().catch((err) => console.error("Notification save error:", err));

  const { requireAdmin, requireCustomer } = createAuthMiddleware({
    adminPassword,
    jwtSecret,
    getRequestUser,
  });

  app.use("/api", createProductRouter(createProductController(products, banners)));

  // Conditional DB Connection
  let isDbConnected = false;

  if (environment.mongoUri) {
    try {
      await mongoose.connect(environment.mongoUri);
      console.log("Connected to MongoDB Atlas");
      isDbConnected = true;
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.log("MONGODB_URI not found. Running with mock data.");
  }

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", dbConnected: isDbConnected });
  });

  app.post("/api/recommendations/advisor", async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const mode = normalizeAdvisorMode(body.mode);
    const advisorContext = buildAdvisorContext(body);
    const image = parseImageDataUrl(body.imageDataUrl);

    if (String(body.imageDataUrl || "").trim() && !image) {
      res.status(400).json({ message: "Image must be a jpeg, png, webp, or gif data URL." });
      return;
    }

    let imageUrl = "";
    try {
      imageUrl = await saveAdvisorImage(image);
    } catch (error) {
      console.error("Advisor image save error:", error);
      res.status(500).json({ message: "Image upload save nahi ho paya." });
      return;
    }

    const baseMatches = chooseRecommendedProducts(
      [
        advisorContext,
        mode === "room"
          ? "home decor room lamp cushion storage mirror rug wall art accessory"
          : "fashion outfit shoes accessories streetwear formal dress oversized",
      ].join(" "),
    );
    let recommendedProducts = baseMatches;
    let analysis = buildLocalAdvisorAnalysis(mode, advisorContext, recommendedProducts);

    if (geminiApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const catalog = buildAiProductCatalog();
        const prompt = mode === "room"
          ? [
              "You are Trendora's room styling and product advisor.",
              "Analyze the customer's room photo if present and their room details.",
              `Customer details: ${advisorContext}.`,
              "Give practical room decoration advice: layout, color, lighting, storage, and which products would help.",
              "Recommend up to 6 matching products only from this Trendora catalog when suitable.",
              "If the catalog has no true home decor item, say which product types the seller should add and still recommend only relevant available accessories.",
              "For each catalog recommendation, include exact product id or product code.",
              "Return concise natural language text; do not use markdown.",
              `Catalog JSON: ${JSON.stringify(catalog)}`,
            ].join("\n\n")
          : [
              "You are Trendora's professional fashion stylist.",
              "Analyze the customer's photo if present and their body/style details.",
              `Customer details: ${advisorContext}.`,
              "Suggest fits, colors, occasion styling, and up to 6 matching products only from this Trendora catalog.",
              "For each catalog recommendation, include exact product id or product code.",
              "Return concise natural language text; do not use markdown.",
              `Catalog JSON: ${JSON.stringify(catalog)}`,
            ].join("\n\n");

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
        if (image) {
          parts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: image.buffer.toString("base64"),
            },
          });
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts }],
        });

        const text = String(response.text || "").trim();
        if (text) {
          analysis = text;
          recommendedProducts = mergeRecommendedProducts(
            extractRecommendedProducts(text),
            chooseRecommendedProducts(text, advisorContext),
          );
        }
      } catch (error) {
        console.error("AI advisor error:", error);
      }
    }

    const analyticsRecord: AiAnalyticsRecord = {
      _id: `aia_${Date.now()}_${randomUUID().slice(0, 8)}`,
      source: "stylist",
      mode,
      createdAt: new Date().toISOString(),
      gender: sanitizeAiText(body.gender) || undefined,
      age: Number(body.age || 0) || undefined,
      heightCm: Number(body.heightCm || 0) || undefined,
      weightKg: Number(body.weightKg || 0) || undefined,
      budget: sanitizeAiText(body.budget) || undefined,
      preferredStyle: sanitizeAiText(body.preferredStyle) || undefined,
      occasion: sanitizeAiText(body.occasion) || undefined,
      roomType: sanitizeAiText(body.roomType) || undefined,
      roomSize: sanitizeAiText(body.roomSize) || undefined,
      existingColors: sanitizeAiText(body.existingColors) || undefined,
      question: sanitizeAiText(body.question) || undefined,
      imageUrl,
      productIds: recommendedProducts.map((product) => product._id),
      analysis,
    };
    aiAnalytics.unshift(analyticsRecord);
    await persistAiAnalytics().catch((error) => console.error("Failed to persist AI analytics:", error));

    res.json({
      mode,
      imageUrl,
      analysis,
      products: recommendedProducts,
    });
  });

  app.post(
    "/api/recommendations/style",
    express.raw({ type: ["image/jpeg", "image/png", "image/webp", "image/gif"], limit: "10mb" }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ message: "Image file is required." });
        return;
      }

      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      const requestMimeType = String(req.header("content-type") || "image/jpeg").split(";")[0].trim().toLowerCase();
      const ext = mimeToExt[requestMimeType] || "jpg";
      const filename = `${randomUUID()}.${ext}`;
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, filename), req.body);

      const stylistContext = buildStylistContext(req.query);
      let analysis = `Your photo is uploaded. Based on ${stylistContext}, here are style recommendations from the Trendora catalog.`;
      let recommendedProducts = chooseRecommendedProducts(analysis, stylistContext);

      if (geminiApiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          const catalog = buildAiProductCatalog();

          const prompt = [
            "You are Trendora's fashion stylist assistant.",
            "Analyze the uploaded outfit photo and customer details.",
            `Customer details: ${stylistContext}.`,
            "Recommend up to 6 matching products only from this catalog.",
            "For each recommendation, include the exact product id or product code so the store can match it.",
            "You may suggest tops, bottoms, outerwear, shoes, and accessories when available.",
            "Return concise natural language text; do not use markdown.",
            `Catalog JSON: ${JSON.stringify(catalog)}`,
          ].join(" \n\n");

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: requestMimeType,
                      data: req.body.toString("base64"),
                    },
                  },
                ],
              },
            ],
          });

          const text = String(response.text || "");
          if (text.trim()) {
            analysis = text.trim();
            const extracted = extractRecommendedProducts(text);
            recommendedProducts = mergeRecommendedProducts(extracted, chooseRecommendedProducts(text, stylistContext));
          }
        } catch (error) {
          console.error("AI recommendation error:", error);
        }
      }

      const analyticsRecord: AiAnalyticsRecord = {
        _id: `aia_${Date.now()}_${randomUUID().slice(0, 8)}`,
        source: "stylist",
        createdAt: new Date().toISOString(),
        gender: String(req.query.gender || "").trim() || undefined,
        age: Number(req.query.age || 0) || undefined,
        heightCm: Number(req.query.heightCm || req.query.height || 0) || undefined,
        weightKg: Number(req.query.weightKg || req.query.weight || 0) || undefined,
        budget: String(req.query.budget || "").trim() || undefined,
        preferredStyle: String(req.query.preferredStyle || req.query.style || "").trim() || undefined,
        occasion: String(req.query.occasion || "").trim() || undefined,
        imageUrl: `/uploads/${filename}`,
        productIds: recommendedProducts.map((product) => product._id),
        analysis,
      };
      aiAnalytics.unshift(analyticsRecord);
      await persistAiAnalytics().catch((error) => console.error("Failed to persist AI analytics:", error));

      res.json({
        imageUrl: `/uploads/${filename}`,
        analysis,
        products: recommendedProducts,
      });
    },
  );

  app.post("/api/auth/register", async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      res.status(400).json({ message: "Name, email and a 6+ character password are required." });
      return;
    }

    if (users.some((user) => user.email.toLowerCase() === email)) {
      res.status(409).json({ message: "Email already registered." });
      return;
    }

    const user: AccountUser = {
      _id: `u_${randomUUID()}`,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "user",
      blocked: false,
      createdAt: new Date().toISOString(),
      orders: 0,
      spent: 0,
    };

    users.unshift(user);
    await persistUsers();

    const token = makeAuthToken(user);
    res.status(201).json({ token, user: getPublicUser(user) });
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = users.find((entry) => entry.email.toLowerCase() === email);
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    if (user.blocked) {
      res.status(403).json({ message: "Account blocked. Support se contact karo." });
      return;
    }

    const token = makeAuthToken(user);
    res.json({ token, user: getPublicUser(user) });
  });

  app.get("/api/auth/me", requireCustomer, (req, res) => {
    const customer = (req as express.Request & { customer?: AccountUser }).customer;
    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    res.json({ user: getPublicUser(customer) });
  });

  app.post("/api/admin/login", (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (email !== adminEmail.toLowerCase() || password !== adminPassword) {
      res.status(401).json({ message: "Invalid admin email or password." });
      return;
    }

    const token = jwt.sign(
      { sub: "trendora-admin", email: adminEmail, role: "admin" },
      jwtSecret,
      { expiresIn: "8h" },
    );

    res.json({
      token,
      admin: { name: "Trendora Admin", email: adminEmail, role: "admin" },
      expiresIn: "8h",
    });
  });

  app.get("/api/admin/session", requireAdmin, (_req, res) => {
    res.json({ authenticated: true, role: "admin" });
  });

  app.post(
    "/api/admin/uploads",
    requireAdmin,
    express.raw({ type: ["image/jpeg", "image/png", "image/webp", "image/gif"], limit: "10mb" }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ message: "Image file is required." });
        return;
      }

      const mimeToExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
      };
      const ext = mimeToExt[req.header("content-type") || ""] || "jpg";
      const filename = `${randomUUID()}.${ext}`;
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(path.join(uploadsDir, filename), req.body);

      res.status(201).json({ url: `/uploads/${filename}` });
    },
  );

  app.get("/api/admin/dashboard", requireAdmin, (_req, res) => {
    syncAdminNotifications();
    const revenue = orders.reduce((sum, order) => sum + order.amount / 100, 0);
    const inventoryValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
    const inventoryCost = products.reduce((sum, product) => sum + Number(product.costPrice || 0) * Number(product.stock || 0), 0);
    const lowStockCount = products.filter((product) => Number(product.stock ?? 0) <= Number(product.lowStockThreshold ?? 5)).length;
    let estimatedProfit = 0;
    const productSales = new Map<string, { name: string; qty: number; revenue: number }>();

    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items as Array<{ product?: Product; quantity?: number }> : [];
      items.forEach((item) => {
        if (!item.product) return;
        const currentProduct = products.find((product) => product._id === item.product?._id);
        const costPrice = Number(currentProduct?.costPrice ?? item.product.costPrice ?? 0);
        const current = productSales.get(item.product._id) || { name: item.product.name, qty: 0, revenue: 0 };
        const quantity = Number(item.quantity || 0);
        current.qty += quantity;
        current.revenue += item.product.price * quantity;
        estimatedProfit += Math.max(0, Number(item.product.price || 0) - costPrice) * quantity;
        productSales.set(item.product._id, current);
      });
    });

    res.json({
      metrics: {
        revenue,
        orders: orders.length,
        users: users.length,
        products: products.length,
        traffic: Math.max(orders.length * 31 + users.length * 12, 184),
        inventoryValue,
        inventoryCost,
        estimatedProfit,
        lowStock: lowStockCount,
      },
      notificationSummary: {
        total: notifications.length,
        unread: notifications.filter((item) => !item.readAt).length,
      },
      revenueSeries: orders.slice(0, 7).reverse().map((order, index) => ({
        label: `Day ${index + 1}`,
        value: Math.round(order.amount / 100),
      })),
      userGrowth: users.map((user, index) => ({ label: `User ${index + 1}`, value: index + 1 })),
      bestSellers: Array.from(productSales.values()).sort((a, b) => b.qty - a.qty).slice(0, 5),
      trafficSources: [
        { label: "Direct", value: 46 },
        { label: "Search", value: 31 },
        { label: "Social", value: 23 },
      ],
    });
  });

  app.get("/api/admin/notifications", requireAdmin, (_req, res) => {
    syncAdminNotifications();
    const sorted = [...notifications].sort((a, b) => parseAdminTimestamp(b.createdAt) - parseAdminTimestamp(a.createdAt));
    res.json({
      notifications: sorted,
      unreadCount: sorted.filter((item) => !item.readAt).length,
    });
  });

  app.post("/api/admin/notifications/mark-read", requireAdmin, async (req, res) => {
    syncAdminNotifications();
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map((value) => String(value)) : [];
    const markAll = Boolean(req.body.all);

    if (!ids.length && !markAll) {
      res.status(400).json({ message: "Notification ids are required." });
      return;
    }

    const now = new Date().toISOString();
    notifications.forEach((item) => {
      if (markAll || ids.includes(item._id)) {
        item.readAt = now;
      }
    });

    await persistNotifications();
    res.json({
      success: true,
      unreadCount: notifications.filter((item) => !item.readAt).length,
    });
  });

  app.post("/api/admin/products", requireAdmin, (req, res) => {
    let product: Product;

    try {
      product = buildProductPayload(req.body);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid product payload." });
      return;
    }

    if (products.some((item) => item.code === product.code)) {
      res.status(409).json({ message: "Product code already exists. Alag code use karo." });
      return;
    }

    product = { ...product, _id: `p${Date.now()}` };

    products.unshift(product);
    persistProducts().catch((err) => {
      console.error("Product save error:", err);
    });
    syncAdminNotifications();
    upsertNotification({
      key: `product-created:${product._id}`,
      type: "product_update",
      severity: "success",
      title: `${product.name} added`,
      message: `Product created with stock ${product.stock ?? 0}.`,
      entityId: product._id,
      entityType: "product",
      link: "/admin?tab=products",
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));
    res.status(201).json(product);
  });

  app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
    const productIndex = products.findIndex((product) => product._id === req.params.id);
    if (productIndex === -1) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    const current = products[productIndex];
    const nextPayload = {
      ...current,
      ...req.body,
      _id: current._id,
    };

    let updated: Product;
    try {
      updated = buildProductPayload(nextPayload);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid product payload." });
      return;
    }

    if (products.some((item) => item._id !== current._id && item.code === updated.code)) {
      res.status(409).json({ message: "Product code already exists. Alag code use karo." });
      return;
    }

    products[productIndex] = updated;
    persistProducts().catch((err) => {
      console.error("Product save error:", err);
    });
    syncAdminNotifications();
    upsertNotification({
      key: `product-updated:${updated._id}:${updated.stock ?? 0}:${updated.price}:${updated.originalPrice}`,
      type: "product_update",
      severity: Number(updated.stock ?? 0) <= 5 ? "warning" : "info",
      title: `${updated.name} updated`,
      message: `Price set to ₹${updated.price} and stock ${updated.stock ?? 0}.`,
      entityId: updated._id,
      entityType: "product",
      link: "/admin?tab=products",
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));
    res.json(updated);
  });

  app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
    const productIndex = products.findIndex((product) => product._id === req.params.id);
    if (productIndex === -1) {
      res.status(404).json({ message: "Product not found." });
      return;
    }

    const [removed] = products.splice(productIndex, 1);
    persistProducts().catch((err) => {
      console.error("Product save error:", err);
    });
    syncAdminNotifications();
    upsertNotification({
      key: `product-deleted:${removed._id}`,
      type: "product_update",
      severity: "warning",
      title: `${removed.name} deleted`,
      message: "Product removed from catalog.",
      entityId: removed._id,
      entityType: "product",
      link: "/admin?tab=products",
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));
    res.json({ success: true, product: removed });
  });

  app.post("/api/admin/products/bulk", requireAdmin, (req, res) => {
    const format = String(req.body.format || "json").toLowerCase() === "csv" ? "csv" : "json";
    const content = String(req.body.content || "").trim();

    if (!content) {
      res.status(400).json({ message: "Bulk content is required." });
      return;
    }

    try {
      const rawItems = parseBulkProducts(content, format);
      if (!rawItems.length) {
        res.status(400).json({ message: "No products found in bulk upload." });
        return;
      }

      const created: Product[] = [];
      const skipped: Array<{ index: number; reason: string }> = [];

      rawItems.forEach((item, index) => {
        try {
          const product = { ...buildProductPayload(item), _id: `p${Date.now()}${index}` };
          if (products.some((existing) => existing.code === product.code)) {
            skipped.push({ index, reason: `Duplicate code ${product.code}` });
            return;
          }

          products.unshift(product);
          created.push(product);
          upsertNotification({
            key: `bulk-product-created:${product._id}`,
            type: "bulk_upload",
            severity: "success",
            title: `Bulk product uploaded: ${product.name}`,
            message: "Product added through bulk upload.",
            entityId: product._id,
            entityType: "bulk",
            link: "/admin?tab=products",
          });
        } catch (error) {
          skipped.push({ index, reason: error instanceof Error ? error.message : "Invalid product row" });
        }
      });

      if (!created.length) {
        res.status(400).json({ message: "No valid products were created.", skipped });
        return;
      }

      persistProducts().catch((err) => console.error("Product save error:", err));
      syncAdminNotifications();
      persistNotifications().catch((err) => console.error("Notification save error:", err));

      res.status(201).json({
        success: true,
        createdCount: created.length,
        skipped,
        products: created,
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Bulk upload failed." });
    }
  });

  app.get("/api/admin/orders", requireAdmin, (_req, res) => {
    res.json(orders);
  });

  app.put("/api/admin/orders/:id", requireAdmin, (req, res) => {
    const order = orders.find((item) => item._id === req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const previousStatus = order.status;
    order.status = req.body.status || order.status;
    order.returnStatus = req.body.returnStatus || order.returnStatus || "none";
    order.shippingStatus = req.body.shippingStatus || order.shippingStatus || "pending";
    order.trackingId = req.body.trackingId ?? order.trackingId;
    order.invoiceId = req.body.invoiceId || order.invoiceId || `INV-${order._id.toUpperCase()}`;
    order.statusHistory = [
      ...(order.statusHistory || []),
      {
        status: order.status,
        note: `Updated by admin from ${previousStatus} to ${order.status}`,
        at: new Date().toISOString(),
      },
    ];

    if (previousStatus !== "cancelled" && order.status === "cancelled") {
      releaseOrderStock(order);
      persistProducts().catch((err) => console.error("Product save error:", err));
    }

    persistOrders().catch((err) => console.error("Order save error:", err));
    syncAdminNotifications();
    upsertNotification({
      key: `order-status:${order._id}:${order.status}:${order.shippingStatus}:${order.returnStatus}`,
      type: order.returnStatus === "requested" ? "return_requested" : order.status === "delivered" ? "delivery_reminder" : "pending_order",
      severity: order.status === "delivered" ? "success" : order.returnStatus === "requested" ? "danger" : "warning",
      title: `Order ${order._id} updated`,
      message: `Status is now ${order.status}.`,
      entityId: order._id,
      entityType: "order",
      link: "/admin?tab=orders",
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));
    res.json(order);
  });

  app.get("/api/admin/users", requireAdmin, (_req, res) => {
    res.json(users.map(getPublicUser));
  });

  app.put("/api/admin/users/:id", requireAdmin, (req, res) => {
    const user = users.find((item) => item._id === req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    user.blocked = Boolean(req.body.blocked);
    persistUsers().catch((err) => console.error("User save error:", err));
    res.json(getPublicUser(user));
  });

  app.get("/api/admin/coupons", requireAdmin, (_req, res) => {
    res.json(coupons);
  });

  app.post("/api/admin/coupons", requireAdmin, (req, res) => {
    if (!req.body.code || !req.body.discountValue || !req.body.expiresAt) {
      res.status(400).json({ message: "Code, discount value and expiry are required." });
      return;
    }

    const coupon: Coupon = {
      _id: `c${Date.now()}`,
      code: String(req.body.code).trim().toUpperCase(),
      discountType: req.body.discountType === "flat" ? "flat" : "percent",
      discountValue: Number(req.body.discountValue),
      expiresAt: String(req.body.expiresAt),
      active: req.body.active !== false,
      usageLimit: Number(req.body.usageLimit || 100),
      used: 0,
    };
    coupons.unshift(coupon);
    writeJsonFile(couponsFile, coupons).catch((err) => console.error("Coupon save error:", err));
    res.status(201).json(coupon);
  });

  app.put("/api/admin/coupons/:id", requireAdmin, (req, res) => {
    const coupon = coupons.find((item) => item._id === req.params.id);
    if (!coupon) {
      res.status(404).json({ message: "Coupon not found." });
      return;
    }

    coupon.active = req.body.active ?? coupon.active;
    coupon.expiresAt = req.body.expiresAt || coupon.expiresAt;
    coupon.discountValue = Number(req.body.discountValue ?? coupon.discountValue);
    writeJsonFile(couponsFile, coupons).catch((err) => console.error("Coupon save error:", err));
    res.json(coupon);
  });

  app.delete("/api/admin/coupons/:id", requireAdmin, (req, res) => {
    const index = coupons.findIndex((item) => item._id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: "Coupon not found." });
      return;
    }

    const [removed] = coupons.splice(index, 1);
    writeJsonFile(couponsFile, coupons).catch((err) => console.error("Coupon save error:", err));
    res.json({ success: true, coupon: removed });
  });

  app.get("/api/admin/banners", requireAdmin, (_req, res) => {
    res.json(banners);
  });

  app.post("/api/admin/banners", requireAdmin, (req, res) => {
    if (!req.body.title || !req.body.image) {
      res.status(400).json({ message: "Banner title and image are required." });
      return;
    }

    const banner: Banner = {
      _id: `b${Date.now()}`,
      title: String(req.body.title),
      subtitle: String(req.body.subtitle || ""),
      image: String(req.body.image),
      link: String(req.body.link || "/"),
      placement: req.body.placement === "promotional" ? "promotional" : "homepage",
      active: req.body.active !== false,
    };
    banners.unshift(banner);
    writeJsonFile(bannersFile, banners).catch((err) => console.error("Banner save error:", err));
    res.status(201).json(banner);
  });

  app.put("/api/admin/banners/:id", requireAdmin, (req, res) => {
    const banner = banners.find((item) => item._id === req.params.id);
    if (!banner) {
      res.status(404).json({ message: "Banner not found." });
      return;
    }

    banner.title = req.body.title ?? banner.title;
    banner.subtitle = req.body.subtitle ?? banner.subtitle;
    banner.image = req.body.image ?? banner.image;
    banner.link = req.body.link ?? banner.link;
    banner.placement = req.body.placement === "promotional" ? "promotional" : "homepage";
    banner.active = req.body.active ?? banner.active;
    writeJsonFile(bannersFile, banners).catch((err) => console.error("Banner save error:", err));
    res.json(banner);
  });

  app.delete("/api/admin/banners/:id", requireAdmin, (req, res) => {
    const index = banners.findIndex((item) => item._id === req.params.id);
    if (index === -1) {
      res.status(404).json({ message: "Banner not found." });
      return;
    }

    const [removed] = banners.splice(index, 1);
    writeJsonFile(bannersFile, banners).catch((err) => console.error("Banner save error:", err));
    res.json({ success: true, banner: removed });
  });

  app.post("/api/orders/create", async (req, res) => {
    const amount = Number(req.body.amount || 0);
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const customer = getRequestUser(req);

    if (!amount || amount < 1) {
      res.status(400).json({ message: "Valid order amount is required." });
      return;
    }

    if (!items.length) {
      res.status(400).json({ message: "Order items are required." });
      return;
    }

    let reservations: Map<string, number> | null = null;

    try {
      const stockState = buildStockReservation(items);
      reservations = stockState.stockChanges;
      const normalizedItems = stockState.normalizedItems;
      const createdAt = new Date().toISOString();
      const sharedOrderFields = {
        amount: Math.round(amount * 100),
        currency: "INR",
        address: req.body.address,
        items: normalizedItems,
        customerId: customer?._id,
        customerEmail: customer?.email,
        customerName: customer?.name,
        createdAt,
      } satisfies Partial<OrderRecord>;

      if (req.body.paymentMode === "cod") {
        const orderId = `cod_${Math.floor(Math.random() * 1000000)}`;
        const orderRecord: OrderRecord = {
          _id: orderId,
          ...sharedOrderFields,
          amount: Math.round(amount * 100),
          currency: "INR",
          paymentMode: "cod",
          status: "placed",
          paymentStatus: "cod",
          trackingId: `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          invoiceId: `INV-${orderId.toUpperCase()}`,
          statusHistory: buildStatusHistory("placed", "COD order placed successfully."),
        };
        orders.unshift(orderRecord);

        if (customer) {
          customer.orders += 1;
          customer.spent += amount;
        }

        await Promise.all([persistOrders(), persistProducts(), persistUsers()]);
        syncAdminNotifications();
        upsertNotification({
          key: `new-order:${orderId}`,
          type: "new_order",
          severity: "success",
          title: `New order ${orderId}`,
          message: `COD order placed for ₹${Math.round(amount)}.`,
          entityId: orderId,
          entityType: "order",
          link: "/admin?tab=orders",
        });
        persistNotifications().catch((err) => console.error("Notification save error:", err));

        res.json({
          success: true,
          orderId,
          amount: orderRecord.amount,
          currency: orderRecord.currency,
          paymentMode: "cod",
          message: "Cash on Delivery order placed successfully.",
        });
        return;
      }

      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
          });

          const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `trendora_${Date.now()}`,
          });

          const orderRecord: OrderRecord = {
            _id: order.id,
            ...sharedOrderFields,
            amount: Number(order.amount),
            currency: order.currency || "INR",
            paymentMode: "razorpay",
            status: "created",
            paymentStatus: "pending",
            razorpayOrderId: order.id,
            trackingId: `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            invoiceId: `INV-${order.id.toUpperCase()}`,
            statusHistory: buildStatusHistory("created", "Razorpay order created."),
          };
          orders.unshift(orderRecord);

          if (customer) {
            customer.orders += 1;
            customer.spent += amount;
          }

          await Promise.all([persistOrders(), persistProducts(), persistUsers()]);
          syncAdminNotifications();
          upsertNotification({
            key: `new-order:${order.id}`,
            type: "new_order",
            severity: "success",
            title: `New order ${order.id}`,
            message: `Razorpay order created for ₹${Math.round(amount)}.`,
            entityId: order.id,
            entityType: "order",
            link: "/admin?tab=orders",
          });
          persistNotifications().catch((err) => console.error("Notification save error:", err));

          res.json({
            success: true,
            orderId: order.id,
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            paymentMode: "razorpay",
            customer: {
              name: customer?.name || req.body.address?.fullName || "",
              email: customer?.email || "",
              contact: req.body.address?.phone || "",
            },
            description: normalizedItems
              .map((item) => `${item.product?.name || "Trendora product"} x ${item.quantity || 1}`)
              .join(", ")
              .slice(0, 255),
            message: "Razorpay order created successfully.",
          });
          return;
        } catch (err) {
          if (reservations) {
            releaseStock(reservations);
            await persistProducts().catch((persistErr) => console.error("Product save error:", persistErr));
          }
          console.error("Razorpay order error:", err);
          res.status(500).json({ message: "Unable to create Razorpay order." });
          return;
        }
      }

      const orderId = `ord_mock_${Math.floor(Math.random() * 1000000)}`;
      const orderRecord: OrderRecord = {
        _id: orderId,
        ...sharedOrderFields,
        amount: Math.round(amount * 100),
        currency: "INR",
        paymentMode: "mock",
        status: "placed",
        paymentStatus: "mock",
        trackingId: `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        invoiceId: `INV-${orderId.toUpperCase()}`,
        statusHistory: buildStatusHistory("placed", "Mock order created for local testing."),
      };
      orders.unshift(orderRecord);

      if (customer) {
        customer.orders += 1;
        customer.spent += amount;
      }

      await Promise.all([persistOrders(), persistProducts(), persistUsers()]);
      syncAdminNotifications();
      upsertNotification({
        key: `new-order:${orderId}`,
        type: "new_order",
        severity: "success",
        title: `New order ${orderId}`,
        message: `Mock order placed for ₹${Math.round(amount)}.`,
        entityId: orderId,
        entityType: "order",
        link: "/admin?tab=orders",
      });
      persistNotifications().catch((err) => console.error("Notification save error:", err));

      res.json({
        success: true,
        orderId,
        amount: Math.round(amount * 100),
        currency: "INR",
        paymentMode: "mock",
        message: "Razorpay keys missing. Mock order created for local testing.",
      });
    } catch (error) {
      if (reservations) {
        releaseStock(reservations);
        await persistProducts().catch((persistErr) => console.error("Product save error:", persistErr));
      }
      const message = error instanceof Error ? error.message : "Unable to create order.";
      res.status(409).json({ message });
    }
  });

  app.post("/api/orders/verify-payment", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    console.log("[Razorpay] Verify payment request", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      hasSignature: Boolean(razorpay_signature),
    });

    if (!process.env.RAZORPAY_KEY_SECRET) {
      res.status(500).json({ message: "Razorpay key secret is not configured." });
      return;
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ message: "Razorpay payment verification fields are required." });
      return;
    }

    const order = orders.find((item) => item._id === razorpay_order_id || item.razorpayOrderId === razorpay_order_id);
    if (!order) {
      res.status(404).json({ message: "Order not found for Razorpay verification." });
      return;
    }

    const expectedSignature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("[Razorpay] Invalid payment signature", { orderId: razorpay_order_id, paymentId: razorpay_payment_id });
      order.paymentStatus = "failed";
      order.paymentFailureReason = "Invalid Razorpay payment signature.";
      order.status = "cancelled";
      if (!order.stockReleasedAt) {
        releaseOrderStock(order);
        order.stockReleasedAt = new Date().toISOString();
      }
      order.statusHistory = [
        ...(order.statusHistory || []),
        { status: "cancelled", note: "Razorpay signature verification failed.", at: new Date().toISOString() },
      ];
      await Promise.all([persistOrders(), persistProducts()]);
      await savePaymentRecord({
        orderId: order._id,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: String(razorpay_payment_id),
        amount: order.amount,
        currency: order.currency,
        status: "failed",
        failureReason: "Invalid Razorpay payment signature.",
      });
      res.status(400).json({ message: "Payment signature verification failed." });
      return;
    }

    const paidAt = new Date().toISOString();
    order.status = "placed";
    order.paymentStatus = "paid";
    order.razorpayOrderId = String(razorpay_order_id);
    order.razorpayPaymentId = String(razorpay_payment_id);
    order.razorpaySignature = String(razorpay_signature);
    order.paidAt = paidAt;
    order.paymentFailureReason = undefined;
    order.statusHistory = [
      ...(order.statusHistory || []),
      { status: "placed", note: "Razorpay payment verified successfully.", at: paidAt },
    ];

    await persistOrders();
    await savePaymentRecord({
      orderId: order._id,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      amount: order.amount,
      currency: order.currency,
      status: "paid",
      customerId: order.customerId,
      customerEmail: order.customerEmail,
      paidAt,
    });

    console.log("[Razorpay] Payment verified successfully", { orderId: order._id, paymentId: razorpay_payment_id });
    res.json({ success: true, orderId: order._id, message: "Payment verified successfully.", order });
  });

  app.post("/api/orders/:id/payment-failed", async (req, res) => {
    const order = orders.find((item) => item._id === req.params.id || item.razorpayOrderId === req.params.id);

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const reason = String(req.body?.reason || "Razorpay checkout was closed or payment failed.");
    console.warn("[Razorpay] Payment failed or dismissed", { orderId: order._id, reason });

    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "failed";
      order.paymentFailureReason = reason;
      order.status = "cancelled";
      if (!order.stockReleasedAt) {
        releaseOrderStock(order);
        order.stockReleasedAt = new Date().toISOString();
      }
      order.statusHistory = [
        ...(order.statusHistory || []),
        { status: "cancelled", note: reason, at: new Date().toISOString() },
      ];

      await Promise.all([persistOrders(), persistProducts()]);
      await savePaymentRecord({
        orderId: order._id,
        razorpayOrderId: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency,
        status: "failed",
        failureReason: reason,
      });
    }

    res.json({ success: true, orderId: order._id, message: "Payment failure recorded." });
  });

  app.get("/api/orders/me", requireCustomer, (req, res) => {
    const customer = (req as express.Request & { customer?: AccountUser }).customer;
    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }

    const customerOrders = orders.filter(
      (order) => order.customerId === customer._id || order.customerEmail?.toLowerCase() === customer.email.toLowerCase(),
    );
    res.json(customerOrders);
  });

  app.get("/api/orders/:id", (req, res) => {
    const order = orders.find((item) => item._id === req.params.id);
    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const customer = getRequestUser(req);
    const isOwner =
      Boolean(customer) &&
      (customer!._id === order.customerId || customer!.email.toLowerCase() === String(order.customerEmail || "").toLowerCase() || customer!.role === "admin" || customer!.role === "manager");

    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }

    if (!isOwner) {
      res.status(403).json({ message: "You do not have access to this order." });
      return;
    }

    res.json(order);
  });

  app.post("/api/orders/:id/cancel", requireCustomer, (req, res) => {
    const customer = (req as express.Request & { customer?: AccountUser }).customer;
    const order = orders.find((item) => item._id === req.params.id);

    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const isOwner =
      customer._id === order.customerId || customer.email.toLowerCase() === String(order.customerEmail || "").toLowerCase();

    if (!isOwner) {
      res.status(403).json({ message: "You do not have access to this order." });
      return;
    }

    if (["shipped", "delivered", "cancelled"].includes(order.status)) {
      res.status(409).json({ message: "This order can no longer be cancelled." });
      return;
    }

    order.status = "cancelled";
    order.shippingStatus = "pending";
    order.returnStatus = "none";
    order.statusHistory = [
      ...(order.statusHistory || []),
      { status: "cancelled", note: "Cancelled by customer.", at: new Date().toISOString() },
    ];

    releaseOrderStock(order);
    persistOrders().catch((err) => console.error("Order save error:", err));
    persistProducts().catch((err) => console.error("Product save error:", err));
    syncAdminNotifications();
    upsertNotification({
      key: `order-cancelled:${order._id}`,
      type: "pending_order",
      severity: "warning",
      title: `Order cancelled ${order._id}`,
      message: "Customer cancelled the order.",
      entityId: order._id,
      entityType: "order",
      link: "/admin?tab=orders",
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));

    res.json({ success: true, order });
  });

  app.post("/api/orders/:id/return-request", requireCustomer, (req, res) => {
    const customer = (req as express.Request & { customer?: AccountUser }).customer;
    const order = orders.find((item) => item._id === req.params.id);

    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }

    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }

    const isOwner =
      customer._id === order.customerId || customer.email.toLowerCase() === String(order.customerEmail || "").toLowerCase();

    if (!isOwner) {
      res.status(403).json({ message: "You do not have access to this order." });
      return;
    }

    if (order.status !== "delivered") {
      res.status(409).json({ message: "Return request only delivered orders ke liye allowed hai." });
      return;
    }

    order.returnStatus = "requested";
    order.status = "return_requested";
    order.statusHistory = [
      ...(order.statusHistory || []),
      { status: "return_requested", note: "Return requested by customer.", at: new Date().toISOString() },
    ];

    persistOrders().catch((err) => console.error("Order save error:", err));
    syncAdminNotifications();
    upsertNotification({
      key: `return-requested:${order._id}`,
      type: "return_requested",
      severity: "danger",
      title: `Return requested ${order._id}`,
      message: "Customer requested a return from order page.",
      entityId: order._id,
      entityType: "order",
      link: "/admin?tab=orders",
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));

    res.json({ success: true, order });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    process.env.DISABLE_HMR ??= "true";

    const vite = await createViteServer({
      root: frontendRoot,
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(errorMiddleware);

  const listen = (port: number) => {
    const server = app.listen(port, HOST, () => {
      console.log(`Server listening on ${HOST}:${port}`);
    });

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.warn(`Port ${port} is already in use. Trying ${port + 1}...`);
        listen(port + 1);
        return;
      }

      throw err;
    });
  };

  listen(PORT);
}
