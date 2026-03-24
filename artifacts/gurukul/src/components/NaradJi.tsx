import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useListCourses, useListAnnouncements, useListEvents } from "@workspace/api-client-react";
import { adminApi } from "@/lib/adminApi";

type MessageItem = {
  id: number;
  from: "bot" | "user";
  text: string;
};

type LiveData = {
  courses:       { name: string; icon: string; schedule: string }[];
  announcements: { title: string; isActive: boolean }[];
  events:        { title: string; date: string; time: string }[];
  teachers:      { name: string; assignedCourse: string }[];
};

const QUICK_REPLIES = [
  "What courses are offered?",
  "Show upcoming events",
  "Any new announcements?",
  "What is Student's Corner?",
  "How do I register?",
  "What is the Parent Portal?",
  "When does the next session start?",
];

function buildResponse(input: string, live: LiveData): string {
  const q = input.toLowerCase();

  // Greetings
  if (q.includes("hello") || q.includes("hi") || q.includes("namaste") || q.includes("hey")) {
    return `Namaste! 🙏 I'm Narad Ji — your Gurukul helper!\n\nYou can ask me about:\n• 📚 Courses & classes\n• 📅 Upcoming events\n• 📢 Announcements\n• 🎮 Student's Corner\n• 👨‍👩‍👧 Parent Portal\n• 📝 Registration & fees\n\nHow can I help you today?`;
  }

  // Student's Corner
  if (
    q.includes("student") && (q.includes("corner") || q.includes("corner")) ||
    q.includes("student's corner") ||
    q.includes("students corner") ||
    q.includes("learning game") ||
    q.includes("quiz") ||
    q.includes("game") ||
    q.includes("gamif") ||
    q.includes("badge") ||
    q.includes("fun learning") ||
    q.includes("practice") ||
    q.includes("practise")
  ) {
    return `🎮 Student's Corner is our free, fun learning hub!\n\nKids can explore 8 courses:\n\n🌐 Indian Languages\n• Hindi, Sanskrit, Telugu\n• Gujarati, Tamil, Kannada\n\n🕉️ Culture & Dharma\n• Dharma Studies\n• Indian Classical Music\n\nActivities include: quizzes, flashcards, memory games, fun facts & more!\n\n✨ No login needed — just visit:\n/students-corner on our website!`;
  }

  // Parent Portal
  if (
    q.includes("parent portal") ||
    q.includes("parents portal") ||
    q.includes("weekly update") ||
    q.includes("class update") ||
    (q.includes("parent") && (q.includes("access") || q.includes("check") || q.includes("view") || q.includes("portal")))
  ) {
    return `👨‍👩‍👧 The Parent Portal gives enrolled families access to:\n\n📰 Weekly class updates from teachers\n(highlights, homework, reminders, upcoming topics)\n\nHow to access:\n1. Click 'Parents Portal' on the website\n2. Click 'View Weekly Updates'\n3. Solve the quick captcha\n4. Enter your registered phone number\n5. Browse updates filtered by course\n\n🔴 High Priority updates are flagged so you never miss urgent notices!\n\nContact us at gurukul@bhtohio.org if your phone number is not recognised.`;
  }

  // Courses
  if (q.includes("course") || q.includes("class") || q.includes("offered") || q.includes("subject") || q.includes("language")) {
    const list = live.courses.map((c) => `${c.icon} ${c.name}`).join("  |  ");
    return `We offer ${live.courses.length} wonderful courses:\n\n${list}\n\nEach course has 7 levels from beginner to mastery.\n\n🎮 Students can also practise at home via Student's Corner!\n\nAsk me about any specific course for more details!`;
  }

  for (const course of live.courses) {
    if (q.includes(course.name.toLowerCase())) {
      if (q.includes("level 1") || q.includes("level1") || q.includes("beginner")) {
        return `${course.icon} Level 1 ${course.name} is perfect for beginners!\n\nClass schedule: ${course.schedule}\n\n🎮 Kids can also practise ${course.name} at home on Student's Corner!\n\nVisit the Courses page for full details.`;
      }
      return `${course.icon} ${course.name} classes build reading, writing, and conversational skills across 7 levels.\n\nSchedule: ${course.schedule}\n\n🎮 Students can practise ${course.name} at home on Student's Corner!\n\nVisit the Courses page for full details.`;
    }
  }

  // Announcements / news / notices
  if (q.includes("announcement") || q.includes("news") || q.includes("notice")) {
    const active = live.announcements.filter((a) => a.isActive).slice(0, 3);
    if (active.length === 0) return `📢 No active announcements right now.\n\nCheck back soon or visit the Announcements page on the website!`;
    const list = active.map((a) => `• ${a.title}`).join("\n");
    return `📢 Latest Announcements:\n\n${list}\n\nVisit the Announcements page for full details!`;
  }

  // Events
  if (q.includes("event") || q.includes("calendar") || q.includes("upcoming") || q.includes("program") || q.includes("celebration") || q.includes("festival")) {
    const upcoming = live.events.slice(0, 3);
    if (upcoming.length === 0) return `📅 No upcoming events listed right now.\n\nCheck the Calendar page on our website for updates!`;
    const list = upcoming.map((e) => `• ${e.title}\n  ${e.date} at ${e.time}`).join("\n");
    return `📅 Upcoming Events:\n\n${list}\n\nSee the Calendar page for all events!`;
  }

  // Session / next class
  if (q.includes("session") || q.includes("start") || q.includes("begin") || (q.includes("when") && q.includes("next"))) {
    return `🗓️ For current session dates and availability, visit the Parents Portal or contact us directly.\n\nRegistration is open!\n\n✉️ gurukul@bhtohio.org\n📞 (740) 369-0717`;
  }

  // Registration / enrollment
  if (q.includes("register") || q.includes("enroll") || q.includes("join") || q.includes("admission") || q.includes("sign up") || q.includes("how do i")) {
    return `📝 To register your child:\n\n1. Visit our Parents Portal\n2. Fill out the enrollment form\n3. Submit the $150 tuition fee\n\nPayment options: Check, Zelle, or Cash.\n\nQuestions? Reach us at:\n✉️ gurukul@bhtohio.org\n📞 (740) 369-0717`;
  }

  // Location / contact
  if (q.includes("location") || q.includes("address") || q.includes("where") || q.includes("contact") || q.includes("phone") || q.includes("email") || q.includes("reach")) {
    return `📍 Bhartiya Hindu Temple Gurukul\n3671 Hyatts Rd, Powell, OH 43065\n\n📞 (740) 369-0717\n✉️ gurukul@bhtohio.org`;
  }

  // Levels
  if (q.includes("level")) {
    return `📚 Each course has 7 levels:\n\n• Levels 1–2: Beginner\n• Levels 3–4: Intermediate\n• Levels 5–6: Advanced\n• Level 7: Mastery\n\nStudents advance based on skills and assessment.\n\n🎮 Practise every level's content on Student's Corner — free & no login needed!`;
  }

  // Fees
  if (q.includes("fee") || q.includes("payment") || q.includes("cost") || q.includes("price") || q.includes("tuition")) {
    return `💰 Tuition is $150 per course per session.\n\nPayment options: Check, Zelle, or Cash.\n\nFor fee assistance, contact us at:\n✉️ gurukul@bhtohio.org\n📞 (740) 369-0717`;
  }

  // Teachers / faculty
  if (q.includes("teacher") || q.includes("instructor") || q.includes("guru") || q.includes("faculty")) {
    if (live.teachers.length === 0) return `👩‍🏫 Our teachers are dedicated volunteers from the community.\n\nVisit the temple or contact us for more info:\n📞 (740) 369-0717`;
    const list = live.teachers.map((t) => `• ${t.assignedCourse} — ${t.name}`).join("\n");
    return `👩‍🏫 Our dedicated teachers:\n\n${list}\n\nVisit us for more information!`;
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
      text: "Namaste! I'm Narad Ji — not here to create mischief, only to share the latest Gurukul news! 🙏\n\nAsk me about courses, events, announcements, the Parent Portal, Student's Corner, or registration.\n\nHow can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Live data from the public API
  const { data: rawCourses = [] } = useListCourses();
  const { data: rawAnnouncements = [] } = useListAnnouncements();
  const { data: rawEvents = [] } = useListEvents();
  const [rawTeachers, setRawTeachers] = useState<{ name: string; assignedCourse: string }[]>([]);

  useEffect(() => {
    adminApi.teachers.list()
      .then((data) => {
        const ts = (data as { name: string; assignedCourse: string }[])
          .filter((t) => (t as { status?: string }).status !== "Inactive");
        setRawTeachers(ts);
      })
      .catch(() => {/* non-critical */});
  }, []);

  const liveData: LiveData = {
    courses: rawCourses.map((c) => ({
      name:     (c as { name: string }).name,
      icon:     (c as { icon: string }).icon ?? "📚",
      schedule: (c as { schedule: string }).schedule ?? "",
    })),
    announcements: rawAnnouncements.map((a) => ({
      title:    (a as { title: string }).title,
      isActive: (a as { isActive: boolean }).isActive ?? true,
    })),
    events: rawEvents.map((e) => ({
      title: (e as { title: string }).title,
      date:  (e as { date: string }).date,
      time:  (e as { time: string }).time,
    })),
    teachers: rawTeachers,
  };

  const pagesWithBubble = ["/", "/students-corner"];
  useEffect(() => {
    if (!pagesWithBubble.includes(location)) return;
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

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: MessageItem = { id: Date.now(), from: "user", text };
    const botMsg: MessageItem = { id: Date.now() + 1, from: "bot", text: buildResponse(text, liveData) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    setShowQuickReplies(false);
  }, [liveData]);

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
              {location === "/students-corner"
                ? "Namaste, little champ! 🎺 Need help finding a course or have a question? I'm here!"
                : "Namaste! Ask me about courses, events & registration!"}
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
