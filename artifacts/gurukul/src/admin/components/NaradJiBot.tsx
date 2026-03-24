import { useState, useRef, useEffect } from "react";
import { X, Send, HelpCircle, ChevronDown } from "lucide-react";

// ─── Knowledge base ───────────────────────────────────────────────────────────

type KBEntry = {
  keywords: string[];
  response: string;
  suggestions?: string[];
};

const KB: KBEntry[] = [
  {
    keywords: ["login", "sign in", "password", "pin", "auth", "access", "locked", "forgot"],
    response:
      "🔐 **Login & Authentication**\n\nAdmins log in at `/admin/login` using their **email + password**. Teachers and Assistants log in using their **registered phone number + 4-digit PIN**.\n\nIf a teacher enters the wrong PIN 5 times, the account is locked for 15 minutes. The Admin can reset their PIN from the **User Management** page at any time.\n\nAdmins can change their password from **Settings → Change Password**. Teachers/Assistants can change their PIN from **Settings → Change PIN**.",
    suggestions: ["How do I reset a teacher's PIN?", "Where is the Settings page?"],
  },
  {
    keywords: ["dashboard", "overview", "home", "stats", "summary", "count"],
    response:
      "📊 **Dashboard** (Admin only)\n\nThe Dashboard is your command centre. It shows at a glance:\n• Total students enrolled\n• Number of active teachers\n• Recent announcements\n• Upcoming calendar events\n• Attendance summary\n\nOnly the Admin role has access to the Dashboard. Teachers and Assistants begin on the **Courses & Classes** page when they log in.",
    suggestions: ["Who can see the dashboard?", "Tell me about announcements"],
  },
  {
    keywords: ["announcement", "notice", "news", "publish", "bulletin"],
    response:
      "📢 **Announcements** (Admin only)\n\nUse Announcements to post important notices that appear on the **public website** for all visitors to see.\n\n**To create an announcement:**\n1. Click **New Announcement**\n2. Enter a title and body text\n3. Set an optional expiry date\n4. Click **Publish**\n\nPublished announcements appear on the website's Announcements page immediately. Draft announcements are saved but not visible to the public.",
    suggestions: ["How does the calendar work?", "What is the Parent Portal?"],
  },
  {
    keywords: ["calendar", "event", "schedule", "date", "upcoming"],
    response:
      "📅 **Calendar** (Admin only)\n\nThe Calendar lets you manage events that appear on the **public Events page** of the website.\n\n**To add an event:**\n1. Click **Add Event**\n2. Enter event name, date, time, and description\n3. Save — it appears publicly immediately\n\nYou can edit or delete events at any time. Events are sorted chronologically for parents and visitors browsing the website.",
    suggestions: ["Tell me about course management", "How do announcements work?"],
  },
  {
    keywords: ["course management", "create course", "level", "section", "curriculum", "structure"],
    response:
      "📚 **Course Management** (Admin only)\n\nThis is where you build the entire class structure. The hierarchy is:\n**Course → Level → Section**\n\nFor example:\n• Course: Hindi\n  - Level: Beginner\n    * Section A (Saturday 10 AM)\n    * Section B (Sunday 2 PM)\n  - Level: Intermediate\n    * Section A\n\n**Steps:**\n1. Go to **Course Management**\n2. Create a course (e.g. Sanskrit, Dharma, Telugu)\n3. Add levels under each course\n4. Add sections (class batches) under each level\n\nSections are what teachers are assigned to and what students enrol in. Head to the **Help & Guide** page for a full walkthrough.",
    suggestions: ["How do I assign teachers to courses?", "How does student enrollment work?"],
  },
  {
    keywords: ["teacher", "staff", "faculty", "assign", "category", "senior teacher"],
    response:
      "👩‍🏫 **Staff Management** (Admin only)\n\nThis page lets you add and manage teachers and teaching assistants.\n\n**Adding a teacher:**\n1. Click **Add Teacher**\n2. Enter name, email, phone\n3. Choose category: *Senior Teacher* or *Assistant*\n4. Assign to a course, level, and optionally a section\n5. Save\n\nOnce added, go to **User Management** to create a portal login account for them so they can log in with their phone + PIN.\n\n💡 **Tip:** The User Management form has a staff picker — it auto-fills the teacher's name, phone, and role when you select them from the dropdown!",
    suggestions: ["How do I create a teacher login?", "What is User Management?"],
  },
  {
    keywords: ["student", "enrollment", "enrol", "fee", "payment", "registration", "new student"],
    response:
      "🎓 **Students & Payments** (Admin only)\n\nThis page displays all registered students with their enrollment status and fee records.\n\n**Key features:**\n• View all students with course enrollment details\n• Track fee payment status (paid / pending)\n• Filter by course, level, or section\n• View individual student profiles\n• Record fee payments\n\n**To register a new student,** use the **Student Registration** page (also in the sidebar). You'll fill in the student's name, parent contact info, and choose the course/section to enrol them in.",
    suggestions: ["How do I register a new student?", "How does attendance work?"],
  },
  {
    keywords: ["register", "new student", "admission", "enroll student", "student registration"],
    response:
      "📝 **Student Registration** (Admin only)\n\nUse this form to admit new students and enrol them in a course.\n\n**What you'll fill in:**\n• Student's full name and date of birth\n• Parent/Guardian name and contact (phone, email)\n• Emergency contact\n• Course, level, and section to enrol in\n• Notes or special requirements\n\nOnce registered, the student appears in **Students & Payments** and is linked to their teacher's class roster.",
    suggestions: ["How do I track fee payments?", "Tell me about attendance"],
  },
  {
    keywords: ["attendance", "mark", "present", "absent", "roll call", "absentee"],
    response:
      "✅ **Attendance** (Teacher, Assistant, Admin)\n\nThis is one of the primary tools for teachers. It lets you record who attended each class session.\n\n**How to mark attendance:**\n1. Go to **Attendance** in the sidebar\n2. Select the course, level, and section\n3. Choose the class date\n4. Mark each student as Present or Absent\n5. Save\n\n**Viewing records:**\nYou can view historical attendance, see attendance percentages per student, and filter by date range.\n\n💡 **Tip:** Attendance is scoped to your assigned sections — you'll only see students in your classes.",
    suggestions: ["How do I publish a weekly update?", "How does course documents work?"],
  },
  {
    keywords: ["weekly update", "class update", "parent update", "publish update", "teacher update"],
    response:
      "📰 **Weekly Updates** (Teacher, Assistant, Admin)\n\nWeekly Updates are rich posts that teachers write each week to keep parents informed about what's happening in class. Parents can read these on the **Parent Portal** after verifying their membership.\n\n**Creating an update:**\n1. Click **New Update**\n2. Select course, level, and section\n3. Set the week start and end dates\n4. Choose **Priority** (High, Normal, Low — High shows a red badge to parents)\n5. Fill in: Class Highlights, Topics Covered, Homework, Upcoming Plan, Reminders\n6. Add an optional attachment/reference link\n7. Save as Draft or Publish immediately\n\n**High Priority** updates get a 🔴 badge on the Parent Portal — use this for urgent reminders.",
    suggestions: ["What can parents see?", "How does the Parent Portal work?"],
  },
  {
    keywords: ["document", "upload", "material", "resource", "file", "worksheet", "pdf"],
    response:
      "📄 **Course Documents** (Teacher, Assistant, Admin)\n\nThis section lets teachers upload learning materials, worksheets, PDFs, and reference links for their classes.\n\n**To upload a document:**\n1. Go to **Course Documents**\n2. Select the course and section\n3. Click **Upload Document**\n4. Enter a title, description, and attach the file or provide a URL\n5. Save\n\nDocuments are organised by course and section. Students and parents can access shared documents through the portal if enabled.",
    suggestions: ["Tell me about weekly updates", "How does attendance work?"],
  },
  {
    keywords: ["inventory", "item", "stock", "asset", "track", "supply"],
    response:
      "📦 **Inventory** (Admin only)\n\nThe Inventory module helps you keep track of physical items owned by or used in the Gurukul — books, stationery, equipment, etc.\n\n**Features:**\n• Add items with name, quantity, and category\n• Edit quantity as items are used or restocked\n• Delete items no longer in use\n• View all items in a searchable, sortable list\n\nThis is especially useful for tracking text books issued to students and classroom supplies.",
    suggestions: ["Tell me about testimonials", "How does the messaging centre work?"],
  },
  {
    keywords: ["testimonial", "review", "feedback", "parent feedback", "quote"],
    response:
      "💬 **Testimonials** (Admin only)\n\nTestimonials are parent and student quotes that appear on the **public website** to showcase Gurukul's impact.\n\n**To add a testimonial:**\n1. Go to **Testimonials**\n2. Click **Add Testimonial**\n3. Enter the person's name, their relationship (Parent/Student), and their quote\n4. Set status to Published to show it on the website\n\nYou can manage (edit/hide/delete) testimonials at any time.",
    suggestions: ["Tell me about messaging centre", "What is the parent portal?"],
  },
  {
    keywords: ["messaging", "email", "send", "notify", "message", "communication", "contact"],
    response:
      "✉️ **Messaging Centre** (Admin only)\n\nThe Messaging Centre allows the Admin to send email communications directly to parents and students through the portal.\n\n**Key features:**\n• Compose and send emails to selected recipients\n• Filter recipients by course, level, or section\n• Send broadcast messages to all enrolled families\n• View sent message history\n\nMessages are sent from the Gurukul's configured email address. Ensure the SMTP settings are configured in the server environment for delivery to work.",
    suggestions: ["Tell me about user management", "How do I manage settings?"],
  },
  {
    keywords: ["user management", "portal user", "create user", "pin user", "teacher login", "access"],
    response:
      "🔑 **User Management** (Admin only)\n\nThis is where you create portal login accounts for **teachers and assistants** so they can log in with their phone number and a 4-digit PIN.\n\n**Creating a user:**\n1. Click **Add User**\n2. Select from the **existing staff dropdown** — it auto-fills name, phone, and role\n3. OR enter the details manually\n4. Click **Create & Generate PIN**\n5. The system generates a 4-digit PIN — **copy it and share it securely** with the teacher\n\n**Important:** The PIN is only shown once! After dismissing the banner, you can reset it but not view the original again.\n\n**Other actions:**\n• **Reset PIN** — generates a new PIN if the teacher forgets theirs\n• **Activate/Deactivate** — toggle access without deleting the account\n• **Delete** — permanently remove the account",
    suggestions: ["How does teacher login work?", "Where can I see role permissions?"],
  },
  {
    keywords: ["role", "permission", "access control", "rbac", "who can", "what can"],
    response:
      "🛡️ **Roles & Permissions**\n\nThe portal has three roles:\n\n**Admin** — Full access to everything\n**Teacher** — Courses, Attendance, Documents, Weekly Updates, Settings, Help\n**Assistant** — Same as Teacher\n\n📋 To view the full permissions matrix, go to **User Management** and click the **\"View Role Permissions Overview\"** link at the bottom of the page — it opens a detailed table in a modal.",
    suggestions: ["How do I create a teacher login?", "What can teachers see?"],
  },
  {
    keywords: ["settings", "change password", "change pin", "profile", "account"],
    response:
      "⚙️ **Settings**\n\n**For Admin:**\n• Change your login password under *Change Password*\n• Enter your current password, then the new one (twice to confirm)\n\n**For Teachers & Assistants:**\n• Change your 4-digit login PIN under *Change PIN*\n• Enter your current PIN, then the new one (twice to confirm)\n\nSettings is only visible to the Admin in the sidebar, but teachers and assistants can access it directly at `/admin/settings`.\n\n💡 The admin cannot see or reset their own PIN here — only the password. PIN resets for teachers are done from **User Management**.",
    suggestions: ["How does teacher login work?", "Tell me about User Management"],
  },
  {
    keywords: ["parent portal", "parent", "parents", "member", "public", "gated", "verify"],
    response:
      "🏠 **Parent Portal** (Public website feature)\n\nThe Parent Portal is a public section of the Gurukul website visible to all visitors at `/parents-portal`.\n\n**What parents can see:**\n• General information about the Gurukul\n• Public testimonials\n• A \"Weekly Class Updates\" section (gated)\n\n**The gated Weekly Updates** require parents to verify their temple membership:\n1. Solve a captcha\n2. Enter their registered phone number\n3. If found in the member database, they get access to all published weekly updates\n\nWeekly Updates published by teachers appear here — sorted by date, filterable by course, with expandable cards showing class highlights, homework, and reminders.",
    suggestions: ["How do teachers publish updates?", "How does member verification work?"],
  },
  {
    keywords: ["member", "lookup", "member lookup", "verify phone", "membership"],
    response:
      "📱 **Member Lookup / Phone Verification**\n\nThe Parent Portal uses phone number verification to grant access to gated Weekly Updates. The system checks the member's phone number against the temple's member database.\n\nIf a parent's phone is not found, they'll see an error. The Admin can manage member records to ensure all active families are in the system.\n\nThis verification protects private class information from being accessible to the general public.",
    suggestions: ["What can parents see?", "Tell me about weekly updates"],
  },
  {
    keywords: ["courses classes", "my classes", "my course", "assigned", "section view"],
    response:
      "📖 **Courses & Classes** (Teacher, Assistant)\n\nThis is the teacher's primary view of their assigned courses.\n\n**What you'll see:**\n• All courses, levels, and sections you are assigned to\n• Enrolled student list per section\n• Quick links to mark attendance or upload documents\n\nTeachers only see their own assigned sections. Admins can see all courses across all teachers.\n\nTo get assigned to a course, the Admin must configure your assignment in **Staff Management**.",
    suggestions: ["How do I take attendance?", "How do I upload documents?"],
  },
  {
    keywords: ["help", "guide", "how to", "documentation", "manual", "tutorial", "what can you"],
    response:
      "🙏 **Narad Ji is here to help!**\n\nI can answer questions about every feature in this portal. Try asking me about:\n\n• **Login** — how teachers and admins sign in\n• **Dashboard** — the admin overview\n• **Courses** — course/level/section structure\n• **Attendance** — marking and viewing\n• **Weekly Updates** — posting class updates for parents\n• **User Management** — creating teacher logins\n• **Parent Portal** — what parents can access\n• **Settings** — changing passwords and PINs\n\nOr click **Help & Guide** in the sidebar for the full Functional Specification document!",
    suggestions: ["How does login work?", "What can teachers do?", "Tell me about the Parent Portal"],
  },
  {
    keywords: ["narad", "who are you", "bot", "ai", "assistant name", "your name"],
    response:
      "🪗 **Narad Ji at your service!**\n\nNarad Ji — the divine sage and messenger of the heavens — is honoured to guide you through this Gurukul portal. As the celestial keeper of knowledge, I shall illuminate even the most bewildering corners of this system!\n\nI am a static guide built into this portal with knowledge of every feature. Ask me anything about how the Admin Portal works, and I shall respond with wisdom and clarity.\n\n*Narayan Narayan!* 🙏",
    suggestions: ["What can you help with?", "How does login work?"],
  },
  {
    keywords: ["student corner", "students corner", "showcase", "student work"],
    response:
      "🌟 **Student's Corner** (Public website)\n\nThe Student's Corner is a public section of the Gurukul website that celebrates student achievements, artwork, and creative work.\n\nThis section is managed from the public website's content. Students and teachers can contribute work to be featured here. It helps inspire prospective students and showcase the vibrant learning community at BHT Gurukul.",
    suggestions: ["Tell me about the Parent Portal", "What is the Dashboard?"],
  },
  {
    keywords: ["priority", "high priority", "normal", "low", "urgent"],
    response:
      "🔴 **Priority in Weekly Updates**\n\nWhen creating a Weekly Update, you can set its priority:\n\n• **High** — Shows a 🔴 High Priority badge on both the admin list and the Parent Portal card. Use for urgent reminders (e.g. exam next week, school closure).\n• **Normal** — Standard update, no special badge.\n• **Low** — Routine informational update.\n\nPriority helps parents quickly spot important communications among multiple updates.",
    suggestions: ["How do I publish a weekly update?", "What can parents see?"],
  },
];

