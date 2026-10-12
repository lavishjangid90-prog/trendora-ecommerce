import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { Request } from "express";
import jwt from "jsonwebtoken";

export type SellerStatus =
  | "INVITED"
  | "REGISTERED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "REJECTED"
  | "SUSPENDED"
  | "BLOCKED";

export type AccountUser = {
  _id: string;
  name: string;
  email: string;
  /** A seller-owned login ID, separate from the platform administrator credentials. */
  sellerId?: string;
  businessName?: string;
  city?: string;
  state?: string;
  pincode?: string;
  businessAddress?: string;
  /** Private fulfilment details: only exposed to the seller/admin, not catalog shoppers. */
  pickupAddress?: string;
  serviceablePincodes?: string[];
  fulfillmentRadiusKm?: number;
  processingDays?: number;
  dispatchSlaHours?: number;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  businessType?: string;
  productCategories?: string[];
  manufacturingStatus?: string;
  productRange?: string;
  qualityInfo?: string;
  expectedPriceRange?: string;
  returnDispatchInfo?: string;
  requiredDocuments?: string[];
  onboardingMode?: "INVITATION_ONLY" | "APPLICATION_ONLY" | "OPEN_REGISTRATION";
  sellerStatus?: SellerStatus;
  sellerApproved?: boolean;
  invitationCode?: string;
  invitationId?: string;
  passwordHash?: string;
  role: "customer" | "user" | "seller" | "TRENDORA_ADMIN" | "COMPANY_ADMIN" | "admin" | "manager";
  blocked: boolean;
  createdAt: string;
  orders: number;
  spent: number;
  avatar?: string;
};

type AuthOptions = {
  users: AccountUser[];
  sellerInvitations?: Array<{ _id: string; code: string; status: string; type?: string; expiresAt?: string; used?: boolean; usedBy?: string; sellerId?: string; createdBy?: string; usedAt?: string; }>;
  jwtSecret: string;
  adminEmail: string;
  adminPassword: string;
  persistUsers: () => Promise<void>;
  onboardingMode?: string;
};

