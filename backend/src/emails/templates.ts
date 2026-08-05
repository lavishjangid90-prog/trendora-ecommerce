import type { AccountUser } from '../services/auth.service';

export function renderWelcomeEmail(user: AccountUser) {
  const subject = `Welcome to Trendora, ${user.name}!`;
  const text = `Hi ${user.name},\n\nWelcome to Trendora. We're excited to have you on board. Start uploading products and grow your store!\n\n— The Trendora team`;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
      <h2>Welcome to Trendora, ${user.name}!</h2>
      <p>We're excited to have you on board. Start uploading products and grow your store.</p>
      <p style="margin-top:24px; font-size:12px; color:#666;">— The Trendora team</p>
    </div>
  `;
  return { subject, text, html };
}

export function renderResetEmail(user: AccountUser, token: string) {
  const subject = `Trendora password reset`;
  const resetUrl = `${process.env.APP_URL || ''}/reset-password?token=${encodeURIComponent(token)}`;
  const text = `Hi ${user.name},\n\nUse the following token to reset your password: ${token}\nOr click: ${resetUrl}\n\nIf you didn't request this, ignore this message.`;
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
      <h3>Password reset request</h3>
      <p>Hi ${user.name},</p>
      <p>Use the token below to reset your password. It expires in 1 hour.</p>
      <p style="font-family:monospace; background:#f5f5f5; padding:10px; border-radius:6px; display:inline-block;">${token}</p>
      <p style="margin-top:16px">Or click <a href="${resetUrl}">this link</a> to reset your password.</p>
      <p style="margin-top:18px; font-size:12px; color:#666;">If you didn't request a password reset, safely ignore this email.</p>
    </div>
  `;
  return { subject, text, html };
}
