import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, Lock, Bell, Globe, School, CalendarDays,
  Loader2, Hash, AlertCircle, CreditCard, Eye, EyeOff,
  Home, Info, Phone,
} from "lucide-react";
import { usePortalSettings } from "../contexts/PortalSettingsContext";
import { useAuth } from "../AuthContext";
import { changePin } from "../auth";
import { adminApi } from "@/lib/adminApi";
import { invalidateSiteContentCache } from "@/hooks/useSiteContent";

type AdminTab = "general" | "account" | "payments" | "notifications" | "organization" | "content";

const ADMIN_TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "general",       label: "General",       icon: <CalendarDays className="w-4 h-4" /> },
  { id: "account",       label: "Account",        icon: <Lock className="w-4 h-4" /> },
  { id: "payments",      label: "Payments",       icon: <CreditCard className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications",  icon: <Bell className="w-4 h-4" /> },
  { id: "organization",  label: "Organization",   icon: <School className="w-4 h-4" /> },
  { id: "content",       label: "Site Content",   icon: <Globe className="w-4 h-4" /> },
];

export default function Settings() {
  const [saved, setSaved] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<AdminTab>("general");

  const {
    activeCurriculumYear,
    curriculumYears,
    setActiveCurriculumYear,
    loading: settingsLoading,
  } = usePortalSettings();

  const [pendingYear, setPendingYear] = useState<string | null>(null);
  const [yearSaving, setYearSaving] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);

  const [currentPin, setCurrentPin] = useState("");
  const [newPin,     setNewPin]     = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinSaving,  setPinSaving]  = useState(false);
  const [pinError,   setPinError]   = useState<string | null>(null);
  const [pinSaved,   setPinSaved]   = useState(false);

  // ── Change Password (super admin) ──
  const [newPassword,    setNewPassword]    = useState("");
  const [confirmPassword,setConfirmPassword]= useState("");
  const [overridePin,    setOverridePin]    = useState("");
  const [showNewPw,      setShowNewPw]      = useState(false);
  const [showOverridePw, setShowOverridePw] = useState(false);
  const [pwSaving,       setPwSaving]       = useState(false);
  const [pwSaved,        setPwSaved]        = useState(false);
  const [pwError,        setPwError]        = useState<string | null>(null);

  async function savePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (newPassword.length < 8)             { setPwError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword)    { setPwError("Passwords do not match."); return; }
    if (!overridePin.trim())                { setPwError("Security PIN is required."); return; }
    setPwSaving(true);
    try {
      await adminApi.adminUsers.changeSuperAdminPassword(overridePin.trim(), newPassword);
      setPwSaved(true);
      setNewPassword(""); setConfirmPassword(""); setOverridePin("");
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err: any) {
      setPwError(err?.message ?? "Failed to change password. Check your security PIN.");
    } finally {
      setPwSaving(false);
    }
  }

  const [stripePubKey,    setStripePubKey]    = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeMemberFee, setStripeMemberFee] = useState("150");
  const [stripeCourseFee, setStripeCourseFee] = useState("35");
  const [showSecret,      setShowSecret]      = useState(false);
  const [stripeLoading,   setStripeLoading]   = useState(false);
  const [stripeSaving,    setStripeSaving]    = useState(false);
  const [stripeSaved,     setStripeSaved]     = useState(false);
  const [stripeError,     setStripeError]     = useState<string | null>(null);

  // ── Site Content state ──────────────────────────────────────────────────────
  const [scHomeHeadline,    setScHomeHeadline]    = useState("Rooted in Tradition, Growing in Wisdom.");
  const [scHomeSubtitle,    setScHomeSubtitle]    = useState("Empowering the next generation with cultural knowledge, spiritual values, and a profound understanding of Sanatana Dharma.");
  const [scCtaTitle,        setScCtaTitle]        = useState("Ready to join the Gurukul family?");
  const [scCtaSubtitle,     setScCtaSubtitle]     = useState("Enroll today and give your child the gift of cultural heritage.");
  const [scAboutHeader,     setScAboutHeader]     = useState("Preserving and passing on the rich heritage of Sanatana Dharma to the next generation.");
  const [scAboutMission1,   setScAboutMission1]   = useState("The Bhartiya Hindu Temple Gurukul is dedicated to providing a nurturing environment where children can learn, appreciate, and practice the values, culture, and traditions of Sanatana Dharma.");
  const [scAboutMission2,   setScAboutMission2]   = useState("We believe that early exposure to our spiritual heritage builds character, instills confidence, and creates a strong foundation for a meaningful life.");
  const [scAboutValues,     setScAboutValues]     = useState("Dharma (Righteousness & Duty)\nVidya (True Knowledge)\nSeva (Selfless Service)\nBhakti (Devotion)");
  const [scContactHeader,   setScContactHeader]   = useState("We are here to answer your questions and welcome you to our community.");
  const [scContactAddress,  setScContactAddress]  = useState("3671 Hyatts Rd\nPowell, OH 43065");
  const [scContactPhone,    setScContactPhone]    = useState("(740) 369-0717");
  const [scContactEmail,    setScContactEmail]    = useState("gurukul@bhtohio.org");
  const [scFooterTagline,   setScFooterTagline]   = useState("Nurturing the next generation with the profound wisdom, culture, and values of Sanatana Dharma in a welcoming community environment.");
  const [scFacebook,        setScFacebook]        = useState("");
  const [scInstagram,       setScInstagram]       = useState("");
  const [scLoading,         setScLoading]         = useState(false);
  const [scSaving,          setScSaving]          = useState<string | null>(null);
  const [scSaved,           setScSaved]           = useState<string | null>(null);
  const [scError,           setScError]           = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setScLoading(true);
    adminApi.settings.getAll()
      .then((s: Record<string, string>) => {
        if (s.home_hero_headline)  setScHomeHeadline(s.home_hero_headline);
        if (s.home_hero_subtitle)  setScHomeSubtitle(s.home_hero_subtitle);
        if (s.home_cta_title)      setScCtaTitle(s.home_cta_title);
        if (s.home_cta_subtitle)   setScCtaSubtitle(s.home_cta_subtitle);
        if (s.about_header_desc)   setScAboutHeader(s.about_header_desc);
        if (s.about_mission_p1)    setScAboutMission1(s.about_mission_p1);
        if (s.about_mission_p2)    setScAboutMission2(s.about_mission_p2);
        if (s.about_core_values)   setScAboutValues(s.about_core_values);
        if (s.contact_header_desc) setScContactHeader(s.contact_header_desc);
        if (s.contact_address)     setScContactAddress(s.contact_address);
        if (s.contact_phone)       setScContactPhone(s.contact_phone);
        if (s.contact_email)       setScContactEmail(s.contact_email);
        if (s.footer_tagline)      setScFooterTagline(s.footer_tagline);
        if (s.footer_facebook_url !== undefined) setScFacebook(s.footer_facebook_url);
        if (s.footer_instagram_url !== undefined) setScInstagram(s.footer_instagram_url);
      })
      .catch(() => setScError("Failed to load site content."))
      .finally(() => setScLoading(false));
  }, [isAdmin]);

  async function saveSiteSection(section: string, settings: Record<string, string>) {
    setScSaving(section);
    setScError(null);
    try {
      await adminApi.settings.saveAll(settings);
      invalidateSiteContentCache();
      setScSaved(section);
      setTimeout(() => setScSaved(null), 3000);
    } catch {
      setScError("Failed to save. Please try again.");
    } finally {
      setScSaving(null);
    }
  }

  useEffect(() => {
    if (!isAdmin) return;
    setStripeLoading(true);
    adminApi.settings.getAll()
      .then((s: Record<string, string>) => {
        setStripePubKey(s.stripe_publishable_key ?? "");
        setStripeSecretKey(s.stripe_secret_key ?? "");
        setStripeMemberFee(s.stripe_membership_fee ?? "150");
        setStripeCourseFee(s.stripe_course_fee ?? "35");
      })
      .catch(() => setStripeError("Failed to load payment settings."))
      .finally(() => setStripeLoading(false));
  }, [isAdmin]);

  async function saveStripeSettings() {
    setStripeSaving(true);
    setStripeError(null);
    try {
      await adminApi.settings.saveAll({
        stripe_publishable_key: stripePubKey.trim(),
        stripe_secret_key:      stripeSecretKey.trim(),
        stripe_membership_fee:  stripeMemberFee.trim(),
        stripe_course_fee:      stripeCourseFee.trim(),
      });
      setStripeSaved(true);
      setTimeout(() => setStripeSaved(false), 3000);
    } catch {
      setStripeError("Failed to save payment settings. Please try again.");
    } finally {
      setStripeSaving(false);
    }
  }

  async function savePinChange(e: React.FormEvent) {
    e.preventDefault();
    setPinError(null);
    if (!/^\d{4}$/.test(newPin)) { setPinError("New PIN must be exactly 4 digits."); return; }
    if (newPin !== confirmPin)   { setPinError("New PIN and confirmation do not match."); return; }
    if (!user?.phone)            { setPinError("No phone number found on your account."); return; }
    setPinSaving(true);
    try {
      await changePin(user.phone, currentPin, newPin);
      setPinSaved(true);
      setCurrentPin(""); setNewPin(""); setConfirmPin("");
      setTimeout(() => setPinSaved(false), 3000);
    } catch (err: any) {
      setPinError(err?.message ?? "Failed to change PIN.");
    } finally {
      setPinSaving(false);
    }
  }

  const displayYear = pendingYear ?? activeCurriculumYear;

  async function saveYear() {
    if (!displayYear) return;
    setYearSaving(true);
    setYearError(null);
    try {
      await setActiveCurriculumYear(displayYear);
      setSaved("year");
      setPendingYear(null);
      setTimeout(() => setSaved(null), 3000);
    } catch {
      setYearError("Failed to save. Please try again.");
    } finally {
      setYearSaving(false);
    }
  }

  function save(section: string) {
    setSaved(section);
    setTimeout(() => setSaved(null), 2500);
  }

  const card = "bg-white rounded-2xl border border-border p-6 space-y-5";
  const sectionIcon = (bg: string, color: string, icon: React.ReactNode) => (
    <div className={`w-9 h-9 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>{icon}</div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-secondary">Settings</h2>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? "Manage your admin portal preferences" : "Manage your account settings"}
        </p>
      </div>

      {/* ── Tab bar (admin only; teachers see just their account panel) ── */}
      {isAdmin && (
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 overflow-x-auto">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white text-secondary shadow-sm"
                  : "text-muted-foreground hover:text-secondary"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: GENERAL  (Curriculum Year + Academic)
      ══════════════════════════════════════════════ */}
      {isAdmin && activeTab === "general" && (
        <div className="space-y-5">
          {/* Curriculum Year */}
          <div className={card}>
            <div className="flex items-center gap-3">
              {sectionIcon("bg-amber-100", "text-amber-600", <CalendarDays className="w-4 h-4" />)}
              <div>
                <h3 className="font-bold text-secondary">Curriculum Year</h3>
                <p className="text-xs text-muted-foreground">Active year used globally across courses, enrollment, reports, and all dropdowns.</p>
              </div>
            </div>

            {settingsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Active Year</Label>
                  <select
                    value={displayYear}
                    onChange={e => { setPendingYear(e.target.value); setSaved(null); setYearError(null); }}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
                  >
                    {curriculumYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Currently active: <strong>{activeCurriculumYear}</strong>. Changing this updates all year-related dropdowns and filters portal-wide.
                  </p>
                </div>
                {yearError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{yearError}</p>
                )}
                <div className="flex justify-end">
                  <Button
                    onClick={saveYear}
                    disabled={yearSaving || displayYear === activeCurriculumYear}
                    className="rounded-xl gap-2"
                  >
                    {yearSaving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : saved === "year"
                        ? <><Check className="w-4 h-4" /> Saved!</>
                        : "Apply Year"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Academic Settings */}
          <div className={card}>
            <div className="flex items-center gap-3">
              {sectionIcon("bg-purple-100", "text-purple-600", <Globe className="w-4 h-4" />)}
              <h3 className="font-bold text-secondary">Academic Settings</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class Duration</Label>
                <Input defaultValue="60 minutes" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Session Start Date</Label>
                <Input type="date" defaultValue="2026-06-01" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Session End Date</Label>
                <Input type="date" defaultValue="2026-09-30" className="rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => save("academic")} className="rounded-xl gap-2">
                {saved === "academic" ? <><Check className="w-4 h-4" /> Saved!</> : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: ACCOUNT  (Change Password / Change PIN)
      ══════════════════════════════════════════════ */}
      {(activeTab === "account" || !isAdmin) && (
        <div className="space-y-5">
          {/* Change PIN — teachers / assistants */}
          {user?.phone && (
            <div className={card}>
              <div className="flex items-center gap-3">
                {sectionIcon("bg-blue-100", "text-blue-600", <Hash className="w-4 h-4" />)}
                <div>
                  <h3 className="font-bold text-secondary">Change PIN</h3>
                  <p className="text-xs text-muted-foreground">Update your 4-digit login PIN.</p>
                </div>
              </div>
              <form onSubmit={savePinChange} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Current PIN</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={currentPin}
                    onChange={e => setCurrentPin(e.target.value)}
                    required
                    className="rounded-xl w-40"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>New PIN</Label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New PIN</Label>
                    <Input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="••••"
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>
                {pinError && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {pinError}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={pinSaving} variant="outline" className="rounded-xl gap-2">
                    {pinSaving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : pinSaved
                        ? <><Check className="w-4 h-4" /> PIN Updated!</>
                        : "Update PIN"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password — admin */}
          {isAdmin && !user?.phone && (
            <div className={card}>
              <div className="flex items-center gap-3">
                {sectionIcon("bg-blue-100", "text-blue-600", <Lock className="w-4 h-4" />)}
                <div>
                  <h3 className="font-bold text-secondary">Change Password</h3>
                  <p className="text-xs text-muted-foreground">Requires your system security PIN to confirm.</p>
                </div>
              </div>

              <form onSubmit={savePasswordChange} className="space-y-4">
                {/* New password */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                      >
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Security PIN */}
                <div className="border-t border-border pt-4 space-y-1.5">
                  <Label>
                    Security PIN
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">— required to authorise this change</span>
                  </Label>
                  <div className="relative max-w-xs">
                    <Input
                      type={showOverridePw ? "text" : "password"}
                      inputMode="numeric"
                      placeholder="Enter security PIN"
                      value={overridePin}
                      onChange={e => setOverridePin(e.target.value)}
                      required
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOverridePw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                    >
                      {showOverridePw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {pwError}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" disabled={pwSaving} variant="outline" className="rounded-xl gap-2">
                    {pwSaving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : pwSaved
                        ? <><Check className="w-4 h-4" /> Password Updated!</>
                        : "Update Password"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: PAYMENTS  (Fees + Stripe keys)
      ══════════════════════════════════════════════ */}
      {isAdmin && activeTab === "payments" && (
        <div className={card}>
          <div className="flex items-center gap-3">
            {sectionIcon("bg-violet-100", "text-violet-600", <CreditCard className="w-4 h-4" />)}
            <div>
              <h3 className="font-bold text-secondary">Payment Gateway — Stripe</h3>
              <p className="text-xs text-muted-foreground">
                Fee amounts and Stripe API keys. Get your keys from{" "}
                <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  dashboard.stripe.com/apikeys
                </a>.
              </p>
            </div>
          </div>

          {stripeLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading payment settings…
            </div>
          ) : (
            <div className="space-y-5">
              {/* Fee configuration */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Fee Configuration</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Annual Membership Fee ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={stripeMemberFee}
                      onChange={e => setStripeMemberFee(e.target.value)}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">Charged once per family per year.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Course Enrollment Fee ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={stripeCourseFee}
                      onChange={e => setStripeCourseFee(e.target.value)}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">Charged per course enrolled.</p>
                  </div>
                </div>
              </div>

              {/* Stripe keys */}
              <div className="border-t border-border pt-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stripe API Keys</p>

                {(stripePubKey === "pk_test_placeholder" || !stripePubKey) ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Using placeholder keys — online payments are disabled until real keys are entered.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
                    <Check className="w-4 h-4 shrink-0" />
                    Stripe API keys are configured. Online payments are active.
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Publishable Key <span className="text-xs text-muted-foreground">(starts with pk_)</span></Label>
                  <Input
                    value={stripePubKey}
                    onChange={e => setStripePubKey(e.target.value)}
                    placeholder="pk_live_... or pk_test_..."
                    className="rounded-xl font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Secret Key <span className="text-xs text-muted-foreground">(starts with sk_) — kept private</span></Label>
                  <div className="relative">
                    <Input
                      type={showSecret ? "text" : "password"}
                      value={stripeSecretKey}
                      onChange={e => setStripeSecretKey(e.target.value)}
                      placeholder="sk_live_... or sk_test_..."
                      className="rounded-xl font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {stripeError && (
                <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {stripeError}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={saveStripeSettings} disabled={stripeSaving} className="rounded-xl gap-2">
                  {stripeSaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : stripeSaved
                      ? <><Check className="w-4 h-4" /> Saved!</>
                      : "Save Payment Settings"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: NOTIFICATIONS
      ══════════════════════════════════════════════ */}
      {isAdmin && activeTab === "notifications" && (
        <div className={card}>
          <div className="flex items-center gap-3">
            {sectionIcon("bg-green-100", "text-green-600", <Bell className="w-4 h-4" />)}
            <h3 className="font-bold text-secondary">Notification Preferences</h3>
          </div>
          <div className="space-y-1">
            {[
              { label: "Payment overdue alerts",       defaultChecked: true },
              { label: "Low inventory alerts",         defaultChecked: true },
              { label: "New enrollment notifications", defaultChecked: true },
              { label: "Upcoming event reminders",     defaultChecked: false },
              { label: "Weekly summary report",        defaultChecked: false },
            ].map(pref => (
              <label key={pref.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
                <span className="text-sm font-medium text-secondary">{pref.label}</span>
                <input type="checkbox" defaultChecked={pref.defaultChecked} className="w-4 h-4 accent-primary" />
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save("notifications")} className="rounded-xl gap-2">
              {saved === "notifications" ? <><Check className="w-4 h-4" /> Saved!</> : "Save Preferences"}
            </Button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: ORGANIZATION  (Gurukul Info)
      ══════════════════════════════════════════════ */}
      {isAdmin && activeTab === "organization" && (
        <div className={card}>
          <div className="flex items-center gap-3">
            {sectionIcon("bg-primary/10", "text-primary", <School className="w-4 h-4" />)}
            <div>
              <h3 className="font-bold text-secondary">Gurukul Information</h3>
              <p className="text-xs text-muted-foreground">Organization details displayed across the portal.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Organization Name</Label><Input defaultValue="Bhartiya Hindu Temple Gurukul" className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Address</Label><Input defaultValue="3671 Hyatts Rd, Powell, OH 43065" className="rounded-xl" /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input defaultValue="(740) 369-0717" className="rounded-xl" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Email</Label><Input defaultValue="gurukul@bhtohio.org" className="rounded-xl" /></div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => save("gurukul")} className="rounded-xl gap-2">
              {saved === "gurukul" ? <><Check className="w-4 h-4" /> Saved!</> : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Site Content tab ─────────────────────────────────────────────────── */}
      {isAdmin && activeTab === "content" && (
        <div className="space-y-5">

          {scError && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" /> {scError}
            </div>
          )}

          {scLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading site content…
            </div>
          ) : (
            <>
              {/* ── Home Page ── */}
              <div className={card}>
                <div className="flex items-center gap-3">
                  {sectionIcon("bg-orange-100", "text-orange-600", <Home className="w-4 h-4" />)}
                  <div>
                    <h3 className="font-bold text-secondary">Home Page</h3>
                    <p className="text-xs text-muted-foreground">Hero headline, subtitle, and the bottom call-to-action strip.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Hero Headline</Label>
                    <Input
                      value={scHomeHeadline}
                      onChange={e => setScHomeHeadline(e.target.value)}
                      className="rounded-xl"
                      placeholder="Main headline on the homepage"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hero Subtitle</Label>
                    <Textarea
                      value={scHomeSubtitle}
                      onChange={e => setScHomeSubtitle(e.target.value)}
                      className="rounded-xl resize-none"
                      rows={2}
                      placeholder="Tagline below the headline"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>CTA Banner Title</Label>
                      <Input
                        value={scCtaTitle}
                        onChange={e => setScCtaTitle(e.target.value)}
                        className="rounded-xl"
                        placeholder="e.g. Ready to join the Gurukul family?"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>CTA Banner Subtitle</Label>
                      <Input
                        value={scCtaSubtitle}
                        onChange={e => setScCtaSubtitle(e.target.value)}
                        className="rounded-xl"
                        placeholder="Short supporting line under the CTA title"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    disabled={scSaving === "home"}
                    onClick={() => saveSiteSection("home", {
                      home_hero_headline: scHomeHeadline,
                      home_hero_subtitle: scHomeSubtitle,
                      home_cta_title:     scCtaTitle,
                      home_cta_subtitle:  scCtaSubtitle,
                    })}
                    className="rounded-xl gap-2"
                  >
                    {scSaving === "home" ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : scSaved === "home" ? <><Check className="w-4 h-4" /> Saved!</>
                      : "Save Home Content"}
                  </Button>
                </div>
              </div>

              {/* ── About Page ── */}
              <div className={card}>
                <div className="flex items-center gap-3">
                  {sectionIcon("bg-blue-100", "text-blue-600", <Info className="w-4 h-4" />)}
                  <div>
                    <h3 className="font-bold text-secondary">About Page</h3>
                    <p className="text-xs text-muted-foreground">Page description, mission paragraphs, and core values list.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Page Description <span className="text-xs text-muted-foreground font-normal">(shown below page title)</span></Label>
                    <Input
                      value={scAboutHeader}
                      onChange={e => setScAboutHeader(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mission — First Paragraph</Label>
                    <Textarea
                      value={scAboutMission1}
                      onChange={e => setScAboutMission1(e.target.value)}
                      className="rounded-xl resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mission — Second Paragraph</Label>
                    <Textarea
                      value={scAboutMission2}
                      onChange={e => setScAboutMission2(e.target.value)}
                      className="rounded-xl resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>
                      Core Values
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">— one value per line</span>
                    </Label>
                    <Textarea
                      value={scAboutValues}
                      onChange={e => setScAboutValues(e.target.value)}
                      className="rounded-xl resize-none font-mono text-xs"
                      rows={5}
                      placeholder={"Dharma (Righteousness & Duty)\nVidya (True Knowledge)\nSeva (Selfless Service)\nBhakti (Devotion)"}
                    />
                    <p className="text-xs text-muted-foreground">Each line becomes a bullet point on the About page.</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    disabled={scSaving === "about"}
                    onClick={() => saveSiteSection("about", {
                      about_header_desc:  scAboutHeader,
                      about_mission_p1:   scAboutMission1,
                      about_mission_p2:   scAboutMission2,
                      about_core_values:  scAboutValues,
                    })}
                    className="rounded-xl gap-2"
                  >
                    {scSaving === "about" ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : scSaved === "about" ? <><Check className="w-4 h-4" /> Saved!</>
                      : "Save About Content"}
                  </Button>
                </div>
              </div>

              {/* ── Contact & Footer ── */}
              <div className={card}>
                <div className="flex items-center gap-3">
                  {sectionIcon("bg-green-100", "text-green-600", <Phone className="w-4 h-4" />)}
                  <div>
                    <h3 className="font-bold text-secondary">Contact, Footer & Social</h3>
                    <p className="text-xs text-muted-foreground">Contact page info, footer tagline, and social media links.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Contact Page Description</Label>
                    <Input
                      value={scContactHeader}
                      onChange={e => setScContactHeader(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-secondary mb-3 uppercase tracking-widest">Contact Information</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>
                          Address
                          <span className="ml-1.5 text-xs text-muted-foreground font-normal">— two lines</span>
                        </Label>
                        <Textarea
                          value={scContactAddress}
                          onChange={e => setScContactAddress(e.target.value)}
                          className="rounded-xl resize-none font-mono text-sm"
                          rows={2}
                          placeholder={"3671 Hyatts Rd\nPowell, OH 43065"}
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label>Phone Number</Label>
                          <Input
                            value={scContactPhone}
                            onChange={e => setScContactPhone(e.target.value)}
                            className="rounded-xl"
                            placeholder="(740) 369-0717"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email Address</Label>
                          <Input
                            type="email"
                            value={scContactEmail}
                            onChange={e => setScContactEmail(e.target.value)}
                            className="rounded-xl"
                            placeholder="gurukul@bhtohio.org"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-secondary mb-3 uppercase tracking-widest">Footer</p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Footer Tagline</Label>
                        <Textarea
                          value={scFooterTagline}
                          onChange={e => setScFooterTagline(e.target.value)}
                          className="rounded-xl resize-none"
                          rows={2}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Facebook URL <span className="text-xs text-muted-foreground font-normal">(leave blank to hide)</span></Label>
                          <Input
                            value={scFacebook}
                            onChange={e => setScFacebook(e.target.value)}
                            className="rounded-xl"
                            placeholder="https://facebook.com/yourpage"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Instagram URL <span className="text-xs text-muted-foreground font-normal">(leave blank to hide)</span></Label>
                          <Input
                            value={scInstagram}
                            onChange={e => setScInstagram(e.target.value)}
                            className="rounded-xl"
                            placeholder="https://instagram.com/yourhandle"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    disabled={scSaving === "contact"}
                    onClick={() => saveSiteSection("contact", {
                      contact_header_desc:  scContactHeader,
                      contact_address:      scContactAddress,
                      contact_phone:        scContactPhone,
                      contact_email:        scContactEmail,
                      footer_tagline:       scFooterTagline,
                      footer_facebook_url:  scFacebook,
                      footer_instagram_url: scInstagram,
                    })}
                    className="rounded-xl gap-2"
                  >
                    {scSaving === "contact" ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : scSaved === "contact" ? <><Check className="w-4 h-4" /> Saved!</>
                      : "Save Contact & Footer"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl border border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">Admin Portal v1.0 • Bhartiya Hindu Temple Gurukul • Powell, OH</p>
        <p className="text-xs text-muted-foreground mt-1">For technical support, contact the temple administration.</p>
      </div>
    </div>
  );
}
