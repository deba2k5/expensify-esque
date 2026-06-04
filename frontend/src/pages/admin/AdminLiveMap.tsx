import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { WorkSession } from "@/lib/types";
import { Card } from "@/components/ui/card";
import LiveMap from "@/components/LiveMap";

export default function AdminLiveMap() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  useEffect(() => {
    const load = async () => setSessions(await api.listSessions());
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  const active = sessions.filter((s) => !s.clockOut);
  const points = active
    .map((s) => {
      const last = s.locations[s.locations.length - 1];
      if (!last) return null;
      return { id: s.id, lat: last.lat, lng: last.lng, label: `${s.fullName} · ${new Date(last.at).toLocaleTimeString()}` };
    })
    .filter(Boolean) as { id: string; lat: number; lng: number; label: string }[];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Live employee map</h1>
        <p className="text-sm text-muted-foreground">{points.length} employee(s) reporting location.</p>
      </header>
      <Card className="p-3">
        <div className="h-[560px]"><LiveMap points={points} /></div>
      </Card>
    </div>
  );
}
