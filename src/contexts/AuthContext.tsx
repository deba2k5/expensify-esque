import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { firebaseAuth } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  User,
} from "firebase/auth";
import { api } from "@/lib/api";
import { isAdminEmail } from "@/lib/config";
import type { EmployeeProfile, Role } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  profile: EmployeeProfile | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);
const TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<number | undefined>(undefined);

  const role: Role = isAdminEmail(user?.email) ? "super_admin" : "employee";

  const refreshProfile = useCallback(async () => {
    if (!user?.email) return setProfile(null);
    let p = await api.getProfile(user.email);
    if (!p) {
      // bootstrap a minimal profile so the user can edit details later
      p = await api.upsertProfile({
        employeeId: user.email.split("@")[0].toUpperCase(),
        fullName: user.displayName || user.email.split("@")[0],
        email: user.email,
        mobile: "",
        department: "—",
        employeeType: "permanent",
        active: true,
        createdAt: new Date().toISOString(),
      });
    }
    setProfile(p);
  }, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user) refreshProfile();
    else setProfile(null);
  }, [user, refreshProfile]);

  // Session inactivity timeout (30 min) — only when signed in
  useEffect(() => {
    if (!user) return;
    const reset = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        fbSignOut(firebaseAuth);
        alert("Session expired due to inactivity. Please sign in again.");
      }, TIMEOUT_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      window.clearTimeout(timerRef.current);
    };
  }, [user]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
    await api.log({ actor: email, action: "auth.signin" });
  };

  const signOut = async () => {
    if (user?.email) await api.log({ actor: user.email, action: "auth.signout" });
    await fbSignOut(firebaseAuth);
  };

  return (
    <Ctx.Provider value={{ user, profile, role, loading, signIn, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
};
