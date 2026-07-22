/**
 * Phase 1 compatibility boundary.
 * The current route registration remains in the legacy module while shared
 * configuration, persistence, middleware, and server startup are extracted.
 */
export { startServer } from "../server";
