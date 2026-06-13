import { useEffect, useMemo, useState } from "react";
import { api, fmtDuration } from "@/lib/api";
import type { EmployeeProfile, WorkSession } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, AlertTriangle, CheckSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const load = async () => {
      setProfiles(await api.listProfiles());
      setSessions(await api.listSessions());
    };
    load();
    const t = setInterval(() => {
      setTick(prev => prev + 1);
      load();
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const activeNow = sessions.filter((s) => !s.clockOut);
  const pending = sessions.filter((s) => s.status === "pending" && s.clockOut);
  const geofenceAlerts = sessions.flatMap((s) =>
    s.locations.filter((l) => l.outsideGeofence).map(() => s.email)
  );

  // Function to calculate current work and break time for a session
  const calculateSessionStats = (s: WorkSession) => {
    const now = Date.now();
    let workMs = s.totalWorkMs || 0;
    let breakMs = s.totalBreakMs || 0;

    if (!s.clockOut) {
      // Calculate current work time (time since clock-in minus break time)
      workMs = now - new Date(s.clockIn).getTime();
      breakMs = s.breaks.reduce((sum, b) => {
        const bEnd = b.end ? new Date(b.end).getTime() : now;
        return sum + (bEnd - new Date(b.start).getTime());
      }, 0);
    }

    return { workMs: Math.max(0, workMs - breakMs), breakMs };
  };

  const workTypeData = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => s.workType && map.set(s.workType, (map.get(s.workType) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.split("_").join(" "), value }));
  }, [sessions]);

  const hoursByEmployee = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      const stats = calculateSessionStats(s);
      const h = stats.workMs / 3600000;
      map.set(s.fullName, (map.get(s.fullName) || 0) + h);
    });
    return Array.from(map.entries()).slice(0, 8).map(([name, hours]) => ({ name, hours: +hours.toFixed(1) }));
  }, [sessions]);

  const colors = ["hsl(354 78% 49%)", "hsl(210 90% 50%)", "hsl(152 60% 38%)", "hsl(36 96% 50%)", "hsl(260 60% 55%)", "hsl(20 80% 55%)"];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Admin overview</h1>
        <p className="text-sm text-muted-foreground">Live activity across your workforce.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total employees" value={String(profiles.length)} />
        <Stat icon={Clock} label="Active now" value={String(activeNow.length)} accent />
        <Stat icon={CheckSquare} label="Pending reports" value={String(pending.length)} />
        <Stat icon={AlertTriangle} label="Geofence alerts" value={String(geofenceAlerts.length)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-medium mb-4">Hours per employee (all time)</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <BarChart data={hoursByEmployee}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-4">Work type distribution</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={workTypeData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                  {workTypeData.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Currently working</h3>
          <Link to="/admin/map" className="text-sm text-primary hover:underline">View live map →</Link>
        </div>
        <div className="space-y-2">
          {activeNow.length === 0 && (
            <p className="text-sm text-muted-foreground">No one is clocked in right now.</p>
          )}
          {activeNow.map((s) => (
            <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
              <div>
                <div className="font-medium">{s.fullName}</div>
                <div className="text-xs text-muted-foreground">{s.email}</div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Badge variant="outline">{s.workType?.split("_").join(" ") || "Unspecified"}</Badge>
                <span>Since {new Date(s.clockIn).toLocaleTimeString()}</span>
                <span className="text-muted-foreground">
                  {fmtDuration(Date.now() - new Date(s.clockIn).getTime())}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-md grid place-items-center ${accent ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold">{value}</div>
        </div>
      </div>
    </Card>
  );
}
