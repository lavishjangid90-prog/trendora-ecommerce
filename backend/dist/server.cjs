var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"), 1);
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_mongoose = __toESM(require("mongoose"), 1);
var import_vite = require("vite");
var import_razorpay = __toESM(require("razorpay"), 1);
var import_promises = __toESM(require("fs/promises"), 1);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var import_crypto = require("crypto");
import_dotenv.default.config({ path: ".env.local" });
console.log("TEST_VAR =", process.env.TEST_VAR);
console.log("MONGODB_URI =", process.env.MONGODB_URI);
var MOCK_PRODUCTS = [
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
var products = [...MOCK_PRODUCTS];
var orders = [];
var users = [];
var coupons = [];
var banners = [];
var notifications = [];
var frontendRoot = process.env.FRONTEND_DIR ? import_path.default.resolve(process.env.FRONTEND_DIR) : import_path.default.resolve(process.cwd(), "../frontend");
var frontendDist = process.env.FRONTEND_DIST ? import_path.default.resolve(process.env.FRONTEND_DIST) : import_path.default.join(frontendRoot, "dist");
var dataDir = import_path.default.join(process.cwd(), "data");
var uploadsDir = import_path.default.join(dataDir, "uploads");
var productsFile = import_path.default.join(dataDir, "products.json");
var ordersFile = import_path.default.join(dataDir, "orders.json");
var usersFile = import_path.default.join(dataDir, "users.json");
var couponsFile = import_path.default.join(dataDir, "coupons.json");
var bannersFile = import_path.default.join(dataDir, "banners.json");
var notificationsFile = import_path.default.join(dataDir, "notifications.json");
var adminEmail = process.env.ADMIN_EMAIL || "admin@trendora.local";
var adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY || "trendora-admin";
var jwtSecret = process.env.JWT_SECRET || "trendora-local-admin-secret";
function normalizeProductCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function generateProductCode(category) {
  const prefix = normalizeProductCode(category).slice(0, 3) || "TRD";
  let code = "";
  do {
    code = `${prefix}-${Math.floor(1e5 + Math.random() * 9e5)}`;
  } while (products.some((product) => product.code === code));
  return code;
}
function getPublicUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
function makeAuthToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      sub: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
}
function getRequestUser(req) {
  const authHeader = req.header("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;
  try {
    const payload = import_jsonwebtoken.default.verify(token, jwtSecret);
    const user = users.find((item) => item._id === payload.sub || item.email.toLowerCase() === String(payload.email || "").toLowerCase());
    if (!user || user.blocked) return null;
    return user;
  } catch {
    return null;
  }
}
function buildStockReservation(orderItems) {
  const normalizedItems = Array.isArray(orderItems) ? orderItems : [];
  const stockChanges = /* @__PURE__ */ new Map();
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
function releaseStock(reservations) {
  for (const [productId, quantity] of reservations.entries()) {
    const product = products.find((entry) => entry._id === productId);
    if (product) {
      product.stock = Number(product.stock ?? 0) + quantity;
    }
  }
}
function releaseOrderStock(order) {
  const reservations = /* @__PURE__ */ new Map();
  for (const item of Array.isArray(order.items) ? order.items : []) {
    const productId = item?.product?._id;
    const quantity = Number(item?.quantity || 0);
    if (!productId || quantity < 1) continue;
    reservations.set(productId, (reservations.get(productId) || 0) + quantity);
  }
  releaseStock(reservations);
}
function buildStatusHistory(status, note) {
  return [{ status, note, at: (/* @__PURE__ */ new Date()).toISOString() }];
}
function notificationId() {
  return `n_${Date.now()}_${(0, import_crypto.randomUUID)().slice(0, 8)}`;
}
function upsertNotification(input) {
  const now = input.createdAt || (/* @__PURE__ */ new Date()).toISOString();
  const existing = notifications.find((item2) => item2.key === input.key);
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
    if (input.readAt !== void 0) existing.readAt = input.readAt;
    else if (wasUnread && input.readAt === void 0) existing.readAt = existing.readAt;
    return existing;
  }
  const item = {
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
    createdAt: now
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
function parseAdminTimestamp(value) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}
function ageInMinutes(value) {
  return (Date.now() - parseAdminTimestamp(value)) / 6e4;
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
        link: "/admin?tab=products"
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
        link: "/admin?tab=orders"
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
        link: "/admin?tab=orders"
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
        link: "/admin?tab=orders"
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
        link: "/admin?tab=orders"
      });
    }
  }
}
function normalizeDelimitedList(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}
function buildProductPayload(input) {
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
  const discount = originalPrice > price ? Math.round((originalPrice - price) / originalPrice * 100) : 0;
  return {
    _id: String(input._id || `p${Date.now()}${Math.floor(Math.random() * 1e3)}`),
    code: productCode,
    sku: String(input.sku || productCode).trim(),
    name,
    price,
    originalPrice,
    discount,
    category,
    image,
    images: Array.isArray(input.images) ? input.images : normalizeDelimitedList(input.images || image),
    rating: Number(input.rating || 4.5),
    reviews: Number(input.reviews || 0),
    sizes: Array.isArray(input.sizes) ? input.sizes : normalizeDelimitedList(input.sizes || "S,M,L,XL"),
    colors: Array.isArray(input.colors) ? input.colors : normalizeDelimitedList(input.colors || "Black,White"),
    costPrice: Number(input.costPrice || 0),
    stock: Number(input.stock || 0),
    lowStockThreshold: Number(input.lowStockThreshold ?? 5),
    variants: Array.isArray(input.variants) ? input.variants : normalizeDelimitedList(input.variants || ""),
    keywords: Array.isArray(input.keywords) ? input.keywords : normalizeDelimitedList(input.keywords || ""),
    description,
    seoTitle: String(input.seoTitle || "").trim(),
    seoDescription: String(input.seoDescription || "").trim(),
    isTrending: Boolean(input.isTrending ?? true)
  };
}
function parseBulkProducts(content, format) {
  if (format === "json") {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) {
      throw new Error("JSON bulk upload must be an array.");
    }
    return parsed;
  }
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return headers.reduce((acc, header, index) => {
      acc[header] = (values[index] || "").trim();
      return acc;
    }, {});
  });
}
async function readJsonFile(filePath, fallback) {
  try {
    const contents = await import_promises.default.readFile(filePath, "utf8");
    return JSON.parse(contents);
  } catch {
    return fallback;
  }
}
async function writeJsonFile(filePath, data) {
  await import_promises.default.mkdir(dataDir, { recursive: true });
  await import_promises.default.writeFile(filePath, JSON.stringify(data, null, 2));
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = Number(process.env.PORT) || 3e3;
  const HOST = process.env.HOST || "0.0.0.0";
  app.use((0, import_cors.default)());
  app.use(import_express.default.json());
  app.use("/uploads", import_express.default.static(uploadsDir));
  const savedProducts = await readJsonFile(productsFile, []);
  const savedOrders = await readJsonFile(ordersFile, []);
  const savedUsers = await readJsonFile(usersFile, []);
  const savedCoupons = await readJsonFile(couponsFile, []);
  const savedBanners = await readJsonFile(bannersFile, []);
  const savedNotifications = await readJsonFile(notificationsFile, []);
  products.splice(0, products.length, ...MOCK_PRODUCTS, ...savedProducts);
  products.forEach((product) => {
    product.code ||= generateProductCode(product.category);
    product.sku ||= product.code;
    product.keywords ||= [];
    product.lowStockThreshold ??= 5;
    product.costPrice ??= 0;
  });
  orders.splice(0, orders.length, ...savedOrders);
  const fallbackUsers = [
    {
      _id: "u_demo_1",
      name: "Lavish Vlogs",
      email: "lavishvlogs70@gmail.com",
      passwordHash: await import_bcryptjs.default.hash("trendora-user", 10),
      role: "admin",
      blocked: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      orders: orders.length,
      spent: orders.reduce((sum, order) => sum + order.amount / 100, 0)
    }
  ];
  users.splice(0, users.length, ...savedUsers.length ? savedUsers : fallbackUsers);
  coupons.splice(0, coupons.length, ...savedCoupons);
  const fallbackBanners = [
    {
      _id: "b_home_1",
      title: "Flat 50% Off",
      subtitle: "End of season fashion sale",
      image: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1200",
      link: "/categories?category=Streetwear",
      placement: "homepage",
      active: true
    }
  ];
  banners.splice(0, banners.length, ...savedBanners.length ? savedBanners : fallbackBanners);
  notifications.splice(0, notifications.length, ...savedNotifications);
  syncAdminNotifications();
  await persistNotifications().catch((err) => console.error("Notification save error:", err));
  const requireAdmin = (req, res, next) => {
    const authHeader = req.header("authorization") || "";
    const legacyKey = req.header("x-admin-key");
    if (legacyKey && legacyKey === adminPassword) {
      next();
      return;
    }
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    try {
      const payload = import_jsonwebtoken.default.verify(token, jwtSecret);
      if (payload.role !== "admin" && payload.role !== "manager") {
        res.status(403).json({ message: "Admin role required." });
        return;
      }
      next();
    } catch {
      res.status(401).json({ message: "Admin login required." });
    }
  };
  const requireCustomer = (req, res, next) => {
    const user = getRequestUser(req);
    if (!user) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    req.customer = user;
    next();
  };
  let isDbConnected = false;
  if (process.env.MONGODB_URI) {
    try {
      await import_mongoose.default.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB Atlas");
      isDbConnected = true;
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.log("MONGODB_URI not found. Running with mock data.");
  }
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", dbConnected: isDbConnected });
  });
  app.get("/api/products", (req, res) => {
    const category = String(req.query.category || "").toLowerCase();
    const search = String(req.query.search || "").toLowerCase();
    const filteredProducts = products.filter((product) => {
      const matchesCategory = !category || product.category.toLowerCase().includes(category);
      const matchesSearch = !search || [
        product.code,
        product.sku,
        product.name,
        product.category,
        product.description,
        product.seoTitle,
        product.seoDescription,
        ...product.sizes || [],
        ...product.colors || [],
        ...product.variants || [],
        ...product.keywords || []
      ].join(" ").toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
    res.json(filteredProducts);
  });
  app.get("/api/products/trending", (_req, res) => {
    res.json(products.filter((p) => p.isTrending));
  });
  app.get("/api/banners", (_req, res) => {
    res.json(banners.filter((banner) => banner.active));
  });
  app.get("/api/products/:id", (req, res) => {
    const product = products.find((p) => p._id === req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  });
  app.post("/api/auth/register", async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || password.length < 6) {
      res.status(400).json({ message: "Name, email and a 6+ character password are required." });
      return;
    }
    if (users.some((user2) => user2.email.toLowerCase() === email)) {
      res.status(409).json({ message: "Email already registered." });
      return;
    }
    const user = {
      _id: `u_${(0, import_crypto.randomUUID)()}`,
      name,
      email,
      passwordHash: await import_bcryptjs.default.hash(password, 10),
      role: "user",
      blocked: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      orders: 0,
      spent: 0
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
    if (!user || !user.passwordHash || !await import_bcryptjs.default.compare(password, user.passwordHash)) {
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
    const customer = req.customer;
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
    const token = import_jsonwebtoken.default.sign(
      { sub: "trendora-admin", email: adminEmail, role: "admin" },
      jwtSecret,
      { expiresIn: "8h" }
    );
    res.json({
      token,
      admin: { name: "Trendora Admin", email: adminEmail, role: "admin" },
      expiresIn: "8h"
    });
  });
  app.get("/api/admin/session", requireAdmin, (_req, res) => {
    res.json({ authenticated: true, role: "admin" });
  });
  app.post(
    "/api/admin/uploads",
    requireAdmin,
    import_express.default.raw({ type: ["image/jpeg", "image/png", "image/webp", "image/gif"], limit: "10mb" }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ message: "Image file is required." });
        return;
      }
      const mimeToExt = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
      };
      const ext = mimeToExt[req.header("content-type") || ""] || "jpg";
      const filename = `${(0, import_crypto.randomUUID)()}.${ext}`;
      await import_promises.default.mkdir(uploadsDir, { recursive: true });
      await import_promises.default.writeFile(import_path.default.join(uploadsDir, filename), req.body);
      res.status(201).json({ url: `/uploads/${filename}` });
    }
  );
  app.get("/api/admin/dashboard", requireAdmin, (_req, res) => {
    syncAdminNotifications();
    const revenue = orders.reduce((sum, order) => sum + order.amount / 100, 0);
    const inventoryValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
    const inventoryCost = products.reduce((sum, product) => sum + Number(product.costPrice || 0) * Number(product.stock || 0), 0);
    const lowStockCount = products.filter((product) => Number(product.stock ?? 0) <= Number(product.lowStockThreshold ?? 5)).length;
    let estimatedProfit = 0;
    const productSales = /* @__PURE__ */ new Map();
    orders.forEach((order) => {
      const items = Array.isArray(order.items) ? order.items : [];
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
        lowStock: lowStockCount
      },
      notificationSummary: {
        total: notifications.length,
        unread: notifications.filter((item) => !item.readAt).length
      },
      revenueSeries: orders.slice(0, 7).reverse().map((order, index) => ({
        label: `Day ${index + 1}`,
        value: Math.round(order.amount / 100)
      })),
      userGrowth: users.map((user, index) => ({ label: `User ${index + 1}`, value: index + 1 })),
      bestSellers: Array.from(productSales.values()).sort((a, b) => b.qty - a.qty).slice(0, 5),
      trafficSources: [
        { label: "Direct", value: 46 },
        { label: "Search", value: 31 },
        { label: "Social", value: 23 }
      ]
    });
  });
  app.get("/api/admin/notifications", requireAdmin, (_req, res) => {
    syncAdminNotifications();
    const sorted = [...notifications].sort((a, b) => parseAdminTimestamp(b.createdAt) - parseAdminTimestamp(a.createdAt));
    res.json({
      notifications: sorted,
      unreadCount: sorted.filter((item) => !item.readAt).length
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
    const now = (/* @__PURE__ */ new Date()).toISOString();
    notifications.forEach((item) => {
      if (markAll || ids.includes(item._id)) {
        item.readAt = now;
      }
    });
    await persistNotifications();
    res.json({
      success: true,
      unreadCount: notifications.filter((item) => !item.readAt).length
    });
  });
  app.post("/api/admin/products", requireAdmin, (req, res) => {
    let product;
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
      link: "/admin?tab=products"
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
      _id: current._id
    };
    let updated;
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
      message: `Price set to \u20B9${updated.price} and stock ${updated.stock ?? 0}.`,
      entityId: updated._id,
      entityType: "product",
      link: "/admin?tab=products"
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
      link: "/admin?tab=products"
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
      const created = [];
      const skipped = [];
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
            link: "/admin?tab=products"
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
        products: created
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
      ...order.statusHistory || [],
      {
        status: order.status,
        note: `Updated by admin from ${previousStatus} to ${order.status}`,
        at: (/* @__PURE__ */ new Date()).toISOString()
      }
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
      link: "/admin?tab=orders"
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
    const coupon = {
      _id: `c${Date.now()}`,
      code: String(req.body.code).trim().toUpperCase(),
      discountType: req.body.discountType === "flat" ? "flat" : "percent",
      discountValue: Number(req.body.discountValue),
      expiresAt: String(req.body.expiresAt),
      active: req.body.active !== false,
      usageLimit: Number(req.body.usageLimit || 100),
      used: 0
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
    const banner = {
      _id: `b${Date.now()}`,
      title: String(req.body.title),
      subtitle: String(req.body.subtitle || ""),
      image: String(req.body.image),
      link: String(req.body.link || "/"),
      placement: req.body.placement === "promotional" ? "promotional" : "homepage",
      active: req.body.active !== false
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
    let reservations = null;
    try {
      const stockState = buildStockReservation(items);
      reservations = stockState.stockChanges;
      const normalizedItems = stockState.normalizedItems;
      const createdAt = (/* @__PURE__ */ new Date()).toISOString();
      const sharedOrderFields = {
        amount: Math.round(amount * 100),
        currency: "INR",
        address: req.body.address,
        items: normalizedItems,
        customerId: customer?._id,
        customerEmail: customer?.email,
        customerName: customer?.name,
        createdAt
      };
      if (req.body.paymentMode === "cod") {
        const orderId2 = `cod_${Math.floor(Math.random() * 1e6)}`;
        const orderRecord2 = {
          _id: orderId2,
          ...sharedOrderFields,
          amount: Math.round(amount * 100),
          currency: "INR",
          paymentMode: "cod",
          status: "placed",
          trackingId: `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
          invoiceId: `INV-${orderId2.toUpperCase()}`,
          statusHistory: buildStatusHistory("placed", "COD order placed successfully.")
        };
        orders.unshift(orderRecord2);
        if (customer) {
          customer.orders += 1;
          customer.spent += amount;
        }
        await Promise.all([persistOrders(), persistProducts(), persistUsers()]);
        syncAdminNotifications();
        upsertNotification({
          key: `new-order:${orderId2}`,
          type: "new_order",
          severity: "success",
          title: `New order ${orderId2}`,
          message: `COD order placed for \u20B9${Math.round(amount)}.`,
          entityId: orderId2,
          entityType: "order",
          link: "/admin?tab=orders"
        });
        persistNotifications().catch((err) => console.error("Notification save error:", err));
        res.json({
          success: true,
          orderId: orderId2,
          amount: orderRecord2.amount,
          currency: orderRecord2.currency,
          paymentMode: "cod",
          message: "Cash on Delivery order placed successfully."
        });
        return;
      }
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        try {
          const razorpay = new import_razorpay.default({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
          });
          const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `trendora_${Date.now()}`
          });
          const orderRecord2 = {
            _id: order.id,
            ...sharedOrderFields,
            amount: Number(order.amount),
            currency: order.currency || "INR",
            paymentMode: "razorpay",
            status: "created",
            trackingId: `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            invoiceId: `INV-${order.id.toUpperCase()}`,
            statusHistory: buildStatusHistory("created", "Razorpay order created.")
          };
          orders.unshift(orderRecord2);
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
            message: `Razorpay order created for \u20B9${Math.round(amount)}.`,
            entityId: order.id,
            entityType: "order",
            link: "/admin?tab=orders"
          });
          persistNotifications().catch((err) => console.error("Notification save error:", err));
          res.json({
            success: true,
            orderId: order.id,
            keyId: process.env.RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            paymentMode: "razorpay",
            message: "Razorpay order created successfully."
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
      const orderId = `ord_mock_${Math.floor(Math.random() * 1e6)}`;
      const orderRecord = {
        _id: orderId,
        ...sharedOrderFields,
        amount: Math.round(amount * 100),
        currency: "INR",
        paymentMode: "mock",
        status: "placed",
        trackingId: `TRK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        invoiceId: `INV-${orderId.toUpperCase()}`,
        statusHistory: buildStatusHistory("placed", "Mock order created for local testing.")
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
        message: `Mock order placed for \u20B9${Math.round(amount)}.`,
        entityId: orderId,
        entityType: "order",
        link: "/admin?tab=orders"
      });
      persistNotifications().catch((err) => console.error("Notification save error:", err));
      res.json({
        success: true,
        orderId,
        amount: Math.round(amount * 100),
        currency: "INR",
        paymentMode: "mock",
        message: "Razorpay keys missing. Mock order created for local testing."
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
  app.get("/api/orders/me", requireCustomer, (req, res) => {
    const customer = req.customer;
    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    const customerOrders = orders.filter(
      (order) => order.customerId === customer._id || order.customerEmail?.toLowerCase() === customer.email.toLowerCase()
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
    const isOwner = Boolean(customer) && (customer._id === order.customerId || customer.email.toLowerCase() === String(order.customerEmail || "").toLowerCase() || customer.role === "admin" || customer.role === "manager");
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
    const customer = req.customer;
    const order = orders.find((item) => item._id === req.params.id);
    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }
    const isOwner = customer._id === order.customerId || customer.email.toLowerCase() === String(order.customerEmail || "").toLowerCase();
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
      ...order.statusHistory || [],
      { status: "cancelled", note: "Cancelled by customer.", at: (/* @__PURE__ */ new Date()).toISOString() }
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
      link: "/admin?tab=orders"
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));
    res.json({ success: true, order });
  });
  app.post("/api/orders/:id/return-request", requireCustomer, (req, res) => {
    const customer = req.customer;
    const order = orders.find((item) => item._id === req.params.id);
    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    if (!order) {
      res.status(404).json({ message: "Order not found." });
      return;
    }
    const isOwner = customer._id === order.customerId || customer.email.toLowerCase() === String(order.customerEmail || "").toLowerCase();
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
      ...order.statusHistory || [],
      { status: "return_requested", note: "Return requested by customer.", at: (/* @__PURE__ */ new Date()).toISOString() }
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
      link: "/admin?tab=orders"
    });
    persistNotifications().catch((err) => console.error("Notification save error:", err));
    res.json({ success: true, order });
  });
  if (process.env.NODE_ENV !== "production") {
    process.env.DISABLE_HMR ??= "true";
    const vite = await (0, import_vite.createServer)({
      root: frontendRoot,
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(import_express.default.static(frontendDist));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(frontendDist, "index.html"));
    });
  }
  const listen = (port) => {
    const server = app.listen(port, HOST, () => {
      console.log(`Server running on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${port}`);
    });
    server.once("error", (err) => {
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
startServer();
//# sourceMappingURL=server.cjs.map
