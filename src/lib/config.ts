const DEFAULT_API_BASE = import.meta.env.DEV ? "http://localhost:5000/api" : "/api";

export const API_BASE =
  (import.meta.env.VITE_MONGODB_API_URL as string | undefined)?.replace(/\/$/, "") ||
  DEFAULT_API_BASE;
export const DRIVE_UPLOAD_URL = (import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL as string | undefined) || "";
const ADMINS = ((import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || "admin@sinhas.ch")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMINS.includes(email.toLowerCase());

export const WS_URL =
  (import.meta.env.VITE_WS_URL as string | undefined)?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin);
