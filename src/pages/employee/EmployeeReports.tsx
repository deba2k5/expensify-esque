import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, fmtDuration } from "@/lib/api";
import type { WorkSession } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function EmployeeReports() {
  const { user } = useAuth();
  const [list, setList] = useState<WorkSession[]>([]);
  useEffect(() => {
    if (!user?.email) return;
    api.listSessions({ email: user.email }).then(setList);
  }, [user]);

  const statusColor: Record<string, string> = {
    pending: "bg-warning text-warning-foreground",
    approved: "bg-success text-success-foreground",
    rejected: "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My reports</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Clock in</TableHead>
              <TableHead>Clock out</TableHead>
              <TableHead>Work</TableHead>
              <TableHead>Breaks</TableHead>
              <TableHead>Work type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admin comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.date}</TableCell>
                <TableCell>{new Date(s.clockIn).toLocaleTimeString()}</TableCell>
                <TableCell>{s.clockOut ? new Date(s.clockOut).toLocaleTimeString() : "—"}</TableCell>
                <TableCell>{fmtDuration((s.totalWorkMs || 0) - (s.totalBreakMs || 0))}</TableCell>
                <TableCell>{fmtDuration(s.totalBreakMs)}</TableCell>
                <TableCell className="capitalize">{s.workType?.split("_").join(" ") || "—"}</TableCell>
                <TableCell><Badge className={statusColor[s.status]}>{s.status}</Badge></TableCell>
                <TableCell className="text-xs">{s.adminComment || "—"}</TableCell>
              </TableRow>
            ))}
            {!list.length && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No sessions yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
