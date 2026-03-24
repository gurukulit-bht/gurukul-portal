import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./AuthContext";
import { DEMO_CREDENTIALS } from "./auth";
import { getDefaultRoute } from "./rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Phone, Mail, BookOpen, ChevronDown, Hash } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [credential, setCredential] = useState("");
  const [secret,     setSecret]     = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showHint,   setShowHint]   = useState(false);

  // Detect whether user is entering a phone number
  const isPhone = /^\d/.test(credential.replace(/\D/g, "")) && credential.replace(/\D/g, "").length >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(credential.trim(), secret);
      if (user) {
        setLocation(getDefaultRoute(user.role));
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(cred: typeof DEMO_CREDENTIALS[number]) {
    setCredential(cred.credential);
    setSecret(cred.secret);
    setShowHint(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-accent p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Gurukul Admin Portal</h1>
            <p className="text-white/80 text-sm mt-1">Bhartiya Hindu Temple, Powell OH</p>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold text-secondary mb-2 text-center">Sign in to continue</h2>
            <p className="text-xs text-muted-foreground text-center mb-6">
              Admin: use email + password &nbsp;·&nbsp; Teachers/Assistants: use phone + PIN
            </p>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="credential" className="text-secondary font-medium">
                  {isPhone ? "Phone Number" : "Email / Phone"}
                </Label>
                <div className="relative">
                  {isPhone
                    ? <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    : <Mail  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                  <Input
                    id="credential"
                    type="text"
                    placeholder="Email or 10-digit phone"
                    className="pl-10 h-12 rounded-xl border-border focus:border-primary"
                    value={credential}
                    onChange={e => setCredential(e.target.value)}
                    required
                    autoComplete="username"
                    inputMode={isPhone ? "numeric" : "email"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret" className="text-secondary font-medium">
                  {isPhone ? "4-Digit PIN" : "Password"}
                </Label>
                <div className="relative">
                  {isPhone
                    ? <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    : <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                  <Input
                    id="secret"
                    type="password"
                    placeholder={isPhone ? "4-digit PIN" : "Enter your password"}
                    className="pl-10 h-12 rounded-xl border-border focus:border-primary"
                    value={secret}
                    onChange={e => setSecret(e.target.value)}
                    required
                    autoComplete="current-password"
                    maxLength={isPhone ? 4 : undefined}
                    inputMode={isPhone ? "numeric" : "text"}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 border border-dashed border-gray-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex items-center justify-between w-full px-4 py-3 text-xs text-muted-foreground hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">Demo credentials (click to expand)</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showHint ? "rotate-180" : ""}`} />
              </button>
              {showHint && (
                <div className="border-t border-dashed border-gray-200 divide-y divide-dashed divide-gray-100">
                  {DEMO_CREDENTIALS.map((cred) => (
                    <button
                      key={cred.credential}
                      type="button"
                      onClick={() => fillDemo(cred)}
                      className="w-full px-4 py-2.5 text-left hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-secondary">{cred.role}</p>
                          <p className="text-xs text-muted-foreground">{cred.credential} · {cred.hint}</p>
                        </div>
                        <span className="text-xs text-primary font-medium">Use →</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Authorized staff only. All activity is monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
