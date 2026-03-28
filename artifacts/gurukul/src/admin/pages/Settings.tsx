import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check, Lock, Bell, Globe, School, CalendarDays,
  Loader2, Hash, AlertCircle, CreditCard, Eye, EyeOff,
} from "lucide-react";
import { usePortalSettings } from "../contexts/PortalSettingsContext";
import { useAuth } from "../AuthContext";
import { changePin } from "../auth";
import { adminApi } from "@/lib/adminApi";

type AdminTab = "general" | "account" | "payments" | "notifications" | "organization";

const ADMIN_TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: "general",       label: "General",       icon: <CalendarDays className="w-4 h-4" /> },
  { id: "account",       label: "Account",        icon: <Lock className="w-4 h-4" /> },
  { id: "payments",      label: "Payments",       icon: <CreditCard className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications",  icon: <Bell className="w-4 h-4" /> },
  { id: "organization",  label: "Organization",   icon: <School className="w-4 h-4" /> },
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

  const [stripePubKey,    setStripePubKey]    = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeMemberFee, setStripeMemberFee] = useState("150");
  const [stripeCourseFee, setStripeCourseFee] = useState("35");
  const [showSecret,      setShowSecret]      = useState(false);
  const [stripeLoading,   setStripeLoading]   = useState(false);
  const [stripeSaving,    setStripeSaving]    = useState(false);
  const [stripeSaved,     setStripeSaved]     = useState(false);
  const [stripeError,     setStripeError]     = useState<string | null>(null);

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
                <h3 className="font-bold text-secondary">Change Password</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Current Password</Label><Input type="password" placeholder="••••••••" className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>New Password</Label><Input type="password" placeholder="••••••••" className="rounded-xl" /></div>
                <div className="space-y-1.5"><Label>Confirm New Password</Label><Input type="password" placeholder="••••••••" className="rounded-xl" /></div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => save("password")} variant="outline" className="rounded-xl gap-2">
                  {saved === "password" ? <><Check className="w-4 h-4" /> Updated!</> : "Update Password"}
                </Button>
              </div>
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

      <div className="bg-gray-50 rounded-2xl border border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">Admin Portal v1.0 • Bhartiya Hindu Temple Gurukul • Powell, OH</p>
        <p className="text-xs text-muted-foreground mt-1">For technical support, contact the temple administration.</p>
      </div>
    </div>
  );
}
