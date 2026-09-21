import type { Request, RequestHandler } from "express";

export function createCustomerAuthMiddleware<TUser>(getRequestUser: (request: Request) => TUser | null): RequestHandler {
  return (req, res, next) => {
    const user = getRequestUser(req);
    if (!user) {
      res.status(401).json({ message: "Login required." });
      return;
    }

    const role = String((user as any)?.role || "customer").toLowerCase();
    if (role === "seller" || role === "admin" || role === "manager" || role === "trendora_admin" || role === "company_admin") {
      (req as Request & { customer?: TUser }).customer = user;
      next();
      return;
    }

    (req as Request & { customer?: TUser }).customer = user;
    next();
  };
}
