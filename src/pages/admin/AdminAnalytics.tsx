import { useEffect, useMemo, useState } from "react";
import { api, fmtDuration } from "@/lib/api";
import type { WorkSession } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminAnalytics() {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [range, setRange] = useState("7");

  useEffect(() => { api.listSessions().then(setSessions); }, []);

  const cutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - Number(range));
    return d.toISOString().slice(0, 10);
  }, [range]);

  const filtered = sessions.filter((s) => s.date >= cutoff);

  const byDay = useMemo(() => {
    const map = new Map<string, { work: number; brk: number }>();
    filtered.forEach((s) => {
      const cur = map.get(s.date) || { work: 0, brk: 0 };
      cur.work += ((s.totalWorkMs || 0) - (s.totalBreakMs || 0)) / 3600000;
      cur.brk += (s.totalBreakMs || 0) / 3600000;
      map.set(s.date, cur);
    });
    return Array.from(map.entries()).sort().map(([date, v]) => ({ date: date.slice(5), work: +v.work.toFixed(1), brk: +v.brk.toFixed(1) }));
  }, [filtered]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((s) => {
      map.set(s.fullName, (map.get(s.fullName) || 0) + ((s.totalWorkMs || 0) - (s.totalBreakMs || 0)) / 3600000);
    });
    return Array.from(map.entries()).map(([name, hours]) => ({ name, hours: +hours.toFixed(1) }));
  }, [filtered]);

  const byType = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((s) => s.workType && map.set(s.workType, (map.get(s.workType) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.split("_").join(" "), value }));
  }, [filtered]);

  const colors = ["hsl(354 78% 49%)", "hsl(210 90% 50%)", "hsl(152 60% 38%)", "hsl(36 96% 50%)", "hsl(260 60% 55%)"];
  const totalWork = filtered.reduce((s, x) => s + ((x.totalWorkMs || 0) - (x.totalBreakMs || 0)), 0);
  const totalBreak = filtered.reduce((s, x) => s + (x.totalBreakMs || 0), 0);
  const productivity = totalWork + totalBreak > 0 ? Math.round((totalWork / (totalWork + totalBreak)) * 100) : 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Productivity, work-type mix, and per-employee hours.</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 hover-lift"><div className="text-xs text-muted-foreground">Total work time</div><div className="text-xl sm:text-2xl font-semibold">{fmtDuration(totalWork)}</div></Card>
        <Card className="p-4 hover-lift"><div className="text-xs text-muted-foreground">Total break time</div><div className="text-xl sm:text-2xl font-semibold">{fmtDuration(totalBreak)}</div></Card>
        <Card className="p-4 hover-lift"><div className="text-xs text-muted-foreground">Productivity</div><div className="text-xl sm:text-2xl font-semibold">{productivity}%</div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-medium mb-4">Hours per day</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
                <Line type="monotone" dataKey="work" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="brk" stroke="hsl(var(--warning))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-medium mb-4">Hours by employee</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <BarChart data={byEmployee}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-medium mb-4">Work type distribution</h3>
          <div className="h-[260px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byType} dataKey="value" nameKey="name" outerRadius={90} label>
                  {byType.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
