import { useState, useEffect } from "react";
import { loadStripe, type Stripe as StripeType } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentFormProps {
  studentCode:   string;
  studentName:   string;
  courseCount:   number;
  membershipFee: number;
  courseFee:     number;
  onPaymentDone: (success: boolean) => void;
}

// ─── Inner card form (must be inside <Elements>) ──────────────────────────────

function CardForm({
  studentCode,
  studentName,
  totalCents,
  description,
  onPaymentDone,
}: {
  studentCode:   string;
  studentName:   string;
  totalCents:    number;
  description:   string;
  onPaymentDone: (success: boolean) => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [cardReady,  setCardReady]  = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/create-intent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: totalCents, studentCode, studentName, description }),
      });

      const data = await res.json() as { clientSecret?: string; error?: string; notConfigured?: boolean };

      if (!res.ok || !data.clientSecret) {
        setError(data.error ?? "Payment could not be initiated. Please contact the Gurukul office.");
        return;
      }

      const card = elements.getElement(CardElement);
      if (!card) { setError("Card element not ready."); return; }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card },
      });

      if (stripeError) {
        setError(stripeError.message ?? "Payment failed. Please try again.");
      } else if (paymentIntent?.status === "succeeded") {
        onPaymentDone(true);
      } else {
        setError("Payment was not completed. Please try again.");
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="border border-border rounded-xl px-4 py-3 bg-gray-50 focus-within:border-primary transition-colors">
        <CardElement
          onChange={e => { setCardReady(e.complete); setError(null); }}
          options={{
            style: {
              base:    { fontSize: "16px", color: "#1a1a1a", "::placeholder": { color: "#9ca3af" } },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
        Your payment is secured and encrypted by Stripe.
      </div>

      <Button
        type="submit"
        disabled={processing || !stripe || !cardReady}
        className="w-full gap-2 h-12 text-base"
      >
        {processing
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
          : <><CreditCard className="w-4 h-4" /> Pay ${(totalCents / 100).toFixed(2)}</>}
      </Button>
    </form>
  );
}

// ─── Outer component — loads Stripe and fetches publishable key ───────────────

export function StripePaymentForm({
  studentCode,
  studentName,
  courseCount,
  membershipFee,
  courseFee,
  onPaymentDone,
}: PaymentFormProps) {
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);

  const totalDollars = membershipFee + courseCount * courseFee;
  const totalCents   = totalDollars * 100;
  const description  = `Gurukul Registration — ${studentName} — ${courseCount} course(s)`;

  useEffect(() => {
    fetch("/api/payments/config")
      .then(r => r.json())
      .then((data: { publishableKey?: string }) => {
        const key = data.publishableKey ?? "";
        if (!key || key === "pk_test_placeholder" || key === "") {
          setNotConfigured(true);
        } else {
          setStripePromise(loadStripe(key));
        }
      })
      .catch(() => setLoadError("Could not load payment configuration."))
      .finally(() => setConfigLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      {/* ── Order summary ── */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 bg-secondary/5 border-b border-border">
          <h3 className="font-bold text-secondary text-sm">Payment Summary</h3>
        </div>
        <div className="px-5 py-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temple Annual Membership</span>
            <span className="font-medium">${membershipFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Course Enrollment ({courseCount} × ${courseFee})
            </span>
            <span className="font-medium">${(courseCount * courseFee).toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2.5 flex justify-between font-bold text-base">
            <span>Total Due</span>
            <span className="text-primary">${totalDollars.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ── Payment form ── */}
      {configLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading payment gateway…
        </div>
      )}

      {!configLoading && notConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Online payment not yet configured
          </p>
          <p className="text-sm text-amber-700">
            The payment gateway is being set up. Please contact the Gurukul office to arrange payment.
          </p>
          <div className="text-sm text-amber-700 space-y-0.5 pt-1">
            <p><strong>Zelle / Check / Cash:</strong> accepted on or before the first class day</p>
            <p><strong>Amount due:</strong> <span className="font-bold">${totalDollars.toFixed(2)}</span></p>
            <p><strong>Email:</strong> <a href="mailto:gurukul@bhtohio.org" className="underline">gurukul@bhtohio.org</a></p>
          </div>
          <Button className="mt-3 w-full" onClick={() => onPaymentDone(false)}>
            I'll Pay Later — Finish Registration
          </Button>
        </div>
      )}

      {!configLoading && loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {loadError}
        </div>
      )}

      {!configLoading && !notConfigured && !loadError && stripePromise && (
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-secondary">Card Details</h3>
          </div>
          <Elements stripe={stripePromise}>
            <CardForm
              studentCode={studentCode}
              studentName={studentName}
              totalCents={totalCents}
              description={description}
              onPaymentDone={onPaymentDone}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}

// ─── Payment success card ─────────────────────────────────────────────────────

export function PaymentSuccessCard({ amount }: { amount: number }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-2">
      <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
      <p className="font-bold text-green-800">Payment of ${amount.toFixed(2)} received!</p>
      <p className="text-sm text-green-700">
        A confirmation will be sent to your registered email address.
      </p>
    </div>
  );
}
