import { useState, useEffect } from "react";
import { adminApi } from "@/lib/adminApi";
import { Loader2, Plus, Trash2, BookOpen, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type MetaSection  = { id: number; sectionName: string; schedule: string };
type MetaLevel    = { id: number; levelNumber: number; className: string; sections: MetaSection[] };
export type MetaCourse   = { id: number; name: string; icon: string; levels: MetaLevel[] };
type Meta         = { nextCode: string; courses: MetaCourse[] };

type EnrollmentDraft = {
  key:       number;
  courseId:  number | "";
  levelId:   number | "";
  sectionId: number | "";
  amountDue: string;
};

const GRADES = [
  "Kindergarten","1st","2nd","3rd","4th","5th","6th",
  "7th","8th","9th","10th","11th","12th",
];

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
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  const [firstName, setFirstName]     = useState("");
  const [lastName,  setLastName]      = useState("");
  const [dob,       setDob]           = useState("");
  const [grade,     setGrade]         = useState("");
  const [isNew,     setIsNew]         = useState(true);

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
    adminApi.students.meta()
      .then((d) => setMeta(d as Meta))
      .catch(() => toast.error("Failed to load course data"))
      .finally(() => setLoading(false));
  }, []);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Student first and last name are required");
      return;
    }

    const validEnrollments = enrollments.filter(e => e.courseId && e.levelId);
    setSaving(true);
    try {
      const result = await adminApi.students.register({
        firstName:   firstName.trim(),
        lastName:    lastName.trim(),
        dob:         dob || undefined,
        grade:       grade || undefined,
        isNewStudent: isNew,
        motherName:  motherName.trim()  || undefined,
        motherPhone: motherPhone.trim() || undefined,
        motherEmail: motherEmail.trim() || undefined,
        fatherName:  fatherName.trim()  || undefined,
        fatherPhone: fatherPhone.trim() || undefined,
        fatherEmail: fatherEmail.trim() || undefined,
        address:     address.trim()     || undefined,
        enrollments: validEnrollments.map(e => ({
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

  const inputCls  = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";
  const selectCls = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

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
          <Field label="Date of Birth">
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="School Grade (2026–27)">
            <select value={grade} onChange={e => setGrade(e.target.value)} className={selectCls}>
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
            <Field label="Full Name">
              <input
                value={motherName}
                onChange={e => setMotherName(e.target.value)}
                placeholder="Mother's full name"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone">
                <input
                  type="tel"
                  value={motherPhone}
                  onChange={e => setMotherPhone(e.target.value)}
                  placeholder="(614) 555-0100"
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={motherEmail}
                  onChange={e => setMotherEmail(e.target.value)}
                  placeholder="mom@email.com"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Father */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Father</p>
            <Field label="Full Name">
              <input
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                placeholder="Father's full name"
                className={inputCls}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone">
                <input
                  type="tel"
                  value={fatherPhone}
                  onChange={e => setFatherPhone(e.target.value)}
                  placeholder="(614) 555-0101"
                  className={inputCls}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={fatherEmail}
                  onChange={e => setFatherEmail(e.target.value)}
                  placeholder="dad@email.com"
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Address */}
          <Field label="Home Address">
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street, City, State ZIP"
              className={inputCls}
            />
          </Field>
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

                <Field label="Course">
                  <select
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

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-2">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
            Back
          </Button>
        )}
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
