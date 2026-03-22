import { useLocation, Link } from "wouter";
import { useEffect } from "react";
import { isAdminAuthenticated, adminLogout } from "./auth";
import {
  LayoutDashboard, Megaphone, Calendar, BookOpen, Users, GraduationCap,
  Package, Settings, LogOut, Menu, X, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Announcements", icon: Megaphone, path: "/admin/announcements" },
  { label: "Calendar", icon: Calendar, path: "/admin/calendar" },
  { label: "Courses & Classes", icon: BookOpen, path: "/admin/courses" },
  { label: "Teacher Assignment", icon: GraduationCap, path: "/admin/teachers" },
  { label: "Students & Payments", icon: Users, path: "/admin/students" },
  { label: "Inventory", icon: Package, path: "/admin/inventory" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      setLocation("/admin/login");
    }
  }, [location]);

  function handleLogout() {
    adminLogout();
    setLocation("/admin/login");
  }

  const currentPage = navItems.find(n => n.path === location)?.label ?? "Admin";

  const Sidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-secondary flex flex-col transform transition-transform duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      lg:relative lg:translate-x-0 lg:flex
    `}>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Gurukul Admin</div>
            <div className="text-white/50 text-xs">BHT Powell, OH</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navItems.map(item => {
          const active = location === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all text-sm font-medium
                ${active
                  ? "bg-primary/20 text-accent border border-primary/30"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-border px-4 lg:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-lg font-bold text-secondary">{currentPage}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Bhartiya Hindu Temple Gurukul</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-secondary">Admin User</div>
              <div className="text-xs text-muted-foreground">gurukuluser01</div>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
