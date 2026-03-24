import { useState } from "react";
import { useAuth } from "../AuthContext";
import { canAccess } from "../rbac";
import {
  ChevronDown, ChevronUp, Search, BookOpen, LayoutDashboard, Megaphone,
  Calendar, Layers, GraduationCap, Users, UserPlus, Package, Quote,
  Mail, ShieldCheck, Settings, ClipboardList, FileText, Newspaper,
  HelpCircle, Lock, Globe, Phone,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "admin" | "teacher" | "assistant" | "all";

type SpecSection = {
  id: string;
  title: string;
  icon: React.ElementType;
  roles: Role[];
  color: string;
  overview: string;
  steps?: { heading: string; detail: string }[];
  tips?: string[];
  notes?: string[];
};

// ─── Specification data ───────────────────────────────────────────────────────

const SECTIONS: SpecSection[] = [
  {
    id: "auth",
    title: "Login & Authentication",
    icon: Lock,
    roles: ["all"],
    color: "from-slate-500 to-slate-700",
    overview:
      "The portal supports two login methods: email + password for admins, and phone number + 4-digit PIN for teachers and assistants. Accounts are locked after 5 consecutive wrong PIN entries for 15 minutes.",
    steps: [
      { heading: "Admin login", detail: "Navigate to /admin/login. Enter your registered email address and password, then click Sign In." },
      { heading: "Teacher / Assistant login", detail: "On the login page, type your 10-digit phone number. The form switches to PIN mode automatically. Enter your 4-digit PIN and click Sign In." },
      { heading: "Forgot PIN", detail: "Ask the Admin to reset your PIN from the User Management page. A new PIN will be generated and shared with you." },
      { heading: "Change credentials", detail: "Admins change their password from Settings → Change Password. Teachers change their PIN from Settings → Change PIN." },
    ],
    tips: ["PINs are 4 digits and case-insensitive.", "After 5 wrong attempts the account locks for 15 minutes automatically.", "The system detects phone vs email input and switches mode automatically."],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
    color: "from-indigo-500 to-indigo-700",
    overview:
      "The Dashboard is the Admin's home screen, providing a high-level snapshot of the Gurukul's operations — student counts, teacher counts, attendance highlights, and recent announcements.",
    steps: [
      { heading: "Access", detail: "Admins are redirected here automatically after login. Teachers and Assistants see Courses & Classes instead." },
      { heading: "Stats cards", detail: "Top cards show total students, active teachers, upcoming events, and today's attendance rate." },
      { heading: "Recent activity", detail: "Scroll down to see the latest announcements and any recently published weekly updates." },
    ],
    tips: ["The Dashboard is a read-only summary — no edits happen here. Use the sidebar links to manage each area."],
  },
  {
    id: "announcements",
    title: "Announcements",
    icon: Megaphone,
    roles: ["admin"],
    color: "from-rose-500 to-rose-700",
    overview:
      "Announcements are public notices posted on the Gurukul's website, visible to all visitors. Use them for important dates, closures, event notices, or any news you want to share broadly.",
    steps: [
      { heading: "Create", detail: "Click New Announcement. Enter a title, body text, and an optional expiry date. Set status to Published to show it on the website immediately." },
      { heading: "Draft vs Published", detail: "Drafts are saved but not visible publicly. You can edit and publish them later." },
      { heading: "Edit / Delete", detail: "Click the edit (pencil) icon on any announcement to modify it. Deleting removes it from the public site immediately." },
    ],
    tips: ["Set an expiry date for time-sensitive notices so they auto-hide after the event.", "Drafts let you prepare announcements in advance."],
  },
  {
    id: "calendar",
    title: "Events Calendar",
    icon: Calendar,
    roles: ["admin"],
    color: "from-cyan-500 to-cyan-700",
    overview:
      "The Events Calendar lets you manage all Gurukul events that appear on the public website's calendar page — festivals, special classes, exams, closures, and community gatherings.",
    steps: [
      { heading: "Add event", detail: "Click Add Event. Fill in the event name, date, time, location, and a short description. Save to publish it immediately." },
      { heading: "Edit / Delete", detail: "Click any event in the list to edit its details. Delete removes it from the public calendar." },
      { heading: "Public view", detail: "Events appear on the website in chronological order. Past events are shown below upcoming events." },
    ],
    tips: ["Add recurring events (e.g. monthly puja) individually since recurring events are not yet automated.", "Use the Description field to give parents all the details they need."],
  },
  {
    id: "course-management",
    title: "Course Management",
    icon: Layers,
    roles: ["admin"],
    color: "from-violet-500 to-violet-700",
    overview:
      "Course Management is where the Admin builds the complete class structure. The hierarchy is: Course → Level → Section. Everything else (teachers, students, attendance, weekly updates) is tied to this structure.",
    steps: [
      { heading: "Create a Course", detail: "Go to Course Management. Click Add Course. Enter the course name (e.g. Hindi, Sanskrit, Dharma, Telugu, Gujarati) and save." },
      { heading: "Add Levels", detail: "Under each course, add levels such as Beginner, Intermediate, Advanced, or Level 1, Level 2, etc. Levels represent the progression within a course." },
      { heading: "Add Sections", detail: "Under each level, add sections — these are the actual class batches (e.g. Section A on Saturdays 10 AM, Section B on Sundays 2 PM). Each section has its own enrolled students and assigned teacher." },
      { heading: "Edit or Archive", detail: "You can rename courses, levels, and sections at any time. Deleting a section will remove its attendance records, so archive rather than delete when possible." },
    ],
    tips: [
      "Plan your structure before adding teachers and students — changes later can be disruptive.",
      "Sections are the smallest unit — each has one teacher and one group of students.",
      "You can have multiple sections under the same level for different time slots.",
    ],
  },
  {
    id: "teachers",
    title: "Staff Management",
    icon: GraduationCap,
    roles: ["admin"],
    color: "from-blue-500 to-blue-700",
    overview:
      "Staff Management is where you add, edit, and assign teachers and teaching assistants. After adding staff here, you must also create their portal login in User Management.",
    steps: [
      { heading: "Add a teacher", detail: "Click Add Teacher. Enter name, email, phone number, and choose category: Senior Teacher or Assistant. Assign them to a course, level, and section." },
      { heading: "Edit assignment", detail: "Click the edit icon to change a teacher's course or section assignment. A teacher can be assigned to multiple sections." },
      { heading: "View assignments", detail: "The teachers list shows each teacher's assigned course, level, and section at a glance." },
      { heading: "Create portal login", detail: "After adding a teacher here, go to User Management → Add User. Select the teacher from the staff dropdown — their details auto-fill. Generate their PIN." },
    ],
    tips: [
      "The portal distinguishes between 'Teacher' (Senior Teacher) and 'Assistant' in the RBAC system — both have the same permissions currently.",
      "A teacher must have a portal user account to log in. Adding them in Staff Management alone is not enough.",
    ],
  },
  {
    id: "students",
    title: "Students & Payments",
    icon: Users,
    roles: ["admin"],
    color: "from-green-500 to-green-700",
    overview:
      "The Students & Payments page gives the Admin a complete view of all enrolled students, their course placements, and fee payment status. You can record payments and track outstanding balances here.",
    steps: [
      { heading: "View students", detail: "The main table shows all students with their name, enrolled course/section, parent contact, and fee status." },
      { heading: "Filter", detail: "Use the dropdowns to filter by course, level, or section to see students in a specific class." },
      { heading: "Record payment", detail: "Click on a student row to open their profile. Mark fees as paid, and enter the amount and date of payment." },
      { heading: "Export", detail: "Use the export option to download student data for reporting." },
    ],
    tips: ["Always register students first using Student Registration before they appear here.", "Fee status is colour-coded: green = paid, red = overdue, yellow = partial."],
  },
  {
    id: "registration",
    title: "Student Registration",
    icon: UserPlus,
    roles: ["admin"],
    color: "from-emerald-500 to-emerald-700",
    overview:
      "Student Registration is the form used to admit new students and enrol them in a course section. Once registered, the student is linked to their class and appears in the teacher's attendance roster.",
    steps: [
      { heading: "Open the form", detail: "Go to Student Registration in the sidebar. Click New Registration." },
      { heading: "Fill student details", detail: "Enter: student name, date of birth, parent/guardian name, phone number, email address, and emergency contact." },
      { heading: "Choose enrollment", detail: "Select the course, level, and section the student is joining." },
      { heading: "Submit", detail: "Click Register. The student now appears in Students & Payments and in the teacher's class roster for attendance." },
    ],
    tips: ["Double-check the phone number — it's used for parent portal verification.", "You can register a student without selecting a section if placement is pending."],
  },
  {
    id: "inventory",
    title: "Inventory",
    icon: Package,
    roles: ["admin"],
    color: "from-orange-500 to-orange-700",
    overview:
      "The Inventory module helps track physical assets and supplies owned or used by the Gurukul — textbooks, stationery, equipment, ceremonial items, and more.",
    steps: [
      { heading: "Add item", detail: "Click Add Item. Enter the item name, category, current quantity, and any notes." },
      { heading: "Update quantity", detail: "Click the edit icon on an item to adjust the quantity as items are used, restocked, or lost." },
      { heading: "Delete item", detail: "Remove items that are no longer tracked. This is permanent." },
      { heading: "Search", detail: "Use the search bar to quickly find items by name or category." },
    ],
    tips: ["Use categories consistently (e.g. Books, Stationery, Equipment) to make filtering easier.", "Consider adding a note when adjusting quantity to track why the change was made."],
  },
  {
    id: "testimonials",
    title: "Testimonials",
    icon: Quote,
    roles: ["admin"],
    color: "from-pink-500 to-pink-700",
    overview:
      "Testimonials are quotes from parents and students displayed on the public website's homepage and about page. They build trust with prospective families considering enrolment.",
    steps: [
      { heading: "Add testimonial", detail: "Click Add Testimonial. Enter the person's name, their relationship (Parent/Student/Alumni), and their quote." },
      { heading: "Publish / Draft", detail: "Set status to Published to display it on the website. Drafts are saved but not shown." },
      { heading: "Edit or Hide", detail: "Click edit to update the text. Set to Draft to hide without deleting." },
    ],
    tips: ["Keep quotes concise — 2–4 sentences is ideal for readability.", "Use real names (with consent) for authenticity."],
  },
  {
    id: "messaging",
    title: "Messaging Centre",
    icon: Mail,
    roles: ["admin"],
    color: "from-teal-500 to-teal-700",
    overview:
      "The Messaging Centre enables the Admin to send email communications to parents and students. Use it for broadcast notices, fee reminders, or targeted messages to a specific course group.",
    steps: [
      { heading: "Compose message", detail: "Click Compose. Enter a subject and body. Use the recipient filter to choose All families, or filter by course/level/section." },
      { heading: "Send", detail: "Click Send. Emails are dispatched immediately using the Gurukul's configured email address (SMTP)." },
      { heading: "View history", detail: "The Sent tab shows all previous messages with timestamps and recipient counts." },
    ],
    notes: ["SMTP must be configured in the server environment for emails to be delivered. Contact the system administrator if emails are not being received."],
    tips: ["Test by sending to yourself first.", "Use specific subject lines so parents don't mistake messages for spam."],
  },
  {
    id: "roles",
    title: "User Management",
    icon: ShieldCheck,
    roles: ["admin"],
    color: "from-red-500 to-red-700",
    overview:
      "User Management is where Admins create portal login accounts for teachers and assistants. The system auto-generates a secure 4-digit PIN for each user. Teachers use their phone number + PIN to log in.",
    steps: [
      { heading: "Add user", detail: "Click Add User. Use the staff dropdown to select an existing teacher — name, phone, and role auto-fill. Or enter details manually. Click Create & Generate PIN." },
      { heading: "Save the PIN", detail: "The PIN is shown once in a banner. Copy it immediately and share it securely with the teacher. After dismissing, it cannot be viewed again." },
      { heading: "Reset PIN", detail: "Click Reset PIN next to a user to generate a new PIN. The old PIN is immediately invalidated." },
      { heading: "Activate / Deactivate", detail: "Toggle a user's status. Inactive users cannot log in but their account is preserved." },
      { heading: "Delete", detail: "Permanently removes the user account. The teacher remains in Staff Management but loses portal access." },
    ],
    tips: [
      "Staff members already registered as portal users are marked 'already a portal user' in the dropdown and cannot be added again.",
      "View Role Permissions → click the link at the bottom of the page to see what each role can access.",
      "PINs are bcrypt-hashed in the database — nobody (including admins) can read them after creation.",
    ],
  },
  {
    id: "courses",
    title: "Courses & Classes",
    icon: BookOpen,
    roles: ["teacher", "assistant"],
    color: "from-blue-500 to-blue-700",
    overview:
      "Courses & Classes is the teacher's primary view. It shows all courses, levels, and sections you are assigned to, along with the enrolled student roster for each section.",
    steps: [
      { heading: "View your classes", detail: "Open Courses & Classes in the sidebar. You see only the sections you are assigned to by the Admin." },
      { heading: "View students", detail: "Click a section to see the enrolled student list — name, parent contact, and enrollment date." },
      { heading: "Quick actions", detail: "From the section view, use quick links to go directly to Take Attendance or Upload Documents for that section." },
    ],
    tips: ["If you don't see a section you teach, ask the Admin to verify your assignment in Staff Management.", "Enrolled students are added here when the Admin registers them in Student Registration."],
  },
  {
    id: "documents",
    title: "Course Documents",
    icon: FileText,
    roles: ["teacher", "assistant"],
    color: "from-purple-500 to-purple-700",
    overview:
      "Course Documents lets teachers upload and manage learning materials, worksheets, PDFs, reference links, and resources for their classes.",
    steps: [
      { heading: "Select class", detail: "Choose the course and section for the document." },
      { heading: "Upload", detail: "Click Upload Document. Enter a title and description. Either attach a file or paste a URL (Google Doc, YouTube link, etc.)." },
      { heading: "Manage", detail: "Edit or delete documents at any time. Documents are visible to enrolled students if the parent portal sharing is enabled." },
    ],
    tips: ["For large files, use a cloud link (Google Drive, Dropbox) rather than uploading directly.", "Name documents clearly so students and parents can identify them easily."],
  },
  {
    id: "attendance",
    title: "Attendance",
    icon: ClipboardList,
    roles: ["teacher", "assistant"],
    color: "from-green-500 to-green-700",
    overview:
      "Attendance lets teachers record who attended each class session. You can view historical records, see individual student attendance percentages, and generate summaries.",
    steps: [
      { heading: "Select class and date", detail: "Go to Attendance. Choose the course, level, and section. Pick the class date." },
      { heading: "Mark attendance", detail: "For each student, tap Present (✓) or Absent (✗). Add notes for tardiness or early departures if needed." },
      { heading: "Save", detail: "Click Save Attendance. Records are saved immediately." },
      { heading: "View history", detail: "Switch to the History tab to see past attendance records. Filter by date range or student." },
      { heading: "Attendance report", detail: "The report view shows each student's attendance percentage over a selected period — useful for identifying students who need follow-up." },
    ],
    tips: ["Mark attendance promptly after each class while it's fresh.", "Attendance is scoped to your sections — you won't see other teachers' classes.", "Parents can be informed of absences through the Messaging Centre (Admin only)."],
  },
  {
    id: "weekly-updates",
    title: "Weekly Updates",
    icon: Newspaper,
    roles: ["teacher", "assistant", "admin"],
    color: "from-amber-500 to-amber-700",
    overview:
      "Weekly Updates are rich posts that teachers publish each week to keep parents informed about class activities, homework, upcoming topics, and important reminders. Parents read these on the Parent Portal after verifying their membership.",
    steps: [
      { heading: "Create a new update", detail: "Click New Update. Select the course, level, and section this update is for." },
      { heading: "Set the week period", detail: "Choose the Week Start and Week End dates. Set the Priority — High (🔴 urgent), Normal, or Low." },
      { heading: "Enter a title", detail: "Write a descriptive title, e.g. 'Week 3 — Introduction to Devanagari Script'." },
      { heading: "Fill the content sections", detail: "Class Highlights (required): summary of what happened. Topics Covered, Homework (shown highlighted in yellow), Upcoming Plan, Reminders (shown highlighted in rose). These are all optional but recommended." },
      { heading: "Add attachment", detail: "Paste a link to a Google Doc, YouTube video, or any reference material parents should see." },
      { heading: "Save or Publish", detail: "Click Save Draft to save privately, or Publish to make it visible on the Parent Portal immediately." },
    ],
    tips: [
      "High Priority updates show a 🔴 badge on the Parent Portal — reserve for truly urgent notices.",
      "Draft updates are only visible to you and admins in the admin portal.",
      "Parents filter updates by course — make sure you select the correct course and section.",
      "You can edit a published update anytime. Changes are reflected on the Parent Portal immediately.",
    ],
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    roles: ["all"],
    color: "from-gray-500 to-gray-700",
    overview:
      "Settings lets users change their own login credentials. Admins change their password; Teachers and Assistants change their 4-digit PIN.",
    steps: [
      { heading: "Change Password (Admin)", detail: "Go to Settings. Under Change Password, enter your current password, then the new password twice. Click Update Password." },
      { heading: "Change PIN (Teacher/Assistant)", detail: "Go to Settings. Under Change PIN, enter your current PIN, then the new 4-digit PIN twice. Click Update PIN." },
    ],
    notes: ["Admins cannot change their own PIN here — they use a password.", "Teachers cannot change their own password here — they use a PIN.", "If you forget your current credentials, ask the Admin to reset them from User Management."],
    tips: ["Choose a PIN you can remember but don't share with others.", "Passwords should be at least 8 characters with a mix of letters and numbers."],
  },
  {
    id: "parent-portal",
    title: "Parent Portal",
    icon: Globe,
    roles: ["all"],
    color: "from-orange-500 to-orange-700",
    overview:
      "The Parent Portal is the public-facing section of the Gurukul website at /parents-portal. It gives enrolled families access to Weekly Class Updates after verifying their temple membership via phone number.",
    steps: [
      { heading: "Parent accesses the portal", detail: "Parents visit the website and click 'Parents Portal' in the navigation. They see a general overview page." },
      { heading: "Access Weekly Updates", detail: "Parents click the 'View Weekly Updates' button to enter the gated section." },
      { heading: "Solve captcha", detail: "A simple captcha puzzle prevents bot access." },
      { heading: "Phone verification", detail: "Parents enter the phone number registered with their temple membership. If found in the member database, access is granted." },
      { heading: "View updates", detail: "Parents see all Published weekly updates from teachers, filterable by course. Each card expands to show full details: highlights, homework, reminders, and links." },
    ],
    notes: ["Only Published updates are visible to parents. Drafts remain private.", "High Priority updates display a 🔴 badge so parents immediately notice urgent notices.", "Parents cannot log in to edit anything — the portal is read-only for families."],
    tips: ["Publish updates regularly so parents feel informed and engaged.", "Use the Messaging Centre to notify parents when new updates are available."],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RolePill({ role }: { role: Role }) {
  const map: Record<Role, { label: string; cls: string }> = {
    admin:     { label: "Admin",     cls: "bg-red-100 text-red-700"    },
    teacher:   { label: "Teacher",   cls: "bg-blue-100 text-blue-700"  },
    assistant: { label: "Assistant", cls: "bg-purple-100 text-purple-700" },
    all:       { label: "All Roles", cls: "bg-green-100 text-green-700" },
  };
  const { label, cls } = map[role];
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function AccordionSection({ section, defaultOpen }: { section: SpecSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const Icon = section.icon;
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-secondary text-sm">{section.title}</h3>
            {section.roles.map(r => <RolePill key={r} role={r} />)}
          </div>
          {!open && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{section.overview.slice(0, 90)}…</p>
          )}
        </div>
        <div className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-5 space-y-5 bg-gray-50/40">
          <p className="text-sm text-muted-foreground leading-relaxed">{section.overview}</p>

          {section.steps && section.steps.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">How it works</h4>
              <ol className="space-y-3">
                {section.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${section.color} text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5`}>
                      {i + 1}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-secondary">{s.heading} — </span>
                      <span className="text-sm text-muted-foreground">{s.detail}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {section.tips && section.tips.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">💡 Tips</h4>
              <ul className="space-y-1.5">
                {section.tips.map((t, i) => (
                  <li key={i} className="text-xs text-amber-900 flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section.notes && section.notes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">📌 Important Notes</h4>
              <ul className="space-y-1.5">
                {section.notes.map((n, i) => (
                  <li key={i} className="text-xs text-blue-900 flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Help() {
  const { user } = useAuth();
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "teacher" | "assistant">("all");
  const [expandAll, setExpandAll] = useState(false);

  const userRole = user?.role ?? "admin";

  function isVisible(s: SpecSection) {
    const roleMatch =
      roleFilter === "all"
        ? s.roles.includes("all") || s.roles.includes(userRole as Role) || s.roles.some(r => r === roleFilter)
        : s.roles.includes("all") || s.roles.includes(roleFilter as Role);
    const q = search.toLowerCase();
    const textMatch = !q ||
      s.title.toLowerCase().includes(q) ||
      s.overview.toLowerCase().includes(q) ||
      s.steps?.some(st => st.heading.toLowerCase().includes(q) || st.detail.toLowerCase().includes(q)) ||
      s.tips?.some(t => t.toLowerCase().includes(q));
    return roleMatch && textMatch;
  }

  const visible = SECTIONS.filter(isVisible);

  const ROLE_FILTER_OPTS = [
    { value: "all",       label: "All Roles" },
    { value: "admin",     label: "Admin only" },
    { value: "teacher",   label: "Teacher / Assistant" },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-sm"
        style={{ background: "linear-gradient(135deg, #92400e 0%, #d97706 60%, #fbbf24 100%)" }}>
        <div className="px-6 py-8 flex gap-5 items-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl shrink-0 select-none">
            🪗
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Help & Functional Guide</h1>
            <p className="text-amber-100 text-sm max-w-lg leading-relaxed">
              Welcome to Narad Ji's guide to the Gurukul Admin Portal. Everything you need to know about every feature — written clearly, step by step. Use the search or role filter to find what you need.
            </p>
          </div>
        </div>
        <div className="px-6 pb-5">
          <div className="bg-white/15 rounded-xl px-4 py-2.5 text-amber-100 text-xs leading-relaxed">
            <strong className="text-white">Quick tip:</strong> The 🪗 Narad Ji bot (bottom-right of every page) can answer questions instantly — just type your question. This page contains the full specification with step-by-step instructions.
          </div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm px-5 py-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="Search features…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {ROLE_FILTER_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                roleFilter === opt.value
                  ? "bg-secondary text-white border-secondary"
                  : "border-border text-muted-foreground hover:border-secondary/50 hover:text-secondary"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setExpandAll(v => !v)}
          className="ml-auto text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors whitespace-nowrap"
        >
          {expandAll ? "Collapse all" : "Expand all"}
        </button>
        <span className="text-xs text-muted-foreground">
          {visible.length} of {SECTIONS.length} sections
        </span>
      </div>

      {/* ── Sections ──────────────────────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sections match your search</p>
          <p className="text-sm mt-1">Try different keywords or clear the filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(s => (
            <AccordionSection key={s.id} section={s} defaultOpen={expandAll} />
          ))}
        </div>
      )}

      {/* ── Footer note ───────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-800 text-center">
        🙏 <strong>Narayan Narayan!</strong> Still have questions? Click the <strong>🪗</strong> button at the bottom-right of any page to chat with Narad Ji directly.
      </div>
    </div>
  );
}
