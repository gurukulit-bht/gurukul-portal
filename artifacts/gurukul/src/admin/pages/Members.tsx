import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "../AuthContext";
import { canAccess } from "../rbac";
import {
  Search, Plus, Pencil, Trash2, X, Loader2, Users,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download,
  GraduationCap, Phone, Mail, ExternalLink, UserPlus, ShieldAlert,
  CheckCircle2, AlertTriangle, RefreshCw, Building2, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatUSPhone } from "@/lib/validators";

// ─── Types ────────────────────────────────────────────────────────────────────

type Member = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  membershipYear: number | null;
  createdAt: string;
  studentCount: number;
  isActive: boolean;
  expiringSoon: boolean;
  employer: string | null;
};

type MemberDetail = Member & {
  students: { id: number; studentCode: string; name: string; dob: string | null; grade: string | null; isActive: boolean }[];
};

type Stats = {
  totalMembers: number;
  activeCount: number;
  expiredCount: number;
  withStudents: number;
  withoutStudents: number;
  addedThisMonth: number;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  membershipYear: string;
};

type SortKey = "id" | "name" | "email" | "createdAt";

const EMPTY_FORM: FormData = { name: "", email: "", phone: "", membershipYear: "" };
const PAGE_SIZE    = 100;
const CURRENT_YEAR = new Date().getFullYear();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function avatarColor(id: number) {
  const P = [
    "bg-red-100 text-red-700", "bg-amber-100 text-amber-700",
    "bg-emerald-100 text-emerald-700", "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700", "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700", "bg-teal-100 text-teal-700",
  ];
  return P[id % P.length];
}

