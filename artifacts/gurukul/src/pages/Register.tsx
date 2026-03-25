import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { StudentRegistrationForm, type RegistrationPaymentInfo } from "@/components/StudentRegistrationForm";
import { CaptchaGate } from "@/components/CaptchaGate";
import { StripePaymentForm, PaymentSuccessCard } from "@/components/StripePaymentForm";
import {
  CheckCircle2, BookOpen,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type SuccessState = {
  code:        string;
  name:        string;
  payment:     RegistrationPaymentInfo;
  paid:        boolean;
  paidAmount?: number;
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Register() {
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  function handleSuccess(studentCode: string, studentName: string, paymentInfo: RegistrationPaymentInfo) {
    setSuccess({ code: studentCode, name: studentName, payment: paymentInfo, paid: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handlePaymentDone(didPay: boolean, amount?: number) {
    setSuccess(prev => prev ? { ...prev, paid: true, paidAmount: amount } : prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Scroll to top when CAPTCHA passes
  useEffect(() => {
    if (captchaVerified) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [captchaVerified]);

  const totalDue = success
    ? success.payment.membershipFee + success.payment.courseCount * success.payment.courseFee
    : 0;

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

          {/* ── Final confirmation (paid or skipped) ── */}
          {success?.paid && (
            <motion.div
              key="final"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl border border-border p-10 text-center space-y-6 shadow-sm"
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-secondary">You're All Set!</h2>
                <p className="text-muted-foreground mt-2 text-lg">
                  <span className="font-semibold text-secondary">{success.name}</span> has been successfully registered.
                </p>
              </div>

              {success.paidAmount != null && success.paidAmount > 0 && (
                <PaymentSuccessCard amount={success.paidAmount} />
              )}

              {(success.paidAmount == null || success.paidAmount === 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 text-left space-y-1">
                  <p className="font-semibold text-amber-800">Balance due: ${totalDue.toFixed(2)}</p>
                  <p>Please bring payment (Zelle, Check, or Cash) to the first class or contact us at <a href="mailto:gurukul@bhtohio.org" className="underline">gurukul@bhtohio.org</a>.</p>
                </div>
              )}

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

          {/* ── Payment step ── */}
          {success && !success.paid && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Registration confirmed banner */}
              <div className="bg-white rounded-2xl border border-green-200 bg-green-50 px-5 py-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">Registration submitted!</p>
                  <p className="text-sm text-green-700 mt-0.5">
                    <span className="font-medium">{success.name}</span> has been registered.
                    Please complete payment below to confirm your enrollment.
                  </p>
                </div>
              </div>

              <StripePaymentForm
                studentCode={success.code}
                studentName={success.name}
                courseCount={success.payment.courseCount}
                membershipFee={success.payment.membershipFee}
                courseFee={success.payment.courseFee}
                onPaymentDone={(didPay) =>
                  handlePaymentDone(didPay, didPay ? totalDue : 0)
                }
              />
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
