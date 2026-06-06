import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, MapPin, Clock4, Info } from "lucide-react";
import logoAsset from "@/assets/sinhas-logo.asset.json";
import { firebaseAuth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { api } from "@/lib/api";
import { isAdminEmail } from "@/lib/config";

export default function Login() {
  const { signIn, user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const nav = useNavigate();

  if (!loading && user) {
    return <Navigate to={role === "employee" ? "/" : "/admin"} replace />;
  }

  const friendlyError = (err: unknown) => {
    const msg = (err as { code?: string; message?: string })?.code || (err as Error)?.message || "Something went wrong";
    if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found"))
      return "Email or password is incorrect. If you don't have an account yet, switch to Create Account.";
    if (msg.includes("email-already-in-use")) return "That email is already registered — switch to Sign In.";
    if (msg.includes("weak-password")) return "Password must be at least 6 characters.";
    if (msg.includes("invalid-email")) return "Please enter a valid email address.";
    if (msg.includes("network")) return "Network problem. Check your connection and try again.";
    return msg;
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back");
      nav("/", { replace: true });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (fullName) await updateProfile(cred.user, { displayName: fullName });
      // bootstrap profile
      await api.upsertProfile({
        employeeId: email.trim().split("@")[0].toUpperCase(),
        fullName: fullName || email.trim().split("@")[0],
        email: email.trim(),
        mobile: "",
        department: "—",
        employeeType: "permanent",
        active: true,
        createdAt: new Date().toISOString(),
      });
      toast.success("Account created");
      nav(isAdminEmail(email.trim()) ? "/admin" : "/", { replace: true });
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-hero text-white">
        <div className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        <div className="relative flex items-center gap-3">
          <img src={logoAsset.url} alt="Sinha's Group" className="h-12 w-12 rounded-xl bg-white p-1 object-contain shadow-elevated" />
          <div>
            <div className="font-semibold tracking-tight text-lg leading-tight">Sinha's Group</div>
            <div className="text-xs text-white/70">Workforce Operations</div>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Live workforce intelligence
          </div>
          <h1 className="text-4xl xl:text-5xl font-semibold leading-[1.05] tracking-tight">
            Employee Work Hours<br/>
            <span className="text-white/70">& Activity Tracking System</span>
          </h1>
          <p className="text-white/80 text-base leading-relaxed">
            Clock in, manage breaks, capture location, and submit daily reports.
            Admins get live oversight and full audit trails — all in one workspace.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { i: Clock4, l: "Live hours" },
              { i: MapPin, l: "Geofence" },
              { i: ShieldCheck, l: "Audit trail" },
            ].map(({ i: Icon, l }) => (
              <div key={l} className="rounded-xl border border-white/15 bg-white/5 backdrop-blur p-3">
                <Icon className="h-4 w-4 mb-2 text-white/80" />
                <div className="text-xs font-medium">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/60">© Sinha's Group {new Date().getFullYear()}</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-gradient-surface">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoAsset.url} alt="Sinha's Group" className="h-11 w-11 rounded-lg bg-white p-1 object-contain ring-1 ring-border" />
            <div className="font-semibold tracking-tight">Sinha's Group</div>
          </div>

          <Card className="p-8 shadow-card border-border/60">
            <div className="space-y-1.5 mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in with your company email to continue."
                  : "Register a new employee or admin account."}
              </p>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mb-5">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-5">
                <form onSubmit={onSignIn} className="space-y-4">
                  <FieldEmail value={email} onChange={setEmail} />
                  <FieldPassword value={password} onChange={setPassword} />
                  <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-elevated" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-5">
                <form onSubmit={onSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" className="h-11" placeholder="Jane Doe"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <FieldEmail value={email} onChange={setEmail} />
                  <FieldPassword value={password} onChange={setPassword} hint="At least 6 characters." />
                  <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-elevated" disabled={busy}>
                    {busy ? "Creating…" : "Create account"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Admin access is automatically granted to emails listed in <code className="text-foreground">VITE_ADMIN_EMAILS</code> (default: <code className="text-foreground">admin@sinhas.ch</code>).
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-2 rounded-lg border bg-muted/40 p-3 flex gap-2 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-info" />
              <div>
                First-time setup: ensure <strong>Firestore Database</strong> is enabled in your Firebase project
                and rules allow authenticated reads/writes, otherwise data won't sync between devices.
              </div>
            </div>
          </Card>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Protected by enterprise-grade authentication.
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldEmail({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" autoComplete="email" placeholder="you@sinhas.ch"
        className="h-11"
        value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}

function FieldPassword({ value, onChange, hint }: { value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" autoComplete="current-password"
        className="h-11"
        value={value} onChange={(e) => onChange(e.target.value)} required />
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
