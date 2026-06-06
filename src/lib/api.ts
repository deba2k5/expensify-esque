import { API_BASE, USE_MOCK_API } from "./config";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import type {
  AuditLog,
  BreakEntry,
  EmployeeProfile,
  LocationPing,
  Status,
  WorkSession,
  WorkType,
} from "./types";

/**
 * Data layer.
 *   - If VITE_MONGODB_API_URL is set → talk to your REST API (see BACKEND.md).
 *   - Otherwise → use Firestore (shared across all devices/users).
 *     This means multiple employees and admins can be signed in at the same
 *     time on different browsers/devices and see the same live workforce data.
 */

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// ---------- Firestore helpers ----------
const PROFILES = "profiles";
const SESSIONS = "sessions";
const AUDIT = "audit";

const emailKey = (e: string) => e.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");

async function fsListProfiles(): Promise<EmployeeProfile[]> {
  const snap = await getDocs(collection(db, PROFILES));
  return snap.docs.map((d) => d.data() as EmployeeProfile);
}
async function fsGetProfile(email: string): Promise<EmployeeProfile | null> {
  const ref = doc(db, PROFILES, emailKey(email));
  const s = await getDoc(ref);
  return s.exists() ? (s.data() as EmployeeProfile) : null;
}
async function fsUpsertProfile(p: EmployeeProfile): Promise<EmployeeProfile> {
  await setDoc(doc(db, PROFILES, emailKey(p.email)), p, { merge: true });
  return p;
}

async function fsListSessions(filter?: { email?: string; status?: Status }): Promise<WorkSession[]> {
  const col = collection(db, SESSIONS);
  // Avoid composite indexes — filter in-memory after a simple query.
  let q;
  if (filter?.email) q = query(col, where("email", "==", filter.email));
  else q = query(col);
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorkSession, "id">) }));
  if (filter?.status) list = list.filter((s) => s.status === filter.status);
  return list.sort((a, b) => (b.clockIn || "").localeCompare(a.clockIn || ""));
}

async function fsCreateSession(s: WorkSession): Promise<WorkSession> {
  await setDoc(doc(db, SESSIONS, s.id), s);
  return s;
}

async function fsUpdateSession(id: string, patch: Partial<WorkSession>): Promise<WorkSession> {
  const ref = doc(db, SESSIONS, id);
  const cur = await getDoc(ref);
  if (!cur.exists()) throw new Error("Session not found");
  const merged: WorkSession = { ...(cur.data() as WorkSession), ...patch, id };
  if (merged.clockOut) {
    merged.totalWorkMs =
      new Date(merged.clockOut).getTime() - new Date(merged.clockIn).getTime();
  }
  merged.totalBreakMs = (merged.breaks || []).reduce(
    (sum, b) => sum + (b.end ? new Date(b.end).getTime() - new Date(b.start).getTime() : 0),
    0
  );
  await setDoc(ref, merged);
  return merged;
}

