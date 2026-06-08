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
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Date</TableHead>
                <TableHead className="whitespace-nowrap">Clock in</TableHead>
                <TableHead className="whitespace-nowrap hidden sm:table-cell">Clock out</TableHead>
                <TableHead>Work</TableHead>
                <TableHead className="hidden md:table-cell">Breaks</TableHead>
                <TableHead className="hidden lg:table-cell">Work type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Admin comment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="whitespace-nowrap">{s.date}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(s.clockIn).toLocaleTimeString()}</TableCell>
                  <TableCell className="whitespace-nowrap hidden sm:table-cell">{s.clockOut ? new Date(s.clockOut).toLocaleTimeString() : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDuration((s.totalWorkMs || 0) - (s.totalBreakMs || 0))}</TableCell>
                  <TableCell className="whitespace-nowrap hidden md:table-cell">{fmtDuration(s.totalBreakMs)}</TableCell>
                  <TableCell className="capitalize hidden lg:table-cell">{s.workType?.split("_").join(" ") || "—"}</TableCell>
                  <TableCell><Badge className={statusColor[s.status]}>{s.status}</Badge></TableCell>
                  <TableCell className="text-xs hidden lg:table-cell">{s.adminComment || "—"}</TableCell>
                </TableRow>
              ))}
              {!list.length && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No sessions yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
