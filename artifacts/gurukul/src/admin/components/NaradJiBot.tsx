import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, ChevronDown } from "lucide-react";

// ─── Knowledge base ───────────────────────────────────────────────────────────

type KBEntry = { keywords: string[]; response: string };

const KB: KBEntry[] = [
  {
    keywords: ["login", "sign in", "sign-in", "password", "pin", "auth", "access", "locked", "forgot", "log in"],
    response:
      "🔐 Login & Authentication\n\nAdmins log in with email + password.\nTeachers & Assistants log in with phone number + 4-digit PIN.\n\nWrong PIN 5 times? The account locks for 15 minutes automatically. Admins can reset a teacher's PIN instantly from User Management.",
  },
  {
    keywords: ["reset pin", "forgot pin", "teacher pin", "change pin", "new pin"],
    response:
      "🔑 Resetting a Teacher's PIN\n\n1. Go to User Management in the sidebar\n2. Find the teacher in the list\n3. Click Reset PIN\n4. A new 4-digit PIN is generated — share it securely with the teacher\n\nThe old PIN is immediately invalidated. Teachers can change their own PIN from Settings after logging in.",
  },
  {
    keywords: ["dashboard", "overview", "home page", "stats", "statistics", "summary", "count"],
    response:
      "📊 Dashboard\n\nThe Dashboard is the Admin's home screen. It shows:\n• Total students enrolled\n• Number of active teachers\n• Upcoming calendar events\n• Attendance summary\n• Recent announcements\n\nTeachers and Assistants go directly to Courses & Classes when they log in.",
  },
  {
    keywords: ["announcement", "notice", "news bulletin", "publish notice", "post notice"],
    response:
      "📢 Announcements\n\nAnnouncements appear on the public website for all visitors.\n\nTo create one:\n1. Click New Announcement\n2. Enter a title and body\n3. Set an optional expiry date\n4. Set status to Published\n\nDrafts are saved privately and not visible to the public.",
  },
  {
    keywords: ["calendar", "event", "schedule", "upcoming event", "add event", "program"],
    response:
      "📅 Events Calendar\n\nThe calendar shows all Gurukul events on the public website.\n\nTo add an event:\n1. Click Add Event\n2. Enter name, date, time, location, description\n3. Save — it appears publicly immediately\n\nEdit or delete events at any time.",
  },
  {
    keywords: ["course management", "create course", "add course", "level", "section", "structure", "hierarchy", "curriculum"],
    response:
      "📚 Course Management\n\nThe class structure follows this hierarchy:\nCourse → Level → Section\n\nExample:\nHindi → Beginner → Section A (Sat 10 AM)\n\nSteps:\n1. Create a Course (e.g. Sanskrit, Telugu)\n2. Add Levels (Beginner, Intermediate…)\n3. Add Sections — these are actual class batches\n\nSections are what teachers are assigned to and students enroll in.",
  },
  {
    keywords: ["difference between course", "what is section", "what is level", "course vs section"],
    response:
      "📖 Course vs Level vs Section\n\nCourse — the subject (Hindi, Sanskrit, Dharma)\nLevel — the student's stage within a course (Beginner, Level 1, Advanced)\nSection — a specific class batch with a fixed schedule, teacher, and enrolled students\n\nA course can have many levels. A level can have many sections (e.g. Section A on Saturdays, Section B on Sundays).",
  },
  {
    keywords: ["add teacher", "staff", "faculty", "create teacher", "new teacher", "assign teacher"],
    response:
      "👩‍🏫 Adding a Teacher\n\n1. Go to Staff Management → Add Teacher\n2. Enter name, email, phone, and category (Senior Teacher or Assistant)\n3. Assign to a course, level, and section\n4. Save\n\nThen go to User Management → Add User to create their portal login account so they can sign in with phone + PIN.",
  },
  {
    keywords: ["student", "enrollment", "enroll", "fee", "payment", "fee status", "tuition"],
    response:
      "🎓 Students & Payments\n\nThis page shows all enrolled students with:\n• Course/section assignment\n• Parent contact info\n• Fee payment status (paid / pending)\n\nClick a student to view their profile or record a payment.\n\nTo register a new student use Student Registration in the sidebar.",
  },
  {
    keywords: ["register student", "new student", "add student", "student registration", "admission", "enroll student"],
    response:
      "📝 Registering a New Student\n\n1. Go to Student Registration\n2. Enter: student name, date of birth, parent/guardian name, phone, email, emergency contact\n3. Choose the course, level, and section to enroll in\n4. Submit\n\nThe student then appears in Students & Payments and in the teacher's class roster for attendance.",
  },
  {
    keywords: ["attendance", "mark attendance", "present", "absent", "roll call", "take attendance", "class attendance"],
    response:
      "✅ Taking Attendance\n\n1. Go to Attendance in the sidebar\n2. Select the course, level, and section\n3. Choose the class date\n4. Mark each student Present ✓ or Absent ✗\n5. Save\n\nView history and per-student attendance percentages from the History tab. You only see students in your own assigned sections.",
  },
  {
    keywords: ["weekly update", "class update", "parent update", "publish update", "write update", "post update"],
    response:
      "📰 Publishing a Weekly Update\n\n1. Go to Weekly Updates → New Update\n2. Select course, level, section\n3. Set week start and end dates\n4. Choose Priority: High 🔴, Normal, or Low\n5. Fill in: Class Highlights (required), Topics Covered, Homework, Upcoming Plan, Reminders\n6. Add an optional attachment link\n7. Publish\n\nParents see published updates on the Parent Portal after verifying their membership.",
  },
  {
    keywords: ["priority", "high priority", "urgent update", "red badge"],
    response:
      "🔴 Update Priority\n\nHigh — shows a 🔴 badge on the Parent Portal. Use for urgent reminders (exam, closure, special class).\nNormal — standard weekly update, no special badge.\nLow — routine or informational update.\n\nParents see the 🔴 badge immediately when browsing weekly updates.",
  },
  {
    keywords: ["document", "upload", "material", "resource", "file", "worksheet", "pdf", "course document"],
    response:
      "📄 Course Documents\n\nTeachers can upload learning materials, worksheets, and reference links.\n\n1. Go to Course Documents\n2. Select the course and section\n3. Click Upload Document\n4. Enter title, description, and attach file or URL\n5. Save\n\nTip: For large files use a Google Drive or Dropbox link instead of uploading directly.",
  },
  {
    keywords: ["inventory", "item", "stock", "asset", "track", "supplies", "equipment"],
    response:
      "📦 Inventory\n\nTrack physical items — textbooks, stationery, equipment.\n\n• Add items with name, quantity, and category\n• Update quantity as items are used or restocked\n• Search by name or category\n\nUseful for tracking text books issued to students and classroom supplies.",
  },
  {
    keywords: ["testimonial", "review", "parent feedback", "quote", "website quote"],
    response:
      "💬 Testimonials\n\nParent and student quotes displayed on the public website's homepage.\n\n1. Click Add Testimonial\n2. Enter name, relationship (Parent/Student), and quote\n3. Set status to Published\n\nDraft testimonials are saved but hidden from the public website.",
  },
  {
    keywords: ["messaging", "email", "send email", "notify parents", "broadcast", "message center"],
    response:
      "✉️ Messaging Centre\n\nSend email communications to parents and students.\n\n• Filter recipients by course, level, or section\n• Send broadcast to all enrolled families\n• View sent message history\n\nNote: SMTP must be configured in the server environment for emails to actually be delivered.",
  },
  {
    keywords: ["user management", "portal user", "create user", "add user", "teacher account", "generate pin", "portal access"],
    response:
      "🔑 User Management\n\nCreate portal login accounts for teachers and assistants.\n\n1. Click Add User\n2. Select from existing staff dropdown (name & phone auto-fill) or enter manually\n3. Click Create & Generate PIN\n4. Copy the PIN immediately — it's shown only once!\n\nOther actions:\n• Reset PIN — generates a new PIN\n• Activate/Deactivate — toggle access\n• Delete — permanently removes the account",
  },
  {
    keywords: ["role", "permission", "access control", "rbac", "what can admin", "what can teacher", "who can access"],
    response:
      "🛡️ Roles & Permissions\n\nAdmin — full access to everything\nTeacher — Courses, Attendance, Documents, Weekly Updates, Settings, Help\nAssistant — same as Teacher\n\nTo see the full permissions matrix, go to User Management and click the 'View Role Permissions Overview' link at the bottom of the page.",
  },
  {
    keywords: ["settings", "change password", "update password", "account settings"],
    response:
      "⚙️ Settings\n\nAdmins — change your login password under Change Password.\nTeachers/Assistants — change your 4-digit PIN under Change PIN.\n\nIf you forget your credentials entirely, ask the Admin to reset them from User Management.",
  },
  {
    keywords: ["parent portal", "what can parents see", "parents section", "public portal", "member verification"],
    response:
      "🏠 Parent Portal\n\nParents visit the public website at /parents-portal.\n\nTo access Weekly Class Updates they must:\n1. Solve a captcha\n2. Enter their registered temple membership phone number\n3. If found, they get full access to all published updates\n\nOnly Published updates are visible. High Priority updates show a 🔴 badge.",
  },
  {
    keywords: ["teacher login", "how teacher login", "how teacher signs in", "teacher access"],
    response:
      "📱 Teacher Login\n\nTeachers visit /admin/login and enter:\n1. Their registered 10-digit phone number\n2. Their 4-digit PIN (provided by the Admin from User Management)\n\nThe form automatically detects phone input and switches to PIN mode. Teachers land on Courses & Classes after signing in.",
  },
  {
    keywords: ["courses classes", "my classes", "my sections", "assigned course", "teacher view"],
    response:
      "📖 Courses & Classes (Teacher view)\n\nShows all sections you are assigned to with the enrolled student roster.\n\n• View students in each section\n• Quick links to Attendance and Course Documents\n\nIf a section is missing, ask the Admin to update your assignment in Staff Management.",
  },
  {
    keywords: ["hello", "hi", "namaste", "hey", "good morning", "help me", "how can"],
    response:
      "Namaste! 🙏\n\nI'm Narad Ji — your guide through this Gurukul Admin Portal. Ask me anything about:\n\n• Login & authentication\n• Course & class structure\n• Attendance & weekly updates\n• User management & PINs\n• Parent Portal\n• Settings & permissions\n\nOr click Help & Guide in the sidebar for the full documentation!",
  },
  {
    keywords: ["narad", "who are you", "bot", "chatbot", "your name", "about you"],
    response:
      "🪗 Narayan Narayan!\n\nI am Narad Ji — the divine sage and celestial messenger, now dedicated to guiding the staff of this Gurukul portal.\n\nI know every feature of this system and am here to answer your questions instantly. Type anything and I shall respond with wisdom!\n\nFor the full written guide, click Help & Guide in the sidebar.",
  },
  {
    keywords: ["staff management", "edit teacher", "remove teacher", "deactivate teacher"],
    response:
      "👩‍🏫 Staff Management\n\nView all teachers and assistants with their course assignments.\n\n• Edit — update name, contact, or course assignment\n• Deactivate portal access — go to User Management and toggle their account\n• Remove from system — delete from Staff Management (this removes their class assignment)\n\nNote: Deleting a teacher here does NOT delete their portal user account — do that separately from User Management.",
  },
  {
    keywords: ["help guide", "documentation", "manual", "where is documentation", "full guide"],
    response:
      "📋 Help & Guide\n\nThe complete Functional Specification is available by clicking Help & Guide — the last link in the sidebar.\n\nIt covers all 18 features of this portal with:\n• Step-by-step instructions\n• Role-specific sections\n• Tips and important notes\n• Searchable and filterable by role\n\nYou can also ask me any question directly here!",
  },
];

