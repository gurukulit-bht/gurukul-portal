import { useState, useRef, useEffect } from "react";
import { X, Send, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { mockAdminAnnouncements, mockAdminEvents, mockAdminCourses } from "@/admin/mockData";

type MessageItem = {
  id: number;
  from: "bot" | "user";
  text: string;
};

const QUICK_REPLIES = [
  "What courses are offered?",
  "Show upcoming events",
  "Any new announcements?",
  "What is Level 1 Hindi?",
  "When does the next session start?",
  "How do I register?",
];

function getResponse(input: string): string {
  const q = input.toLowerCase();

  if (q.includes("course") || q.includes("class") || q.includes("offered") || q.includes("subject") || q.includes("language")) {
    const list = mockAdminCourses.map((c) => `${c.icon} ${c.name}`).join("  |  ");
    return `We offer 6 wonderful courses:\n\n${list}\n\nEach course has 7 levels from beginner to mastery. Ask me about any specific course for more details!`;
  }

  if (q.includes("hindi")) {
    const course = mockAdminCourses.find((c) => c.name === "Hindi");
    if (q.includes("level 1") || q.includes("level1") || q.includes("beginner")) {
      return `📖 Level 1 Hindi is perfect for beginners! Students learn the Devanagari alphabet, basic pronunciation, and simple vocabulary.\n\nClass schedule: ${course?.levels[0].schedule}`;
    }
    return `📖 Hindi classes build reading, writing, and conversational skills across 7 levels.\n\nSchedule: ${course?.levels[0].schedule}\n\nVisit the Courses page for full details!`;
  }

  if (q.includes("dharma")) {
    const course = mockAdminCourses.find((c) => c.name === "Dharma");
    return `🙏 Dharma classes teach Hindu values, ethics, traditions, and scriptures in 7 levels.\n\nSchedule: ${course?.levels[0].schedule}`;
  }

  if (q.includes("telugu")) {
    const course = mockAdminCourses.find((c) => c.name === "Telugu");
    return `🌺 Telugu classes cover reading, writing, and conversation across 7 levels.\n\nSchedule: ${course?.levels[0].schedule}`;
  }

  if (q.includes("tamil")) {
    const course = mockAdminCourses.find((c) => c.name === "Tamil");
    return `🏮 Tamil — one of the world's oldest classical languages! We offer 7 levels.\n\nSchedule: ${course?.levels[0].schedule}`;
  }

  if (q.includes("sanskrit")) {
    const course = mockAdminCourses.find((c) => c.name === "Sanskrit");
    return `🕉️ Sanskrit is the sacred language of the Vedas and scriptures. 7 levels available.\n\nSchedule: ${course?.levels[0].schedule}`;
  }

  if (q.includes("gujarati")) {
    const course = mockAdminCourses.find((c) => c.name === "Gujarati");
    return `🎨 Gujarati classes teach reading, writing, and speaking skills in 7 levels.\n\nSchedule: ${course?.levels[0].schedule}`;
  }

  if (q.includes("announcement") || q.includes("news") || q.includes("update") || q.includes("notice")) {
    const active = mockAdminAnnouncements.filter((a) => a.isActive).slice(0, 3);
    const list = active.map((a) => `• ${a.title}`).join("\n");
    return `📢 Latest Announcements:\n\n${list}\n\nVisit the Announcements page for full details!`;
  }

  if (q.includes("event") || q.includes("calendar") || q.includes("upcoming") || q.includes("program") || q.includes("celebration")) {
    const events = mockAdminEvents.slice(0, 3);
    const list = events.map((e) => `• ${e.title}\n  ${e.date} at ${e.time}`).join("\n");
    return `📅 Upcoming Events:\n\n${list}\n\nSee the Calendar page for all events!`;
  }

  if (q.includes("session") || q.includes("start") || q.includes("begin") || (q.includes("when") && q.includes("next"))) {
    return `🗓️ The Summer 2026 session begins June 1, 2026 and runs through August 31, 2026.\n\nRegistration is currently open! Visit the Parents Portal to enroll your child.`;
  }

  if (q.includes("register") || q.includes("enroll") || q.includes("join") || q.includes("admission") || q.includes("how do i")) {
    return `📝 To register your child:\n\n1. Visit our Parents Portal\n2. Fill out the enrollment form\n3. Submit the $150 tuition fee\n\nQuestions? Reach us at:\ngurukul@bhtohio.org\n(740) 369-0717`;
  }

  if (q.includes("location") || q.includes("address") || q.includes("where") || q.includes("contact") || q.includes("phone") || q.includes("email")) {
    return `📍 Bhartiya Hindu Temple Gurukul\n3671 Hyatts Rd, Powell, OH 43065\n\n📞 (740) 369-0717\n✉️ gurukul@bhtohio.org`;
  }

  if (q.includes("level")) {
    return `📚 Each course has 7 levels:\n\n• Levels 1–2: Beginner\n• Levels 3–4: Intermediate\n• Levels 5–6: Advanced\n• Level 7: Mastery\n\nStudents advance based on skills and assessment. Ask me about a specific course's levels!`;
  }

  if (q.includes("fee") || q.includes("payment") || q.includes("cost") || q.includes("price") || q.includes("tuition")) {
    return `💰 Tuition is $150 per course per session.\n\nPayment options: Check, Zelle, or Cash.\n\nFor fee assistance, contact us at gurukul@bhtohio.org.`;
  }

  if (q.includes("teacher") || q.includes("instructor") || q.includes("guru") || q.includes("faculty")) {
    return `👩‍🏫 Our dedicated teachers:\n\n• Hindi — Smt. Priya Sharma & Smt. Anita Reddy\n• Dharma — Smt. Kavita Patel\n• Telugu — Smt. Lalitha Rao\n• Tamil — Smt. Vijaya Kumar\n• Sanskrit — Pt. Ramesh Joshi\n• Gujarati — Smt. Hetal Shah`;
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("namaste") || q.includes("hey")) {
    return `Namaste! 🙏 How can I help you today? You can ask me about courses, events, announcements, registration, or anything Gurukul-related!`;
  }

  return `I'm still learning! 🙏\n\nPlease check the Announcements, Calendar, or Courses page for more information.\n\nYou can also reach us at:\n✉️ gurukul@bhtohio.org\n📞 (740) 369-0717`;
}

export function NaradJi() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 0,
      from: "bot",
      text: "Namaste! I'm Narad Ji — not here to create mischief, only to share the latest Gurukul news, classes, and events. 🙏\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (location !== "/") return;
    const showTimer = setTimeout(() => {
      setShowBubble(true);
      const hideTimer = setTimeout(() => setShowBubble(false), 30000);
      return () => clearTimeout(hideTimer);
    }, 3000);
    return () => clearTimeout(showTimer);
  }, [location]);

  useEffect(() => {
    if (open) setShowBubble(false);
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: MessageItem = { id: Date.now(), from: "user", text };
    const botMsg: MessageItem = { id: Date.now() + 1, from: "bot", text: getResponse(text) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setShowQuickReplies(false);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-amber-200"
          style={{ maxHeight: "calc(100vh - 120px)" }}>
          <div className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ background: "linear-gradient(135deg, #7b1f1f 0%, #a52929 100%)" }}>
            <div className="w-11 h-11 rounded-full bg-amber-100 overflow-hidden shadow-md shrink-0 border-2 border-amber-300">
              <img src={`${import.meta.env.BASE_URL}images/naradji-avatar.png`} alt="Narad Ji" className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">Narad Ji</p>
              <p className="text-white/70 text-xs">Gurukul Helper • Always Online</p>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-amber-50" style={{ minHeight: 240, maxHeight: 400 }}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                {msg.from === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden shrink-0 mt-1 mr-2 shadow border border-amber-200">
                    <img src={`${import.meta.env.BASE_URL}images/naradji-avatar.png`} alt="Narad Ji" className="w-full h-full object-cover object-top" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line leading-relaxed shadow-sm ${
                  msg.from === "bot"
                    ? "bg-white text-gray-800 rounded-tl-none"
                    : "text-white rounded-tr-none"
                }`}
                  style={msg.from === "user" ? { background: "#7b1f1f" } : {}}>
                  {msg.text}
                </div>
              </div>
            ))}

            {showQuickReplies && (
              <div className="pt-1">
                <p className="text-xs text-gray-500 mb-2 ml-9">Suggested questions:</p>
                <div className="flex flex-wrap gap-2 ml-9">
                  {QUICK_REPLIES.map((qr) => (
                    <button key={qr} onClick={() => sendMessage(qr)}
                      className="text-xs px-3 py-1.5 rounded-full border border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors">
                      {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {!showQuickReplies && (
            <div className="px-3 pt-2 pb-1 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-gray-400 mb-1.5">Quick replies:</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_REPLIES.slice(0, 4).map((qr) => (
                  <button key={qr} onClick={() => sendMessage(qr)}
                    className="text-xs px-2.5 py-1 rounded-full border border-amber-300 text-amber-800 bg-white hover:bg-amber-50 whitespace-nowrap transition-colors shrink-0">
                    {qr}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask Narad Ji..."
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-amber-400 bg-gray-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-40"
              style={{ background: "#7b1f1f" }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showBubble && !open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 animate-fade-in"
          style={{ animation: "fadeSlideUp 0.4s ease-out" }}>
          <div className="relative bg-white rounded-2xl shadow-xl border border-amber-200 px-4 py-3 max-w-[220px]">
            <button
              onClick={() => setShowBubble(false)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-400 hover:bg-gray-500 flex items-center justify-center transition-colors"
              aria-label="Dismiss">
              <X className="w-3 h-3 text-white" />
            </button>
            <p className="text-xs font-bold text-amber-800 mb-1">Narad Ji 🙏</p>
            <p className="text-xs text-gray-700 leading-snug">
              Namaste! Ask me about courses, events & registration!
            </p>
            <button
              onClick={() => { setShowBubble(false); setOpen(true); }}
              className="mt-2 w-full text-xs font-semibold py-1.5 rounded-full text-white transition-colors"
              style={{ background: "#7b1f1f" }}>
              Chat with me →
            </button>
            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-amber-200 rotate-45" />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 overflow-hidden border-4 border-amber-300"
        style={{ background: "linear-gradient(135deg, #f5c518 0%, #e8a000 100%)" }}
        aria-label="Open Narad Ji chatbot">
        {open ? (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7b1f1f 0%, #a52929 100%)" }}>
            <ChevronDown className="w-6 h-6 text-white" />
          </div>
        ) : (
          <img src={`${import.meta.env.BASE_URL}images/naradji-avatar.png`} alt="Narad Ji" className="w-full h-full object-cover object-top" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  );
}