// ---------- PROFILES ----------
export const api = {
  async getProfile(email: string): Promise<EmployeeProfile | null> {
    if (USE_MOCK_API) return fsGetProfile(email);
    try {
      return await request(`/profiles/${encodeURIComponent(email)}`);
    } catch {
      return null;
    }
  },

  async upsertProfile(p: EmployeeProfile): Promise<EmployeeProfile> {
    if (USE_MOCK_API) return fsUpsertProfile(p);
    return request(`/profiles`, { method: "POST", body: JSON.stringify(p) });
  },

  async listProfiles(): Promise<EmployeeProfile[]> {
    if (USE_MOCK_API) return fsListProfiles();
    return request(`/profiles`);
  },

  // ---------- SESSIONS ----------
  async listSessions(filter?: { email?: string; status?: Status }): Promise<WorkSession[]> {
    if (USE_MOCK_API) return fsListSessions(filter);
    const qs = new URLSearchParams(filter as Record<string, string>).toString();
    return request(`/sessions${qs ? `?${qs}` : ""}`);
  },

  async getActiveSession(email: string): Promise<WorkSession | null> {
    const list = await this.listSessions({ email });
    return list.find((s) => !s.clockOut) || null;
  },

  async clockIn(profile: EmployeeProfile): Promise<WorkSession> {
    const session: WorkSession = {
      id: uid(),
      employeeId: profile.employeeId,
      email: profile.email,
      fullName: profile.fullName,
      date: today(),
      clockIn: new Date().toISOString(),
      breaks: [],
      locations: [],
      attachments: [],
      status: "pending",
    };
    if (USE_MOCK_API) return fsCreateSession(session);
    return request(`/sessions`, { method: "POST", body: JSON.stringify(session) });
  },

  async updateSession(id: string, patch: Partial<WorkSession>): Promise<WorkSession> {
    if (USE_MOCK_API) return fsUpdateSession(id, patch);
    return request(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async addBreak(id: string, type: BreakEntry["type"]): Promise<WorkSession> {
    const s = (await this.listSessions()).find((x) => x.id === id)!;
    const b: BreakEntry = { id: uid(), type, start: new Date().toISOString() };
    return this.updateSession(id, { breaks: [...s.breaks, b] });
  },

  async endBreak(id: string, breakId: string): Promise<WorkSession> {
    const s = (await this.listSessions()).find((x) => x.id === id)!;
    const breaks = s.breaks.map((b) =>
      b.id === breakId && !b.end ? { ...b, end: new Date().toISOString() } : b
    );
    return this.updateSession(id, { breaks });
  },

  async pushLocation(id: string, ping: LocationPing): Promise<WorkSession> {
    const s = (await this.listSessions()).find((x) => x.id === id)!;
    return this.updateSession(id, { locations: [...s.locations, ping] });
  },

  async setWorkType(id: string, workType: WorkType): Promise<WorkSession> {
    return this.updateSession(id, { workType });
  },

  async startTravel(id: string, destination: string, startLat?: number, startLng?: number) {
    const s = (await this.listSessions()).find((x) => x.id === id)!;
    const travels = s.travels || [];
    const t = { id: uid(), destination, startedAt: new Date().toISOString(), startLat, startLng };
    return this.updateSession(id, { travels: [...travels, t], workType: "travel" });
  },

  async endTravel(id: string, travelId: string, endLat?: number, endLng?: number, distanceMeters?: number) {
    const s = (await this.listSessions()).find((x) => x.id === id)!;
    const travels = (s.travels || []).map((t) =>
      t.id === travelId && !t.endedAt
        ? { ...t, endedAt: new Date().toISOString(), endLat, endLng, distanceMeters }
        : t
    );
    return this.updateSession(id, { travels });
  },

  async clockOut(id: string): Promise<WorkSession> {
    return this.updateSession(id, { clockOut: new Date().toISOString() });
  },

  /** Admin can force-clock-out an employee who forgot to log off. */
  async forceClockOut(id: string, adminEmail: string, note?: string): Promise<WorkSession> {
    const s = await this.updateSession(id, {
      clockOut: new Date().toISOString(),
      adminComment: note || `Force clocked-out by ${adminEmail}`,
    });
    await this.log({
      actor: adminEmail,
      action: "session.force_clock_out",
      target: id,
      meta: { email: s.email, note },
    });
    return s;
  },

  async submitReport(id: string, description: string, attachments: WorkSession["attachments"]) {
    const s = await this.updateSession(id, { description, attachments, status: "pending" });
    await this.log({ actor: s.email, action: "report.submitted", target: id });
    return s;
  },

  async reviewSession(id: string, status: "approved" | "rejected", comment: string, reviewer: string) {
    const s = await this.updateSession(id, {
      status,
      adminComment: comment,
      reviewedBy: reviewer,
      reviewedAt: new Date().toISOString(),
    });
    await this.log({ actor: reviewer, action: `report.${status}`, target: id, meta: { comment } });
    return s;
  },

  // ---------- AUDIT ----------
  async log(entry: Omit<AuditLog, "id" | "at">): Promise<AuditLog> {
    const log: AuditLog = { ...entry, id: uid(), at: new Date().toISOString() };
    if (USE_MOCK_API) {
      await addDoc(collection(db, AUDIT), { ...log, _ts: serverTimestamp() });
      return log;
    }
    return request(`/audit`, { method: "POST", body: JSON.stringify(log) });
  },

  async listAudit(): Promise<AuditLog[]> {
    if (USE_MOCK_API) {
      const snap = await getDocs(query(collection(db, AUDIT), orderBy("at", "desc"), limit(500)));
      return snap.docs.map((d) => d.data() as AuditLog);
    }
    return request(`/audit`);
  },
};

// ---------- Helpers ----------
export const fmtDuration = (ms?: number) => {
  if (!ms || ms < 0) return "0h 0m";
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
export const haversine = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// kept for unused-import safety
void updateDoc;
