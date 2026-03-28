import { useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MapPin, Phone, Mail, Send, CheckCircle2, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { validatePersonName, validateEmail, validateUSPhone, validateRequired, formatUSPhone } from "@/lib/validators";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function submitContactForm(data: {
  name: string; email: string; phone: string; message: string;
}) {
  const res = await fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? "Failed to send message");
  return json;
}

// ─── CAPTCHA ────────────────────────────────────────────────────────────────

type CaptchaChallenge = { a: number; b: number; op: "+" | "-"; answer: number };

function generateChallenge(): CaptchaChallenge {
  const a = Math.floor(Math.random() * 9) + 2;
  const b = Math.floor(Math.random() * 9) + 1;
  const op = Math.random() > 0.45 ? "+" : "-";
  const answer = op === "+" ? a + b : Math.abs(a - b);
  return { a: op === "-" ? Math.max(a, b) : a, b: op === "-" ? Math.min(a, b) : b, op, answer };
}

function CaptchaWidget({ onVerified }: { onVerified: () => void }) {
  const [challenge, setChallenge] = useState<CaptchaChallenge>(generateChallenge);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput("");
    setError("");
    setAttempts(0);
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
        setError("Let\u2019s try a fresh question.");
        refresh();
      } else {
        setError(`That\u2019s not quite right \u2014 ${3 - next} attempt${3 - next === 1 ? "" : "s"} left.`);
        setInput("");
      }
    }
  };

  return (
    <div className={`rounded-xl border border-border bg-gray-50 p-4 transition-all ${shake ? "animate-[shake_0.4s_ease]" : ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-secondary">Quick Verification</span>
        <span className="text-xs text-muted-foreground ml-auto">Prove you\u2019re human</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base font-mono font-bold text-secondary bg-white border border-border rounded-lg px-3 py-2 shrink-0 min-w-[90px] text-center">
          {challenge.a} {challenge.op} {challenge.b} = ?
        </span>
        <input
          type="number"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), verify())}
          placeholder="Answer"
          className="w-24 border border-border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white"
        />
        <button
          type="button"
          onClick={verify}
          className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition"
        >
          Verify
        </button>
        <button
          type="button"
          onClick={refresh}
          title="New question"
          className="p-2 text-muted-foreground hover:text-secondary transition rounded-lg hover:bg-white"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Contact() {
  const { get } = useSiteContent();
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [message, setMessage] = useState("");
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    const nameErr = validatePersonName(name, "Your name");
    if (nameErr) e.name = nameErr;
    const msgErr = validateRequired(message, "Message");
    if (msgErr) e.message = msgErr;
    const emailErr = validateEmail(email, false); // optional
    if (emailErr) e.email = emailErr;
    const phoneErr = validateUSPhone(phone, false); // optional
    if (phoneErr) e.phone = phoneErr;
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!captchaOk) { setErrors({ submit: "Please complete the verification first." }); return; }
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSending(true);
    try {
      await submitContactForm({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() });
      setSent(true);
      setName(""); setEmail(""); setPhone(""); setMessage(""); setCaptchaOk(false);
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setSending(false);
    }
  }

  const inputCls = (field: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition ${
      errors[field] ? "border-red-400 bg-red-50" : "border-border bg-white"
    }`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Contact Us"
        description={get("contact_header_desc")}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid lg:grid-cols-5 gap-10">

          {/* ── Left: Info panel ── */}
          <div className="lg:col-span-2">
            <div className="bg-secondary text-white rounded-3xl p-8 shadow-xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                <img
                  src={`${import.meta.env.BASE_URL}images/hero-mandala.png`}
                  alt=""
                  className="w-64 h-64 object-cover rounded-full"
                />
              </div>

              <h2 className="text-3xl font-display font-bold mb-8 relative z-10 text-accent">Get in Touch</h2>

              <div className="space-y-8 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Temple Location</h4>
                    <p className="text-white/80 leading-relaxed">
                      {get("contact_address").split("\n").map((line, i) => (
                        <span key={i}>{line}{i === 0 && <br />}</span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Phone</h4>
                    <p className="text-white/80">{get("contact_phone")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Email</h4>
                    <p className="text-white/80">{get("contact_email")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-xl border border-border/50">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-secondary">Message Sent!</h2>
                <p className="text-muted-foreground max-w-sm">
                  Thank you for reaching out. Our team will get back to you as soon as possible.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-2 text-sm text-primary hover:underline font-medium"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-secondary mb-6">Send a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-secondary block">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: "" })); }}
                      placeholder="Full name"
                      className={inputCls("name")}
                    />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  {/* Email + Phone side by side */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-secondary block">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: "" })); }}
                        placeholder="your@email.com"
                        className={inputCls("email")}
                      />
                      {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-secondary block">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => {
                          setPhone(formatUSPhone(e.target.value));
                          setErrors(prev => ({ ...prev, phone: "" }));
                        }}
                        placeholder="(614) 555-0100"
                        className={inputCls("phone")}
                        maxLength={14}
                      />
                      {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-secondary block">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={6}
                      value={message}
                      onChange={e => { setMessage(e.target.value); setErrors(prev => ({ ...prev, message: "" })); }}
                      placeholder="How can we help you?"
                      className={`${inputCls("message")} resize-none`}
                    />
                    {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
                  </div>

                  {/* CAPTCHA */}
                  {captchaOk ? (
                    <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      <span className="text-sm font-medium text-green-700">Verification complete</span>
                    </div>
                  ) : (
                    <CaptchaWidget onVerified={() => setCaptchaOk(true)} />
                  )}

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                      {errors.submit}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !captchaOk}
                    className="flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : <><Send className="w-4 h-4" /> Send Message</>}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>

        {/* Map embed */}
        <div className="mt-16 rounded-3xl overflow-hidden border border-border shadow-sm h-[400px] w-full">
          <iframe
            title="BHT Gurukul Location"
            src="https://www.google.com/maps?q=3671+Hyatts+Rd,+Powell,+OH+43065&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
