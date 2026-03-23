import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  Loader2, Plus, Trash2, BookOpen, GraduationCap, Users,
  Search, UserCheck, UserPlus, ChevronRight, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADES = [
  "Kindergarten","1st","2nd","3rd","4th","5th","6th",
  "7th","8th","9th","10th","11th","12th",
];

const EMPLOYERS = [
  "Accenture",
  "Bank of America",
  "Cardinal Health",
  "Chipotle",
  "IBM",
  "JPMorgan Chase",
  "Nationwide Insurance",
  "Tata Consultancy Services",
  "Tech Mahindra",
  "Wipro",
  "Worthington Industries",
  "Other / Not Listed",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type MetaSection  = { id: number; sectionName: string; schedule: string };
type MetaLevel    = { id: number; levelNumber: number; className: string; sections: MetaSection[] };
export type MetaCourse   = { id: number; name: string; icon: string; levels: MetaLevel[] };
type Meta         = { nextCode: string; courses: MetaCourse[] };

type FoundMember = { id: number; name: string | null; email: string | null; phone: string | null };

type EnrollmentDraft = {
  key:       number;
  courseId:  number | "";
  levelId:   number | "";
  sectionId: number | "";
  amountDue: string;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main Form Component ──────────────────────────────────────────────────────

type Props = {
  onSuccess: (studentCode: string, studentName: string) => void;
  onBack?:   () => void;
  submitLabel?: string;
};

export function StudentRegistrationForm({ onSuccess, onBack, submitLabel = "Register Student" }: Props) {
  // ── Course meta ──
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Phase control ──
  // "member-check" → "form"
  const [phase, setPhase] = useState<"member-check" | "form">("member-check");

  // ── Phase 1: Member check ──
  const [isExistingMember, setIsExistingMember] = useState<boolean | null>(null);
  const [lookupValue,      setLookupValue]      = useState("");
  const [lookupLoading,    setLookupLoading]    = useState(false);
  const [foundMember,      setFoundMember]      = useState<FoundMember | null>(null);

  // New member fields (if not existing)
  const [memberName,  setMemberName]  = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");

  // Resolved member id (set after lookup or creation)
  const [resolvedMemberId, setResolvedMemberId] = useState<number | null>(null);

  // ── Phase 2: Student fields ──
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [dob,       setDob]       = useState("");
  const [grade,     setGrade]     = useState("");
  const [isNew,     setIsNew]     = useState(true);

  const [motherName,     setMotherName]     = useState("");
  const [motherPhone,    setMotherPhone]    = useState("");
  const [motherEmail,    setMotherEmail]    = useState("");
  const [motherEmployer, setMotherEmployer] = useState("");

  const [fatherName,     setFatherName]     = useState("");
  const [fatherPhone,    setFatherPhone]    = useState("");
  const [fatherEmail,    setFatherEmail]    = useState("");
  const [fatherEmployer, setFatherEmployer] = useState("");

  const [address, setAddress] = useState("");

  const [volunteerParent, setVolunteerParent] = useState(false);
  const [volunteerArea,   setVolunteerArea]   = useState("");

  const [policyAgreed, setPolicyAgreed] = useState(false);

  const [enrollments, setEnrollments] = useState<EnrollmentDraft[]>([
    { key: 0, courseId: "", levelId: "", sectionId: "", amountDue: "35.00" },
  ]);
  const [draftKey, setDraftKey] = useState(1);

  useEffect(() => {
    adminApi.students.meta()
      .then((d) => setMeta(d as Meta))
      .catch(() => toast.error("Failed to load course data"))
      .finally(() => setLoading(false));
  }, []);

  // ── Enrollment helpers ──
  function addEnrollment() {
    setEnrollments(prev => [
      ...prev,
      { key: draftKey, courseId: "", levelId: "", sectionId: "", amountDue: "35.00" },
    ]);
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

  // ── Phase 1: Lookup existing member ──
  async function handleLookup() {
    const val = lookupValue.trim();
    if (!val) { toast.error("Please enter your email or phone number"); return; }
    setLookupLoading(true);
    try {
      const m = await adminApi.members.lookup(val);
      setFoundMember(m);
    } catch {
      toast.error("No member found with that email or phone. Please check and try again.");
      setFoundMember(null);
    } finally {
      setLookupLoading(false);
    }
  }

  // ── Phase 1 → Phase 2: Advance ──
  function handleAdvanceToForm() {
    if (isExistingMember === null) {
      toast.error("Please indicate if you are an existing temple member.");
      return;
    }
    if (isExistingMember) {
      if (!foundMember) {
        toast.error("Please look up your member record before continuing.");
        return;
      }
      setResolvedMemberId(foundMember.id);
    } else {
      if (!memberEmail.trim() && !memberPhone.trim()) {
        toast.error("Please provide at least an email or phone number to register.");
        return;
      }
    }
    setPhase("form");
  }

  // ── Phase 2: Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!policyAgreed) {
      toast.error("Please read and agree to the Temple policies before submitting.");
      return;
    }

    const validEnrollments = enrollments.filter(e => e.courseId && e.levelId);
    if (validEnrollments.length === 0) {
      toast.error("Please enroll in at least one course.");
      return;
    }

    setSaving(true);
    try {
      let memberId = resolvedMemberId;

      // If new member, create them now
      if (!isExistingMember) {
        const created = await adminApi.members.create({
          name:             memberName.trim() || null,
          email:            memberEmail.trim() || null,
          phone:            memberPhone.trim() || null,
          isExistingMember: false,
          policyAgreed:     true,
        });
        memberId = created.id;
      } else if (memberId) {
        // Update policyAgreed on the existing member record
        await adminApi.members.update(memberId, { policyAgreed: true });
      }

      const result = await adminApi.students.register({
        firstName:      firstName.trim(),
        lastName:       lastName.trim(),
        dob:            dob || undefined,
        grade:          grade || undefined,
        isNewStudent:   isNew,
        memberId:       memberId ?? undefined,
        motherName:     motherName.trim()     || undefined,
        motherPhone:    motherPhone.trim()    || undefined,
        motherEmail:    motherEmail.trim()    || undefined,
        motherEmployer: motherEmployer.trim() || undefined,
        fatherName:     fatherName.trim()     || undefined,
        fatherPhone:    fatherPhone.trim()    || undefined,
        fatherEmail:    fatherEmail.trim()    || undefined,
        fatherEmployer: fatherEmployer.trim() || undefined,
        address:        address.trim()        || undefined,
        volunteerParent,
        volunteerArea:  volunteerParent ? volunteerArea.trim() : undefined,
        enrollments:    validEnrollments.map(e => ({
          courseLevelId: Number(e.levelId),
          sectionId:     e.sectionId ? Number(e.sectionId) : null,
          amountDue:     e.amountDue || "35.00",
          enrollDate:    new Date().toISOString().slice(0, 10),
        })),
      }) as { studentCode: string };

      onSuccess(result.studentCode, `${firstName.trim()} ${lastName.trim()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Styles ──
  const inputCls  = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";
  const selectCls = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: Member Check
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "member-check") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 py-2 border-b border-border mb-2">
          <span className="text-primary"><Users className="w-4 h-4" /></span>
          <span className="text-sm font-bold text-secondary uppercase tracking-wide">Temple Membership</span>
        </div>

        {/* Question */}
        <div>
          <p className="text-sm font-semibold text-secondary mb-3">
            Are you an existing Bharatiya Hindu Temple member?
            <span className="text-red-500 ml-0.5">*</span>
          </p>
          <div className="flex gap-3">
            {([true, false] as const).map(v => (
              <button
                key={String(v)}
                type="button"
                onClick={() => {
                  setIsExistingMember(v);
                  setFoundMember(null);
                  setLookupValue("");
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                  isExistingMember === v
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 bg-white"
                }`}
              >
                {v ? <><UserCheck className="w-4 h-4" /> Yes, I am a member</> : <><UserPlus className="w-4 h-4" /> No, I am new</>}
              </button>
            ))}
          </div>
        </div>

        {/* Existing member: lookup */}
        {isExistingMember === true && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 space-y-3">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Member Lookup</p>
            <p className="text-sm text-green-700">
              Enter your email address or phone number to locate your member record.
            </p>
            <div className="flex gap-2">
              <input
                value={lookupValue}
                onChange={e => setLookupValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLookup()}
                placeholder="Email or phone number"
                className={`${inputCls} flex-1`}
              />
              <Button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading}
                className="gap-1.5 shrink-0"
              >
                {lookupLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Search className="w-4 h-4" /> Look Up</>
                }
              </Button>
            </div>

            {foundMember && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-300">
                <UserCheck className="w-5 h-5 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary">{foundMember.name ?? "Member"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[foundMember.email, foundMember.phone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full shrink-0">
                  Found
                </span>
              </div>
            )}
          </div>
        )}

        {/* New member: collect info */}
        {isExistingMember === false && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">New Member Registration</p>
            <p className="text-sm text-orange-700">
              We will create a temple member account for you. Please provide your contact details below.
            </p>
            <Field label="Your Name">
              <input
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                placeholder="Full name of primary contact"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email Address" required>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone Number" required>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={e => setMemberPhone(e.target.value)}
                  placeholder="(614) 555-0100"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Continue button */}
        <div className="flex gap-3 justify-end pt-2">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={handleAdvanceToForm}
            disabled={isExistingMember === null}
            className="gap-2 min-w-40"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: Full Registration Form
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Next code badge */}
      {meta?.nextCode && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary/8 rounded-xl border border-primary/20">
          <span className="text-sm text-muted-foreground">Student ID will be assigned:</span>
          <span className="font-mono font-bold text-primary">{meta.nextCode}</span>
        </div>
      )}

      {/* ── Section 1: Student Info ── */}
      <div>
        <SectionLabel icon={<GraduationCap className="w-4 h-4" />} title="Student Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required>
            <input
              required
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="e.g. Arjun"
              className={inputCls}
            />
          </Field>
          <Field label="Last Name" required>
            <input
              required
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="e.g. Sharma"
              className={inputCls}
            />
          </Field>
          <Field label="Date of Birth" required>
            <input
              required
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="School Grade (2026–27)" required>
            <select required value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
              <option value="">— Select grade —</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Enrollment Type">
            <div className="flex gap-3 mt-1">
              {([true, false] as const).map(v => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => setIsNew(v)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                    isNew === v
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/40 bg-white"
                  }`}
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
            <Field label="Full Name" required>
              <input
                required
                value={motherName}
                onChange={e => setMotherName(e.target.value)}
                placeholder="Mother's full name"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone" required>
                <input
                  required
                  type="tel"
                  value={motherPhone}
                  onChange={e => setMotherPhone(e.target.value)}
                  placeholder="(614) 555-0100"
                  className={inputCls}
                />
              </Field>
              <Field label="Email" required>
                <input
                  required
                  type="email"
                  value={motherEmail}
                  onChange={e => setMotherEmail(e.target.value)}
                  placeholder="mom@email.com"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Where do you work?" required>
              <select
                required
                value={motherEmployer}
                onChange={e => setMotherEmployer(e.target.value)}
                className={selectCls}
              >
                <option value="">— Select employer —</option>
                {EMPLOYERS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </Field>
          </div>

          {/* Father */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Father</p>
            <Field label="Full Name" required>
              <input
                required
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                placeholder="Father's full name"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone" required>
                <input
                  required
                  type="tel"
                  value={fatherPhone}
                  onChange={e => setFatherPhone(e.target.value)}
                  placeholder="(614) 555-0101"
                  className={inputCls}
                />
              </Field>
              <Field label="Email" required>
                <input
                  required
                  type="email"
                  value={fatherEmail}
                  onChange={e => setFatherEmail(e.target.value)}
                  placeholder="dad@email.com"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Where do you work?" required>
              <select
                required
                value={fatherEmployer}
                onChange={e => setFatherEmployer(e.target.value)}
                className={selectCls}
              >
                <option value="">— Select employer —</option>
                {EMPLOYERS.map(emp => <option key={emp} value={emp}>{emp}</option>)}
              </select>
            </Field>
          </div>

          {/* Address */}
          <Field label="Home Address" required>
            <input
              required
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street, City, State ZIP"
              className={inputCls}
            />
          </Field>

          {/* Volunteer */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-3">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Volunteering</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={volunteerParent}
                onChange={e => setVolunteerParent(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-sm text-secondary">
                Do either of the parents currently volunteer at the Bharatiya Hindu Temple?
              </span>
            </label>
            {volunteerParent && (
              <Field label="In what area?" required>
                <input
                  required
                  value={volunteerArea}
                  onChange={e => setVolunteerArea(e.target.value)}
                  placeholder="e.g. Mahaprasadam, Puja, Garland, etc."
                  className={inputCls}
                />
              </Field>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: Enrollments ── */}
      <div>
        <SectionLabel icon={<BookOpen className="w-4 h-4" />} title="Course Enrollment" />
        <p className="text-sm text-muted-foreground mb-4">
          Select the course(s) you would like to enroll your child in. Each subject is{" "}
          <strong>$35 per child</strong>. You may add multiple courses below.
        </p>

        <div className="space-y-3">
          {enrollments.map((enr, idx) => {
            const selectedCourse = meta?.courses.find(c => c.id === enr.courseId) ?? null;
            const selectedLevel  = selectedCourse?.levels.find(l => l.id === enr.levelId) ?? null;

            return (
              <div key={enr.key} className="p-4 rounded-xl border border-border bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-secondary uppercase tracking-wide">
                    Course {idx + 1}
                  </span>
                  {enrollments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEnrollment(enr.key)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <Field label="Course" required>
                  <select
                    required
                    value={enr.courseId}
                    onChange={e => updateEnrollment(enr.key, { courseId: e.target.value ? Number(e.target.value) : "" })}
                    className={selectCls}
                  >
                    <option value="">— Select a course —</option>
                    {meta?.courses.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </Field>

                {selectedCourse && (
                  <Field label="Level" required>
                    <select
                      required
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
                  <Field label="Preferred Time Slot">
                    <select
                      value={enr.sectionId}
                      onChange={e => updateEnrollment(enr.key, { sectionId: e.target.value ? Number(e.target.value) : "" })}
                      className={selectCls}
                    >
                      <option value="">— No preference —</option>
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
                    className={`${inputCls} max-w-[120px]`}
                  />
                </Field>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addEnrollment}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary text-sm font-semibold hover:border-primary/60 hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Another Course
          </button>
        </div>
      </div>

      {/* ── Policy Agreement ── */}
      <div className="p-4 rounded-xl bg-gray-50 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-secondary uppercase tracking-wide">Temple Policies</span>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={policyAgreed}
            onChange={e => setPolicyAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary"
          />
          <span className="text-sm text-secondary leading-relaxed">
            I have read and agree to the{" "}
            <span className="font-semibold text-primary">Bharatiya Hindu Temple Gurukul policies</span>,
            including attendance requirements, code of conduct, and fee payment terms.
            <span className="text-red-500 ml-0.5">*</span>
          </span>
        </label>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 justify-end pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setPhase("member-check")}
          disabled={saving}
        >
          Back
        </Button>
        <Button type="submit" disabled={saving} className="min-w-36 gap-2">
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
            : submitLabel
          }
        </Button>
      </div>
    </form>
  );
}
