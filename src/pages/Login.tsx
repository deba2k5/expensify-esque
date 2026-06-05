import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, MapPin, Clock4 } from "lucide-react";
import logoAsset from "@/assets/sinhas-logo.asset.json";

export default function Login() {
  const { signIn, user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  if (!loading && user) {
    return <Navigate to={role === "employee" ? "/" : "/admin"} replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back");
      nav("/", { replace: true });
    } catch (err) {
      toast.error((err as Error).message || "Sign-in failed");
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
              <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in with your company email to continue.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@sinhas.ch"
                  className="h-11"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password"
                  className="h-11"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-elevated" disabled={busy}>
                {busy ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-xs text-muted-foreground text-center">
              Accounts are provisioned by your administrator.
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
