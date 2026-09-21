import type { RequestHandler } from "express";
import type { createAuthService } from "../services/auth.service";

type AuthService = ReturnType<typeof createAuthService>;

export function createAuthController(service: AuthService) {
  const register: RequestHandler = async (req, res) => {
    const result = await service.register(req.body || {});
    res.status(result.status).json(result.body);
  };

  const registerSeller: RequestHandler = async (req, res) => {
    const result = await (service as any).registerSeller(req.body || {});
    res.status(result.status).json(result.body);
  };

  const login: RequestHandler = async (req, res) => {
    const result = await service.login(req.body || {});
    res.status(result.status).json(result.body);
  };

  const googleLogin: RequestHandler = async (req, res) => {
    const result = await service.googleLogin(req.body || {});
    res.status(result.status).json(result.body);
  };

  const me: RequestHandler = (req, res) => {
    const customer = (req as typeof req & { customer?: Parameters<AuthService["getPublicUser"]>[0] }).customer;
    if (!customer) {
      res.status(401).json({ message: "Login required." });
      return;
    }
    res.json({ user: service.getPublicUser(customer) });
  };

  const adminLogin: RequestHandler = (req, res) => {
    const result = service.adminLogin(req.body || {});
    res.status(result.status).json(result.body);
  };

  const adminSession: RequestHandler = (_req, res) => {
    res.json({ authenticated: true, role: "admin" });
  };

  return { register, registerSeller, login, googleLogin, me, adminLogin, adminSession };
}
