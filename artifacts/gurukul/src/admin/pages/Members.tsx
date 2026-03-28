import { useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "@/lib/adminApi";
import { useAuth } from "../AuthContext";
import { canAccess } from "../rbac";
import {
  Search, Plus, Pencil, Trash2, X, Loader2, Users,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download,
  GraduationCap, Phone, Mail, ExternalLink, UserPlus, ShieldAlert, CheckCircle2,
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

const EMPTY_FORM: FormData = { name: "", email: "", phone: "", membershipYear: "" };
const PAGE_SIZE   = 50;
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

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-500 leading-tight">{label}</p>
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

    // Email — mandatory
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Invalid email address";
    }

    // Phone — mandatory
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
        e.membershipYear = `Year must be between 2000 and ${CURRENT_YEAR + 1}`;
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">{editing ? "Edit Member" : "Add New Member"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <Input value={form.name} onChange={(e) => field("name", e.target.value)} placeholder="e.g. Anita Sharma" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <Input type="email" value={form.email} onChange={(e) => field("email", e.target.value)} placeholder="anita@example.com" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
            <Input
              value={form.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 123-4567"
              maxLength={14}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Membership Year</label>
            <Input
              type="number"
              value={form.membershipYear}
              onChange={(e) => field("membershipYear", e.target.value)}
              placeholder={String(CURRENT_YEAR)}
              min={2000}
              max={CURRENT_YEAR + 1}
            />
            {errors.membershipYear && <p className="text-xs text-red-500 mt-1">{errors.membershipYear}</p>}
            <p className="text-xs text-gray-400 mt-1">The year their temple membership was renewed or confirmed</p>
          </div>

          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Membership is valid for <strong>1 year from the date of registration</strong>. Only active members may register students.
          </p>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-red-700 hover:bg-red-800 text-white">
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

function DetailPanel({ member, onClose, onEdit, onDelete, canEdit }: {
  member: MemberDetail; onClose: () => void; onEdit: () => void;
  onDelete: () => void; canEdit: boolean;
}) {
  const exp    = expiresOn(member.createdAt);
  const active = member.isActive;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${avatarColor(member.id)}`}>
              {initials(member.name)}
            </div>
            <div>
              <p className="font-bold text-gray-900">{member.name ?? "—"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Member #{member.id}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {active ? "Active" : "Expired"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {!active && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Membership expired on <strong>{exp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>. This member cannot register new students until renewed.</p>
          </div>
        )}

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                {member.email ? <span>{member.email}</span> : <span className="text-gray-400 italic">No email on record</span>}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                {member.phone ? <span>{formatUSPhone(member.phone.replace(/\D/g, ""))}</span> : <span className="text-gray-400 italic">No phone on record</span>}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Membership Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Member ID</p>
                <p className="text-sm font-semibold text-gray-800">#{member.id}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Membership Year</p>
                <p className="text-sm font-semibold text-gray-800">{member.membershipYear ?? "Not recorded"}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">Registered</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className={`rounded-xl p-3 ${active ? "bg-emerald-50" : "bg-red-50"}`}>
                <p className="text-xs text-gray-500">Expires</p>
                <p className={`text-sm font-semibold ${active ? "text-emerald-700" : "text-red-700"}`}>
                  {exp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Linked Students ({member.students.length})
            </h3>
            {member.students.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No students linked to this member.</p>
            ) : (
              <div className="space-y-2">
                {member.students.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(s.id)}`}>
                      {initials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.studentCode}{s.grade ? ` · Grade ${s.grade}` : ""}</p>
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
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
            <Button variant="outline" className="flex-1" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
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

  const [members, setMembers]           = useState<Member[]>([]);
  const [stats, setStats]               = useState<Stats>({ totalMembers: 0, activeCount: 0, expiredCount: 0, withStudents: 0, withoutStudents: 0, addedThisMonth: 0 });
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [sortCol, setSortCol]           = useState<"id" | "name" | "email" | "createdAt">("id");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [detailMember, setDetailMember] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting]         = useState<number | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchMembers = useCallback(async (opts?: { resetPage?: boolean }) => {
    setLoading(true);
    try {
      const p = opts?.resetPage ? 1 : page;
      if (opts?.resetPage) setPage(1);
      const res = await adminApi.members.list({
        q: search, sort: sortCol, dir: sortDir, page: String(p), limit: String(PAGE_SIZE),
      });
      setMembers(res.data);
      setTotal(res.total);
      setStats(res.stats);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [search, sortCol, sortDir, page]);

  useEffect(() => {
    clearTimeout(searchTimer.current ?? 0);
    searchTimer.current = setTimeout(() => fetchMembers({ resetPage: true }), 350);
    return () => clearTimeout(searchTimer.current ?? 0);
  }, [search, sortCol, sortDir]);

  useEffect(() => { fetchMembers(); }, [page]);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: typeof sortCol }) {
    if (sortCol !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc"
      ? <ChevronUp   className="w-3 h-3 text-red-600" />
      : <ChevronDown className="w-3 h-3 text-red-600" />;
  }

  async function openDetail(member: Member) {
    setDetailLoading(true);
    try {
      const detail = await adminApi.members.getById(member.id);
      setDetailMember(detail);
    } catch {
      toast.error("Failed to load member details");
    } finally {
      setDetailLoading(false);
    }
  }

  function openAdd()            { setEditingMember(null); setModalOpen(true); }
  function openEdit(m: Member)  { setDetailMember(null); setEditingMember(m); setModalOpen(true); }

  async function handleDelete(member: Member) {
    if (!confirm(`Delete member "${member.name}"? This cannot be undone.`)) return;
    setDeleting(member.id);
    try {
      await adminApi.members.remove(member.id);
      toast.success("Member deleted");
      setDetailMember(null);
      fetchMembers({ resetPage: false });
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to delete member");
    } finally {
      setDeleting(null);
    }
  }

  function handleSaved() { setModalOpen(false); setEditingMember(null); fetchMembers({ resetPage: false }); }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function exportCSV() {
    const header = ["ID", "Name", "Email", "Phone", "Status", "Expires", "Students", "Registered"];
    const rows = members.map((m) => [
      m.id, m.name ?? "", m.email ?? "",
      m.phone ? formatUSPhone(m.phone.replace(/\D/g, "")) : "",
      m.isActive ? "Active" : "Expired",
      expiresOn(m.createdAt).toLocaleDateString(),
      m.studentCount,
      new Date(m.createdAt).toLocaleDateString(),
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const thisMonthLabel = new Date().toLocaleString("default", { month: "short" }) + " " + CURRENT_YEAR;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Member Management</h1>
          <p className="text-sm text-gray-500">Bhartiya Hindu Temple registered members · active for 1 year from registration</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={exportCSV} className="gap-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </Button>
          {canEdit && (
            <Button onClick={openAdd} className="gap-2 text-sm bg-red-700 hover:bg-red-800 text-white">
              <Plus className="w-4 h-4" /> Add Member
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Members"         value={stats.totalMembers}    icon={Users}          color="bg-red-50 text-red-700" />
          <StatCard label="Active"                value={stats.activeCount}     icon={CheckCircle2}   color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Expired"               value={stats.expiredCount}    icon={ShieldAlert}    color="bg-orange-50 text-orange-600" />
          <StatCard label="With Students"         value={stats.withStudents}    icon={GraduationCap}  color="bg-sky-50 text-sky-600" />
          <StatCard label={`Added in ${thisMonthLabel}`} value={stats.addedThisMonth} icon={UserPlus} color="bg-violet-50 text-violet-600" />
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-sm text-gray-500">
              {loading ? "Loading…" : `${total.toLocaleString()} member${total !== 1 ? "s" : ""}${search ? " (filtered)" : ""}`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  <th className="pl-4 pr-2 py-3 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort("id")}>
                      ID <SortIcon col="id" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort("name")}>
                      Name <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left hidden md:table-cell">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort("email")}>
                      Email <SortIcon col="email" />
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left hidden sm:table-cell">Phone</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center hidden lg:table-cell">Students</th>
                  <th className="px-3 py-3 text-left">
                    <button className="flex items-center gap-1 hover:text-gray-700" onClick={() => toggleSort("createdAt")}>
                      Registered <SortIcon col="createdAt" />
                    </button>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {loading && members.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
                  </td></tr>
                )}
                {!loading && members.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    No members found.{" "}
                    {canEdit && <button className="text-red-700 hover:underline font-medium" onClick={openAdd}>Add the first member</button>}
                  </td></tr>
                )}
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-50 hover:bg-amber-50/40 transition-colors cursor-pointer"
                    onClick={() => openDetail(m)}
                  >
                    <td className="pl-4 pr-2 py-3">
                      <span className="text-xs font-mono text-gray-400">#{m.id}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(m.id)}`}>
                          {initials(m.name)}
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[160px]">{m.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-gray-600 truncate max-w-[200px] block">{m.email ?? <span className="text-gray-300">—</span>}</span>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-gray-600 whitespace-nowrap">
                      {m.phone ? formatUSPhone(m.phone.replace(/\D/g, "")) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {m.isActive ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center hidden lg:table-cell">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.studentCount > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                        {m.studentCount}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openDetail(m)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-blue-600" title="View details">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button onClick={() => openEdit(m)} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-amber-600" title="Edit">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canEdit && m.studentCount === 0 && (
                          <button
                            onClick={() => handleDelete(m)}
                            disabled={deleting === m.id}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors text-gray-400 hover:text-red-600 disabled:opacity-40"
                            title="Delete"
                          >
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {page} of {totalPages} · {total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailLoading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl p-8 shadow-xl text-center">
            <Loader2 className="w-6 h-6 animate-spin text-red-700 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Loading…</p>
          </div>
        </div>
      )}

      {detailMember && !detailLoading && (
        <DetailPanel
          member={detailMember}
          onClose={() => setDetailMember(null)}
          onEdit={() => openEdit(detailMember)}
          onDelete={() => handleDelete(detailMember)}
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
