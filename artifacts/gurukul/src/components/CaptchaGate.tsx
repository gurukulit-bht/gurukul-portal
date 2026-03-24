import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type CaptchaChallenge = { a: number; b: number; op: "+" | "-"; answer: number };

function generateChallenge(): CaptchaChallenge {
  const a = Math.floor(Math.random() * 9) + 2;
  const b = Math.floor(Math.random() * 9) + 1;
  const op = Math.random() > 0.45 ? "+" : "-";
  const answer = op === "+" ? a + b : Math.abs(a - b);
  return { a: op === "-" ? Math.max(a, b) : a, b: op === "-" ? Math.min(a, b) : b, op, answer };
}

export function CaptchaGate({
  onVerified,
  subtitle = "Solve the puzzle below to continue.",
}: {
  onVerified: () => void;
  subtitle?: string;
}) {
  const [challenge, setChallenge] = useState<CaptchaChallenge>(generateChallenge);
  const [input, setInput]         = useState("");
  const [error, setError]         = useState("");
  const [attempts, setAttempts]   = useState(0);
  const [shake, setShake]         = useState(false);

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput("");
    setError("");
  }, []);

  const verify = () => {
    const val = parseInt(input.trim(), 10);
    if (isNaN(val)) { setError("Please enter a number."); return; }
    if (val === challenge.answer) {
      onVerified();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (next >= 3) {
        setError("Let's try a fresh question.");
        refresh();
        setAttempts(0);
      } else {
        setError(`That's not quite right — ${3 - next} attempt${3 - next === 1 ? "" : "s"} left.`);
      }
      setInput("");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-sm mx-auto">
      <div className="bg-white rounded-3xl border border-border shadow-md overflow-hidden">
        <div className="bg-secondary px-8 py-7 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-display font-bold text-white">Quick Verification</h2>
          <p className="text-white/60 text-sm mt-1">{subtitle}</p>
        </div>

        <div className="px-8 py-8 space-y-6">
          <motion.div
            animate={shake ? { x: [0, -8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl py-6 text-center"
          >
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">What is…</p>
            <div className="text-4xl font-display font-bold text-secondary">
              {challenge.a} {challenge.op} {challenge.b} = ?
            </div>
          </motion.div>

          <div className="space-y-3">
            <input
              type="number"
              inputMode="numeric"
              className="w-full border border-border rounded-xl px-4 py-3 text-center text-2xl font-display font-bold text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              placeholder="?"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              autoFocus
            />
            {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={verify}>Verify</Button>
            <Button variant="outline" size="icon" onClick={refresh} title="New question">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
