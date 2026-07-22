import type { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";

type AuthenticatedUser = {
  _id: string;
  email: string;
  role: string;
  blocked: boolean;
};

export function createAuthMiddleware<TUser extends AuthenticatedUser>(options: {
  adminPassword: string;
  jwtSecret: string;
  getRequestUser: (request: Request) => TUser | null;
}) {
  const requireAdmin: RequestHandler = (req, res, next) => {
    const authHeader = req.header("authorization") || "";
    const legacyKey = req.header("x-admin-key");

    if (legacyKey && legacyKey === options.adminPassword) {
      next();
      return;
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    try {
      const payload = jwt.verify(token, options.jwtSecret) as { role?: string };
      if (payload.role !== "admin" && payload.role !== "manager") {
        res.status(403).json({ message: "Admin role required." });
        return;
      }
      next();
    } catch {
      res.status(401).json({ message: "Admin login required." });
    }
  };

  const requireCustomer: RequestHandler = (req, res, next) => {
    const user = options.getRequestUser(req);
    if (!user) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    (req as Request & { customer?: TUser }).customer = user;
    next();
  };

  return { requireAdmin, requireCustomer };
}
