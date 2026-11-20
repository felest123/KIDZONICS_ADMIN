import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, BarChart3, BookOpen, Bot, CreditCard, GraduationCap, Inbox, LayoutDashboard,
  Loader2, LogOut, Menu, ScrollText, Settings, ShieldAlert, ShieldCheck, Users, X,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { call } from "@/admin/api";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/teachers", label: "Teacher Management", icon: GraduationCap },
  { to: "/students", label: "Student Management", icon: Users },
  { to: "/rfid", label: "RFID Management", icon: CreditCard },
  { to: "/ai-agent", label: "AI Agent Management", icon: Bot },
  { to: "/lessons", label: "Lesson Management", icon: BookOpen },
  { to: "/inbox", label: "Admin Inbox", icon: Inbox, badge: true },
  { to: "/reports", label: "System Reports", icon: BarChart3 },
  { to: "/monitoring", label: "System Monitoring", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/activity", label: "Activity Logs", icon: ScrollText },
];

function Sidebar({ admin, pending, onNavigate, onLogout }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d9488]">
          <ShieldCheck className="h-6 w-6 text-white" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-lg font-extrabold text-white">KidZonics Admin</p>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#8fd6cf]">System Management</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label="Admin">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition",
                  isActive ? "bg-[#0d9488] text-white" : "text-[#c5dedd] hover:bg-white/10 hover:text-white"
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && pending > 0 && (
                <span className="rounded-full bg-[#f59e0b] px-2 py-0.5 text-[11px] font-extrabold text-[#3d2a00]">{pending}</span>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="truncate px-1 text-sm font-extrabold text-white">{admin.full_name || "Administrator"}</p>
        <p className="truncate px-1 text-xs font-semibold text-[#8fb3b8]">{admin.email}</p>
        <button
          onClick={onLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[#ffb4a6] hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );
}

export default function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [denied, setDenied] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, setPending] = useState(0);

  // The server decides who is an administrator; this only reflects its answer.
  useEffect(() => {
    let active = true;
    call("session")
      .then((session) => active && setAdmin(session))
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) {
          navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
        } else {
          setDenied(error.message);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!admin) return undefined;
    const load = () =>
      call("inbox.list", { status: "pending" })
        .then((data) => setPending(data.requests.length))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, [admin, location.pathname, location.search]);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const logout = () => base44.auth.logout(`${window.location.origin}/login`);

  if (denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f2a30] p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe9e5]">
            <ShieldAlert className="h-7 w-7 text-[#a34c3f]" />
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-[#173a44]">Access denied</h1>
          <p className="mt-1 text-sm font-semibold text-[#5f7f86]">{denied}</p>
          <p className="mt-1 text-xs font-semibold text-[#8aa6ab]">Teachers use the KidZonics teacher portal, not this application.</p>
          <button onClick={logout} className="mt-5 w-full rounded-xl bg-[#173a44] px-4 py-3 text-sm font-extrabold text-white">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f8f7]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0d9488]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f8f7] font-body">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-[#123039] lg:block">
        <Sidebar admin={admin} pending={pending} onLogout={logout} />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between bg-[#123039] px-4 py-3 lg:hidden">
        <span className="font-display text-lg font-extrabold text-white">KidZonics Admin</span>
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-[#123039] shadow-2xl">
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="absolute right-2 top-3 rounded-lg p-2 text-white hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            <Sidebar admin={admin} pending={pending} onNavigate={() => setMenuOpen(false)} onLogout={logout} />
          </div>
        </div>
      )}

      <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet context={{ admin }} />
        </div>
      </main>
    </div>
  );
}
