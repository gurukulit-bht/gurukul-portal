import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./AuthContext";
import { getDefaultRoute } from "./rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, User, BookOpen, Home, RefreshCw } from "lucide-react";

// ── Simple Math CAPTCHA ────────────────────────────────────────────────────────

function generateCaptcha() {
  const ops = ["+", "-", "×"] as const;
  const op  = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === "+") {
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    answer = a + b;
  } else if (op === "-") {
    a = Math.floor(Math.random() * 10) + 5;
    b = Math.floor(Math.random() * 5)  + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * 9)  + 2;
    b = Math.floor(Math.random() * 5)  + 2;
    answer = a * b;
  }
  return { question: `${a} ${op} ${b}`, answer };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [credential, setCredential] = useState("");
  const [secret,     setSecret]     = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  // CAPTCHA state
  const [captcha,      setCaptcha]      = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  const refreshCaptcha = useCallback(() => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setCaptchaError(false);
  }, []);

  // Refresh CAPTCHA after a failed login attempt
  useEffect(() => {
    if (error) refreshCaptcha();
  }, [error, refreshCaptcha]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCaptchaError(false);

    // Verify CAPTCHA
    if (parseInt(captchaInput, 10) !== captcha.answer) {
      setCaptchaError(true);
      refreshCaptcha();
      return;
    }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary/90 to-secondary/80 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-accent p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Gurukul Admin Portal</h1>
            <p className="text-white/80 text-sm mt-1">Bhartiya Hindu Temple, Powell OH</p>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold text-secondary mb-6 text-center">Sign in to continue</h2>

            {/* Error alert */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Username / Phone */}
              <div className="space-y-2">
                <Label htmlFor="credential" className="text-secondary font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="credential"
                    type="text"
                    placeholder="Phone number or admin@gurukul.org"
                    className="pl-10 h-12 rounded-xl border-border focus:border-primary"
                    value={credential}
                    onChange={e => setCredential(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>

              </div>

              {/* Password / PIN */}
              <div className="space-y-2">
                <Label htmlFor="secret" className="text-secondary font-medium">
                  Password / PIN
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="secret"
                    type="password"
                    placeholder="Password or 4-digit PIN"
                    className="pl-10 h-12 rounded-xl border-border focus:border-primary"
                    value={secret}
                    onChange={e => setSecret(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="space-y-2">
                <Label className="text-secondary font-medium">Verification</Label>
                <div className="flex items-center gap-3">
                  {/* CAPTCHA question box */}
                  <div className="flex-1 flex items-center justify-center bg-gray-50 border border-border rounded-xl h-12 px-4 select-none">
                    <span className="font-mono text-lg font-bold text-secondary tracking-widest">
                      {captcha.question} = ?
                    </span>
                  </div>
                  {/* Refresh button */}
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    title="New question"
                    className="w-12 h-12 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <Input
                  type="number"
                  placeholder="Your answer"
                  className={`h-12 rounded-xl border-border focus:border-primary ${captchaError ? "border-red-400 bg-red-50" : ""}`}
                  value={captchaInput}
                  onChange={e => { setCaptchaInput(e.target.value); setCaptchaError(false); }}
                  required
                  autoComplete="off"
                  inputMode="numeric"
                />
                {captchaError && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Incorrect answer — a new question has been generated.
                  </p>
                )}
              </div>

              {/* Sign In button */}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            {/* Back to Home */}
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="mt-5 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Authorized staff only. All activity is monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
