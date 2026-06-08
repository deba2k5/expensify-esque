import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { EmployeeProfile, WorkSession } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Plus } from "lucide-react";

export default function AdminEmployees() {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const reload = async () => {
    setProfiles(await api.listProfiles());
    setSessions(await api.listSessions());
  };
  useEffect(() => { reload(); }, []);

  const activeEmails = new Set(sessions.filter((s) => !s.clockOut).map((s) => s.email));
  const departments = Array.from(new Set(profiles.map((p) => p.department).filter(Boolean)));

  const filtered = useMemo(() => profiles.filter((p) => {
    if (q && !`${p.fullName} ${p.email} ${p.employeeId}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (dept !== "all" && p.department !== dept) return false;
    if (type !== "all" && p.employeeType !== type) return false;
    if (status === "active" && !activeEmails.has(p.email)) return false;
    if (status === "inactive" && activeEmails.has(p.email)) return false;
    if (status === "deactivated" && p.active) return false;
    return true;
  }), [profiles, q, dept, type, status, activeEmails]);

  const toggleActive = async (p: EmployeeProfile) => {
    await api.upsertProfile({ ...p, active: !p.active });
    await api.log({ actor: "admin", action: p.active ? "employee.deactivate" : "employee.activate", target: p.email });
    reload();
  };

  const exportCsv = () => {
    const rows = [
      ["Employee ID", "Full name", "Email", "Department", "Type", "Active", "Last session"],
      ...filtered.map((p) => {
        const last = sessions.find((s) => s.email === p.email);
        return [p.employeeId, p.fullName, p.email, p.department, p.employeeType, p.active ? "yes" : "no", last?.date || ""];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: "employees.csv" }).click();
  };

  const exportPdf = () => {
    const html = `
      <html><head><title>Employees</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px;font-size:12px}</style>
      </head><body><h1>Employee Report</h1>
      <table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Type</th><th>Status</th></tr></thead>
      <tbody>${filtered.map((p) => `<tr><td>${p.employeeId}</td><td>${p.fullName}</td><td>${p.email}</td><td>${p.department}</td><td>${p.employeeType}</td><td>${p.active ? "Active" : "Deactivated"}</td></tr>`).join("")}</tbody>
      </table><script>print()</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {profiles.length}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2 flex-1 sm:flex-none"><FileSpreadsheet className="h-4 w-4" /><span className="hidden xs:inline">Export </span>CSV</Button>
          <Button variant="outline" onClick={exportPdf} className="gap-2 flex-1 sm:flex-none"><Download className="h-4 w-4" /><span className="hidden xs:inline">Export </span>PDF</Button>
          <AddEmployeeDialog onAdded={reload} />
        </div>
      </header>

      <Card className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input placeholder="Search name / email / ID" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="permanent">Permanent</SelectItem>
            <SelectItem value="contractual">Contractual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="active">Working now</SelectItem>
            <SelectItem value="inactive">Off-clock</SelectItem>
            <SelectItem value="deactivated">Deactivated</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.email}>
                  <TableCell className="font-mono text-xs">{p.employeeId}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.fullName}</div>
                    <div className="md:hidden text-[11px] text-muted-foreground truncate max-w-[160px]">{p.email}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{p.email}</TableCell>
                  <TableCell className="hidden sm:table-cell">{p.department}</TableCell>
                  <TableCell className="hidden lg:table-cell capitalize">{p.employeeType}</TableCell>
                  <TableCell>
                    {!p.active ? <Badge variant="secondary">Off</Badge>
                      : activeEmails.has(p.email) ? <Badge className="bg-success text-success-foreground">Working</Badge>
                      : <Badge variant="outline">Idle</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(p)}>
                      {p.active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No employees match the filters</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function AddEmployeeDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EmployeeProfile>({
    employeeId: "", fullName: "", email: "", mobile: "", department: "", employeeType: "permanent", active: true, createdAt: new Date().toISOString(),
  });
  const save = async () => {
    if (!form.email || !form.fullName) return toast.error("Email & name required");
    await api.upsertProfile(form);
    await api.log({ actor: "admin", action: "employee.add", target: form.email });
    toast.success("Employee added. They can now sign in once you create their Firebase account.");
    setOpen(false);
    onAdded();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" />Add employee</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add employee</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Employee ID"><Input value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></Field>
          <Field label="Full name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Mobile"><Input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
          <Field label="Department"><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Field>
          <Field label="Type">
            <Select value={form.employeeType} onValueChange={(v) => setForm({ ...form, employeeType: v as EmployeeProfile["employeeType"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="contractual">Contractual</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button onClick={save} className="w-full mt-2">Save</Button>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
