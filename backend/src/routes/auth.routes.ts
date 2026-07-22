import { Router, type RequestHandler } from "express";

type AuthController = {
  register: RequestHandler;
  login: RequestHandler;
  me: RequestHandler;
  adminLogin: RequestHandler;
  adminSession: RequestHandler;
};

export function createAuthRouter(controller: AuthController, requireCustomer: RequestHandler, requireAdmin: RequestHandler) {
  const router = Router();
  router.post("/auth/register", controller.register);
  router.post("/auth/login", controller.login);
  router.get("/auth/me", requireCustomer, controller.me);
  router.post("/admin/login", controller.adminLogin);
  router.get("/admin/session", requireAdmin, controller.adminSession);
  return router;
}
