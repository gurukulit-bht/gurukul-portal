import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { StudentRegistrationForm } from "@/components/StudentRegistrationForm";
import {
  CheckCircle2, BookOpen, Phone, Mail, MapPin,
  ShieldCheck, RefreshCw, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── CAPTCHA logic ────────────────────────────────────────────────────────────

type CaptchaChallenge = { a: number; b: number; op: "+" | "-"; answer: number };

function generateChallenge(): CaptchaChallenge {
  const a = Math.floor(Math.random() * 9) + 2;
  const b = Math.floor(Math.random() * 9) + 1;
  const op = Math.random() > 0.45 ? "+" : "-";
  const answer = op === "+" ? a + b : Math.abs(a - b);
  return { a: op === "-" ? Math.max(a, b) : a, b: op === "-" ? Math.min(a, b) : b, op, answer };
}

// ─── CAPTCHA component ────────────────────────────────────────────────────────

function CaptchaGate({ onVerified }: { onVerified: () => void }) {
  const [challenge, setChallenge] = useState<CaptchaChallenge>(generateChallenge);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput("");
    setError("");
  }, []);

  const verify = () => {
    const val = parseInt(input.trim(), 10);
    if (isNaN(val)) {
      setError("Please enter a number.");
      return;
    }
    if (val === challenge.answer) {
      onVerified();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (next >= 3) {
        setError("Let\u2019s try a fresh question.");
        refresh();
        setAttempts(0);
      } else {
        setError(`That\u2019s not quite right \u2014 ${3 - next} attempt${3 - next === 1 ? "" : "s"} left.`);
      }
      setInput("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-sm mx-auto"
    >
      <div className="bg-white rounded-3xl border border-border shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-secondary px-8 py-7 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-white">Quick Verification</h2>
          <p className="text-white/60 text-sm mt-1">
            Solve the puzzle below to continue to registration.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-8 space-y-6">
          {/* Math challenge display */}
          <motion.div
            animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl py-6 text-center"
          >
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">
              What is…
            </p>
            <div className="text-4xl font-display font-bold text-secondary">
              {challenge.a} {challenge.op} {challenge.b} = ?
            </div>
          </motion.div>

          {/* Answer input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-secondary block">
              Your Answer
            </label>
            <input
              type="number"
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && verify()}
              placeholder="Type your answer…"
              className="w-full border border-border rounded-xl px-4 py-3 text-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
            )}
          </div>

          {/* Verify button */}
          <Button
            onClick={verify}
            className="w-full py-6 text-base font-semibold rounded-xl"
            disabled={!input.trim()}
          >
            Verify &amp; Continue <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          {/* Refresh */}
          <button
            onClick={refresh}
            className="flex items-center justify-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Get a different question
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Register() {
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [success, setSuccess] = useState<{ code: string; name: string } | null>(null);

  function handleSuccess(studentCode: string, studentName: string) {
    setSuccess({ code: studentCode, name: studentName });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Scroll to top when CAPTCHA passes
  useEffect(() => {
    if (captchaVerified) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [captchaVerified]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 to-white">
      {/* ── Hero banner ── */}
      <div className="bg-secondary text-white py-14 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3">
            Student Registration
          </h1>
          <p className="text-white/80 text-lg">
            Bhartiya Hindu Temple Gurukul — Powell, OH
          </p>
          <p className="text-white/60 text-sm mt-2">
            Academic Year 2026–27 · Classes begin September 2026
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">

        <AnimatePresence mode="wait">

          {/* ── Success State ── */}
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl border border-border p-10 text-center space-y-6 shadow-sm"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary">Thank You!</h2>
                <p className="text-muted-foreground mt-2 text-lg">
                  <span className="font-semibold text-secondary">{success.name}</span> has been
                  successfully registered.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl">
                  <span className="text-sm text-muted-foreground">Student ID:</span>
                  <span className="font-mono font-bold text-primary text-lg">{success.code}</span>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left space-y-2 max-w-md mx-auto">
                <p className="text-sm font-semibold text-amber-800">What happens next?</p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Our team will review your registration</li>
                  <li>You'll receive a confirmation email with class details</li>
                  <li>Payment can be made via Zelle, Check, or Cash on class day</li>
                  <li>First class is Sunday, September 7, 2026</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => { setSuccess(null); setCaptchaVerified(false); }}>
                  Register Another Child
                </Button>
                <Button asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── CAPTCHA gate ── */}
          {!success && !captchaVerified && (
            <motion.div
              key="captcha"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Contact info bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: MapPin, label: "Location", value: "3671 Hyatts Rd, Powell, OH 43065" },
                  { icon: Phone,  label: "Phone",    value: "(740) 369-0717" },
                  { icon: Mail,   label: "Email",    value: "gurukul@bhtohio.org" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
                      <div className="text-sm font-medium text-secondary mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <CaptchaGate onVerified={() => setCaptchaVerified(true)} />

              <p className="text-xs text-center text-muted-foreground pt-2">
                This quick check helps us protect student data and prevent spam registrations.
              </p>
            </motion.div>
          )}

          {/* ── Registration Form ── */}
          {!success && captchaVerified && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Contact info bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: MapPin, label: "Location", value: "3671 Hyatts Rd, Powell, OH 43065" },
                  { icon: Phone,  label: "Phone",    value: "(740) 369-0717" },
                  { icon: Mail,   label: "Email",    value: "gurukul@bhtohio.org" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</div>
                      <div className="text-sm font-medium text-secondary mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Verified badge */}
              <div className="flex items-center justify-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Verification complete — your information is secure.</span>
              </div>

              {/* Form card */}
              <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
                <StudentRegistrationForm
                  onSuccess={handleSuccess}
                  submitLabel="Submit Registration"
                />
              </div>

              <p className="text-xs text-center text-muted-foreground">
                By submitting this form you agree to be contacted by Gurukul staff regarding enrollment.
                Questions? Email{" "}
                <a href="mailto:gurukul@bhtohio.org" className="text-primary hover:underline">
                  gurukul@bhtohio.org
                </a>
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
