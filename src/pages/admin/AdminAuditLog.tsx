import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLog } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  useEffect(() => { api.listAudit().then(setLogs); }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Target</TableHead>
                <TableHead className="hidden lg:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(l.at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs break-all">{l.actor}</TableCell>
                  <TableCell><Badge variant="outline" className="whitespace-nowrap">{l.action}</Badge></TableCell>
                  <TableCell className="text-xs hidden md:table-cell break-all">{l.target || "—"}</TableCell>
                  <TableCell className="text-xs font-mono hidden lg:table-cell break-all max-w-[320px]">{l.meta ? JSON.stringify(l.meta) : ""}</TableCell>
                </TableRow>
              ))}
              {!logs.length && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No activity yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
