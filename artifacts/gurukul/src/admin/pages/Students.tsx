import { useState, useMemo, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  Search, Download, ChevronUp, ChevronDown, Filter, Loader2,
  X, Plus, Trash2, UserPlus, BookOpen, GraduationCap, Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { canAccess } from "../rbac";

// ─── Types ────────────────────────────────────────────────────────────────────

type Student = {
  id: string; name: string; course: string; level: string;
  section: string; timing: string; enrollDate: string;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  amountDue: number; amountPaid: number; paymentMethod: string; receiptId: string;
};

type MetaSection  = { id: number; sectionName: string; schedule: string };
type MetaLevel    = { id: number; levelNumber: number; className: string; sections: MetaSection[] };
type MetaCourse   = { id: number; name: string; icon: string; levels: MetaLevel[] };
type Meta         = { nextCode: string; courses: MetaCourse[] };

type EnrollmentDraft = {
  key: number;
  courseId: number | "";
  levelId:  number | "";
  sectionId: number | "";
  amountDue: string;
};

const GRADES = ["Kindergarten","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];

const CURRICULUM_YEARS: string[] = Array.from({ length: 25 }, (_, i) => {
  const s = 2027 + i;
  return `${s}-${s + 1}`;
});
const coursesList    = ["All","Hindi","Dharma","Telugu","Tamil","Sanskrit","Gujarati"];
const paymentStatuses = ["All","Paid","Pending","Overdue"];
const levels         = ["All","Level 1","Level 2","Level 3","Level 4","Level 5","Level 6","Level 7"];
type SortKey = keyof Student;

// ─── Registration Panel ───────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-secondary mb-1 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-border mb-4">
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-bold text-secondary uppercase tracking-wide">{title}</span>
    </div>
  );
}

