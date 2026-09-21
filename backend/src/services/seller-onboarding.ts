export type SellerRole = "customer" | "seller" | "TRENDORA_ADMIN" | "COMPANY_ADMIN" | "user" | "admin" | "manager";

export type SellerStatus =
  | "INVITED"
  | "REGISTERED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "BLOCKED";

export type SellerInvitationStatus = "ACTIVE" | "USED" | "DISABLED" | "EXPIRED";

export type SellerInvitation = {
  _id: string;
  code: string;
  type: "seller";
  status: SellerInvitationStatus;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  used: boolean;
  usedBy?: string;
  usedAt?: string;
  notes?: string;
  sellerId?: string;
};

export function normalizeSellerRole(value: unknown): SellerRole {
  const role = String(value || "customer").trim();
  if (role === "user" || role === "customer") return "customer";
  if (role === "seller") return "seller";
  if (role === "TRENDORA_ADMIN" || role === "COMPANY_ADMIN" || role === "admin") return "TRENDORA_ADMIN";
  if (role === "manager") return "manager";
  return "customer";
}

export function generateSellerInvitationCode() {
  const prefix = "TRD-SELL-";
  const randomPart = Array.from({ length: 7 }, () => {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  }).join("");
  return `${prefix}${randomPart}`;
}

export function validateSellerInvitation(invitation: SellerInvitation | undefined, now = Date.now()) {
  if (!invitation) return { valid: false, reason: "Invitation code not found." };
  if (invitation.type !== "seller") return { valid: false, reason: "This invitation is not for seller onboarding." };
  if (invitation.status === "DISABLED") return { valid: false, reason: "This invitation code has been disabled." };
  if (invitation.status === "USED") return { valid: false, reason: "This invitation code has already been used." };
  if (invitation.status === "EXPIRED") return { valid: false, reason: "This invitation code has expired." };
  if (invitation.expiresAt) {
    const expiresAt = new Date(invitation.expiresAt).getTime();
    if (Number.isFinite(expiresAt) && now > expiresAt) {
      return { valid: false, reason: "This invitation code has expired." };
    }
  }
  return { valid: true };
}
