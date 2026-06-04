import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 grid place-items-center bg-white text-primary rounded-md font-bold text-lg">+</div>
          <span className="font-semibold tracking-tight">Sinhas Track</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold leading-tight">
            Real-time workforce tracking,<br/>built Swiss-precise.
          </h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Clock in, manage breaks, capture location, upload daily reports.
            Admins get live oversight and full audit trails.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/60">© Sinhas {new Date().getFullYear()}</div>
      </div>

      <div className="flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use your company email and password.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-xs text-muted-foreground">
            Accounts are provisioned in Firebase by your administrator.
          </p>
        </Card>
      </div>
    </div>
  );
}
