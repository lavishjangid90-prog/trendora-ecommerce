import type { Request, RequestHandler } from "express";

export function createCustomerAuthMiddleware<TUser>(getRequestUser: (request: Request) => TUser | null): RequestHandler {
  return (req, res, next) => {
    const user = getRequestUser(req);
    if (!user) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    (req as Request & { customer?: TUser }).customer = user;
    next();
  };
}
