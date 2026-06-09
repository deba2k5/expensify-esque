import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditLog } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  useEffect(() => {
    const load = async () => setLogs(await api.listAudit());
    load();
    const interval = setInterval(load, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);
  
  const formatDetails = (meta: any) => {
    if (!meta) return "—";
    if (typeof meta === "object") {
      const parts = [];
      if (meta.location) parts.push(`Location: ${meta.location}`);
      if (meta.distance !== undefined) parts.push(`Distance: ${meta.distance}m`);
      if (meta.comment) parts.push(`Comment: ${meta.comment}`);
      if (parts.length > 0) return parts.join(" • ");
      return JSON.stringify(meta);
    }
    return String(meta);
  };

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
                  <TableCell className="text-xs hidden lg:table-cell break-all max-w-[320px]">{formatDetails(l.meta)}</TableCell>
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