const DEFAULT_RESPONSE =
  "🤔 Narad Ji ponders... I don't have a specific answer for that, but I can help with topics like **login, dashboard, courses, attendance, weekly updates, user management, parent portal, settings**, and more.\n\nTry rephrasing your question or click **Help & Guide** in the sidebar for the complete Functional Specification!";

const SUGGESTIONS_DEFAULT = [
  "How does login work?",
  "How do I create a teacher login?",
  "How do teachers publish updates?",
  "What can parents see?",
  "How does attendance work?",
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function findResponse(input: string): KBEntry {
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
  return best ?? { keywords: [], response: DEFAULT_RESPONSE };
}

function formatResponse(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p.split("\n").map((line, j) =>
          j === 0 ? <span key={j}>{line}</span> : <span key={j}><br />{line}</span>
        )
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Msg = { role: "user" | "bot"; text: string; id: number };

let msgId = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export default function NaradJiBot() {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: msgId++,
      role: "bot",
      text: "🙏 **Narayan Narayan!** I am Narad Ji, your guide through this Gurukul portal.\n\nAsk me anything about any feature — login, courses, attendance, weekly updates, user management, parent portal — and I shall illuminate the way!\n\nOr click **Help & Guide** in the sidebar for the complete documentation.",
    },
  ]);
  const [typing, setTyping]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send(text: string) {
    const q = text.trim();
    if (!q) return;
    setInput("");
    const userMsg: Msg = { id: msgId++, role: "user", text: q };
    setMessages(prev => [...prev, userMsg]);
    setTyping(true);
    setTimeout(() => {
      const entry = findResponse(q);
      setMessages(prev => [...prev, { id: msgId++, role: "bot", text: entry.response }]);
      setTyping(false);
    }, 600);
  }

  const lastBotEntry = [...messages].reverse().find(m => m.role === "bot");
  const entry = lastBotEntry ? findResponse(lastBotEntry.text) : null;
  const chips = entry?.suggestions ?? SUGGESTIONS_DEFAULT;

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: "linear-gradient(135deg, #d97706, #92400e)" }}
        title="Ask Narad Ji"
      >
        {open
          ? <ChevronDown className="w-6 h-6 text-white" />
          : <span className="text-2xl leading-none select-none">🪗</span>}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-amber-200 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-amber-100"
            style={{ background: "linear-gradient(135deg, #92400e, #d97706)" }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl select-none shrink-0">
              🪗
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Narad Ji</p>
              <p className="text-amber-200 text-[11px]">Your Gurukul Portal Guide</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-amber-50/30">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                {m.role === "bot" && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5 select-none"
                    style={{ background: "linear-gradient(135deg, #92400e, #d97706)" }}>
                    🪗
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-secondary text-white rounded-br-sm"
                    : "bg-white text-secondary shadow-sm border border-amber-100 rounded-bl-sm"
                }`}>
                  {formatResponse(m.text)}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 select-none"
                  style={{ background: "linear-gradient(135deg, #92400e, #d97706)" }}>
                  🪗
                </div>
                <div className="bg-white border border-amber-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          <div className="px-3 py-2 border-t border-amber-100 bg-white flex gap-1.5 flex-wrap">
            {chips.slice(0, 3).map(c => (
              <button
                key={c}
                onClick={() => send(c)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors leading-tight"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-2 bg-white border-t border-border flex gap-2 items-center">
            <input
              className="flex-1 text-sm border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 bg-gray-50"
              placeholder="Ask Narad Ji anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #92400e, #d97706)" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
