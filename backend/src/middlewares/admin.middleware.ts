import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export function createAdminMiddleware(adminPassword: string, jwtSecret: string): RequestHandler {
  return (req, res, next) => {
    const authHeader = req.header("authorization") || "";
    const legacyKey = req.header("x-admin-key");
    if (legacyKey && legacyKey === adminPassword) {
      // legacy admin key grants full access
      next();
      return;
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    try {
      const payload = jwt.verify(token, jwtSecret) as { role?: string; sub?: string; email?: string };
      // allow global admins, managers, and sellers (seller will be scoped by handlers)
      if (payload.role !== "admin" && payload.role !== "manager" && payload.role !== "seller") {
        res.status(403).json({ message: "Admin role required." });
        return;
      }
      // attach decoded payload for downstream handlers
      (req as any).adminPayload = payload;
      next();
    } catch {
      res.status(401).json({ message: "Admin login required." });
    }
  };
}
