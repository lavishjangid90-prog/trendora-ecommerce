import type { ErrorRequestHandler } from "express";

/**
 * Last-resort error boundary. Route handlers continue returning their existing
 * responses; this only covers unhandled Express errors.
 */
export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error("Unhandled API error:", error);
  if (res.headersSent) return;
  res.status(500).json({ message: "Internal server error." });
};
