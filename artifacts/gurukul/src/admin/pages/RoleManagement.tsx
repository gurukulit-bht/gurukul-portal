import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, Users, Phone, UserPlus, RefreshCw,
  Copy, Check, Eye, EyeOff, Loader2, Trash2, X, ChevronDown
} from "lucide-react";
import { getRoleLabel, getRoleBadgeColor, type UserRole } from "../rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type PortalUser = {
  id:        number;
  name:      string;
  phone:     string;
  role:      "teacher" | "assistant";
  status:    "active" | "inactive";
  createdAt: string;
};

type TeacherOption = {
  id:       number;
  name:     string;
  phone:    string;
  category: string;
};

type NewPin = { userId: number; pin: string; copied: boolean };

const API = "/api/admin/portal-users";

function formatPhone(p: string) {
  if (p.length === 10) return `(${p.slice(0,3)}) ${p.slice(3,6)}-${p.slice(6)}`;
  return p;
}

function categoryToRole(cat: string): "teacher" | "assistant" {
  return cat === "Assistant" ? "assistant" : "teacher";
}

export default function UserManagement() {
  const [users,      setUsers]      = useState<PortalUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPin,     setNewPin]     = useState<NewPin | null>(null);
  const [showPin,    setShowPin]    = useState(false);
  const [resetting,  setResetting]  = useState<number | null>(null);
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [showPerms,  setShowPerms]  = useState(false);

  // Staff auto-complete
  const [staffList,       setStaffList]       = useState<TeacherOption[]>([]);
  const [staffLoading,    setStaffLoading]    = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");

  // Form state
  const [name,  setName]  = useState("");
  const [phone, setPhone] = useState("");
  const [role,  setRole]  = useState<"teacher" | "assistant">("teacher");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Failed to load");
      setUsers(await res.json());
    } catch {
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load staff list when form opens
  useEffect(() => {
    if (!showForm) return;
    setStaffLoading(true);
    fetch("/api/admin/teachers")
      .then(r => r.json())
      .then((data: TeacherOption[]) => setStaffList(Array.isArray(data) ? data : []))
      .catch(() => setStaffList([]))
      .finally(() => setStaffLoading(false));
  }, [showForm]);

  // Pre-existing phones so we can mark already-added staff
  const registeredPhones = new Set(users.map(u => u.phone));

  function handleStaffSelect(staffId: string) {
    setSelectedStaffId(staffId);
    if (!staffId) return;
    const staff = staffList.find(s => String(s.id) === staffId);
    if (!staff) return;
    setName(staff.name);
    setPhone(staff.phone?.replace(/\D/g, "") ?? "");
    setRole(categoryToRole(staff.category));
  }

  function openForm() {
    setShowForm(true);
    setName(""); setPhone(""); setRole("teacher"); setSelectedStaffId("");
  }

  function closeForm() {
    setShowForm(false);
    setName(""); setPhone(""); setRole("teacher"); setSelectedStaffId("");
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) { toast.error("Phone must be 10 digits."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(API, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: name.trim(), phone: clean, role }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to create user."); return; }
      setUsers(prev => [data, ...prev]);
      setNewPin({ userId: data.id, pin: data.pin, copied: false });
      setShowPin(true);
      closeForm();
      toast.success(`User created! Share the PIN with ${data.name}.`);
    } catch {
      toast.error("Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPin(user: PortalUser) {
    if (!confirm(`Reset PIN for ${user.name}? The old PIN will be invalidated immediately.`)) return;
    setResetting(user.id);
    try {
      const res  = await fetch(`${API}/${user.id}/reset-pin`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to reset PIN."); return; }
      setNewPin({ userId: user.id, pin: data.pin, copied: false });
      setShowPin(true);
      toast.success("PIN reset. Share the new PIN with the user.");
    } catch {
      toast.error("Failed to reset PIN.");
    } finally {
      setResetting(null);
    }
  }

  async function toggleStatus(user: PortalUser) {
    const next = user.status === "active" ? "inactive" : "active";
    try {
      const res  = await fetch(`${API}/${user.id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: next }),
      });
      if (!res.ok) { toast.error("Failed to update status."); return; }
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: next } : u));
      toast.success(`${user.name} is now ${next}.`);
    } catch {
      toast.error("Failed to update status.");
    }
  }

  async function deleteUser(user: PortalUser) {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setDeleting(user.id);
    try {
      const res = await fetch(`${API}/${user.id}`, { method: "DELETE" });
      if (!res.ok) { toast.error("Failed to delete user."); return; }
      setUsers(prev => prev.filter(u => u.id !== user.id));
      toast.success(`${user.name} deleted.`);
    } catch {
      toast.error("Failed to delete user.");
    } finally {
      setDeleting(null);
    }
  }

  function copyPin() {
    if (!newPin) return;
    navigator.clipboard.writeText(newPin.pin).then(() => {
      setNewPin(p => p ? { ...p, copied: true } : null);
      setTimeout(() => setNewPin(p => p ? { ...p, copied: false } : null), 2000);
    });
  }

  const stats = {
    total:      users.length,
    active:     users.filter(u => u.status === "active").length,
    teachers:   users.filter(u => u.role === "teacher").length,
    assistants: users.filter(u => u.role === "assistant").length,
  };

  return (
    <div className="space-y-6">

      {/* ── PIN reveal banner ─────────────────────────────────────────── */}
      {newPin && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              New PIN generated — share this securely with the user
            </p>
            <p className="text-xs text-amber-700">This PIN is only shown once. Copy it before dismissing.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-xl px-4 py-2">
              <span className="font-mono text-2xl font-bold text-secondary tracking-widest">
                {showPin ? newPin.pin : "••••"}
              </span>
              <button onClick={() => setShowPin(v => !v)} className="text-muted-foreground hover:text-secondary">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button size="sm" variant="outline" onClick={copyPin} className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100">
              {newPin.copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
            <button onClick={() => setNewPin(null)} className="text-muted-foreground hover:text-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Users",  value: stats.total,      color: "text-secondary"  },
          { label: "Active",       value: stats.active,     color: "text-green-600"  },
          { label: "Teachers",     value: stats.teachers,   color: "text-blue-600"   },
          { label: "Assistants",   value: stats.assistants, color: "text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Users table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-secondary">Portal Users</h3>
            <span className="text-xs text-muted-foreground">(Teachers &amp; Assistants)</span>
          </div>
          <Button
            size="sm"
            onClick={() => showForm ? closeForm() : openForm()}
            className="gap-1.5 h-8 text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            {showForm ? "Cancel" : "Add User"}
          </Button>
        </div>

        {/* ── Add user form ── */}
        {showForm && (
          <div className="px-5 py-5 border-b border-border bg-gray-50 space-y-4">

            {/* Staff picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                <ChevronDown className="w-3.5 h-3.5" />
                Select from existing staff
                <span className="font-normal text-muted-foreground">(optional — auto-fills the form)</span>
              </Label>
              {staffLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading staff…
                </div>
              ) : (
                <select
                  value={selectedStaffId}
                  onChange={e => handleStaffSelect(e.target.value)}
                  className="w-full h-9 text-sm border border-border rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <option value="">— Choose a teacher or assistant —</option>
                  {staffList.map(s => {
                    const alreadyAdded = s.phone && registeredPhones.has(s.phone.replace(/\D/g, ""));
                    return (
                      <option key={s.id} value={String(s.id)} disabled={!!alreadyAdded}>
                        {s.name} ({s.category}){alreadyAdded ? " — already a portal user" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="border-t border-dashed border-border pt-4">
              <form onSubmit={createUser} className="grid sm:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Full Name</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Smt. Priya Sharma"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Phone (10 digits)</Label>
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="7401234567"
                    inputMode="numeric"
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Role</Label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as "teacher" | "assistant")}
                    className="w-full h-9 text-sm border border-border rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="assistant">Assistant</option>
                  </select>
                </div>
                <Button type="submit" disabled={submitting} className="h-9 text-sm gap-1.5">
                  {submitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</>
                    : <>Create &amp; Generate PIN</>}
                </Button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No users yet. Click <strong>Add User</strong> to create the first teacher or assistant.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  {["User", "Phone (Login)", "Role", "Status", "Actions"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${u.status === "inactive" ? "opacity-60" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-secondary">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {formatPhone(u.phone)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleBadgeColor(u.role as UserRole)}`}>
                        {getRoleLabel(u.role as UserRole)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        u.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}>
                        {u.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => resetPin(u)}
                          disabled={resetting === u.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {resetting === u.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <RefreshCw className="w-3 h-3" />}
                          Reset PIN
                        </button>
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${
                            u.status === "active"
                              ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                              : "border-green-200 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {u.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(u)}
                          disabled={deleting === u.id}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {deleting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Role permissions link ─────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowPerms(true)}
          className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          View Role Permissions Overview
        </button>
      </div>

      {/* ── Permissions modal ──────────────────────────────────────────── */}
      {showPerms && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPerms(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Role Permissions Overview
              </h3>
              <button
                onClick={() => setShowPerms(false)}
                className="text-muted-foreground hover:text-secondary rounded-lg p-1 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto px-6 py-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Module</th>
                    <th className="text-center px-3 py-2 font-semibold text-red-700">Admin</th>
                    <th className="text-center px-3 py-2 font-semibold text-blue-700">Teacher</th>
                    <th className="text-center px-3 py-2 font-semibold text-purple-700">Assistant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Dashboard",           true,  false, false],
                    ["Announcements",       true,  false, false],
                    ["Calendar",            true,  false, false],
                    ["Courses & Classes",   true,  true,  true ],
                    ["Staff Management",    true,  false, false],
                    ["Student Management", true,  false, false],
                    ["Inventory",           true,  false, false],
                    ["Course Documents",    true,  true,  true ],
                    ["Attendance",          true,  true,  true ],
                    ["Weekly Updates",      true,  true,  true ],
                    ["User Management",     true,  false, false],
                    ["Settings",            true,  false, false],
                  ].map(([mod, admin, teacher, asst]) => (
                    <tr key={String(mod)} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-secondary">{mod}</td>
                      {[admin, teacher, asst].map((v, i) => (
                        <td key={i} className="text-center px-3 py-2.5">
                          {v
                            ? <span className="text-green-600 font-bold">✓</span>
                            : <span className="text-gray-300">–</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-border flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowPerms(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
