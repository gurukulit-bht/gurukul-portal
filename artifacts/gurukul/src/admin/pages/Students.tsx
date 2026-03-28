import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { adminApi } from "@/lib/adminApi";
import { usePortalSettings } from "../contexts/PortalSettingsContext";
import {
  Search, Download, ChevronUp, ChevronDown, Filter, Loader2,
  X, Plus, Trash2, UserPlus, BookOpen, GraduationCap, Users,
  Pencil, ChevronLeft, ChevronRight, UserX, UserCheck, AlertTriangle,
  Phone, Mail, CreditCard, Receipt,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../AuthContext";
import { canAccess } from "../rbac";

// ─── Types ────────────────────────────────────────────────────────────────────

type Enrollment = {
  enrollmentId: number | null;
  course: string;
  courseIcon: string;
  level: string;
  levelNum: number;
  section: string;
  timing: string;
  enrollDate: string;
  enrollStatus: string;
  paymentStatus: "Paid" | "Pending" | "Overdue";
  amountDue: number;
  amountPaid: number;
  paymentMethod: string;
  receiptId: string;
};

type Student = {
  id: string;
  studentDbId: number;
  name: string;
  dob: string;
  grade: string;
  curriculumYear: string;
  isNewStudent: boolean;
  isActive: boolean;
  // Temple membership
  memberId: number | null;
  memberName: string | null;
  memberPhone: string | null;
  memberEmail: string | null;
  // Parent contacts
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  address: string;
  enrollments: Enrollment[];
  // aggregated helpers
  courses: string[];
  primaryCourse: string;
  primaryLevel: string;
  primarySection: string;
  totalPaid: number;
  totalDue: number;
  worstPayStatus: "Paid" | "Pending" | "Overdue";
  parentPhone: string;
};

type RawRow = Record<string, unknown>;

const PAGE_SIZE = 100;

const PAYMENT_RANK: Record<string, number> = { Overdue: 3, Pending: 2, Paid: 1 };

function groupRows(raw: RawRow[]): Student[] {
  const map = new Map<string, Student>();
  for (const r of raw) {
    const code = r.id as string;
    if (!map.has(code)) {
      map.set(code, {
        id: code,
        studentDbId: r.studentDbId as number,
        name: r.name as string,
        dob: r.dob as string ?? "",
        grade: r.grade as string ?? "",
        curriculumYear: r.curriculumYear as string ?? "",
        isNewStudent: r.isNewStudent as boolean ?? true,
        isActive: r.isActive as boolean ?? true,
        memberId: r.memberId as number | null ?? null,
        memberName: r.memberName as string | null ?? null,
        memberPhone: r.memberPhone as string | null ?? null,
        memberEmail: r.memberEmail as string | null ?? null,
        motherName: r.motherName as string ?? "",
        motherPhone: r.motherPhone as string ?? "",
        motherEmail: r.motherEmail as string ?? "",
        fatherName: r.fatherName as string ?? "",
        fatherPhone: r.fatherPhone as string ?? "",
        fatherEmail: r.fatherEmail as string ?? "",
        address: r.address as string ?? "",
        enrollments: [],
        courses: [],
        primaryCourse: "",
        primaryLevel: "",
        primarySection: "",
        totalPaid: 0,
        totalDue: 0,
        worstPayStatus: "Paid",
        parentPhone: "",
      });
    }
    const s = map.get(code)!;
    if (r.enrollmentId) {
      const enr: Enrollment = {
        enrollmentId:  r.enrollmentId as number,
        course:        r.course as string ?? "",
        courseIcon:    r.courseIcon as string ?? "",
        level:         r.level as string ?? "",
        levelNum:      r.levelNum as number ?? 0,
        section:       r.section as string ?? "",
        timing:        r.timing as string ?? "",
        enrollDate:    r.enrollDate as string ?? "",
        enrollStatus:  r.enrollStatus as string ?? "Enrolled",
        paymentStatus: r.paymentStatus as "Paid"|"Pending"|"Overdue" ?? "Pending",
        amountDue:     r.amountDue as number ?? 0,
        amountPaid:    r.amountPaid as number ?? 0,
        paymentMethod: r.paymentMethod as string ?? "-",
        receiptId:     r.receiptId as string ?? "-",
      };
      s.enrollments.push(enr);
    }
  }

  // compute aggregated fields
  for (const s of map.values()) {
    s.courses = [...new Set(s.enrollments.map(e => e.course).filter(Boolean))];
    s.primaryCourse  = s.enrollments[0]?.course ?? "";
    s.primaryLevel   = s.enrollments[0]?.level ?? "";
    s.primarySection = s.enrollments[0]?.section ?? "";
    s.totalPaid = s.enrollments.reduce((a, e) => a + e.amountPaid, 0);
    s.totalDue  = s.enrollments.reduce((a, e) => a + e.amountDue, 0);
    let worst = 1;
    for (const e of s.enrollments) worst = Math.max(worst, PAYMENT_RANK[e.paymentStatus] ?? 1);
    s.worstPayStatus = worst === 3 ? "Overdue" : worst === 2 ? "Pending" : "Paid";
    s.parentPhone = s.motherPhone || s.fatherPhone;
  }

  return Array.from(map.values());
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title, message, confirmLabel, danger, onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-border">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${danger ? "bg-red-100" : "bg-amber-100"}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? "text-red-600" : "text-amber-600"}`} />
        </div>
        <h3 className="text-base font-bold text-secondary mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={danger ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Student Panel ────────────────────────────────────────────────────────

function EditStudentPanel({
  student, onClose, onSaved, curriculumYears,
}: {
  student: Student;
  onClose: () => void;
  onSaved: () => void;
  curriculumYears: string[];
}) {
  const nameParts = student.name.split(" ");
  const [firstName,    setFirstName]    = useState(nameParts[0] ?? "");
  const [lastName,     setLastName]     = useState(nameParts.slice(1).join(" "));
  const [dob,          setDob]          = useState(student.dob);
  const [grade,        setGrade]        = useState(student.grade);
  const [curricYear,   setCurricYear]   = useState(student.curriculumYear);
  const [motherName,   setMotherName]   = useState(student.motherName);
  const [motherPhone,  setMotherPhone]  = useState(student.motherPhone);
  const [motherEmail,  setMotherEmail]  = useState(student.motherEmail);
  const [fatherName,   setFatherName]   = useState(student.fatherName);
  const [fatherPhone,  setFatherPhone]  = useState(student.fatherPhone);
  const [fatherEmail,  setFatherEmail]  = useState(student.fatherEmail);
  const [address,      setAddress]      = useState(student.address);
  const [saving,       setSaving]       = useState(false);

  const GRADES = ["Kindergarten","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];
  const inputCls  = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";
  const selectCls = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    setSaving(true);
    try {
      await adminApi.students.update(student.id, {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        dob, grade, curriculumYear: curricYear,
        motherName, motherPhone, motherEmail,
        fatherName, fatherPhone, fatherEmail,
        address,
      });
      toast.success(`${firstName} ${lastName} updated`);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary text-white shrink-0">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            <div>
              <h2 className="font-bold text-sm">Edit Student</h2>
              <p className="text-white/70 text-xs">{student.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col">
          <div className="flex-1 p-6 space-y-5 overflow-y-auto">

            {/* Student Info */}
            <div>
              <p className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border pb-2 mb-4">Student Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">First Name <span className="text-red-500">*</span></label>
                  <input required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date of Birth</label>
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">School Grade</label>
                  <select value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
                    <option value="">— Select —</option>
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Curriculum Year</label>
                  <select value={curricYear} onChange={e => setCurricYear(e.target.value)} className={selectCls}>
                    {curriculumYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Mother */}
            <div className="p-4 rounded-xl bg-pink-50 border border-pink-100 space-y-3">
              <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">Mother</p>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
                <input value={motherName} onChange={e => setMotherName(e.target.value)} placeholder="Mother's full name" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone</label>
                  <input type="tel" value={motherPhone} onChange={e => setMotherPhone(e.target.value)} placeholder="(614) 555-0100" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                  <input type="email" value={motherEmail} onChange={e => setMotherEmail(e.target.value)} placeholder="mom@email.com" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Father */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Father</p>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Full Name</label>
                <input value={fatherName} onChange={e => setFatherName(e.target.value)} placeholder="Father's full name" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone</label>
                  <input type="tel" value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} placeholder="(614) 555-0101" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                  <input type="email" value={fatherEmail} onChange={e => setFatherEmail(e.target.value)} placeholder="dad@email.com" className={inputCls} />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Home Address</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, State ZIP" className={inputCls} />
            </div>

            {/* Enrollments (read-only) */}
            {student.enrollments.length > 0 && (
              <div>
                <p className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border pb-2 mb-3">Enrollments</p>
                <div className="space-y-2">
                  {student.enrollments.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 border border-border">
                      <div>
                        <span className="font-semibold text-secondary">{e.courseIcon} {e.course}</span>
                        <span className="text-muted-foreground ml-2">{e.level}</span>
                        {e.section && <span className="text-muted-foreground ml-1">· {e.section}</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${e.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : e.paymentStatus === "Overdue" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        ${e.amountPaid} paid
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-gray-50 shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Register Student Panel (unchanged logic, kept for quick access) ───────────

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

type EnrollmentDraft = { key: number; courseId: number | ""; levelId: number | ""; sectionId: number | ""; amountDue: string; };
type MetaSection  = { id: number; sectionName: string; schedule: string };
type MetaLevel    = { id: number; levelNumber: number; className: string; sections: MetaSection[] };
type MetaCourse   = { id: number; name: string; icon: string; levels: MetaLevel[] };
type Meta         = { nextCode: string; courses: MetaCourse[] };

type LinkedMember = { id: number; name: string | null; email: string | null; phone: string | null };

function RegisterStudentPanel({ onClose, onRegistered }: { onClose: () => void; onRegistered: () => void }) {
  const { curriculumYearsLong, activeCurriculumYearLong } = usePortalSettings();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  // ── Temple member (required) ──
  const [membershipPath, setMembershipPath] = useState<"existing" | "new" | null>(null);
  const [linkedMember,   setLinkedMember]   = useState<LinkedMember | null>(null);
  const [memberSearch,   setMemberSearch]   = useState("");
  const [memberLooking,  setMemberLooking]  = useState(false);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [newMemberName,  setNewMemberName]  = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  // ── Student fields ──
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [dob,        setDob]        = useState("");
  const [grade,      setGrade]      = useState("");
  const [curricYear, setCurricYear] = useState(() => activeCurriculumYearLong || "2027-2028");
  const [isNew,      setIsNew]      = useState(true);
  const [motherName,  setMotherName]  = useState("");
  const [motherPhone, setMotherPhone] = useState("");
  const [motherEmail, setMotherEmail] = useState("");
  const [fatherName,  setFatherName]  = useState("");
  const [fatherPhone, setFatherPhone] = useState("");
  const [fatherEmail, setFatherEmail] = useState("");
  const [address,     setAddress]     = useState("");
  const [enrollments, setEnrollments] = useState<EnrollmentDraft[]>([{ key: 0, courseId: "", levelId: "", sectionId: "", amountDue: "35.00" }]);
  const [draftKey, setDraftKey] = useState(1);
  const GRADES = ["Kindergarten","1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"];
  const inputCls  = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";
  const selectCls = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";

  useEffect(() => {
    adminApi.students.meta().then((d) => setMeta(d as Meta)).finally(() => setLoading(false));
  }, []);

  function resetMemberPath() {
    setMembershipPath(null);
    setLinkedMember(null);
    setMemberSearch("");
    setMemberNotFound(false);
    setNewMemberName("");
    setNewMemberPhone("");
    setNewMemberEmail("");
  }

  function selectNewPath() {
    setMembershipPath("new");
    // Pre-populate from father's info (primary) filled in so far
    setNewMemberName(fatherName.trim() || "");
    setNewMemberPhone(fatherPhone.trim() || "");
    setNewMemberEmail(fatherEmail.trim() || "");
    setMemberNotFound(false);
    setLinkedMember(null);
  }

  async function lookupMember() {
    const val = memberSearch.trim();
    if (!val) { toast.error("Enter a phone number or email to search"); return; }
    setMemberLooking(true);
    setMemberNotFound(false);
    setLinkedMember(null);
    try {
      const m = await adminApi.members.lookup(val);
      setLinkedMember(m);
      toast.success(`Member found: ${m.name ?? val}`);
    } catch {
      setMemberNotFound(true);
      // Pre-fill the create fields with father's info + searched value
      setNewMemberName(fatherName.trim() || "");
      setNewMemberPhone(fatherPhone.trim() || (val.includes("@") ? "" : val));
      setNewMemberEmail(fatherEmail.trim() || (val.includes("@") ? val : ""));
    } finally {
      setMemberLooking(false);
    }
  }

  async function createAndLinkMember() {
    if (!newMemberName.trim()) { toast.error("Parent/member name is required"); return; }
    setCreatingMember(true);
    try {
      const isTemple = membershipPath === "existing";
      const m = await adminApi.members.create({
        name:             newMemberName.trim(),
        phone:            newMemberPhone.trim() || null,
        email:            newMemberEmail.trim() || null,
        isExistingMember: isTemple,
      });
      setLinkedMember({ id: m.id, name: newMemberName.trim(), phone: newMemberPhone.trim() || null, email: newMemberEmail.trim() || null });
      setMemberNotFound(false);
      toast.success(isTemple ? "Temple member record created and linked!" : "Parent Membership created and linked!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create membership record");
    } finally {
      setCreatingMember(false);
    }
  }

  function addEnrollment() {
    setEnrollments(prev => [...prev, { key: draftKey, courseId: "", levelId: "", sectionId: "", amountDue: "35.00" }]);
    setDraftKey(k => k + 1);
  }
  function removeEnrollment(key: number) { setEnrollments(prev => prev.filter(e => e.key !== key)); }
  function updateEnrollment(key: number, patch: Partial<EnrollmentDraft>) {
    setEnrollments(prev => prev.map(e => {
      if (e.key !== key) return e;
      const u = { ...e, ...patch };
      if (patch.courseId !== undefined) { u.levelId = ""; u.sectionId = ""; }
      if (patch.levelId  !== undefined) { u.sectionId = ""; }
      return u;
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) { toast.error("First and last name required"); return; }
    if (!linkedMember) { toast.error("A temple member record must be linked first. Use the Temple Membership section above."); return; }
    const valid = enrollments.filter(e => e.courseId && e.levelId);
    setSaving(true);
    try {
      await adminApi.students.register({
        firstName: firstName.trim(), lastName: lastName.trim(),
        dob: dob || undefined, grade: grade || undefined,
        curriculumYear: curricYear || undefined, isNewStudent: isNew,
        memberId: linkedMember.id,
        motherName: motherName.trim() || undefined, motherPhone: motherPhone.trim() || undefined, motherEmail: motherEmail.trim() || undefined,
        fatherName: fatherName.trim() || undefined, fatherPhone: fatherPhone.trim() || undefined, fatherEmail: fatherEmail.trim() || undefined,
        address: address.trim() || undefined,
        enrollments: valid.map(e => ({ courseLevelId: Number(e.levelId), sectionId: e.sectionId ? Number(e.sectionId) : null, amountDue: e.amountDue || "35.00", enrollDate: new Date().toISOString().slice(0, 10) })),
      });
      toast.success(`${firstName} ${lastName} registered!`);
      onRegistered();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary text-white shrink-0">
          <div className="flex items-center gap-2"><UserPlus className="w-5 h-5" /><h2 className="font-bold text-lg">Register New Student</h2></div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {meta?.nextCode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/8 rounded-xl border border-primary/20">
                  <span className="text-xs text-muted-foreground">Student ID will be:</span>
                  <span className="font-mono font-bold text-primary text-sm">{meta.nextCode}</span>
                </div>
              )}

              {/* ── Temple Membership (REQUIRED) ── */}
              <div>
                <div className="flex items-center gap-2 py-2 border-b border-border mb-4">
                  <Users className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-secondary uppercase tracking-wide">Temple Membership</span>
                  <span className="ml-auto text-xs font-semibold text-red-600 uppercase">Required</span>
                </div>

                {/* ── Linked: show confirmation card ── */}
                {linkedMember ? (
                  <div className="flex items-start justify-between p-3 bg-green-50 border border-green-200 rounded-xl gap-3">
                    <div>
                      <p className="font-semibold text-green-800 text-sm">{linkedMember.name ?? "Unknown"}</p>
                      <p className="text-xs text-green-700 mt-0.5">{[linkedMember.phone, linkedMember.email].filter(Boolean).join(" · ")}</p>
                      <p className="text-xs text-green-600 mt-1">
                        {membershipPath === "new" ? "New Parent Membership created" : "Linked to existing temple member"}
                      </p>
                    </div>
                    <button type="button" onClick={resetMemberPath}
                      className="text-xs text-red-500 hover:text-red-700 underline shrink-0 mt-0.5">Change</button>
                  </div>

                ) : membershipPath === null ? (
                  /* ── Step 1: choose path ── */
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground mb-3">Is this family already a registered temple member?</p>
                    <button type="button" onClick={() => setMembershipPath("existing")}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary">Yes — Existing Temple Member</p>
                        <p className="text-xs text-muted-foreground">Search for their existing member record</p>
                      </div>
                    </button>
                    <button type="button" onClick={selectNewPath}
                      className="w-full flex items-center gap-3 px-4 py-3 border-2 border-border rounded-xl hover:border-amber-500 hover:bg-amber-50 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200">
                        <UserPlus className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-secondary">No — Not a Temple Member</p>
                        <p className="text-xs text-muted-foreground">A Parent Membership record will be created automatically</p>
                      </div>
                    </button>
                  </div>

                ) : membershipPath === "existing" ? (
                  /* ── Step 2a: search for existing member ── */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <button type="button" onClick={resetMemberPath} className="text-xs text-primary hover:underline">← Back</button>
                      <span className="text-xs text-muted-foreground">Search existing temple member by phone or email</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={memberSearch}
                        onChange={e => { setMemberSearch(e.target.value); setMemberNotFound(false); }}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); lookupMember(); } }}
                        placeholder="Phone or email address"
                        className={inputCls}
                        autoFocus
                      />
                      <button type="button" onClick={lookupMember} disabled={memberLooking}
                        className="shrink-0 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1.5">
                        {memberLooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        Find
                      </button>
                    </div>
                    {memberNotFound && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                        <p className="text-xs font-semibold text-amber-800">No member found. Confirm details to create a member record:</p>
                        <div className="space-y-2">
                          <input value={newMemberName}  onChange={e => setNewMemberName(e.target.value)}  placeholder="Full name *" className={inputCls} />
                          <input value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} placeholder="Phone number"  className={inputCls} />
                          <input value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                        </div>
                        <button type="button" onClick={createAndLinkMember} disabled={creatingMember}
                          className="w-full py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
                          {creatingMember && <Loader2 className="w-4 h-4 animate-spin" />}
                          Create Member Record &amp; Link
                        </button>
                      </div>
                    )}
                  </div>

                ) : (
                  /* ── Step 2b: create parent membership from father's info ── */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <button type="button" onClick={resetMemberPath} className="text-xs text-primary hover:underline">← Back</button>
                      <span className="text-xs text-muted-foreground">Parent Membership — pre-filled from father's info</span>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                      <p className="text-xs text-amber-800">A <strong>Parent Membership</strong> record will be created with the information below (primarily from the father's details). Fill in the Parent Information section below first, or enter the details here directly.</p>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs font-medium text-amber-900 block mb-1">Parent / Guardian Name <span className="text-red-500">*</span></label>
                          <input value={newMemberName}  onChange={e => setNewMemberName(e.target.value)}  placeholder="Full name (from father's info)" className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-amber-900 block mb-1">Phone Number</label>
                          <input value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} placeholder="Phone number" className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-amber-900 block mb-1">Email Address</label>
                          <input value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} placeholder="Email address" className={inputCls} />
                        </div>
                      </div>
                      <button type="button" onClick={createAndLinkMember} disabled={creatingMember || !newMemberName.trim()}
                        className="w-full py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 flex items-center justify-center gap-2 font-medium">
                        {creatingMember && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Parent Membership &amp; Continue
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 py-2 border-b border-border mb-4"><GraduationCap className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-secondary uppercase tracking-wide">Student Information</span></div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" required><input required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="e.g. Arjun" className={inputCls} /></Field>
                  <Field label="Last Name" required><input required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="e.g. Sharma" className={inputCls} /></Field>
                  <Field label="Date of Birth"><input type="date" value={dob} onChange={e => setDob(e.target.value)} className={inputCls} /></Field>
                  <Field label="School Grade">
                    <select value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
                      <option value="">— Select —</option>
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </Field>
                  <Field label="Curriculum Year" required>
                    <select value={curricYear} onChange={e => setCurricYear(e.target.value)} className={selectCls}>
                      {curriculumYearsLong.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </Field>
                  <Field label="Enrollment Type">
                    <div className="flex gap-2 mt-1">
                      {[true, false].map(v => (
                        <button key={String(v)} type="button" onClick={() => setIsNew(v)}
                          className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${isNew === v ? "border-primary bg-primary text-white" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                          {v ? "New" : "Returning"}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 py-2 border-b border-border mb-4"><Users className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-secondary uppercase tracking-wide">Parent / Guardian</span></div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-pink-50 border border-pink-100 space-y-3">
                    <p className="text-xs font-bold text-pink-700 uppercase tracking-wide">Mother</p>
                    <Field label="Full Name"><input value={motherName} onChange={e => setMotherName(e.target.value)} placeholder="Mother's full name" className={inputCls} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Phone"><input type="tel" value={motherPhone} onChange={e => setMotherPhone(e.target.value)} placeholder="(614) 555-0100" className={inputCls} /></Field>
                      <Field label="Email"><input type="email" value={motherEmail} onChange={e => setMotherEmail(e.target.value)} placeholder="mom@email.com" className={inputCls} /></Field>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Father</p>
                    <Field label="Full Name"><input value={fatherName} onChange={e => setFatherName(e.target.value)} placeholder="Father's full name" className={inputCls} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Phone"><input type="tel" value={fatherPhone} onChange={e => setFatherPhone(e.target.value)} placeholder="(614) 555-0101" className={inputCls} /></Field>
                      <Field label="Email"><input type="email" value={fatherEmail} onChange={e => setFatherEmail(e.target.value)} placeholder="dad@email.com" className={inputCls} /></Field>
                    </div>
                  </div>
                  <Field label="Home Address"><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, City, State ZIP" className={inputCls} /></Field>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 py-2 border-b border-border mb-4"><BookOpen className="w-4 h-4 text-primary" /><span className="text-sm font-bold text-secondary uppercase tracking-wide">Course Enrollment</span></div>
                <div className="space-y-3">
                  {enrollments.map((enr, idx) => {
                    const sc = meta?.courses.find(c => c.id === enr.courseId) ?? null;
                    const sl = sc?.levels.find(l => l.id === enr.levelId) ?? null;
                    return (
                      <div key={enr.key} className="p-4 rounded-xl border border-border bg-gray-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-secondary">Course {idx + 1}</span>
                          {enrollments.length > 1 && <button type="button" onClick={() => removeEnrollment(enr.key)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </div>
                        <Field label="Course">
                          <select value={enr.courseId} onChange={e => updateEnrollment(enr.key, { courseId: e.target.value ? Number(e.target.value) : "" })} className={selectCls}>
                            <option value="">— Select course —</option>
                            {meta?.courses.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                          </select>
                        </Field>
                        {sc && (
                          <Field label="Level">
                            <select value={enr.levelId} onChange={e => updateEnrollment(enr.key, { levelId: e.target.value ? Number(e.target.value) : "" })} className={selectCls}>
                              <option value="">— Select level —</option>
                              {sc.levels.map(l => <option key={l.id} value={l.id}>Level {l.levelNumber} — {l.className}</option>)}
                            </select>
                          </Field>
                        )}
                        {sl && sl.sections.length > 0 && (
                          <Field label="Section">
                            <select value={enr.sectionId} onChange={e => updateEnrollment(enr.key, { sectionId: e.target.value ? Number(e.target.value) : "" })} className={selectCls}>
                              <option value="">— Unassigned —</option>
                              {sl.sections.map(s => <option key={s.id} value={s.id}>{s.sectionName}{s.schedule ? ` · ${s.schedule}` : ""}</option>)}
                            </select>
                          </Field>
                        )}
                        <Field label="Fee ($)">
                          <input type="number" min="0" step="0.01" value={enr.amountDue} onChange={e => updateEnrollment(enr.key, { amountDue: e.target.value })} className={`${inputCls} w-32`} />
                        </Field>
                      </div>
                    );
                  })}
                  <button type="button" onClick={addEnrollment}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-medium hover:border-primary/60 hover:bg-primary/5 transition-colors">
                    <Plus className="w-4 h-4" /> Add Another Course
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 justify-end bg-gray-50 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving} className="gap-2">
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

// ─── Payment Drawer ───────────────────────────────────────────────────────────

function PaymentDrawer({ student, onClose }: { student: Student; onClose: () => void }) {
  const PAY_BADGE: Record<string, string> = {
    Paid:    "bg-green-100 text-green-700",
    Pending: "bg-orange-100 text-orange-700",
    Overdue: "bg-red-100 text-red-700",
  };
  const totalDue  = student.enrollments.reduce((a, e) => a + e.amountDue, 0);
  const totalPaid = student.enrollments.reduce((a, e) => a + e.amountPaid, 0);
  const balance   = totalDue - totalPaid;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="font-semibold text-secondary">Payment Details</span>
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">{student.name}</div>
            <div className="font-mono text-xs text-muted-foreground">{student.id}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Enrollments */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No enrollments found.</p>
          ) : student.enrollments.map((e, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-2.5">
              {/* Course + Level */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-secondary">
                    <span>{e.courseIcon}</span>
                    <span>{e.course}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {e.level}{e.section ? ` · ${e.section}` : ""}{e.timing ? ` · ${e.timing}` : ""}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PAY_BADGE[e.paymentStatus] ?? "bg-gray-100 text-gray-500"}`}>
                  {e.paymentStatus}
                </span>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Due</div>
                  <div className="text-sm font-semibold text-secondary">${e.amountDue.toFixed(0)}</div>
                </div>
                <div className="bg-green-50 rounded-lg px-2 py-1.5">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Paid</div>
                  <div className="text-sm font-semibold text-green-700">${e.amountPaid.toFixed(0)}</div>
                </div>
                <div className={`rounded-lg px-2 py-1.5 ${e.amountDue - e.amountPaid > 0 ? "bg-orange-50" : "bg-green-50"}`}>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance</div>
                  <div className={`text-sm font-semibold ${e.amountDue - e.amountPaid > 0 ? "text-orange-600" : "text-green-700"}`}>
                    ${(e.amountDue - e.amountPaid).toFixed(0)}
                  </div>
                </div>
              </div>

              {/* Method + Receipt */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {e.paymentMethod && e.paymentMethod !== "-" ? (
                  <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{e.paymentMethod}</span>
                ) : <span>—</span>}
                {e.receiptId && e.receiptId !== "-" ? (
                  <span className="flex items-center gap-1"><Receipt className="w-3 h-3" />#{e.receiptId}</span>
                ) : null}
                {e.enrollDate && (
                  <span>Enrolled: {new Date(e.enrollDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer summary */}
        <div className="border-t border-border px-5 py-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Due</div>
              <div className="text-base font-bold text-secondary">${totalDue.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Paid</div>
              <div className="text-base font-bold text-green-700">${totalPaid.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Balance</div>
              <div className={`text-base font-bold ${balance > 0 ? "text-orange-600" : "text-green-700"}`}>${balance.toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type SortKey = "id" | "name" | "grade" | "primaryCourse" | "primaryLevel" | "totalPaid" | "worstPayStatus" | "isActive";

export default function Students() {
  const { user } = useAuth();
  const isAdmin = user ? canAccess(user.role, "dashboard") : false;
  const { curriculumYearsLong, activeCurriculumYearLong } = usePortalSettings();

  // ── data
  const [rawStudents, setRawStudents] = useState<Student[]>([]);
  const [loading, setLoading]         = useState(true);

  // ── search & filters (operate on full dataset)
  const [search,          setSearch]          = useState("");
  const [filterCourse,    setFilterCourse]    = useState("All");
  const [filterLevel,     setFilterLevel]     = useState("All");
  const [filterSection,   setFilterSection]   = useState("All");
  const [filterPayStatus, setFilterPayStatus] = useState("All");
  const [filterActive,    setFilterActive]    = useState("All");
  const [filterCurricYear,setFilterCurricYear]= useState("All");
  const [showFilters,     setShowFilters]     = useState(false);

  // ── sort
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // ── pagination
  const [page, setPage]         = useState(1);
  const [pageInput, setPageInput] = useState("1");

  // ── selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── panels / dialogs
  const [editStudent,    setEditStudent]    = useState<Student | null>(null);
  const [showRegister,   setShowRegister]   = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [paymentDrawer,  setPaymentDrawer]  = useState<Student | null>(null);
  const [confirmInactive, setConfirmInactive] = useState(false);
  const [confirmActive,   setConfirmActive]   = useState(false);
  const [actionLoading,   setActionLoading]   = useState(false);
  // ── unlinked member banner
  const [unlinkedCount,   setUnlinkedCount]   = useState(0);
  const [backfilling,     setBackfilling]     = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

  const loadStudents = useCallback(() => {
    setLoading(true);
    adminApi.students.list()
      .then((d) => setRawStudents(groupRows(d as RawRow[])))
      .finally(() => setLoading(false));
  }, []);

  const loadUnlinkedCount = useCallback(() => {
    adminApi.students.unlinkedCount().then(r => setUnlinkedCount(r.unlinkedCount ?? 0)).catch(() => {});
  }, []);

  async function runBackfill() {
    setBackfilling(true);
    try {
      const res = await adminApi.backfill.linkMembers();
      toast.success(`Backfill complete: ${res.totalStudentsFixed} student(s) linked to member records.`);
      loadStudents();
      loadUnlinkedCount();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setBackfilling(false);
    }
  }

  useEffect(() => { loadStudents(); loadUnlinkedCount(); }, [loadStudents, loadUnlinkedCount]);
  useEffect(() => { if (activeCurriculumYearLong && filterCurricYear === "All") setFilterCurricYear(activeCurriculumYearLong); }, [activeCurriculumYearLong]);

  // ── dynamic filter options from data
  const allCourses  = useMemo(() => ["All", ...Array.from(new Set(rawStudents.flatMap(s => s.courses))).sort()], [rawStudents]);
  const allLevels   = useMemo(() => {
    const nums = Array.from(new Set(rawStudents.flatMap(s => s.enrollments.map(e => e.levelNum)))).filter(Boolean).sort((a,b) => a-b);
    return ["All", ...nums.map(n => `Level ${n}`)];
  }, [rawStudents]);
  const allSections = useMemo(() => {
    const secs = Array.from(new Set(rawStudents.flatMap(s => s.enrollments.map(e => e.section)).filter(Boolean))).sort();
    return ["All", ...secs];
  }, [rawStudents]);

  // ── filtered + sorted (entire dataset, no pagination yet)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let data = rawStudents.filter(s => {
      if (filterCourse !== "All"     && !s.courses.includes(filterCourse)) return false;
      if (filterLevel  !== "All"     && !s.enrollments.some(e => e.level === filterLevel)) return false;
      if (filterSection !== "All"    && !s.enrollments.some(e => e.section === filterSection)) return false;
      if (filterPayStatus !== "All"  && s.worstPayStatus !== filterPayStatus) return false;
      if (filterActive !== "All"     && String(s.isActive) !== (filterActive === "Active" ? "true" : "false")) return false;
      if (filterCurricYear !== "All" && s.curriculumYear !== filterCurricYear) return false;
      if (q && !(
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.motherName.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.motherPhone.includes(q) ||
        s.fatherPhone.includes(q) ||
        s.grade.toLowerCase().includes(q)
      )) return false;
      return true;
    });
    data = [...data].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av === bv) return 0;
      if (av < bv) return sortAsc ? -1 : 1;
      return sortAsc ? 1 : -1;
    });
    return data;
  }, [rawStudents, search, filterCourse, filterLevel, filterSection, filterPayStatus, filterActive, filterCurricYear, sortKey, sortAsc]);

  // reset page when filters change
  useEffect(() => { setPage(1); setPageInput("1"); }, [search, filterCourse, filterLevel, filterSection, filterPayStatus, filterActive, filterCurricYear]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageIds     = new Set(paginated.map(s => s.id));
  const allPageSelected = paginated.length > 0 && paginated.every(s => selected.has(s.id));
  const somePageSelected = paginated.some(s => selected.has(s.id));
  const selectedArray = Array.from(selected);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="opacity-0 ml-1">↑</span>;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-1 text-primary" />
      : <ChevronDown className="w-3 h-3 inline ml-1 text-primary" />;
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected(prev => { const n = new Set(prev); pageIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); paginated.forEach(s => n.add(s.id)); return n; });
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function goToPage(p: number) {
    const clamped = Math.max(1, Math.min(totalPages, p));
    setPage(clamped);
    setPageInput(String(clamped));
    tableRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Bulk operations
  async function doBulkSetStatus(isActive: boolean) {
    setActionLoading(true);
    try {
      await adminApi.students.bulkSetStatus(selectedArray, isActive);
      toast.success(`${selectedArray.length} student(s) marked ${isActive ? "active" : "inactive"}`);
      setSelected(new Set());
      loadStudents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setActionLoading(false);
      setConfirmInactive(false);
      setConfirmActive(false);
    }
  }

  async function doBulkDelete() {
    setActionLoading(true);
    try {
      await adminApi.students.bulkDelete(selectedArray);
      toast.success(`${selectedArray.length} student(s) deleted`);
      setSelected(new Set());
      loadStudents();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionLoading(false);
      setConfirmDelete(false);
    }
  }

  function exportCSV() {
    const headers = ["Student ID","Name","Grade","Curriculum Year","Status","Course(s)","Parent Phone","Payment Status","Total Paid","Mother Name","Mother Email","Father Name","Father Email","Address"];
    const rows = filtered.map(s => [
      s.id, s.name, s.grade, s.curriculumYear, s.isActive ? "Active" : "Inactive",
      s.courses.join("; "),
      s.parentPhone,
      s.worstPayStatus,
      s.totalPaid.toFixed(2),
      s.motherName, s.motherEmail, s.fatherName, s.fatherEmail, s.address,
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "gurukul-students.csv"; a.click();
  }

  const statusBadge = { Paid: "bg-green-100 text-green-700", Pending: "bg-orange-100 text-orange-700", Overdue: "bg-red-100 text-red-700" };

  const activeFilterCount = [
    filterCourse !== "All", filterLevel !== "All", filterSection !== "All",
    filterPayStatus !== "All", filterActive !== "All",
    filterCurricYear !== "All" && filterCurricYear !== activeCurriculumYearLong,
  ].filter(Boolean).length;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full space-y-3">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-secondary">Student Management</h2>
          <p className="text-xs text-muted-foreground">
            {filtered.length} student{filtered.length !== 1 ? "s" : ""} found
            {filtered.length !== rawStudents.length && ` · ${rawStudents.length} total`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Button onClick={() => setShowRegister(true)} size="sm" className="gap-1.5 rounded-xl text-xs h-9">
              <UserPlus className="w-3.5 h-3.5" /> Register
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 rounded-xl text-xs h-9">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* ── Unlinked Members Banner ── */}
      {isAdmin && unlinkedCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800">
              <strong>{unlinkedCount} student{unlinkedCount !== 1 ? "s" : ""}</strong> {unlinkedCount !== 1 ? "are" : "is"} not linked to a temple member record.
            </span>
          </div>
          <button
            onClick={runBackfill}
            disabled={backfilling}
            className="shrink-0 text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 flex items-center gap-1 font-medium"
          >
            {backfilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {backfilling ? "Linking…" : "Auto-Link All"}
          </button>
        </div>
      )}

      {/* ── Summary (2 cards only) ── */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="bg-white p-3 rounded-xl border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-xl font-bold text-secondary leading-none">{filtered.length}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Students (filtered)</div>
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <span className="text-green-700 text-sm font-bold">$</span>
          </div>
          <div>
            <div className="text-xl font-bold text-green-700 leading-none">
              ${filtered.reduce((a, s) => a + s.totalPaid, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Collected</div>
          </div>
        </div>
      </div>

      {/* ── Search + Filters toggle ── */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, ID, parent name or phone…"
            className="pl-9 rounded-xl h-9 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
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
          onClick={() => setShowFilters(f => !f)}
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
            {/* Curriculum Year */}
            <div className="space-y-1.5 shrink-0">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Year</label>
              <select
                value={filterCurricYear}
                onChange={e => setFilterCurricYear(e.target.value)}
                className="text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary bg-white min-w-32"
              >
                <option value="All">All Years</option>
                {curriculumYearsLong.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Status</label>
              <div className="flex gap-1">
                {["All","Active","Inactive"].map(s => (
                  <button key={s} onClick={() => setFilterActive(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterActive === s ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Course */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Course</label>
              <div className="flex flex-wrap gap-1">
                {allCourses.map(c => (
                  <button key={c} onClick={() => setFilterCourse(c)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterCourse === c ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Level</label>
              <div className="flex flex-wrap gap-1">
                {allLevels.map(l => (
                  <button key={l} onClick={() => setFilterLevel(l)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterLevel === l ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>
                    {l === "All" ? "All" : l.replace("Level ", "L")}
                  </button>
                ))}
              </div>
            </div>

            {/* Section */}
            {allSections.length > 1 && (
              <div className="space-y-1.5 shrink-0">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Section</label>
                <select
                  value={filterSection}
                  onChange={e => setFilterSection(e.target.value)}
                  className="text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary bg-white min-w-32"
                >
                  {allSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* Payment Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Payment</label>
              <div className="flex flex-wrap gap-1">
                {["All","Paid","Pending","Overdue"].map(p => (
                  <button key={p} onClick={() => setFilterPayStatus(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterPayStatus === p ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="pt-1 border-t border-border">
              <button
                onClick={() => { setFilterCourse("All"); setFilterLevel("All"); setFilterSection("All"); setFilterPayStatus("All"); setFilterActive("All"); setFilterCurricYear(activeCurriculumYearLong || "All"); }}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Bulk Actions Bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-xl shrink-0 flex-wrap">
          <span className="text-sm font-semibold text-primary mr-2">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg text-green-700 border-green-300 hover:bg-green-50"
            onClick={() => setConfirmActive(true)}>
            <UserCheck className="w-3.5 h-3.5" /> Mark Active
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg text-amber-700 border-amber-300 hover:bg-amber-50"
            onClick={() => setConfirmInactive(true)}>
            <UserX className="w-3.5 h-3.5" /> Mark Inactive
          </Button>
          {isAdmin && (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs rounded-lg text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </Button>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col flex-1 min-h-0">
        <div ref={tableRef} className="overflow-auto" style={{ maxHeight: "calc(100vh - 340px)", minHeight: 320 }}>
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-border shadow-sm">
              <tr>
                {/* Checkbox */}
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                {[
                  { label: "ID",      key: "id"           as SortKey, w: "w-16"  },
                  { label: "Name",    key: "name"         as SortKey, w: "w-36"  },
                  { label: "Grade",   key: "grade"        as SortKey, w: "w-16"  },
                  { label: "Course",  key: "primaryCourse"as SortKey, w: "w-40"  },
                  { label: "Level",   key: "primaryLevel" as SortKey, w: "w-16"  },
                  { label: "Section",                                  w: "w-24", noSort: true },
                  { label: "Parent Contact",                           w: "w-52", noSort: true },
                  { label: "Payment", key: "worstPayStatus"as SortKey,w: "w-28"  },
                  { label: "Status",  key: "isActive"     as SortKey, w: "w-20"  },
                  { label: "",                                         w: "w-16", noSort: true },
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
                  <td colSpan={10} className="text-center py-16 text-muted-foreground text-sm">
                    No students found.
                    {isAdmin && <> <button onClick={() => setShowRegister(true)} className="text-primary hover:underline ml-1">Register one?</button></>}
                  </td>
                </tr>
              )}
              {paginated.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-border/50 transition-colors ${selected.has(s.id) ? "bg-primary/5" : "hover:bg-gray-50"} ${!s.isActive ? "opacity-60" : ""}`}
                >
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} className="rounded" />
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{s.id}</td>
                  <td className="px-3 py-2 font-medium text-secondary whitespace-nowrap max-w-[140px] truncate" title={s.name}>{s.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{s.grade || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {s.courses.length === 0 ? <span className="text-muted-foreground">—</span> : s.courses.map(c => (
                        <span key={c} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[11px] font-medium whitespace-nowrap">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {s.enrollments.length === 0 ? "—" : s.enrollments.length === 1
                      ? s.primaryLevel
                      : <span title={s.enrollments.map(e=>e.level).join(", ")}>{s.primaryLevel}{s.enrollments.length > 1 ? <span className="ml-1 text-[10px] text-muted-foreground">+{s.enrollments.length-1}</span> : null}</span>
                    }
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {s.primarySection
                      ? <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-medium border border-blue-100">{s.primarySection}</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-0.5">
                      {(s.motherName || s.motherPhone || s.motherEmail) && (
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                          <span className="font-semibold text-pink-500 shrink-0">M</span>
                          {s.motherPhone && <span className="flex items-center gap-0.5 text-muted-foreground whitespace-nowrap"><Phone className="w-2.5 h-2.5" />{s.motherPhone}</span>}
                          {s.motherEmail && <span className="flex items-center gap-0.5 text-muted-foreground truncate max-w-[160px]"><Mail className="w-2.5 h-2.5 shrink-0" />{s.motherEmail}</span>}
                        </div>
                      )}
                      {(s.fatherName || s.fatherPhone || s.fatherEmail) && (
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
                          <span className="font-semibold text-blue-500 shrink-0">F</span>
                          {s.fatherPhone && <span className="flex items-center gap-0.5 text-muted-foreground whitespace-nowrap"><Phone className="w-2.5 h-2.5" />{s.fatherPhone}</span>}
                          {s.fatherEmail && <span className="flex items-center gap-0.5 text-muted-foreground truncate max-w-[160px]"><Mail className="w-2.5 h-2.5 shrink-0" />{s.fatherEmail}</span>}
                        </div>
                      )}
                      {!s.motherPhone && !s.motherEmail && !s.fatherPhone && !s.fatherEmail && (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-3 py-2 cursor-pointer group"
                    title="Click to view payment details"
                    onClick={() => setPaymentDrawer(s)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${statusBadge[s.worstPayStatus]}`}>
                        {s.worstPayStatus}
                      </span>
                      <span className="text-xs font-medium text-green-700 whitespace-nowrap">${s.totalPaid.toFixed(0)}</span>
                      <CreditCard className="w-3 h-3 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        title="Edit student"
                        onClick={() => setEditStudent(s)}
                        className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-secondary transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title={s.isActive ? "Mark inactive" : "Mark active"}
                        onClick={async () => {
                          try {
                            await adminApi.students.setStatus(s.id, !s.isActive);
                            toast.success(`${s.name} marked ${!s.isActive ? "active" : "inactive"}`);
                            loadStudents();
                          } catch { toast.error("Failed to update status"); }
                        }}
                        className="p-1 rounded hover:bg-gray-100 text-muted-foreground hover:text-secondary transition-colors"
                      >
                        {s.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                      {isAdmin && (
                        <button
                          title="Delete student"
                          onClick={() => { setSelected(new Set([s.id])); setConfirmDelete(true); }}
                          className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            {selected.size > 0 && <span className="ml-2 text-primary font-medium">· {selected.size} selected</span>}
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
                onChange={e => setPageInput(e.target.value)}
                onBlur={() => goToPage(parseInt(pageInput) || 1)}
                onKeyDown={e => e.key === "Enter" && goToPage(parseInt(pageInput) || 1)}
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
      {showRegister && (
        <RegisterStudentPanel onClose={() => setShowRegister(false)} onRegistered={() => { setShowRegister(false); loadStudents(); }} />
      )}

      {editStudent && (
        <EditStudentPanel
          student={editStudent}
          curriculumYears={curriculumYearsLong}
          onClose={() => setEditStudent(null)}
          onSaved={() => { setEditStudent(null); loadStudents(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          danger
          title={`Delete ${selected.size} Student${selected.size !== 1 ? "s" : ""}?`}
          message={`This will permanently remove ${selected.size} student record${selected.size !== 1 ? "s" : ""} including all enrollments, attendance, and payment data. This cannot be undone.`}
          confirmLabel={`Delete ${selected.size} Student${selected.size !== 1 ? "s" : ""}`}
          loading={actionLoading}
          onConfirm={doBulkDelete}
          onCancel={() => { setConfirmDelete(false); if (selected.size === 1) setSelected(new Set()); }}
        />
      )}

      {confirmInactive && (
        <ConfirmDialog
          title={`Mark ${selected.size} Student${selected.size !== 1 ? "s" : ""} Inactive?`}
          message={`These students will be marked inactive. They will remain in the system but appear dimmed in the list. You can reactivate them at any time.`}
          confirmLabel="Mark Inactive"
          loading={actionLoading}
          onConfirm={() => doBulkSetStatus(false)}
          onCancel={() => setConfirmInactive(false)}
        />
      )}

      {confirmActive && (
        <ConfirmDialog
          title={`Mark ${selected.size} Student${selected.size !== 1 ? "s" : ""} Active?`}
          message={`These students will be marked active and will appear normally in all views.`}
          confirmLabel="Mark Active"
          loading={actionLoading}
          onConfirm={() => doBulkSetStatus(true)}
          onCancel={() => setConfirmActive(false)}
        />
      )}

      {paymentDrawer && (
        <PaymentDrawer student={paymentDrawer} onClose={() => setPaymentDrawer(null)} />
      )}
    </div>
  );
}
