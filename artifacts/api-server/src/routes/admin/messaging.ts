import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  enrollmentsTable,
  courseLevelsTable,
  coursesTable,
  emailLogsTable,
  contactsTable,
} from "@workspace/db/schema";
import { eq, asc, isNotNull, sql, desc } from "drizzle-orm";
import nodemailer from "nodemailer";

const router: IRouter = Router();

// ─── Build transporter (SMTP via env vars) ────────────────────────────────────

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

// ─── GET /api/admin/messaging/recipients ─────────────────────────────────────
// Returns filtered parent list (for preview before sending)

router.get("/recipients", async (req, res) => {
  const { course, curricYear, employer } = req.query as Record<string, string | undefined>;

  try {
    const rows = await db
      .select({
        studentCode:    studentsTable.studentCode,
        studentName:    studentsTable.name,
        curriculumYear: studentsTable.curriculumYear,
        motherName:     studentsTable.motherName,
        motherEmail:    studentsTable.motherEmail,
        motherEmployer: studentsTable.motherEmployer,
        fatherName:     studentsTable.fatherName,
        fatherEmail:    studentsTable.fatherEmail,
        fatherEmployer: studentsTable.fatherEmployer,
        courseName:     coursesTable.name,
      })
      .from(studentsTable)
      .leftJoin(enrollmentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
      .leftJoin(courseLevelsTable, eq(courseLevelsTable.id, enrollmentsTable.courseLevelId))
      .leftJoin(coursesTable, eq(coursesTable.id, courseLevelsTable.courseId))
      .orderBy(asc(studentsTable.studentCode));

    // De-duplicate by student, then aggregate course names
    const studentMap = new Map<string, {
      studentCode: string; studentName: string;
      curriculumYear: string | null;
      motherName: string | null; motherEmail: string | null; motherEmployer: string | null;
      fatherName: string | null; fatherEmail: string | null; fatherEmployer: string | null;
      courses: string[];
    }>();

    for (const r of rows) {
      const key = r.studentCode ?? "";
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentCode: r.studentCode ?? "",
          studentName: r.studentName ?? "",
          curriculumYear: r.curriculumYear,
          motherName: r.motherName,
          motherEmail: r.motherEmail,
          motherEmployer: r.motherEmployer,
          fatherName: r.fatherName,
          fatherEmail: r.fatherEmail,
          fatherEmployer: r.fatherEmployer,
          courses: [],
        });
      }
      if (r.courseName) {
        const entry = studentMap.get(key)!;
        if (!entry.courses.includes(r.courseName)) entry.courses.push(r.courseName);
      }
    }

    let entries = Array.from(studentMap.values());

    // Apply filters
    if (course && course !== "All") {
      entries = entries.filter(e => e.courses.includes(course));
    }
    if (curricYear && curricYear !== "All") {
      entries = entries.filter(e => e.curriculumYear === curricYear);
    }
    if (employer && employer !== "All") {
      entries = entries.filter(e =>
        (e.motherEmployer ?? "").toLowerCase().includes(employer.toLowerCase()) ||
        (e.fatherEmployer ?? "").toLowerCase().includes(employer.toLowerCase())
      );
    }

    // Build recipient list (deduplicate emails)
    const recipientSet = new Map<string, {
      name: string; email: string; relation: string; studentName: string; studentCode: string;
    }>();

    for (const e of entries) {
      if (e.motherEmail?.trim()) {
        recipientSet.set(e.motherEmail.toLowerCase(), {
          name: e.motherName ?? "Parent",
          email: e.motherEmail.trim(),
          relation: "Mother",
          studentName: e.studentName,
          studentCode: e.studentCode,
        });
      }
      if (e.fatherEmail?.trim()) {
        recipientSet.set(e.fatherEmail.toLowerCase(), {
          name: e.fatherName ?? "Parent",
          email: e.fatherEmail.trim(),
          relation: "Father",
          studentName: e.studentName,
          studentCode: e.studentCode,
        });
      }
    }

    return res.json(Array.from(recipientSet.values()));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch recipients");
    return res.status(500).json({ error: "Failed to fetch recipients" });
  }
});

// ─── GET /api/admin/messaging/employers ─────────────────────────────────────
// Returns distinct employer values

