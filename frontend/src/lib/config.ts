export const API_BASE = (import.meta.env.VITE_MONGODB_API_URL as string | undefined)?.replace(/\/$/, "") || "";
export const DRIVE_UPLOAD_URL = (import.meta.env.VITE_GOOGLE_DRIVE_UPLOAD_URL as string | undefined) || "";
const ADMINS = ((import.meta.env.VITE_ADMIN_EMAILS as string | undefined) || "admin@sinhas.ch,debangshu@sinhas.ch,nirmalya@sinhas.ch,rishu@sinhas.ch,rajeev@sinhas.ch")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMINS.includes(email.toLowerCase());

export const USE_MOCK_API = !API_BASE;
