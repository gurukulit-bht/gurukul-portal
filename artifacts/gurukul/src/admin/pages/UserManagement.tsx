import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, Users, Phone, UserPlus, RefreshCw,
  Copy, Check, Eye, EyeOff, Loader2, Trash2, X, Edit2,
  AlertCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "../AuthContext";

type AdminUser = {
  id:          number;
  name:        string;
  email:       string | null;
  phone:       string | null;
  role:        string;
  status:      string;
  createdBy:   string | null;
  updatedBy:   string | null;
  lastLoginAt: string | null;
  createdAt:   string | null;
  updatedAt:   string | null;
};

type PinReveal = { id: number; pin: string; name: string; copied: boolean };

function formatPhone(p: string | null | undefined) {
  if (!p) return "—";
  if (p.length === 10) return `(${p.slice(0, 3)}) ${p.slice(3, 6)}-${p.slice(6)}`;
  return p;
}

function formatLastLogin(dt: string | null | undefined): string {
  if (!dt) return "Never";
  const d = new Date(dt);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Initials({ name }: { name: string }) {
  const ini = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
      {ini}
    </div>
  );
}


// ── Main Component ─────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { user: currentUser } = useAuth();

  const [admins,       setAdmins]       = useState<AdminUser[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<AdminUser | null>(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [pinReveal,    setPinReveal]    = useState<PinReveal | null>(null);
  const [showPin,      setShowPin]      = useState(false);
  const [resetting,    setResetting]    = useState<number | null>(null);
  const [deleting,     setDeleting]     = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showPerms,    setShowPerms]    = useState(false);

  // Form state (add / edit)
  const [form, setForm] = useState({ name: "", phone: "", pin: "" });
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.adminUsers.list();
      setAdmins(data as AdminUser[]);
    } catch {
      toast.error("Failed to load admin users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const regularAdmins = admins.filter((a) => a.role !== "super_admin");

  // ── Form helpers ────────────────────────────────────────────────────────────
  function openAdd() {
    setEditTarget(null);
    setForm({ name: "", phone: "", pin: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(a: AdminUser) {
    setEditTarget(a);
    setForm({ name: a.name, phone: a.phone ?? "", pin: "" });
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditTarget(null);
    setForm({ name: "", phone: "", pin: "" });
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (cleanPhone.length !== 10) { setFormError("Phone must be exactly 10 digits."); return; }

    if (!editTarget) {
      // Create
      if (!/^\d{4}$/.test(form.pin)) { setFormError("PIN must be exactly 4 digits."); return; }
    }

    setSubmitting(true);
    try {
      if (editTarget) {
        await adminApi.adminUsers.update(editTarget.id, {
          name:       form.name.trim(),
          phone:      cleanPhone,
          updatedById: currentUser?.id,
        });
        toast.success(`${form.name} updated.`);
        await load();
      } else {
        const result = await adminApi.adminUsers.create({
          name:       form.name.trim(),
          phone:      cleanPhone,
          pin:        form.pin,
          createdById: currentUser?.id,
        }) as { admin: AdminUser; pin: string };
        toast.success(`Admin created! Share the PIN with ${form.name}.`);
        setPinReveal({ id: result.admin.id, pin: result.pin, name: result.admin.name, copied: false });
        setShowPin(true);
        await load();
      }
      closeForm();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPin(a: AdminUser) {
    setResetting(a.id);
    try {
      const result = await adminApi.adminUsers.resetPin(a.id, { updatedById: currentUser?.id }) as { pin: string };
      setPinReveal({ id: a.id, pin: result.pin, name: a.name, copied: false });
      setShowPin(true);
      toast.success("PIN reset. Share the new PIN securely.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset PIN.");
    } finally {
      setResetting(null);
    }
  }

  async function handleToggleStatus(a: AdminUser) {
    const next = a.status === "active" ? "inactive" : "active";
    try {
      await adminApi.adminUsers.setStatus(a.id, next);
      setAdmins((prev) => prev.map((u) => (u.id === a.id ? { ...u, status: next } : u)));
      toast.success(`${a.name} is now ${next}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
    }
  }

  async function handleDelete(a: AdminUser) {
    setDeleting(a.id);
    try {
      await adminApi.adminUsers.remove(a.id);
      setAdmins((prev) => prev.filter((u) => u.id !== a.id));
      setDeleteConfirm(null);
      toast.success(`${a.name} removed.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeleting(null);
    }
  }

  function copyPin() {
    if (!pinReveal) return;
    navigator.clipboard.writeText(pinReveal.pin).then(() => {
      setPinReveal((p) => (p ? { ...p, copied: true } : null));
      setTimeout(() => setPinReveal((p) => (p ? { ...p, copied: false } : null)), 2000);
    });
  }

  return (
    <div className="space-y-6">

      {/* ── PIN reveal banner ──────────────────────────────────────────── */}
      {pinReveal && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 mb-1">
              New PIN for <strong>{pinReveal.name}</strong> — share this securely
            </p>
            <p className="text-xs text-amber-700">This PIN is shown only once. Copy it before dismissing.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-amber-300 rounded-xl px-4 py-2">
              <span className="font-mono text-2xl font-bold text-secondary tracking-widest">
                {showPin ? pinReveal.pin : "••••"}
              </span>
              <button onClick={() => setShowPin((v) => !v)} className="text-muted-foreground hover:text-secondary">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button size="sm" variant="outline" onClick={copyPin} className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-100">
              {pinReveal.copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </Button>
            <button onClick={() => setPinReveal(null)} className="text-muted-foreground hover:text-secondary">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage admin accounts · {regularAdmins.length} regular admin{regularAdmins.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowPerms(true)} className="gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" /> Permissions
          </Button>
          <Button onClick={openAdd} className="gap-2 rounded-xl shrink-0">
            <UserPlus className="w-4 h-4" /> Add Admin
          </Button>
        </div>
      </div>

      {/* ── Admin Management ───────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-secondary">Admin Accounts</h3>
            <span className="text-xs text-muted-foreground">Login: phone number + 4-digit PIN</span>
          </div>
          <Button size="sm" onClick={showForm ? closeForm : openAdd} className="gap-1.5 h-8 text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            {showForm && !editTarget ? "Cancel" : "Add Admin"}
          </Button>
        </div>

        {/* Add / Edit form */}
        {showForm && (
          <div className="px-5 py-5 border-b border-border bg-gray-50">
            <h4 className="text-sm font-semibold text-secondary mb-4">
              {editTarget ? `Edit — ${editTarget.name}` : "New Admin Account"}
            </h4>
            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs mb-4">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Pt. Ramesh Sharma"
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Phone / Username <span className="text-red-500">*</span>
                  <span className="font-normal text-muted-foreground ml-1">(10 digits)</span>
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="6141234567"
                  inputMode="numeric"
                  required
                  className="h-9 text-sm"
                />
              </div>
              {!editTarget && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Initial 4-digit PIN <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.pin}
                    onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value }))}
                    placeholder="e.g. 7890"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    className="h-9 text-sm"
                  />
                </div>
              )}
              <div className="flex gap-2 sm:col-span-3 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={closeForm} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="text-xs gap-1.5">
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editTarget ? "Save Changes" : "Create Admin"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-14 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : regularAdmins.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground text-sm">
            No admin accounts yet. Click <strong>Add Admin</strong> to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  {["Admin", "Phone / Username", "Status", "Last Login", "Created By", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {regularAdmins.map((a) => {
                  const isSelf = currentUser?.id === a.id;
                  return (
                    <tr key={a.id} className={`hover:bg-gray-50 ${a.status === "inactive" ? "opacity-60" : ""}`}>
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Initials name={a.name} />
                          <div>
                            <span className="font-medium text-secondary">{a.name}</span>
                            {isSelf && <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">You</span>}
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {formatPhone(a.phone)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">username: {a.phone}</p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          a.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}>
                          {a.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{formatLastLogin(a.lastLoginAt)}</span>
                        </div>
                        {a.lastLoginAt && (
                          <div className="text-[11px] text-muted-foreground/60 mt-0.5 pl-5">
                            {new Date(a.lastLoginAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                          </div>
                        )}
                      </td>

                      {/* Created by */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {a.createdBy ?? "System"}
                        {a.createdAt && (
                          <div className="text-[11px] text-muted-foreground/70">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => openEdit(a)}
                            className="text-xs px-2 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleResetPin(a)}
                            disabled={resetting === a.id}
                            className="text-xs px-2 py-1 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 flex items-center gap-1 disabled:opacity-50"
                          >
                            {resetting === a.id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <RefreshCw className="w-3 h-3" />}
                            Reset PIN
                          </button>
                          <button
                            onClick={() => handleToggleStatus(a)}
                            className={`text-xs px-2 py-1 rounded-lg border flex items-center gap-1 transition-colors ${
                              a.status === "active"
                                ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                                : "border-green-200 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {a.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                          {deleteConfirm === a.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(a)}
                                disabled={deleting === a.id}
                                className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-1 disabled:opacity-50"
                              >
                                {deleting === a.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-gray-100 flex items-center gap-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(a.id)}
                              className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Permissions modal ───────────────────────────────────────────── */}
      {showPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowPerms(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-secondary flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Role Permissions Overview
              </h3>
              <button onClick={() => setShowPerms(false)} className="text-muted-foreground hover:text-secondary rounded-lg p-1 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto px-6 py-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Module</th>
                    <th className="text-center px-3 py-2 font-semibold text-secondary">Admin</th>
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
                          {v ? <span className="text-green-600 font-bold">✓</span> : <span className="text-gray-300">–</span>}
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
