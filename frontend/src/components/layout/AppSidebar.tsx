import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Clock,
  FileBarChart,
  User,
  LayoutDashboard,
  Users,
  CheckSquare,
  Map,
  ScrollText,
  LogOut,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const linkBase =
  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors";
const linkActive = "bg-primary/10 text-primary";

export default function AppSidebar() {
  const { role, profile, signOut, user } = useAuth();
  const nav = useNavigate();
  const isAdmin = role !== "employee";

  const items = isAdmin
    ? [
        { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
        { to: "/admin/employees", label: "Employees", icon: Users },
        { to: "/admin/approvals", label: "Pending Reports", icon: CheckSquare },
        { to: "/admin/map", label: "Live Map", icon: Map },
        { to: "/admin/analytics", label: "Analytics", icon: PieChart },
        { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
      ]
    : [
        { to: "/", label: "Dashboard", icon: Clock, end: true },
        { to: "/reports", label: "My Reports", icon: FileBarChart },
        { to: "/profile", label: "Profile", icon: User },
      ];

  return (
    <aside className="w-60 shrink-0 border-r bg-sidebar flex flex-col">
      <div className="h-16 flex items-center px-5 border-b">
        <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold mr-3">
          +
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Sinhas Track</div>
          <div className="text-[11px] text-muted-foreground">
            {isAdmin ? "Admin Console" : "Employee Portal"}
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
          >
            <it.icon className="h-4 w-4" /> {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-3 text-xs">
        <div className="font-medium truncate">{profile?.fullName || user?.email}</div>
        <div className="text-muted-foreground truncate">{user?.email}</div>
        <Button
          onClick={async () => {
            await signOut();
            nav("/login");
          }}
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-muted-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