const DEFAULT_RESPONSE =
  "🤔 Narad Ji ponders...\n\nI don't have a specific answer for that yet, but I can help with topics like login, courses, attendance, weekly updates, user management, parent portal, settings, and more.\n\nTry rephrasing your question, or click Help & Guide in the sidebar for the complete documentation!";

const QUICK_REPLIES = [
  "How does teacher login work?",
  "How do I take attendance?",
  "How do I publish a weekly update?",
  "How do I add a new student?",
  "What can teachers access?",
  "How does the Parent Portal work?",
  "How do I create a teacher login?",
  "How do I reset a teacher's PIN?",
  "What is the difference between a Course and Section?",
  "How do I change my password?",
  "How do I upload course documents?",
  "How do I record a fee payment?",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildResponse(input: string): string {
  const lower = input.toLowerCase();
  let best: KBEntry | null = null;
  let bestScore = 0;
  for (const entry of KB) {
    const score = entry.keywords.reduce(
      (acc, kw) => acc + (lower.includes(kw) ? kw.length : 0),
      0
    );
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  return best ? best.response : DEFAULT_RESPONSE;
}

type Msg = { id: number; from: "user" | "bot"; text: string };
let msgId = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function NaradJiBot() {
  const [open, setOpen]             = useState(false);
  const [input, setInput]           = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [messages, setMessages]     = useState<Msg[]>([
    {
      id: msgId++,
      from: "bot",
      text: "Namaste! I'm Narad Ji — your dedicated guide for this Gurukul Admin Portal. 🙏\n\nAsk me anything about courses, attendance, weekly updates, user management, or any feature here!",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: msgId++, from: "user",  text };
    const botMsg:  Msg = { id: msgId++, from: "bot",   text: buildResponse(text) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput("");
    setShowQuickReplies(false);
  }, []);

  const AVATAR = `${import.meta.env.BASE_URL}images/naradji-avatar.png`;

  return (
    <>
      {/* ── Chat panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[340px] sm:w-[380px] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-amber-200"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #7b1f1f 0%, #a52929 100%)" }}
          >
            <div className="w-11 h-11 rounded-full bg-amber-100 overflow-hidden shadow-md shrink-0 border-2 border-amber-300">
              <img src={AVATAR} alt="Narad Ji" className="w-full h-full object-cover object-top" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight">Narad Ji</p>
              <p className="text-white/70 text-xs">Admin Portal Guide • Always Here</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-amber-50"
            style={{ minHeight: 240, maxHeight: 400 }}
          >
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                {msg.from === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-amber-100 overflow-hidden shrink-0 mt-1 mr-2 shadow border border-amber-200">
                    <img src={AVATAR} alt="Narad Ji" className="w-full h-full object-cover object-top" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line leading-relaxed shadow-sm ${
                    msg.from === "bot"
                      ? "bg-white text-gray-800 rounded-tl-none"
                      : "text-white rounded-tr-none"
                  }`}
                  style={msg.from === "user" ? { background: "#7b1f1f" } : {}}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Inline quick replies — shown initially inside the message area */}
            {showQuickReplies && (
              <div className="pt-1">
                <p className="text-xs text-gray-500 mb-2 ml-10">Suggested questions:</p>
                <div className="flex flex-wrap gap-2 ml-10">
                  {QUICK_REPLIES.slice(0, 8).map(qr => (
                    <button
                      key={qr}
                      onClick={() => sendMessage(qr)}
                      className="text-xs px-3 py-1.5 rounded-full border border-amber-400 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compact quick-reply strip — shown after first message */}
          {!showQuickReplies && (
            <div className="px-3 pt-2 pb-1 bg-amber-50 border-t border-amber-100 shrink-0">
              <p className="text-xs text-gray-400 mb-1.5">Quick questions:</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {QUICK_REPLIES.slice(0, 6).map(qr => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="text-xs px-2.5 py-1 rounded-full border border-amber-300 text-amber-800 bg-white hover:bg-amber-50 whitespace-nowrap transition-colors shrink-0"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 items-center shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask Narad Ji..."
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-amber-400 bg-gray-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-40"
              style={{ background: "#7b1f1f" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating toggle button ────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-16 h-16 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 overflow-hidden border-4 border-amber-300"
        style={{ background: "linear-gradient(135deg, #f5c518 0%, #e8a000 100%)" }}
        aria-label="Open Narad Ji chatbot"
      >
        {open ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7b1f1f 0%, #a52929 100%)" }}
          >
            <ChevronDown className="w-6 h-6 text-white" />
          </div>
        ) : (
          <img src={AVATAR} alt="Narad Ji" className="w-full h-full object-cover object-top" />
        )}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  );
}
