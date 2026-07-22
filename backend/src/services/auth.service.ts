import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { Request } from "express";
import jwt from "jsonwebtoken";

export type AccountUser = {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: "user" | "admin" | "manager";
  blocked: boolean;
  createdAt: string;
  orders: number;
  spent: number;
  avatar?: string;
};

type AuthOptions = {
  users: AccountUser[];
  jwtSecret: string;
  adminEmail: string;
  adminPassword: string;
  persistUsers: () => Promise<void>;
};

export function createAuthService(options: AuthOptions) {
  function getPublicUser(user: AccountUser) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  function makeAuthToken(user: AccountUser) {
    return jwt.sign(
      { sub: user._id, email: user.email, role: user.role, name: user.name },
      options.jwtSecret,
      { expiresIn: "7d" },
    );
  }

  function getRequestUser(req: Request) {
    const authHeader = req.header("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return null;

    try {
      const payload = jwt.verify(token, options.jwtSecret) as { sub?: string; email?: string };
      const user = options.users.find(
        (item) => item._id === payload.sub || item.email.toLowerCase() === String(payload.email || "").toLowerCase(),
      );
      if (!user || user.blocked) return null;
      return user;
    } catch {
      return null;
    }
  }

  async function register(input: Record<string, unknown>) {
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");

    if (!name || !email || password.length < 6) {
      return { status: 400, body: { message: "Name, email and a 6+ character password are required." } };
    }
    if (options.users.some((user) => user.email.toLowerCase() === email)) {
      return { status: 409, body: { message: "Email already registered." } };
    }

    const user: AccountUser = {
      _id: `u_${randomUUID()}`,
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "user",
      blocked: false,
      createdAt: new Date().toISOString(),
      orders: 0,
      spent: 0,
    };
    options.users.unshift(user);
    await options.persistUsers();
    return { status: 201, body: { token: makeAuthToken(user), user: getPublicUser(user) } };
  }

  async function login(input: Record<string, unknown>) {
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    const user = options.users.find((entry) => entry.email.toLowerCase() === email);

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return { status: 401, body: { message: "Invalid email or password." } };
    }
    if (user.blocked) {
      return { status: 403, body: { message: "Account blocked. Support se contact karo." } };
    }
    return { status: 200, body: { token: makeAuthToken(user), user: getPublicUser(user) } };
  }

  function adminLogin(input: Record<string, unknown>) {
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    if (email !== options.adminEmail.toLowerCase() || password !== options.adminPassword) {
      return { status: 401, body: { message: "Invalid admin email or password." } };
    }

    const token = jwt.sign(
      { sub: "trendora-admin", email: options.adminEmail, role: "admin" },
      options.jwtSecret,
      { expiresIn: "8h" },
    );
    return {
      status: 200,
      body: { token, admin: { name: "Trendora Admin", email: options.adminEmail, role: "admin" }, expiresIn: "8h" },
    };
  }

  return { getPublicUser, getRequestUser, register, login, adminLogin };
}
