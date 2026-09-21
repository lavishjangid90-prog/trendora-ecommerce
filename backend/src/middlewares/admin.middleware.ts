import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export function createAdminMiddleware(adminPassword: string, jwtSecret: string): RequestHandler {
  return (req, res, next) => {
    const authHeader = req.header("authorization") || "";
    const legacyKey = req.header("x-admin-key");
    if (legacyKey && legacyKey === adminPassword) {
      (req as any).adminPayload = { role: "TRENDORA_ADMIN" };
      next();
      return;
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    try {
      const payload = jwt.verify(token, jwtSecret) as { role?: string; sub?: string; email?: string };
      const role = String(payload.role || "").toUpperCase();
      if (role !== "TRENDORA_ADMIN" && role !== "COMPANY_ADMIN" && role !== "ADMIN") {
        res.status(403).json({ message: "Trendora company admin access required." });
        return;
      }
      (req as any).adminPayload = payload;
      next();
    } catch {
      res.status(401).json({ message: "Admin login required." });
    }
  };
}