function expiresOn(createdAt: string) {
  const d = new Date(createdAt);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive, expiringSoon, size = "sm" }: { isActive: boolean; expiringSoon: boolean; size?: "xs" | "sm" }) {
  const cls = size === "xs"
    ? "text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
    : "text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap";

  if (!isActive)    return <span className={`${cls} bg-red-100 text-red-600`}>Expired</span>;
  if (expiringSoon) return <span className={`${cls} bg-amber-100 text-amber-700`}>Expiring Soon</span>;
  return <span className={`${cls} bg-emerald-100 text-emerald-700`}>Active</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white p-3 rounded-xl border border-border flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xl font-bold text-secondary leading-none">{value.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Member Form Modal ────────────────────────────────────────────────────────

function MemberModal({ editing, onClose, onSaved }: {
  editing: Member | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormData>(
    editing
      ? {
          name:           editing.name ?? "",
          email:          editing.email ?? "",
          phone:          editing.phone ? formatUSPhone(editing.phone.replace(/\D/g, "")) : "",
          membershipYear: editing.membershipYear?.toString() ?? "",
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function field(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    field("phone", formatUSPhone(digits));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Invalid email address";
    }
    if (!form.phone.trim()) {
      e.phone = "Phone is required";
    } else {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length !== 10)      e.phone = "Phone must be 10 digits";
      else if (/^[01]/.test(digits)) e.phone = "US area codes cannot start with 0 or 1";
    }
    if (form.membershipYear) {
      const y = parseInt(form.membershipYear);
      if (isNaN(y) || y < 2000 || y > CURRENT_YEAR + 1)
        e.membershipYear = `Year must be 2000–${CURRENT_YEAR + 1}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name:             form.name.trim(),
        email:            form.email.trim(),
        phone:            form.phone.replace(/\D/g, ""),
        isExistingMember: true,
        policyAgreed:     true,
        membershipYear:   form.membershipYear ? parseInt(form.membershipYear) : null,
      };
      if (editing) {
        await adminApi.members.fullUpdate(editing.id, payload);
        toast.success("Member updated");
      } else {
        await adminApi.members.create(payload);
        toast.success("Member added");
      }
      onSaved();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Failed to save member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-secondary">{editing ? "Edit Member" : "Add New Member"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Full Name <span className="text-red-500">*</span></label>
            <Input value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="e.g. Anita Sharma" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Email <span className="text-red-500">*</span></label>
            <Input type="email" value={form.email} onChange={(e) => field("email", e.target.value)} placeholder="anita@example.com" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Phone <span className="text-red-500">*</span></label>
            <Input value={form.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="(555) 123-4567" maxLength={14} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Membership Year</label>
            <Input type="number" value={form.membershipYear} onChange={(e) => field("membershipYear", e.target.value)}
              placeholder={String(CURRENT_YEAR)} min={2000} max={CURRENT_YEAR + 1} />
            {errors.membershipYear && <p className="text-xs text-red-500 mt-1">{errors.membershipYear}</p>}
          </div>
          <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Membership is valid for <strong>1 year from the date of registration</strong>. Only active members may register students.
          </p>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? "Save Changes" : "Add Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ member, onClose, onEdit, onDelete, onRenew, canEdit }: {
  member: MemberDetail; onClose: () => void; onEdit: () => void;
  onDelete: () => void; onRenew: () => void; canEdit: boolean;
}) {
  const [renewing, setRenewing] = useState(false);
  const exp          = expiresOn(member.createdAt);
  const now          = new Date();
  const active       = exp > now;
  const expiringSoon = active && (exp.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000);

  async function handleRenew() {
    if (!confirm(`Renew membership for "${member.name}"? This resets the 1-year membership clock to today.`)) return;
    setRenewing(true);
    try {
      await adminApi.members.renew(member.id);
      toast.success("Membership renewed — active for another year");
      onRenew();
    } catch (err) {
      toast.error((err as Error).message ?? "Renewal failed");
    } finally {
      setRenewing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${avatarColor(member.id)}`}>
              {initials(member.name)}
            </div>
            <div>
              <p className="font-bold text-secondary">{member.name ?? "—"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Member #{member.id}</span>
                <StatusBadge isActive={active} expiringSoon={expiringSoon} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {!active && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Expired on <strong>{fmtDate(exp.toISOString())}</strong>. Cannot register new students until renewed.</p>
          </div>
        )}
        {active && expiringSoon && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Expires on <strong>{fmtDate(exp.toISOString())}</strong> — within the next 30 days. Consider renewing now.</p>
          </div>
        )}

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                {member.email ?? <span className="text-muted-foreground italic">No email</span>}
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                {member.phone ? formatUSPhone(member.phone.replace(/\D/g, "")) : <span className="text-muted-foreground italic">No phone</span>}
              </div>
              {member.employer && (
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  {member.employer}
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Membership Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Member ID</p>
                <p className="text-sm font-semibold text-secondary">#{member.id}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Membership Year</p>
                <p className="text-sm font-semibold text-secondary">{member.membershipYear ?? "Not recorded"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="text-sm font-semibold text-secondary">{fmtDate(member.createdAt)}</p>
              </div>
              <div className={`rounded-xl p-3 ${active ? "bg-emerald-50" : "bg-red-50"}`}>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className={`text-sm font-semibold ${active ? "text-emerald-700" : "text-red-700"}`}>{fmtDate(exp.toISOString())}</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Linked Students ({member.students.length})
            </h3>
            {member.students.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No students linked.</p>
            ) : (
              <div className="space-y-2">
                {member.students.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(s.id)}`}>
                      {initials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-secondary truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.studentCode}{s.grade ? ` · Grade ${s.grade}` : ""}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {canEdit && (
          <div className="px-6 py-4 border-t border-border flex flex-wrap gap-2 sticky bottom-0 bg-white">
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
            {(!active || expiringSoon) && (
              <Button variant="outline" className="flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                onClick={handleRenew} disabled={renewing}>
                {renewing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Renew
              </Button>
            )}
            {member.students.length === 0 && (
              <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Members() {
  const { user } = useAuth();
  const canEdit = canAccess(user?.role ?? "teacher", "members");

  // ── data
  const [rawMembers, setRawMembers] = useState<Member[]>([]);
  const [stats, setStats]           = useState<Stats>({ totalMembers: 0, activeCount: 0, expiredCount: 0, withStudents: 0, withoutStudents: 0, addedThisMonth: 0 });
  const [loading, setLoading]       = useState(true);

  // ── search & filters (client-side)
  const [search,          setSearch]          = useState("");
  const [statusFilter,    setStatusFilter]    = useState("all");
  const [studentsFilter,  setStudentsFilter]  = useState("all");
  const [employerFilter,  setEmployerFilter]  = useState("");
  const [showFilters,     setShowFilters]     = useState(false);

  // ── sort (client-side)
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(false);

  // ── pagination
  const [page,      setPage]      = useState(1);
  const [pageInput, setPageInput] = useState("1");

  // ── panels / dialogs
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editingMember,  setEditingMember]  = useState<Member | null>(null);
  const [detailMember,   setDetailMember]   = useState<MemberDetail | null>(null);
  const [detailLoading,  setDetailLoading]  = useState(false);
  const [deleting,       setDeleting]       = useState<number | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  const loadMembers = useCallback(() => {
    setLoading(true);
    adminApi.members.list({ limit: "9999" })
      .then((res) => {
        setRawMembers(res.data as Member[]);
        setStats(res.stats);
      })
      .catch((err) => toast.error((err as Error).message ?? "Failed to load members"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  // ── filtered + sorted (entire dataset, no pagination yet)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let data = rawMembers.filter((m) => {
      if (statusFilter === "active"   && (!m.isActive || m.expiringSoon)) return false;
      if (statusFilter === "expiring" && (!m.isActive || !m.expiringSoon)) return false;
      if (statusFilter === "expired"  && m.isActive) return false;
      if (studentsFilter === "with"    && m.studentCount === 0) return false;
      if (studentsFilter === "without" && m.studentCount > 0)  return false;
      if (employerFilter.trim() && !(m.employer ?? "").toLowerCase().includes(employerFilter.toLowerCase())) return false;
      if (q && !(
        (m.name  ?? "").toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        (m.phone ?? "").includes(q)
      )) return false;
      return true;
    });
    data = [...data].sort((a, b) => {
      let av: string | number, bv: string | number;
      if      (sortKey === "id")        { av = a.id;                      bv = b.id; }
      else if (sortKey === "name")      { av = (a.name  ?? "").toLowerCase(); bv = (b.name  ?? "").toLowerCase(); }
      else if (sortKey === "email")     { av = (a.email ?? "").toLowerCase(); bv = (b.email ?? "").toLowerCase(); }
      else                              { av = a.createdAt;               bv = b.createdAt; }
      if (av === bv) return 0;
      if (av < bv) return sortAsc ? -1 : 1;
      return sortAsc ? 1 : -1;
    });
    return data;
  }, [rawMembers, search, statusFilter, studentsFilter, employerFilter, sortKey, sortAsc]);

  // reset page when filters change
  useEffect(() => { setPage(1); setPageInput("1"); }, [search, statusFilter, studentsFilter, employerFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = [
    statusFilter !== "all",
    studentsFilter !== "all",
    employerFilter.trim() !== "",
  ].filter(Boolean).length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="opacity-0 ml-1">↑</span>;
    return sortAsc
      ? <ChevronUp   className="w-3 h-3 inline ml-1 text-primary" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-primary" />;
  }

  function goToPage(p: number) {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
    setPageInput(String(clamped));
    tableRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function openDetail(member: Member) {
    setDetailLoading(true);
    try {
      const detail = await adminApi.members.getById(member.id);
      setDetailMember(detail as MemberDetail);
    } catch {
      toast.error("Failed to load member details");
    } finally {
      setDetailLoading(false);
    }
  }

  function openAdd()           { setEditingMember(null); setModalOpen(true); }
  function openEdit(m: Member) { setDetailMember(null); setEditingMember(m); setModalOpen(true); }

  async function handleDelete(member: Member) {
    if (!confirm(`Delete member "${member.name}"? This cannot be undone.`)) return;
    setDeleting(member.id);
    try {
      await adminApi.members.remove(member.id);
      toast.success("Member deleted");
      setDetailMember(null);
      loadMembers();
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delete member");
    } finally {
      setDeleting(null);
    }
  }

  function handleSaved() { setModalOpen(false); setEditingMember(null); loadMembers(); }

  function exportCSV() {
    const header = ["ID", "Name", "Email", "Phone", "Employer", "Status", "Expires", "Students", "Registered"];
    const rows = filtered.map((m) => [
      m.id, m.name ?? "", m.email ?? "",
      m.phone ? formatUSPhone(m.phone.replace(/\D/g, "")) : "",
      m.employer ?? "",
      !m.isActive ? "Expired" : m.expiringSoon ? "Expiring Soon" : "Active",
      expiresOn(m.createdAt).toLocaleDateString(),
      m.studentCount,
      fmtDate(m.createdAt),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const thisMonthLabel = new Date().toLocaleString("default", { month: "short" }) + " " + CURRENT_YEAR;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full space-y-3">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-secondary">Member Management</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} member{filtered.length !== 1 ? "s" : ""} found
            {filtered.length !== rawMembers.length && ` · ${rawMembers.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <Button onClick={openAdd} size="sm" className="gap-1.5 rounded-xl text-xs h-9">
              <Plus className="w-3.5 h-3.5" /> Add Member
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 rounded-xl text-xs h-9">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
        <StatCard label="Total Members"                value={stats.totalMembers}    icon={Users}         color="bg-primary/10 text-primary" />
        <StatCard label="Active"                       value={stats.activeCount}     icon={CheckCircle2}  color="bg-emerald-100 text-emerald-600" />
        <StatCard label="Expired"                      value={stats.expiredCount}    icon={ShieldAlert}   color="bg-orange-100 text-orange-600" />
        <StatCard label="With Students"                value={stats.withStudents}    icon={GraduationCap} color="bg-sky-100 text-sky-600" />
        <StatCard label={`Added in ${thisMonthLabel}`} value={stats.addedThisMonth} icon={UserPlus}      color="bg-violet-100 text-violet-600" />
      </div>

      {/* ── Search + Filters toggle ── */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone…"
            className="pl-9 rounded-xl h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters((f) => !f)}
          className={`gap-1.5 rounded-xl h-9 text-xs shrink-0 ${activeFilterCount > 0 ? "border-primary text-primary bg-primary/5" : ""}`}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">{activeFilterCount}</span>
          )}
        </Button>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-border p-4 space-y-3 shrink-0">
          <div className="flex flex-wrap gap-x-6 gap-y-3">

            {/* Membership Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Membership Status</label>
              <div className="flex flex-wrap gap-1">
                {([["all","All"],["active","Active"],["expiring","Expiring Soon"],["expired","Expired"]] as [string,string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setStatusFilter(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === v ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Students */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Students</label>
              <div className="flex flex-wrap gap-1">
                {([["all","All"],["with","With Students"],["without","Without Students"]] as [string,string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setStudentsFilter(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${studentsFilter === v ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Employer */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Employer</label>
              <div className="relative">
                <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={employerFilter}
                  onChange={(e) => setEmployerFilter(e.target.value)}
                  placeholder="e.g. Ohio State"
                  className="text-xs border border-border rounded-lg pl-7 pr-7 py-1.5 focus:outline-none focus:border-primary bg-white min-w-36"
                />
                {employerFilter && (
                  <button onClick={() => setEmployerFilter("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

          </div>

          {activeFilterCount > 0 && (
            <div className="pt-1 border-t border-border">
              <button
                onClick={() => { setStatusFilter("all"); setStudentsFilter("all"); setEmployerFilter(""); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col flex-1 min-h-0">
        <div ref={tableRef} className="overflow-auto" style={{ maxHeight: "calc(100vh - 340px)", minHeight: 320 }}>
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-border shadow-sm">
              <tr>
                {[
                  { label: "ID",         key: "id"        as SortKey, w: "w-14"  },
                  { label: "Name",       key: "name"      as SortKey, w: "w-40"  },
                  { label: "Contact",    noSort: true,                w: "w-52"  },
                  { label: "Employer",   noSort: true,                w: "w-36"  },
                  { label: "Status",     noSort: true,                w: "w-28"  },
                  { label: "Students",   noSort: true,                w: "w-16"  },
                  { label: "Registered", key: "createdAt" as SortKey, w: "w-28"  },
                  { label: "",           noSort: true,                w: "w-20"  },
                ].map((col) => (
                  <th
                    key={col.label || "actions"}
                    className={`text-left font-semibold text-muted-foreground px-3 py-2.5 whitespace-nowrap select-none ${col.w} ${!col.noSort && col.key ? "cursor-pointer hover:text-secondary transition-colors" : ""}`}
                    onClick={() => !col.noSort && col.key && toggleSort(col.key as SortKey)}
                  >
                    {col.label}
                    {!col.noSort && col.key && <SortIcon k={col.key as SortKey} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
                    No members found.
                    {canEdit && !search && activeFilterCount === 0 && (
                      <> <button onClick={openAdd} className="text-primary hover:underline ml-1">Add the first member</button></>
                    )}
                  </td>
                </tr>
              )}
              {paginated.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border/50 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => openDetail(m)}
                >
                  <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">#{m.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(m.id)}`}>
                        {initials(m.name)}
                      </div>
                      <span className="font-medium text-secondary truncate max-w-[130px]">{m.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-0.5 min-w-0">
                      {m.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[200px]">
                          <Mail className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      )}
                      {m.phone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                          <Phone className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                          {formatUSPhone(m.phone.replace(/\D/g, ""))}
                        </div>
                      )}
                      {!m.email && !m.phone && <span className="text-muted-foreground/40">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {m.employer
                      ? <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[140px]">
                          <Building2 className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                          <span className="truncate">{m.employer}</span>
                        </div>
                      : <span className="text-muted-foreground/40">—</span>
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge isActive={m.isActive} expiringSoon={m.expiringSoon} size="xs" />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`font-semibold px-2 py-0.5 rounded-full ${m.studentCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-muted-foreground"}`}>
                      {m.studentCount}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    {fmtDate(m.createdAt)}
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openDetail(m)} title="View details"
                        className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <button onClick={() => openEdit(m)} title="Edit member"
                          className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-secondary transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canEdit && m.studentCount === 0 && (
                        <button onClick={() => handleDelete(m)} disabled={deleting === m.id} title="Delete member"
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-40">
                          {deleting === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3 bg-gray-50 shrink-0 flex-wrap gap-y-2">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-secondary hover:border-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => goToPage(parseInt(pageInput) || 1)}
                onKeyDown={(e) => e.key === "Enter" && goToPage(parseInt(pageInput) || 1)}
                className="w-12 text-center border border-border rounded-lg px-1 py-1 focus:outline-none focus:border-primary text-xs"
              />
              <span className="text-muted-foreground">of {totalPages}</span>
            </div>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-secondary hover:border-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Panels & Dialogs ── */}
      {detailLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Loading…</p>
          </div>
        </div>
      )}

      {detailMember && !detailLoading && (
        <DetailPanel
          member={detailMember}
          onClose={() => setDetailMember(null)}
          onEdit={() => openEdit(detailMember)}
          onDelete={() => handleDelete(detailMember)}
          onRenew={() => { setDetailMember(null); loadMembers(); }}
          canEdit={canEdit}
        />
      )}

      {modalOpen && (
        <MemberModal
          editing={editingMember}
          onClose={() => { setModalOpen(false); setEditingMember(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