function RegisterStudentPanel({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [dob,        setDob]        = useState("");
  const [grade,      setGrade]      = useState("");
  const [curricYear, setCurricYear] = useState("2027-2028");
  const [isNew,      setIsNew]      = useState(true);

  const [motherName,  setMotherName]  = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [motherEmail, setMotherEmail] = useState("");
  const [fatherName,  setFatherName]  = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [fatherEmail, setFatherEmail] = useState("");
  const [address,     setAddress]     = useState("");

  const [enrollments, setEnrollments] = useState<EnrollmentDraft[]>([
    { key: 0, courseId: "", levelId: "", sectionId: "", amountDue: "35.00" },
  ]);
  const [draftKey, setDraftKey] = useState(1);

  useEffect(() => {
    adminApi.students.meta().then((d) => setMeta(d as Meta)).finally(() => setLoading(false));
  }, []);

  function addEnrollment() {
    setEnrollments(prev => [...prev, { key: draftKey, courseId: "", levelId: "", sectionId: "", amountDue: "35.00" }]);
    setDraftKey(k => k + 1);
  }

  function removeEnrollment(key: number) {
    setEnrollments(prev => prev.filter(e => e.key !== key));
  }

  function updateEnrollment(key: number, patch: Partial<EnrollmentDraft>) {
    setEnrollments(prev => prev.map(e => {
      if (e.key !== key) return e;
      const updated = { ...e, ...patch };
      if (patch.courseId !== undefined) { updated.levelId = ""; updated.sectionId = ""; }
      if (patch.levelId  !== undefined) { updated.sectionId = ""; }
      return updated;
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { toast.error("Student first and last name are required"); return; }

    const validEnrollments = enrollments.filter(e => e.courseId && e.levelId);
    setSaving(true);
    try {
      await adminApi.students.register({
        firstName:      firstName.trim(),
        lastName:       lastName.trim(),
        dob:            dob || undefined,
        grade:          grade || undefined,
        curriculumYear: curricYear || undefined,
        isNewStudent:   isNew,
        motherName:  motherName.trim() || undefined,
        motherPhone: motherPhone.trim() || undefined,
        motherEmail: motherEmail.trim() || undefined,
        fatherName:  fatherName.trim() || undefined,
        fatherPhone: fatherPhone.trim() || undefined,
        fatherEmail: fatherEmail.trim() || undefined,
        address:     address.trim() || undefined,
        enrollments: validEnrollments.map(e => ({
          courseLevelId: Number(e.levelId),
          sectionId:     e.sectionId ? Number(e.sectionId) : null,
          amountDue:     e.amountDue || "35.00",
          enrollDate:    new Date().toISOString().slice(0, 10),
        })),
      });
      toast.success(`${firstName} ${lastName} registered successfully!`);
      onRegistered();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";
  const selectCls = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary text-white shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <h2 className="font-bold text-lg">Register New Student</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

              {/* Student Code badge */}
              {meta?.nextCode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/8 rounded-xl border border-primary/20">
                  <span className="text-xs text-muted-foreground">Student ID will be assigned:</span>
                  <span className="font-mono font-bold text-primary text-sm">{meta.nextCode}</span>
                </div>
              )}

              {/* ── Section 1: Student ── */}
              <div>
                <SectionLabel icon={<GraduationCap className="w-4 h-4" />} title="Student Information" />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" required>
                    <input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Arjun" className={inputCls} />
                  </Field>
                  <Field label="Last Name" required>
                    <input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Sharma" className={inputCls} />
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="School Grade">
                    <select value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
                      <option value="">— Select grade —</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Curriculum Year" required>
                    <select value={curricYear} onChange={e => setCurricYear(e.target.value)} className={selectCls}>
                      {CURRICULUM_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="mt-4">
                  <Field label="Enrollment Type">
                    <div className="flex gap-3 mt-1">
                      {[true, false].map(v => (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => setIsNew(v)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${isNew === v ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        >
                          {v ? "New Student" : "Returning Student"}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>

              {/* ── Section 2: Parents ── */}
              <div>
                <SectionLabel icon={<Users className="w-4 h-4" />} title="Parent / Guardian Information" />

                <div className="space-y-4">
                  {/* Mother */}
                  <div className="p-4 rounded-xl bg-pink-50 border border-pink-100 space-y-3">
                    <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">Mother</p>
                    <div className="grid grid-cols-1 gap-3">
                      <Field label="Full Name">
                        <input value={motherName} onChange={e => setMotherName(e.target.value)} placeholder="Mother's full name" className={inputCls} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Phone">
                          <input type="tel" value={motherPhone} onChange={e => setMotherPhone(e.target.value)} placeholder="(614) 555-0100" className={inputCls} />
                        </Field>
                        <Field label="Email">
                          <input type="email" value={motherEmail} onChange={e => setMotherEmail(e.target.value)} placeholder="mom@email.com" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Father */}
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Father</p>
                    <div className="grid grid-cols-1 gap-3">
                      <Field label="Full Name">
                        <input value={fatherName} onChange={e => setFatherName(e.target.value)} placeholder="Father's full name" className={inputCls} />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Phone">
                          <input type="tel" value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} placeholder="(614) 555-0101" className={inputCls} />
                        </Field>
                        <Field label="Email">
                          <input type="email" value={fatherEmail} onChange={e => setFatherEmail(e.target.value)} placeholder="dad@email.com" className={inputCls} />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <Field label="Home Address">
                    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, State ZIP" className={inputCls} />
                  </Field>
                </div>
              </div>

              {/* ── Section 3: Enrollments ── */}
              <div>
                <SectionLabel icon={<BookOpen className="w-4 h-4" />} title="Course Enrollment" />

                <div className="space-y-3">
                  {enrollments.map((enr, idx) => {
                    const selectedCourse = meta?.courses.find(c => c.id === enr.courseId) ?? null;
                    const selectedLevel  = selectedCourse?.levels.find(l => l.id === enr.levelId) ?? null;
                    return (
                      <div key={enr.key} className="p-4 rounded-xl border border-border bg-gray-50 space-y-3 relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-secondary">Course {idx + 1}</span>
                          {enrollments.length > 1 && (
                            <button type="button" onClick={() => removeEnrollment(enr.key)} className="text-red-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <Field label="Course">
                          <select
                            value={enr.courseId}
                            onChange={e => updateEnrollment(enr.key, { courseId: e.target.value ? Number(e.target.value) : "" })}
                            className={selectCls}
                          >
                            <option value="">— Select course —</option>
                            {meta?.courses.map(c => (
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </Field>

                        {selectedCourse && (
                          <Field label="Level">
                            <select
                              value={enr.levelId}
                              onChange={e => updateEnrollment(enr.key, { levelId: e.target.value ? Number(e.target.value) : "" })}
                              className={selectCls}
                            >
                              <option value="">— Select level —</option>
                              {selectedCourse.levels.map(l => (
                                <option key={l.id} value={l.id}>Level {l.levelNumber} — {l.className}</option>
                              ))}
                            </select>
                          </Field>
                        )}

                        {selectedLevel && selectedLevel.sections.length > 0 && (
                          <Field label="Section / Time Slot">
                            <select
                              value={enr.sectionId}
                              onChange={e => updateEnrollment(enr.key, { sectionId: e.target.value ? Number(e.target.value) : "" })}
                              className={selectCls}
                            >
                              <option value="">— Unassigned —</option>
                              {selectedLevel.sections.map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.sectionName}{s.schedule ? ` · ${s.schedule}` : ""}
                                </option>
                              ))}
                            </select>
                          </Field>
                        )}

                        <Field label="Registration Fee ($)">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={enr.amountDue}
                            onChange={e => updateEnrollment(enr.key, { amountDue: e.target.value })}
                            className={`${inputCls} w-32`}
                          />
                        </Field>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={addEnrollment}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-medium hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Another Course
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-gray-50 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {saving ? "Registering…" : "Register Student"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Students() {
  const { user } = useAuth();
  const isAdmin = user ? canAccess(user.role, "dashboard") : false;

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterLevel,  setFilterLevel]  = useState("All");
  const [sortKey, setSortKey]   = useState<SortKey>("id");
  const [sortAsc, setSortAsc]   = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const loadStudents = useCallback(() => {
    setLoading(true);
    adminApi.students.list().then((d) => setStudents(d as Student[])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const filtered = useMemo(() => {
    let data = students.filter((s) =>
      (filterCourse === "All" || s.course === filterCourse) &&
      (filterStatus === "All" || s.paymentStatus === filterStatus) &&
      (filterLevel === "All" || s.level === filterLevel) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()))
    );
    data = [...data].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return data;
  }, [students, search, filterCourse, filterStatus, filterLevel, sortKey, sortAsc]);

  const totalPaid    = filtered.filter((s) => s.paymentStatus === "Paid").reduce((a, s) => a + s.amountPaid, 0);
  const totalPending = filtered.filter((s) => s.paymentStatus !== "Paid").reduce((a, s) => a + (s.amountDue - s.amountPaid), 0);
  const totalOverdue = filtered.filter((s) => s.paymentStatus === "Overdue").length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;
  }

  function exportCSV() {
    const headers = ["Student ID","Name","Course","Level","Section","Timing","Enroll Date","Payment Status","Amount Due","Amount Paid","Method","Receipt ID"];
    const rows = filtered.map((s) => [s.id,s.name,s.course,s.level,s.section,s.timing,s.enrollDate,s.paymentStatus,s.amountDue,s.amountPaid,s.paymentMethod,s.receiptId]);
    const csv = [headers,...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gurukul-students.csv"; a.click();
  }

  const statusBadge: Record<string, string> = {
    Paid: "bg-green-100 text-green-700", Pending: "bg-orange-100 text-orange-700", Overdue: "bg-red-100 text-red-700",
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-secondary">Students & Payments</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} student{filtered.length !== 1 ? "s" : ""} shown</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Button onClick={() => setShowRegister(true)} className="gap-2 rounded-xl">
              <UserPlus className="w-4 h-4" /> Register Student
            </Button>
          )}
          <Button variant="outline" onClick={exportCSV} className="gap-2 rounded-xl">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border">
          <div className="text-2xl font-bold text-secondary">{filtered.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Students</div>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <div className="text-2xl font-bold text-green-700">${totalPaid.toLocaleString()}</div>
          <div className="text-xs text-green-600 mt-1">Total Collected</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <div className="text-2xl font-bold text-orange-700">${totalPending.toLocaleString()}</div>
          <div className="text-xs text-orange-600 mt-1">Pending Amount</div>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
          <div className="text-2xl font-bold text-red-700">{totalOverdue}</div>
          <div className="text-xs text-red-600 mt-1">Overdue Accounts</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, parent, or ID..." className="pl-9 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2 rounded-xl shrink-0">
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-4">
          <div className="space-y-1.5 min-w-32">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Course</label>
            <div className="flex flex-wrap gap-1">
              {coursesList.map((c) => (
                <button key={c} onClick={() => setFilterCourse(c)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filterCourse === c ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>{c}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Status</label>
            <div className="flex flex-wrap gap-1">
              {paymentStatuses.map((s) => (
                <button key={s} onClick={() => setFilterStatus(s)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>{s}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Level</label>
            <div className="flex flex-wrap gap-1">
              {levels.map((l) => (
                <button key={l} onClick={() => setFilterLevel(l)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${filterLevel === l ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {[
                  { label: "Student ID", key: "id" as SortKey },
                  { label: "Student Name", key: "name" as SortKey },
                  { label: "Course", key: "course" as SortKey },
                  { label: "Level", key: "level" as SortKey },
                  { label: "Section", key: "section" as SortKey },
                  { label: "Timing", key: "timing" as SortKey },
                  { label: "Enroll Date", key: "enrollDate" as SortKey },
                  { label: "Status", key: "paymentStatus" as SortKey },
                  { label: "Due", key: "amountDue" as SortKey },
                  { label: "Paid", key: "amountPaid" as SortKey },
                  { label: "Method", key: "paymentMethod" as SortKey },
                  { label: "Receipt", key: "receiptId" as SortKey },
                ].map((col) => (
                  <th key={col.key} onClick={() => toggleSort(col.key)}
                    className="text-left font-semibold text-muted-foreground px-4 py-3 whitespace-nowrap cursor-pointer hover:text-secondary transition-colors select-none">
                    {col.label}<SortIcon k={col.key} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="text-center py-12 text-muted-foreground">
                  No students found.{isAdmin && <> <button onClick={() => setShowRegister(true)} className="text-primary hover:underline ml-1">Register one?</button></>}
                </td></tr>
              )}
              {filtered.map((s) => (
                <tr key={`${s.id}-${s.course}`} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                  <td className="px-4 py-3 font-medium text-secondary whitespace-nowrap">{s.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium">{s.course}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.level}</td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {s.section
                      ? <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-100">{s.section}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.timing}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.enrollDate}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[s.paymentStatus]}`}>{s.paymentStatus}</span></td>
                  <td className="px-4 py-3 text-xs font-medium">${s.amountDue}</td>
                  <td className="px-4 py-3 text-xs font-medium text-green-700">${s.amountPaid}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.paymentMethod}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{s.receiptId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRegister && (
        <RegisterStudentPanel
          onClose={() => setShowRegister(false)}
          onRegistered={() => { setShowRegister(false); loadStudents(); }}
        />
      )}
    </div>
  );
}
