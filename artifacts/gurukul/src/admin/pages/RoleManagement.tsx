import { useState } from "react";
import { ShieldCheck, Users, Mail, Edit2, Save, X, Info } from "lucide-react";
import { getRoleLabel, getRoleBadgeColor, type UserRole } from "../rbac";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DemoUser = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  status: "Active" | "Inactive";
};

const INITIAL_USERS: DemoUser[] = [
  { id: "1", displayName: "Gurukul Admin",     email: "admin@gurukul.org",     role: "admin",     status: "Active" },
  { id: "2", displayName: "Smt. Priya Sharma", email: "teacher@gurukul.org",   role: "teacher",   status: "Active" },
  { id: "3", displayName: "Sri Venkat Rao",    email: "assistant@gurukul.org", role: "assistant", status: "Active" },
];

const ROLES: UserRole[] = ["admin", "teacher", "assistant"];

export default function RoleManagement() {
  const [users, setUsers]       = useState<DemoUser[]>(INITIAL_USERS);
  const [editing, setEditing]   = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>("teacher");

  function startEdit(user: DemoUser) {
    setEditing(user.id);
    setEditRole(user.role);
  }

  function saveEdit(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: editRole } : u));
    setEditing(null);
    toast.success("Role updated successfully.");
  }

  function toggleStatus(id: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" } : u));
    const user = users.find(u => u.id === id);
    toast.success(`${user?.displayName} set to ${user?.status === "Active" ? "Inactive" : "Active"}.`);
  }

  const stats = {
    total:     users.length,
    active:    users.filter(u => u.status === "Active").length,
    admins:    users.filter(u => u.role === "admin").length,
    teachers:  users.filter(u => u.role === "teacher").length,
    assistants:users.filter(u => u.role === "assistant").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Users",  value: stats.total,      color: "text-secondary" },
          { label: "Active",       value: stats.active,     color: "text-green-600" },
          { label: "Admins",       value: stats.admins,     color: "text-red-600" },
          { label: "Teachers",     value: stats.teachers,   color: "text-blue-600" },
          { label: "Assistants",   value: stats.assistants, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-blue-800">
          <p className="font-semibold mb-0.5">Demo Role Management</p>
          <p className="text-xs leading-relaxed">
            This portal uses local role assignments for demonstration. The structure is designed for easy integration with
            AWS Cognito, API Gateway, and Lambda. In production, role assignments would be persisted in DynamoDB or your backend service.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-secondary">Portal Users</h3>
          </div>
          <button
            onClick={() => toast.info("Add user flow will connect to your identity provider (e.g. AWS Cognito).")}
            className="text-xs text-primary hover:underline font-medium"
          >
            + Add User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {["User", "Email", "Role", "Status", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.status === "Inactive" ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.displayName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="font-medium text-secondary">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      {u.email}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {editing === u.id ? (
                      <select
                        value={editRole}
                        onChange={e => setEditRole(e.target.value as UserRole)}
                        className="text-xs border border-primary rounded-lg px-2 py-1 focus:outline-none"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{getRoleLabel(r)}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(u.role)}`}>
                        {getRoleLabel(u.role)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      u.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {editing === u.id ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="h-7 px-2">
                            <X className="w-3 h-3" />
                          </Button>
                          <Button size="sm" onClick={() => saveEdit(u.id)} className="h-7 px-3 text-xs">
                            <Save className="w-3 h-3 mr-1" /> Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(u)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-gray-50 transition-colors text-secondary flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Role
                          </button>
                          <button
                            onClick={() => toggleStatus(u.id)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${
                              u.status === "Active"
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {u.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-border p-5">
        <h3 className="text-sm font-semibold text-secondary mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Role Permissions Overview
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Module</th>
                <th className="text-center px-3 py-2 font-semibold text-red-700">Admin</th>
                <th className="text-center px-3 py-2 font-semibold text-blue-700">Teacher</th>
                <th className="text-center px-3 py-2 font-semibold text-green-700">Assistant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Dashboard",             true,  false, false],
                ["Announcements",         true,  false, false],
                ["Calendar",              true,  false, false],
                ["Courses & Classes",     true,  true,  true ],
                ["Teacher Assignment",    true,  false, false],
                ["Students & Payments",   true,  false, false],
                ["Inventory",             true,  false, false],
                ["Course Documents",      true,  true,  true ],
                ["Attendance",            true,  true,  true ],
                ["Parent Notifications",  true,  true,  true ],
                ["Role Management",       true,  false, false],
                ["Settings",              true,  false, false],
              ].map(([mod, admin, teacher, asst]) => (
                <tr key={String(mod)} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-secondary">{mod}</td>
                  {[admin, teacher, asst].map((v, i) => (
                    <td key={i} className="text-center px-3 py-2.5">
                      {v ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">–</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
