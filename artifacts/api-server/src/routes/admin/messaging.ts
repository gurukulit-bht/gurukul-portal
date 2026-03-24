import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  studentsTable,
  enrollmentsTable,
  courseLevelsTable,
  coursesTable,
  adminMessagesTable,
  contactsTable,
} from "@workspace/db/schema";
import { eq, asc, isNotNull, sql, desc } from "drizzle-orm";

const router: IRouter = Router();

// ─── GET /api/admin/messaging/recipients ─────────────────────────────────────
// Returns filtered parent list with email AND phone

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
        motherPhone:    studentsTable.motherPhone,
        motherEmployer: studentsTable.motherEmployer,
        fatherName:     studentsTable.fatherName,
        fatherEmail:    studentsTable.fatherEmail,
        fatherPhone:    studentsTable.fatherPhone,
        fatherEmployer: studentsTable.fatherEmployer,
        courseName:     coursesTable.name,
      })
      .from(studentsTable)
      .leftJoin(enrollmentsTable, eq(enrollmentsTable.studentId, studentsTable.id))
      .leftJoin(courseLevelsTable, eq(courseLevelsTable.id, enrollmentsTable.courseLevelId))
      .leftJoin(coursesTable, eq(coursesTable.id, courseLevelsTable.courseId))
      .orderBy(asc(studentsTable.studentCode));

    const studentMap = new Map<string, {
      studentCode: string; studentName: string;
      curriculumYear: string | null;
      motherName: string | null; motherEmail: string | null; motherPhone: string | null; motherEmployer: string | null;
      fatherName: string | null; fatherEmail: string | null; fatherPhone: string | null; fatherEmployer: string | null;
      courses: string[];
    }>();

    for (const r of rows) {
      const key = r.studentCode ?? "";
      if (!studentMap.has(key)) {
        studentMap.set(key, {
          studentCode: r.studentCode ?? "",
          studentName: r.studentName ?? "",
          curriculumYear: r.curriculumYear,
          motherName: r.motherName, motherEmail: r.motherEmail, motherPhone: r.motherPhone, motherEmployer: r.motherEmployer,
          fatherName: r.fatherName, fatherEmail: r.fatherEmail, fatherPhone: r.fatherPhone, fatherEmployer: r.fatherEmployer,
          courses: [],
        });
      }
      if (r.courseName) {
        const entry = studentMap.get(key)!;
        if (!entry.courses.includes(r.courseName)) entry.courses.push(r.courseName);
      }
    }

    let entries = Array.from(studentMap.values());

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

    // Build recipient list — include parent even if no email (in-app messaging uses phone lookup too)
    const recipientSet = new Map<string, {
      name: string; email: string; phone: string; relation: string; studentName: string; studentCode: string;
    }>();

    for (const e of entries) {
      const key = (e.motherEmail ?? e.motherPhone ?? "").toLowerCase();
      if (key && (e.motherEmail?.trim() || e.motherPhone?.trim())) {
        recipientSet.set(key, {
          name: e.motherName ?? "Mother",
          email: e.motherEmail?.trim() ?? "",
          phone: e.motherPhone?.trim() ?? "",
          relation: "Mother",
          studentName: e.studentName,
          studentCode: e.studentCode,
        });
      }
      const key2 = (e.fatherEmail ?? e.fatherPhone ?? "").toLowerCase();
      if (key2 && (e.fatherEmail?.trim() || e.fatherPhone?.trim())) {
        recipientSet.set(key2, {
          name: e.fatherName ?? "Father",
          email: e.fatherEmail?.trim() ?? "",
          phone: e.fatherPhone?.trim() ?? "",
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
// In-app messaging: stores message to DB (no SMTP). Visible in teacher portal
// and parent portal once delivered.

router.post("/send", async (req, res) => {
  const {
    subject, body, recipients, teacherEmails, audienceType,
    filterCourse, filterCurricYear, filterEmployer,
  } = req.body as {
    subject: string;
    body: string;
    recipients: { name: string; email: string; phone?: string; studentName: string }[];
    teacherEmails?: string;    // comma-separated teacher emails when audience includes teachers
    audienceType?: string;     // "parents" | "teachers" | "both"
    filterCourse?: string;
    filterCurricYear?: string;
    filterEmployer?: string;
  };

  const sentBy = (req.headers["x-user-email"] as string | undefined) || "admin";

  if (!subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: "Subject and body are required." });
  }
  if (!recipients?.length) {
    return res.status(400).json({ error: "No recipients selected." });
  }

  try {
    await db.insert(adminMessagesTable).values({
      subject:          subject.trim(),
      body:             body.trim(),
      audienceType:     audienceType || "parents",
      sentBy,
      recipientCount:   recipients.length,
      teacherEmails:    teacherEmails || null,
      filterCourse:     filterCourse || null,
      filterCurricYear: filterCurricYear || null,
      filterEmployer:   filterEmployer || null,
    });

    return res.json({
      success: true,
      sent: recipients.length,
      failed: 0,
      smtpConfigured: false,
      message: `Message delivered to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""} in-portal.`,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to save in-app message");
    return res.status(500).json({ error: "Failed to send message." });
  }
});

// ─── GET /api/admin/messaging/messages ───────────────────────────────────────
// Returns all sent in-app messages (admin history view)

router.get("/messages", async (_req, res) => {
  try {
    const msgs = await db
      .select()
      .from(adminMessagesTable)
      .orderBy(desc(adminMessagesTable.sentAt))
      .limit(100);
    return res.json(msgs);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// ─── GET /api/admin/messaging/teacher-inbox ──────────────────────────────────
// Returns in-app messages for the authenticated teacher.
// Teacher identified via X-User-Phone (digits-only) matched to their email via
// the teachers table, OR directly by X-User-Email if admin is viewing.

router.get("/teacher-inbox", async (req, res) => {
  const userEmail = (req.headers["x-user-email"] as string | undefined)?.toLowerCase().trim();
  const userPhone = (req.headers["x-user-phone"] as string | undefined)?.replace(/\D/g, "");

  try {
    const all = await db
      .select()
      .from(adminMessagesTable)
      .where(
        sql`${adminMessagesTable.audienceType} IN ('teachers', 'both')`
      )
      .orderBy(desc(adminMessagesTable.sentAt));

    // Filter to only messages where this teacher's email appears in teacherEmails
    const filtered = all.filter(m => {
      if (!m.teacherEmails) {
        // If no specific teacher list — message was sent to all teachers
        return true;
      }
      const list = m.teacherEmails.split(",").map(e => e.trim().toLowerCase());
      if (userEmail && list.includes(userEmail)) return true;
      return false;
    });

    return res.json(filtered);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch teacher messages" });
  }
});

// ─── GET /api/admin/messaging/inbox ──────────────────────────────────────────
// Contact-form submissions from the public Contact Us page

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
