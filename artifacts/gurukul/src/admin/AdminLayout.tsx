import { useLocation, Link } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { canAccess, getRoleLabel, getRoleBadgeColor, type Permission } from "./rbac";
import {
  LayoutDashboard, Megaphone, Calendar, BookOpen, Users, GraduationCap,
  Package, Settings, LogOut, Menu, X, ChevronRight, FileText, ClipboardList,
  ShieldCheck, UserPlus, Layers, Quote, Mail, Newspaper, HelpCircle,
} from "lucide-react";
import NaradJiBot from "./components/NaradJiBot";
import { Button } from "@/components/ui/button";

type Permission_ = Permission;

type NavItem = {
  label: string;
  icon: React.ElementType;
  path: string;
  permission: Permission_;
};

type NavGroup = {
  label: string;
  emoji: string;
  items: NavItem[];
};

// ── Admin grouped nav ─────────────────────────────────────────────────────────

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    emoji: "📌",
    items: [
      { label: "Dashboard",            icon: LayoutDashboard, path: "/admin/dashboard",         permission: "dashboard" },
      { label: "Student Registration", icon: UserPlus,        path: "/admin/register",          permission: "registration" },
      { label: "Students & Payments",  icon: Users,           path: "/admin/students",          permission: "students" },
    ],
  },
  {
    label: "Academic Management",
    emoji: "📚",
    items: [
      { label: "Course Management",    icon: Layers,          path: "/admin/course-management", permission: "courseManagement" },
      { label: "Staff Management",     icon: GraduationCap,   path: "/admin/teachers",          permission: "teachers" },
    ],
  },
  {
    label: "Communication",
    emoji: "📢",
    items: [
      { label: "Announcements",        icon: Megaphone,       path: "/admin/announcements",     permission: "announcements" },
      { label: "Calendar",             icon: Calendar,        path: "/admin/calendar",          permission: "calendar" },
      { label: "Messaging Center",     icon: Mail,            path: "/admin/messaging",         permission: "messaging" },
    ],
  },
  {
    label: "Operations Support",
    emoji: "🧾",
    items: [
      { label: "Inventory",            icon: Package,         path: "/admin/inventory",         permission: "inventory" },
      { label: "Testimonials",         icon: Quote,           path: "/admin/testimonials",      permission: "testimonials" },
    ],
  },
  {
    label: "Administration",
    emoji: "⚙️",
    items: [
      { label: "User Management",      icon: ShieldCheck,     path: "/admin/roles",             permission: "roles" },
      { label: "Settings",             icon: Settings,        path: "/admin/settings",          permission: "settings" },
      { label: "Help & Guide",         icon: HelpCircle,      path: "/admin/help",              permission: "help" },
    ],
  },
];

// ── Teacher flat nav ──────────────────────────────────────────────────────────

const TEACHER_NAV_ITEMS: NavItem[] = [
  { label: "Attendance",         icon: ClipboardList, path: "/admin/attendance",     permission: "attendance" },
  { label: "Courses & Classes",  icon: BookOpen,      path: "/admin/courses",        permission: "courses" },
  { label: "Course Documents",   icon: FileText,      path: "/admin/documents",      permission: "documents" },
  { label: "Messaging Center",   icon: Newspaper,     path: "/admin/weekly-updates", permission: "weeklyUpdates" },
  { label: "Settings",           icon: Settings,      path: "/admin/settings",       permission: "settings" },
  { label: "Help & Guide",       icon: HelpCircle,    path: "/admin/help",           permission: "help" },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) setLocation("/admin/login");
  }, [location, user]);

  function handleLogout() {
    logout();
    window.location.href = "/";
  }

  const isAdmin = user?.role === "admin";

  // For the header "current page" label — search both sources
  const allItems = [
    ...ADMIN_NAV_GROUPS.flatMap(g => g.items),
    ...TEACHER_NAV_ITEMS,
  ];
  const currentPage = allItems.find(n => n.path === location)?.label ?? "Admin";

  function NavLink({ item }: { item: NavItem }) {
    const active = location === item.path;
    return (
      <Link
        href={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium
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
  }

  const Sidebar = () => (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-secondary flex flex-col transform transition-transform duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      lg:relative lg:translate-x-0 lg:flex
    `}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Gurukul Portal</div>
            <div className="text-white/50 text-xs">BHT Powell, OH</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {isAdmin ? (
          // ── Admin: grouped sections ──
          <div className="space-y-1">
            {ADMIN_NAV_GROUPS.map((group, gIdx) => {
              const visibleItems = group.items.filter(
                item => user && canAccess(user.role, item.permission)
              );
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.label}>
                  {gIdx > 0 && <div className="border-t border-white/10 mt-3 mb-1 mx-1" />}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 pt-2 pb-1 select-none">
                    {group.emoji} {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {visibleItems.map(item => (
                      <NavLink key={item.path} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // ── Teacher / Assistant: flat list ──
          <div className="space-y-0.5">
            {TEACHER_NAV_ITEMS.filter(
              item => user && canAccess(user.role, item.permission)
            ).map(item => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user.displayName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
          </div>
        )}
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

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-secondary">{user.displayName}</div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadgeColor(user.role)}`}>
                  {getRoleLabel(user.role)}
                </div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user.initials}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <NaradJiBot />
    </div>
  );
}
