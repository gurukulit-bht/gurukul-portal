import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Lock, Bell, Globe, School, CalendarDays, Loader2 } from "lucide-react";
import { usePortalSettings } from "../contexts/PortalSettingsContext";

export default function Settings() {
  const [saved, setSaved] = useState<string | null>(null);

  const {
    activeCurriculumYear,
    curriculumYears,
    setActiveCurriculumYear,
    loading: settingsLoading,
  } = usePortalSettings();

  const [pendingYear, setPendingYear] = useState<string | null>(null);
  const [yearSaving, setYearSaving] = useState(false);
  const [yearError, setYearError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-secondary">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your admin portal preferences</p>
      </div>

      {/* ── Curriculum Year Preference ── */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-secondary">Curriculum Year Preference</h3>
            <p className="text-xs text-muted-foreground">Sets the active year used globally across courses, enrollment, reports, and all dropdowns.</p>
          </div>
        </div>

        {settingsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading current setting…
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Active Curriculum Year</Label>
              <select
                value={displayYear}
                onChange={e => {
                  setPendingYear(e.target.value);
                  setSaved(null);
                  setYearError(null);
                }}
                className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-primary"
              >
                {curriculumYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Currently active: <strong>{activeCurriculumYear}</strong>. Changing this will immediately update all year-related dropdowns and filters portal-wide.
              </p>
            </div>

            {yearError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{yearError}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {/* Quick-select badges for common years */}
                {[activeCurriculumYear,
                  (() => { const [s] = activeCurriculumYear.split("-"); const n = parseInt(s) + 1; return `${n}-${String(n+1).slice(-2)}`; })(),
                  (() => { const [s] = activeCurriculumYear.split("-"); const n = parseInt(s) - 1; return `${n}-${String(n+1).slice(-2)}`; })(),
                ].filter((y, i, arr) => arr.indexOf(y) === i).map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => { setPendingYear(y); setSaved(null); }}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      displayYear === y
                        ? "bg-primary text-white border-primary"
                        : "border-border text-secondary hover:border-primary/50"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              <Button
                onClick={saveYear}
                disabled={yearSaving || displayYear === activeCurriculumYear}
                className="rounded-xl gap-2 shrink-0"
              >
                {yearSaving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : saved === "year"
                    ? <><Check className="w-4 h-4" /> Saved!</>
                    : "Apply Year"
                }
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Gurukul Information ── */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <School className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-secondary">Gurukul Information</h3>
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

      {/* ── Change Password ── */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
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

      {/* ── Notification Preferences ── */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-secondary">Notification Preferences</h3>
        </div>
        <div className="space-y-3">
          {[
            { label: "Payment overdue alerts", defaultChecked: true },
            { label: "Low inventory alerts", defaultChecked: true },
            { label: "New enrollment notifications", defaultChecked: true },
            { label: "Upcoming event reminders", defaultChecked: false },
            { label: "Weekly summary report", defaultChecked: false },
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

      {/* ── Academic Settings ── */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-secondary">Academic Settings</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Default Fee per Session</Label>
            <Input defaultValue="$150" className="rounded-xl" />
          </div>
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

      <div className="bg-gray-50 rounded-2xl border border-border p-5 text-center">
        <p className="text-sm text-muted-foreground">Admin Portal v1.0 • Bhartiya Hindu Temple Gurukul • Powell, OH</p>
        <p className="text-xs text-muted-foreground mt-1">For technical support, contact the temple administration.</p>
      </div>
    </div>
  );
}
