import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/adminApi";
import {
  Loader2, Plus, Trash2, BookOpen, GraduationCap, Users,
  Search, UserCheck, UserPlus, ChevronRight, ShieldCheck,
  AlertCircle, BadgeDollarSign, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = new Date().getFullYear();

const GRADES = [
  "Kindergarten","1st","2nd","3rd","4th","5th","6th",
  "7th","8th","9th","10th","11th","12th",
];

const EMPLOYERS_LIST = [
  "Abercrombie & Fitch Co.",
  "Accenture",
  "Amazon",
  "American Electric Power (AEP)",
  "Bath & Body Works",
  "Battelle Memorial Institute",
  "Big Lots",
  "Bob Evans Restaurants",
  "Bread Financial",
  "Cardinal Health",
  "Chipotle Mexican Grill",
  "Columbus City Schools",
  "CoverMyMeds",
  "Designer Brands (DSW)",
  "Diebold Nixdorf",
  "Encova Insurance",
  "Express",
  "Fifth Third Bank",
  "Grange Insurance",
  "Honda of America Manufacturing",
  "Huntington National Bank",
  "IBM",
  "JPMorgan Chase",
  "KeyBank",
  "Kroger",
  "Microsoft",
  "Mount Carmel Health System",
  "Nationwide Children's Hospital",
  "Nationwide Insurance",
  "NetJets",
  "OhioHealth",
  "Ohio State University",
  "Optum",
  "Oracle",
  "Pfizer",
  "PricewaterhouseCoopers (PwC)",
  "Root Insurance",
  "Safelite AutoGlass",
  "State of Ohio",
  "Tata Consultancy Services",
  "Tech Mahindra",
  "Vertiv",
  "Victoria's Secret & Co.",
  "Walmart",
  "Wendy's",
  "White Castle",
  "Wipro",
  "Worthington Industries",
  "Prefer Not to Disclose",
  "Other (please specify)",
];

// ─── Validation helpers ───────────────────────────────────────────────────────

function validatePhone(v: string): string {
  if (!v.trim()) return "Phone number is required.";
  const digits = v.replace(/\D/g, "");
  if (digits.length < 10) return "Please enter a valid 10-digit US phone number, e.g. (614) 555-0100.";
  if (digits.length > 11) return "Phone number is too long. Please enter a 10-digit US number.";
  return "";
}

function validateEmail(v: string): string {
  if (!v.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
    return "Please enter a valid email address, e.g. name@example.com.";
  return "";
}

function validatePersonName(v: string, label: string): string {
  if (!v.trim()) return `${label} is required.`;
  if (v.trim().length < 2) return `${label} must be at least 2 characters.`;
  if (/\d/.test(v)) return `${label} should not contain numbers.`;
  return "";
}

function validateDob(v: string): string {
  if (!v) return "Date of birth is required.";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "Please enter a valid date.";
  const now = new Date();
  if (d >= now) return "Date of birth must be in the past.";
  const ageYears = (now.getTime() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (ageYears < 3)  return "Student must be at least 3 years old to register.";
  if (ageYears > 22) return "Please check the date of birth — the student appears to be over 22 years old.";
  return "";
}

function validateAddress(v: string): string {
  if (!v.trim()) return "Home address is required.";
  if (v.trim().length < 8) return "Please enter your full street address including city and state.";
  return "";
}

function validateLookupInput(v: string): string {
  if (!v.trim()) return "Please enter your email address or phone number.";
  const digits = v.replace(/\D/g, "");
  const looksLikePhone = digits.length >= 10 && !/[@]/.test(v);
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  if (!looksLikePhone && !looksLikeEmail)
    return "Please enter a valid email address (e.g. name@email.com) or 10-digit phone number.";
  return "";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type MetaSection  = { id: number; sectionName: string; schedule: string };
type MetaLevel    = { id: number; levelNumber: number; className: string; sections: MetaSection[] };
export type MetaCourse = { id: number; name: string; icon: string; levels: MetaLevel[] };
type Meta         = { nextCode: string; courses: MetaCourse[] };

type FoundMember  = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  membershipYear: number | null;
};

type EnrollmentDraft = {
  key:       number;
  courseId:  number | "";
  levelId:   number | "";
  sectionId: number | "";
  amountDue: string;
};

type Errors = Record<string, string>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" /> {msg}
    </p>
  );
}

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-secondary mb-1 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      <FieldError msg={error} />
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

function EmployerSelect({
  value, otherValue, onChange, onOtherChange, onBlur, error, cls,
}: {
  value: string; otherValue: string;
  onChange: (v: string) => void; onOtherChange: (v: string) => void;
  onBlur?: () => void; error?: string; cls: string;
}) {
  return (
    <div className="space-y-2">
      <select
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className={cls}
      >
        <option value="">— Select employer —</option>
        {EMPLOYERS_LIST.map(emp => <option key={emp} value={emp}>{emp}</option>)}
      </select>
      {value === "Other (please specify)" && (
        <input
          required
          value={otherValue}
          onChange={e => onOtherChange(e.target.value)}
          placeholder="Please type your employer's name"
          className={cls}
        />
      )}
      <FieldError msg={error} />
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

  // ── Phase control: "member-check" → "form" ──
  const [phase, setPhase] = useState<"member-check" | "form">("member-check");

  // ── Phase 1: Member check ──
  const [isExistingMember, setIsExistingMember] = useState<boolean | null>(null);
  const [lookupValue,      setLookupValue]      = useState("");
  const [lookupLoading,    setLookupLoading]    = useState(false);
  const [foundMember,      setFoundMember]      = useState<FoundMember | null>(null);
  const [lookupError,      setLookupError]      = useState("");

  // New member fields (if not existing)
  const [memberName,  setMemberName]  = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [p1Errors,    setP1Errors]    = useState<Errors>({});

  // Membership renewal acknowledgment
  const [membershipConfirmed, setMembershipConfirmed] = useState(false);
  const [membershipError,     setMembershipError]     = useState("");

  // Resolved member id (set after lookup or creation)
  const [resolvedMemberId, setResolvedMemberId] = useState<number | null>(null);

  // ── Phase 2: Student fields ──
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState<Errors>({});

  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [dob,       setDob]       = useState("");
  const [grade,     setGrade]     = useState("");
  const [isNew,     setIsNew]     = useState(true);

  const [motherName,          setMotherName]          = useState("");
  const [motherPhone,         setMotherPhone]         = useState("");
  const [motherEmail,         setMotherEmail]         = useState("");
  const [motherEmployer,      setMotherEmployer]      = useState("");
  const [motherEmployerOther, setMotherEmployerOther] = useState("");

  const [fatherName,          setFatherName]          = useState("");
  const [fatherPhone,         setFatherPhone]         = useState("");
  const [fatherEmail,         setFatherEmail]         = useState("");
  const [fatherEmployer,      setFatherEmployer]      = useState("");
  const [fatherEmployerOther, setFatherEmployerOther] = useState("");

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

  // ── Computed employer values (resolve "Other" to custom text) ──
  const effectiveMotherEmployer = motherEmployer === "Other (please specify)"
    ? motherEmployerOther.trim() : motherEmployer;
  const effectiveFatherEmployer = fatherEmployer === "Other (please specify)"
    ? fatherEmployerOther.trim() : fatherEmployer;

  // ── Enrollment helpers ──
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

  // ── Blur handlers (Phase 2) ──
  const blurField = useCallback((field: string, value: string) => {
    let msg = "";
    switch (field) {
      case "firstName":         msg = validatePersonName(value, "First name"); break;
      case "lastName":          msg = validatePersonName(value, "Last name"); break;
      case "dob":               msg = validateDob(value); break;
      case "grade":             msg = value ? "" : "Please select a grade."; break;
      case "motherName":        msg = validatePersonName(value, "Mother's name"); break;
      case "motherPhone":       msg = validatePhone(value); break;
      case "motherEmail":       msg = validateEmail(value); break;
      case "motherEmployer":    msg = value ? "" : "Please select an employer."; break;
      case "motherEmployerOther": msg = value.trim() ? "" : "Please specify your employer."; break;
      case "fatherName":        msg = validatePersonName(value, "Father's name"); break;
      case "fatherPhone":       msg = validatePhone(value); break;
      case "fatherEmail":       msg = validateEmail(value); break;
      case "fatherEmployer":    msg = value ? "" : "Please select an employer."; break;
      case "fatherEmployerOther": msg = value.trim() ? "" : "Please specify your employer."; break;
      case "address":           msg = validateAddress(value); break;
      case "volunteerArea":     msg = value.trim() ? "" : "Please describe the volunteer area."; break;
    }
    setErrors(prev => ({ ...prev, [field]: msg }));
  }, []);

  // ── Phase 2: Validate all fields ──
  function validateAll(): boolean {
    const e: Errors = {
      firstName:         validatePersonName(firstName, "First name"),
      lastName:          validatePersonName(lastName, "Last name"),
      dob:               validateDob(dob),
      grade:             grade ? "" : "Please select a grade.",
      motherName:        validatePersonName(motherName, "Mother's name"),
      motherPhone:       validatePhone(motherPhone),
      motherEmail:       validateEmail(motherEmail),
      motherEmployer:    motherEmployer ? "" : "Please select an employer.",
      motherEmployerOther: motherEmployer === "Other (please specify)" && !motherEmployerOther.trim()
        ? "Please specify your employer." : "",
      fatherName:        validatePersonName(fatherName, "Father's name"),
      fatherPhone:       validatePhone(fatherPhone),
      fatherEmail:       validateEmail(fatherEmail),
      fatherEmployer:    fatherEmployer ? "" : "Please select an employer.",
      fatherEmployerOther: fatherEmployer === "Other (please specify)" && !fatherEmployerOther.trim()
        ? "Please specify your employer." : "",
      address:           validateAddress(address),
      volunteerArea:     volunteerParent && !volunteerArea.trim()
        ? "Please describe the volunteer area." : "",
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  // ── Phase 1: Lookup ──
  async function handleLookup() {
    const val = lookupValue.trim();
    const err = validateLookupInput(val);
    if (err) { setLookupError(err); return; }
    setLookupError("");
    setLookupLoading(true);
    try {
      const m = await adminApi.members.lookup(val);
      setFoundMember(m);
    } catch {
      setFoundMember(null);
      setLookupError('No member found with that email or phone. Please check and try again, or select \u201cNo, I am new\u201d below.');
    } finally {
      setLookupLoading(false);
    }
  }

  // ── Phase 1 → Phase 2 ──
  function handleAdvanceToForm() {
    if (isExistingMember === null) {
      toast.error("Please indicate whether you are an existing temple member.");
      return;
    }
    if (!membershipConfirmed) {
      setMembershipError("You must confirm your temple membership renewal to continue.");
      return;
    }
    setMembershipError("");
    if (isExistingMember) {
      if (!foundMember) {
        toast.error("Please look up your member record before continuing.");
        return;
      }
      setResolvedMemberId(foundMember.id);
    } else {
      const emailErr = memberEmail.trim() ? validateEmail(memberEmail) : "";
      const phoneErr = memberPhone.trim() ? validatePhone(memberPhone) : "";
      const newErrors: Errors = { memberEmail: emailErr, memberPhone: phoneErr };
      if (!memberEmail.trim() && !memberPhone.trim()) {
        newErrors.memberEmail = "Please provide at least one: email address or phone number.";
      }
      if (Object.values(newErrors).some(Boolean)) {
        setP1Errors(newErrors);
        return;
      }
      setP1Errors({});
    }
    setPhase("form");
  }

  // ── Phase 2: Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateAll()) {
      toast.error("Please correct the highlighted fields before submitting.");
      const first = document.querySelector("[data-field-error]");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

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

      if (!isExistingMember) {
        const created = await adminApi.members.create({
          name:           memberName.trim() || null,
          email:          memberEmail.trim() || null,
          phone:          memberPhone.trim() || null,
          isExistingMember: false,
          policyAgreed:     true,
          membershipYear:   CURRENT_YEAR,
        });
        memberId = created.id;
      } else if (memberId) {
        await adminApi.members.update(memberId, { policyAgreed: true, membershipYear: CURRENT_YEAR });
      }

      const result = await adminApi.students.register({
        firstName:      firstName.trim(),
        lastName:       lastName.trim(),
        dob,
        grade,
        isNewStudent:   isNew,
        memberId:       memberId ?? undefined,
        motherName:     motherName.trim(),
        motherPhone:    motherPhone.trim(),
        motherEmail:    motherEmail.trim(),
        motherEmployer: effectiveMotherEmployer || undefined,
        fatherName:     fatherName.trim(),
        fatherPhone:    fatherPhone.trim(),
        fatherEmail:    fatherEmail.trim(),
        fatherEmployer: effectiveFatherEmployer || undefined,
        address:        address.trim(),
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

  const inputCls  = "w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white";
  const selectCls = inputCls;

  const inputErr = (field: string) =>
    errors[field]
      ? "border-red-400 focus:border-red-500"
      : "";

  const inputClsFor = (field: string) =>
    `${inputCls} ${inputErr(field)}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: Temple Member Check
  // ─────────────────────────────────────────────────────────────────────────────
  if (phase === "member-check") {
    const membershipIsCurrentYear = foundMember?.membershipYear === CURRENT_YEAR;

    return (
      <div className="space-y-6">
        <SectionLabel icon={<Users className="w-4 h-4" />} title="Temple Membership" />

        {/* Q1: Existing member? */}
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
                  setLookupError("");
                  setMembershipConfirmed(false);
                  setMembershipError("");
                }}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                  isExistingMember === v
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 bg-white"
                }`}
              >
                {v
                  ? <><UserCheck className="w-4 h-4" /> Yes, I am a member</>
                  : <><UserPlus className="w-4 h-4" /> No, I am new</>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Existing member: lookup */}
        {isExistingMember === true && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 space-y-3">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Member Lookup</p>
            <p className="text-sm text-green-700">
              Enter your registered email address or phone number to locate your member record.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <input
                  value={lookupValue}
                  onChange={e => { setLookupValue(e.target.value); setLookupError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleLookup()}
                  placeholder="Email address or 10-digit phone number"
                  className={`${inputCls} ${lookupError ? "border-red-400" : ""}`}
                />
                <FieldError msg={lookupError} />
              </div>
              <Button
                type="button"
                onClick={handleLookup}
                disabled={lookupLoading}
                className="gap-1.5 shrink-0 self-start"
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
                  Found ✓
                </span>
              </div>
            )}
          </div>
        )}

        {/* New member: collect contact info */}
        {isExistingMember === false && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-3">
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wide">New Member Registration</p>
            <p className="text-sm text-orange-700">
              We will create a temple member account for you. Please provide at least one contact method below.
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
              <Field label="Email Address" required error={p1Errors.memberEmail}>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={e => { setMemberEmail(e.target.value); setP1Errors(prev => ({ ...prev, memberEmail: "" })); }}
                  onBlur={() => memberEmail && setP1Errors(prev => ({ ...prev, memberEmail: validateEmail(memberEmail) }))}
                  placeholder="your@email.com"
                  className={`${inputCls} ${p1Errors.memberEmail ? "border-red-400" : ""}`}
                />
              </Field>
              <Field label="Phone Number" required error={p1Errors.memberPhone}>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={e => { setMemberPhone(e.target.value); setP1Errors(prev => ({ ...prev, memberPhone: "" })); }}
                  onBlur={() => memberPhone && setP1Errors(prev => ({ ...prev, memberPhone: validatePhone(memberPhone) }))}
                  placeholder="(614) 555-0100"
                  className={`${inputCls} ${p1Errors.memberPhone ? "border-red-400" : ""}`}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Temple Membership Renewal ── */}
        {isExistingMember !== null && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4 text-amber-700 shrink-0" />
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Annual Temple Membership — ${CURRENT_YEAR}
              </p>
            </div>

            {/* For existing members: show membership status */}
            {isExistingMember && foundMember && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                membershipIsCurrentYear
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {membershipIsCurrentYear
                  ? <><RefreshCw className="w-3.5 h-3.5 shrink-0" /> Membership is active for {CURRENT_YEAR}.</>
                  : <><AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Membership was last renewed in{" "}
                      {foundMember.membershipYear ?? "an unknown year"}.{" "}
                      Renewal is required for {CURRENT_YEAR}.
                    </>
                }
              </div>
            )}

            <p className="text-sm text-amber-800">
              Temple annual membership is <strong>$150 per year</strong> and must be active to register
              students in Gurukul. Membership fees help support temple operations, events, and programs.
            </p>

            <label className={`flex items-start gap-3 cursor-pointer rounded-lg p-2 transition-colors ${membershipError ? "bg-red-50" : ""}`}>
              <input
                type="checkbox"
                checked={membershipConfirmed}
                onChange={e => { setMembershipConfirmed(e.target.checked); setMembershipError(""); }}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-sm text-secondary leading-relaxed">
                I have reviewed my temple membership and confirm I will{" "}
                {isExistingMember && !membershipIsCurrentYear ? "renew" : "pay/maintain"}{" "}
                the <strong>$150 annual membership fee for {CURRENT_YEAR}</strong> as part of this
                student registration.
                <span className="text-red-500 ml-0.5">*</span>
              </span>
            </label>
            {membershipError && <FieldError msg={membershipError} />}
          </div>
        )}

        {/* Continue */}
        <div className="flex gap-3 justify-end pt-2">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>Back</Button>
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
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>

      {/* ── Section 1: Student Info ── */}
      <div>
        <SectionLabel icon={<GraduationCap className="w-4 h-4" />} title="Student Information" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required error={errors.firstName}>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              onBlur={() => blurField("firstName", firstName)}
              placeholder="e.g. Arjun"
              className={inputClsFor("firstName")}
              data-field-error={errors.firstName ? "true" : undefined}
            />
          </Field>
          <Field label="Last Name" required error={errors.lastName}>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              onBlur={() => blurField("lastName", lastName)}
              placeholder="e.g. Sharma"
              className={inputClsFor("lastName")}
              data-field-error={errors.lastName ? "true" : undefined}
            />
          </Field>
          <Field label="Date of Birth" required error={errors.dob}>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              onBlur={() => blurField("dob", dob)}
              className={inputClsFor("dob")}
              data-field-error={errors.dob ? "true" : undefined}
            />
          </Field>
          <Field label="School Grade (2026–27)" required error={errors.grade}>
            <select
              value={grade}
              onChange={e => setGrade(e.target.value)}
              onBlur={() => blurField("grade", grade)}
              className={`${selectCls} ${inputErr("grade")}`}
              data-field-error={errors.grade ? "true" : undefined}
            >
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
            <Field label="Full Name" required error={errors.motherName}>
              <input
                value={motherName}
                onChange={e => setMotherName(e.target.value)}
                onBlur={() => blurField("motherName", motherName)}
                placeholder="Mother's full name"
                className={inputClsFor("motherName")}
                data-field-error={errors.motherName ? "true" : undefined}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone" required error={errors.motherPhone}>
                <input
                  type="tel"
                  value={motherPhone}
                  onChange={e => setMotherPhone(e.target.value)}
                  onBlur={() => blurField("motherPhone", motherPhone)}
                  placeholder="(614) 555-0100"
                  className={inputClsFor("motherPhone")}
                  data-field-error={errors.motherPhone ? "true" : undefined}
                />
              </Field>
              <Field label="Email" required error={errors.motherEmail}>
                <input
                  type="email"
                  value={motherEmail}
                  onChange={e => setMotherEmail(e.target.value)}
                  onBlur={() => blurField("motherEmail", motherEmail)}
                  placeholder="mom@email.com"
                  className={inputClsFor("motherEmail")}
                  data-field-error={errors.motherEmail ? "true" : undefined}
                />
              </Field>
            </div>
            <Field
              label="Where do you work?"
              required
              error={errors.motherEmployer || errors.motherEmployerOther}
            >
              <EmployerSelect
                value={motherEmployer}
                otherValue={motherEmployerOther}
                onChange={v => { setMotherEmployer(v); setErrors(prev => ({ ...prev, motherEmployer: "" })); }}
                onOtherChange={v => { setMotherEmployerOther(v); setErrors(prev => ({ ...prev, motherEmployerOther: "" })); }}
                onBlur={() => blurField("motherEmployer", motherEmployer)}
                cls={`${selectCls} ${inputErr("motherEmployer")}`}
              />
            </Field>
          </div>

          {/* Father */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 space-y-3">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Father</p>
            <Field label="Full Name" required error={errors.fatherName}>
              <input
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                onBlur={() => blurField("fatherName", fatherName)}
                placeholder="Father's full name"
                className={inputClsFor("fatherName")}
                data-field-error={errors.fatherName ? "true" : undefined}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone" required error={errors.fatherPhone}>
                <input
                  type="tel"
                  value={fatherPhone}
                  onChange={e => setFatherPhone(e.target.value)}
                  onBlur={() => blurField("fatherPhone", fatherPhone)}
                  placeholder="(614) 555-0101"
                  className={inputClsFor("fatherPhone")}
                  data-field-error={errors.fatherPhone ? "true" : undefined}
                />
              </Field>
              <Field label="Email" required error={errors.fatherEmail}>
                <input
                  type="email"
                  value={fatherEmail}
                  onChange={e => setFatherEmail(e.target.value)}
                  onBlur={() => blurField("fatherEmail", fatherEmail)}
                  placeholder="dad@email.com"
                  className={inputClsFor("fatherEmail")}
                  data-field-error={errors.fatherEmail ? "true" : undefined}
                />
              </Field>
            </div>
            <Field
              label="Where do you work?"
              required
              error={errors.fatherEmployer || errors.fatherEmployerOther}
            >
              <EmployerSelect
                value={fatherEmployer}
                otherValue={fatherEmployerOther}
                onChange={v => { setFatherEmployer(v); setErrors(prev => ({ ...prev, fatherEmployer: "" })); }}
                onOtherChange={v => { setFatherEmployerOther(v); setErrors(prev => ({ ...prev, fatherEmployerOther: "" })); }}
                onBlur={() => blurField("fatherEmployer", fatherEmployer)}
                cls={`${selectCls} ${inputErr("fatherEmployer")}`}
              />
            </Field>
          </div>

          {/* Address */}
          <Field label="Home Address" required error={errors.address}>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              onBlur={() => blurField("address", address)}
              placeholder="Street, City, State ZIP (e.g. 123 Maple Dr, Powell, OH 43065)"
              className={inputClsFor("address")}
              data-field-error={errors.address ? "true" : undefined}
            />
          </Field>

          {/* Volunteering */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 space-y-3">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Volunteering</p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={volunteerParent}
                onChange={e => { setVolunteerParent(e.target.checked); if (!e.target.checked) setErrors(prev => ({ ...prev, volunteerArea: "" })); }}
                className="mt-0.5 w-4 h-4 accent-primary"
              />
              <span className="text-sm text-secondary">
                Do either of the parents currently volunteer at the Bharatiya Hindu Temple?
              </span>
            </label>
            {volunteerParent && (
              <Field label="In what area?" required error={errors.volunteerArea}>
                <input
                  value={volunteerArea}
                  onChange={e => setVolunteerArea(e.target.value)}
                  onBlur={() => blurField("volunteerArea", volunteerArea)}
                  placeholder="e.g. Mahaprasadam, Puja, Garland, Parking, etc."
                  className={inputClsFor("volunteerArea")}
                  data-field-error={errors.volunteerArea ? "true" : undefined}
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

      {/* ── Temple Policies ── */}
      <div className="p-4 rounded-xl bg-gray-50 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-secondary uppercase tracking-wide">Temple Policies</span>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
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
