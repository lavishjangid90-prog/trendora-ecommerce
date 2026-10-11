import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentModuleDir = path.dirname(fileURLToPath(import.meta.url));

// The bundled production entry point lives in backend/dist; development files
// live under backend/src. Keep all existing environment and data locations.
export const backendDir = path.basename(currentModuleDir) === "dist"
  ? path.dirname(currentModuleDir)
  : path.resolve(currentModuleDir, "../..");

export const envPath = path.join(backendDir, ".env.local");

dotenv.config({ path: envPath });

export const environment = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || "0.0.0.0",
  adminEmail: process.env.ADMIN_EMAIL || "admin@trendora.local",
  adminPassword: process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY || "trendora-admin",
  jwtSecret: process.env.JWT_SECRET || "trendora-local-admin-secret",
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  mongoUri: process.env.MONGODB_URI || "",
  sellerOnboardingMode: (process.env.SELLER_ONBOARDING_MODE || "INVITATION_ONLY").toUpperCase(),
  appUrl: (process.env.APP_URL || process.env.FRONTEND_URL || "").replace(/\/$/, ""),
  allowedSites: process.env.ALLOWED_SITES
    ? process.env.ALLOWED_SITES.split(',').map(s => s.trim()).filter(Boolean)
    : [],
};

export const paths = {
  frontendRoot: process.env.FRONTEND_DIR
    ? path.resolve(process.env.FRONTEND_DIR)
    : path.resolve(backendDir, "../frontend"),
  dataDir: path.join(backendDir, "data"),
};

export const frontendDist = process.env.FRONTEND_DIST
  ? path.resolve(process.env.FRONTEND_DIST)
  : path.join(paths.frontendRoot, "dist");

export const dataFiles = {
  uploadsDir: path.join(paths.dataDir, "uploads"),
  products: path.join(paths.dataDir, "products.json"),
  orders: path.join(paths.dataDir, "orders.json"),
  users: path.join(paths.dataDir, "users.json"),
  coupons: path.join(paths.dataDir, "coupons.json"),
  banners: path.join(paths.dataDir, "banners.json"),
  notifications: path.join(paths.dataDir, "notifications.json"),
  sellerInvitations: path.join(paths.dataDir, "seller-invitations.json"),
  supplierApplications: path.join(paths.dataDir, "supplier-applications.json"),
  revenueLedger: path.join(paths.dataDir, "revenue-ledger.json"),
  sellerCampaigns: path.join(paths.dataDir, "seller-campaigns.json"),
  aiAnalytics: path.join(paths.dataDir, "ai-analytics.json"),
  localCommerceConfig: path.join(paths.dataDir, "local-commerce-config.json"),
  reviews: path.join(paths.dataDir, "reviews.json"),
  returns: path.join(paths.dataDir, "returns.json"),
};
