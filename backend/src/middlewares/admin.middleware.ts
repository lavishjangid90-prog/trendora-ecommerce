import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export function createAdminMiddleware(adminPassword: string, jwtSecret: string): RequestHandler {
  return (req, res, next) => {
    const authHeader = req.header("authorization") || "";
    const legacyKey = req.header("x-admin-key");
    if (legacyKey && legacyKey === adminPassword) {
      next();
      return;
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    try {
      const payload = jwt.verify(token, jwtSecret) as { role?: string };
      if (payload.role !== "admin" && payload.role !== "manager") {
        res.status(403).json({ message: "Admin role required." });
        return;
      }
      next();
    } catch {
      res.status(401).json({ message: "Admin login required." });
    }
  };
}