router.get("/employers", async (_req, res) => {
  try {
    const rows = await db
      .selectDistinct({ employer: studentsTable.motherEmployer })
      .from(studentsTable)
      .where(isNotNull(studentsTable.motherEmployer));
    const rows2 = await db
      .selectDistinct({ employer: studentsTable.fatherEmployer })
      .from(studentsTable)
      .where(isNotNull(studentsTable.fatherEmployer));

    const set = new Set<string>();
    [...rows, ...rows2].forEach(r => { if (r.employer?.trim()) set.add(r.employer.trim()); });
    return res.json(Array.from(set).sort());
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch employers" });
  }
});

// ─── POST /api/admin/messaging/send ─────────────────────────────────────────

router.post("/send", async (req, res) => {
  const {
    subject, body, recipients, filterCourse, filterCurricYear, filterEmployer,
  } = req.body as {
    subject: string;
    body: string;
    recipients: { name: string; email: string; studentName: string }[];
    filterCourse?: string;
    filterCurricYear?: string;
    filterEmployer?: string;
  };

  const sentBy = req.headers["x-user-email"] as string | undefined;

  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: "Subject and body are required." });
  }
  if (!recipients?.length) {
    return res.status(400).json({ error: "No recipients selected." });
  }

  const transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@bhtohio.org";

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (const r of recipients) {
    const personalised = body
      .replace(/\{\{parent_name\}\}/gi, r.name)
      .replace(/\{\{student_name\}\}/gi, r.studentName);

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"BHT Gurukul" <${from}>`,
          to: r.email,
          subject,
          html: personalised.replace(/\n/g, "<br>"),
          text: personalised,
        });
        successCount++;
      } catch (err) {
        failCount++;
        errors.push(`${r.email}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    } else {
      req.log.info({ to: r.email, subject }, "[MESSAGING] Email preview (SMTP not configured)");
      successCount++;
    }
  }

  // Log to DB
  await db.insert(emailLogsTable).values({
    subject,
    body,
    recipientCount: recipients.length,
    recipientEmails: recipients.map(r => r.email).join(", "),
    filterCourse:     filterCourse || null,
    filterCurricYear: filterCurricYear || null,
    filterEmployer:   filterEmployer || null,
    sentBy:  sentBy || null,
    status:  failCount === recipients.length ? "failed" : failCount > 0 ? "partial" : "sent",
  });

  const smtpConfigured = !!transporter;

  return res.json({
    success: true,
    sent: successCount,
    failed: failCount,
    errors,
    smtpConfigured,
    message: smtpConfigured
      ? `Email sent to ${successCount} of ${recipients.length} recipients.`
      : `SMTP not configured — ${successCount} emails logged (not delivered). Configure SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM to enable real delivery.`,
  });
});

// ─── GET /api/admin/messaging/logs ───────────────────────────────────────────

router.get("/logs", async (_req, res) => {
  try {
    const logs = await db
      .select()
      .from(emailLogsTable)
      .orderBy(sql`${emailLogsTable.sentAt} DESC`)
      .limit(100);
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// ─── GET /api/admin/messaging/inbox ──────────────────────────────────────────
// Returns contact-form submissions from the public Contact Us page

router.get("/inbox", async (_req, res) => {
  try {
    const messages = await db
      .select({
        id:          contactsTable.id,
        senderName:  contactsTable.senderName,
        senderEmail: contactsTable.senderEmail,
        senderPhone: contactsTable.senderPhone,
        message:     contactsTable.message,
        isRead:      contactsTable.isRead,
        createdAt:   contactsTable.createdAt,
      })
      .from(contactsTable)
      .where(isNotNull(contactsTable.senderName))
      .orderBy(desc(contactsTable.createdAt))
      .limit(200);
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch inbox" });
  }
});

// ─── PATCH /api/admin/messaging/inbox/:id/read ───────────────────────────────
// Mark a contact message as read

router.patch("/inbox/:id/read", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await db.update(contactsTable).set({ isRead: true }).where(eq(contactsTable.id, id));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to mark as read" });
  }
});

// ─── DELETE /api/admin/messaging/inbox/:id ────────────────────────────────────
// Permanently delete a contact message from the inbox

router.delete("/inbox/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await db.delete(contactsTable).where(eq(contactsTable.id, id));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