export function createAuthService(options: AuthOptions) {
  function getPublicUser(user: AccountUser) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  function makeAuthToken(user: AccountUser) {
    const sellerStatus = user.sellerStatus ?? (user.sellerApproved ? "APPROVED" : "REGISTERED");
    return jwt.sign(
      { sub: user._id, email: user.email, role: user.role, name: user.name, sellerStatus },
      options.jwtSecret,
      { expiresIn: "7d" },
    );
  }

  // helper to create a seller account (keeps register() behaviour unchanged)
  async function registerSeller(input: Record<string, unknown>) {
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const sellerId = String(input.sellerId || "").trim().toLowerCase();
    const businessName = String(input.businessName || "").trim();
    const city = String(input.city || "").trim();
    const state = String(input.state || "").trim();
    const pincode = String(input.pincode || "").trim();
    const businessAddress = String(input.businessAddress || "").trim();
    const phone = String(input.phone || "").trim();
    const termsAccepted = input.termsAccepted === true;
    const password = String(input.password || "");
    const invitationCode = String(input.invitationCode || "").trim().toUpperCase();

    const onboardingMode = String(options.onboardingMode || "INVITATION_ONLY").toUpperCase();
    if (onboardingMode === "INVITATION_ONLY" && !invitationCode) {
      return { status: 403, body: { message: "Seller registration requires a valid Trendora invitation code." } };
    }

    if (!name || !email || !sellerId || !businessName || businessName.length < 3 || !city || city.length < 2 || !/^[+\d][\d\s-]{6,20}$/.test(phone) || !termsAccepted || !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(sellerId) || password.length < 8) {
      return { status: 400, body: { message: "Seller application needs a valid business name, city, phone, Seller ID (3-32 characters), 8+ character password, and terms acceptance." } };
    }
    if (options.users.some((user) => user.email.toLowerCase() === email || user.sellerId === sellerId)) {
      return { status: 409, body: { message: "Email or seller ID already registered." } };
    }

    if (onboardingMode === "INVITATION_ONLY") {
      const invitation = options.sellerInvitations?.find((entry) => entry.code.toUpperCase() === invitationCode && entry.type !== "customer");
      if (!invitation) {
        return { status: 403, body: { message: "Invalid or unavailable seller invitation code." } };
      }
      if (invitation.status === "DISABLED" || invitation.status === "USED" || invitation.status === "EXPIRED") {
        return { status: 403, body: { message: "This invitation code is no longer valid." } };
      }
      if (invitation.expiresAt && Date.parse(invitation.expiresAt) < Date.now()) {
        return { status: 403, body: { message: "This invitation code has expired." } };
      }
    }

    const user: AccountUser = {
      _id: `u_${randomUUID()}`,
      name,
      email,
      sellerId,
      businessName,
      city,
      state,
      pincode,
      businessAddress,
      phone,
      sellerApproved: false,
      sellerStatus: "PENDING_REVIEW",
      invitationCode,
      passwordHash: await bcrypt.hash(password, 10),
      role: "seller",
      blocked: false,
      createdAt: new Date().toISOString(),
      orders: 0,
      spent: 0,
    };
    options.users.unshift(user);
    if (onboardingMode === "INVITATION_ONLY") {
      const invitation = options.sellerInvitations?.find((entry) => entry.code.toUpperCase() === invitationCode);
      if (invitation) {
        invitation.status = "USED";
        invitation.used = true;
        invitation.usedBy = user._id;
        invitation.usedAt = new Date().toISOString();
        invitation.sellerId = user._id;
      }
    }
    await options.persistUsers();
    return { status: 201, body: { token: makeAuthToken(user), user: getPublicUser(user) } };
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
      role: "customer",
      blocked: false,
      createdAt: new Date().toISOString(),
      orders: 0,
      spent: 0,
    };
    options.users.unshift(user);
    await options.persistUsers();
    return { status: 201, body: { token: makeAuthToken(user), user: getPublicUser(user) } };
  }

  async function googleLogin(input: Record<string, unknown>) {
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const avatar = String(input.avatar || "").trim() || undefined;

    if (!name || !email) {
      return { status: 400, body: { message: "Google name and email are required." } };
    }

    let user = options.users.find((entry) => entry.email.toLowerCase() === email);

    if (!user) {
      user = {
        _id: `u_${randomUUID()}`,
        name,
        email,
        role: "customer",
        blocked: false,
        createdAt: new Date().toISOString(),
        orders: 0,
        spent: 0,
        avatar,
      };
      options.users.unshift(user);
      await options.persistUsers();
      return { status: 201, body: { token: makeAuthToken(user), user: getPublicUser(user) } };
    }

    if (avatar && !user.avatar) {
      user.avatar = avatar;
      await options.persistUsers();
    }

    if (user.name !== name) {
      user.name = name;
      await options.persistUsers();
    }

    if (user.blocked) {
      return { status: 403, body: { message: "Account blocked. Support se contact karo." } };
    }

    return { status: 200, body: { token: makeAuthToken(user), user: getPublicUser(user) } };
  }

  async function login(input: Record<string, unknown>) {
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    const user = options.users.find((entry) => entry.email.toLowerCase() === email || entry.sellerId === email);

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return { status: 401, body: { message: "Invalid email or password." } };
    }
    if (user.blocked) {
      return { status: 403, body: { message: "Account blocked. Support se contact karo." } };
    }
    if (user.role === "seller" && (user.sellerStatus === "PENDING_REVIEW" || user.sellerStatus === "REGISTERED")) {
      return { status: 403, body: { message: "Your seller application is pending admin approval." } };
    }
    if (user.role === "seller" && user.sellerStatus === "REJECTED") {
      return { status: 403, body: { message: "Your seller account has been rejected." } };
    }
    if (user.role === "seller" && (user.sellerStatus === "SUSPENDED" || user.sellerStatus === "BLOCKED")) {
      return { status: 403, body: { message: "Your seller account is inactive." } };
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
      { sub: "trendora-admin", email: options.adminEmail, role: "TRENDORA_ADMIN" },
      options.jwtSecret,
      { expiresIn: "8h" },
    );
    return {
      status: 200,
      body: { token, admin: { name: "Trendora Admin", email: options.adminEmail, role: "TRENDORA_ADMIN" }, expiresIn: "8h" },
    };
  }

  return { getPublicUser, getRequestUser, register, registerSeller, login, googleLogin, adminLogin };
}
