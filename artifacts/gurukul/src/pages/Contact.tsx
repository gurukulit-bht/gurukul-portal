import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MapPin, Phone, Mail, Send, CheckCircle2, Loader2 } from "lucide-react";

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

export default function Contact() {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [message, setMessage] = useState("");
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())        e.name    = "Your name is required.";
    if (!message.trim())     e.message = "Please write a message.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "Please enter a valid email address.";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSending(true);
    try {
      await submitContactForm({ name: name.trim(), email: email.trim(), phone: phone.trim(), message: message.trim() });
      setSent(true);
      setName(""); setEmail(""); setPhone(""); setMessage("");
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
        description="We are here to answer your questions and welcome you to our community."
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
                      3671 Hyatts Rd<br />Powell, OH 43065
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Phone</h4>
                    <p className="text-white/80">(740) 369-0717</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Email</h4>
                    <p className="text-white/80">gurukul@bhtohio.org</p>
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
                        onChange={e => setPhone(e.target.value)}
                        placeholder="(614) 555-0100"
                        className={inputCls("phone")}
                      />
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

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                      {errors.submit}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-60"
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
