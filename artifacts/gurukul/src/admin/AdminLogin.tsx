import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "./AuthContext";
import { DEMO_CREDENTIALS } from "./auth";
import { getDefaultRoute } from "./rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock, Mail, BookOpen, ChevronDown } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const user = login(email.trim(), password);
      if (user) {
        setLocation(getDefaultRoute(user.role));
      } else {
        setError("Invalid credentials. Please try again.");
      }
      setLoading(false);
    }, 500);
  }

  function fillCredential(cred: typeof DEMO_CREDENTIALS[number]) {
    setEmail(cred.email);
    setPassword(cred.password);
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
            <h2 className="text-xl font-bold text-secondary mb-6 text-center">Sign in to continue</h2>

            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-secondary font-medium">Email / Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="email@gurukul.org"
                    className="pl-10 h-12 rounded-xl border-border focus:border-primary"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-secondary font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10 h-12 rounded-xl border-border focus:border-primary"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
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
                      key={cred.email}
                      type="button"
                      onClick={() => fillCredential(cred)}
                      className="w-full px-4 py-2.5 text-left hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-secondary">{cred.role}</p>
                          <p className="text-xs text-muted-foreground">{cred.email}</p>
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
