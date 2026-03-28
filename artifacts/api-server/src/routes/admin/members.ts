import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { membersTable, studentsTable } from "@workspace/db/schema";
import { or, eq, ilike, asc, desc, sql, and, count } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/admin/members — list all members with search, filter, pagination
router.get("/", async (req, res) => {
  try {
    const {
      q        = "",
      type     = "all",     // "all" | "temple" | "parent"
      policy   = "all",     // "all" | "agreed" | "not_agreed"
      year     = "",
      page     = "1",
      limit    = "50",
      sort     = "id",
      dir      = "desc",
    } = req.query as Record<string, string>;

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(200, Math.max(1, parseInt(limit) || 50));
    const offset   = (pageNum - 1) * pageSize;

    const conditions: ReturnType<typeof eq>[] = [];

    // Text search — name, email, phone
    if (q.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(membersTable.name,  term),
          ilike(membersTable.email, term),
          ilike(membersTable.phone, term),
        ) as ReturnType<typeof eq>
      );
    }

    // Member type filter
    if (type === "temple") {
      conditions.push(eq(membersTable.isExistingMember, true));
    } else if (type === "parent") {
      conditions.push(eq(membersTable.isExistingMember, false));
    }

    // Policy agreed filter
    if (policy === "agreed") {
      conditions.push(eq(membersTable.policyAgreed, true));
    } else if (policy === "not_agreed") {
      conditions.push(eq(membersTable.policyAgreed, false));
    }

    // Membership year filter
    if (year && !isNaN(parseInt(year))) {
      conditions.push(eq(membersTable.membershipYear, parseInt(year)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Sort
    const sortCol  = sort === "name" ? membersTable.name
                   : sort === "email" ? membersTable.email
                   : sort === "createdAt" ? membersTable.createdAt
                   : membersTable.id;
    const orderFn  = dir === "asc" ? asc : desc;

    // Execute query with student count sub-query
    const rows = await db
      .select({
        id:               membersTable.id,
        name:             membersTable.name,
        email:            membersTable.email,
        phone:            membersTable.phone,
        isExistingMember: membersTable.isExistingMember,
        policyAgreed:     membersTable.policyAgreed,
        membershipYear:   membersTable.membershipYear,
        createdAt:        membersTable.createdAt,
        studentCount:     sql<number>`(SELECT COUNT(*) FROM students WHERE students.member_id = ${membersTable.id})`.as("student_count"),
      })
      .from(membersTable)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(membersTable)
      .where(where);

    // Stats (always full table)
    const curYear  = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1; // 1–12
    const [stats] = await db
      .select({
        totalMembers:    count(),
        thisYear:        sql<number>`COUNT(*) FILTER (WHERE membership_year = ${curYear})`,
        withStudents:    sql<number>`COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM students WHERE students.member_id = ${membersTable.id}) > 0)`,
        withoutStudents: sql<number>`COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM students WHERE students.member_id = ${membersTable.id}) = 0)`,
        addedThisMonth:  sql<number>`COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM created_at) = ${curYear} AND EXTRACT(MONTH FROM created_at) = ${curMonth})`,
      })
      .from(membersTable);

    res.json({
      data:    rows,
      total:   Number(total),
      page:    pageNum,
      limit:   pageSize,
      stats: {
        totalMembers:    Number(stats.totalMembers),
        thisYear:        Number(stats.thisYear),
        withStudents:    Number(stats.withStudents),
        withoutStudents: Number(stats.withoutStudents),
        addedThisMonth:  Number(stats.addedThisMonth),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Members list failed");
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// GET /api/admin/members/:id — single member with linked students
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid member id" });

    const [member] = await db
      .select()
      .from(membersTable)
      .where(eq(membersTable.id, id))
      .limit(1);

    if (!member) return res.status(404).json({ error: "Member not found" });

    const students = await db
      .select({
        id:          studentsTable.id,
        studentCode: studentsTable.studentCode,
        name:        studentsTable.name,
        dob:         studentsTable.dob,
        grade:       studentsTable.grade,
        isActive:    studentsTable.isActive,
      })
      .from(studentsTable)
      .where(eq(studentsTable.memberId, id))
      .orderBy(asc(studentsTable.studentCode));

    res.json({ ...member, students });
  } catch (err) {
    req.log.error({ err }, "Member get failed");
    res.status(500).json({ error: "Failed to fetch member" });
  }
});

// POST /api/admin/members/lookup — find existing member by email OR phone
router.post("/lookup", async (req, res) => {
  try {
    const { emailOrPhone } = req.body as { emailOrPhone?: string };
    const val = emailOrPhone?.trim();
    if (!val) return res.status(400).json({ error: "Email or phone is required" });

    const digitsOnly = val.replace(/\D/g, "");
    const isPhone = digitsOnly.length >= 10 && !val.includes("@");

    const [member] = await db
      .select()
      .from(membersTable)
      .where(
        isPhone
          ? sql`REGEXP_REPLACE(${membersTable.phone}, '[^0-9]', '', 'g') = ${digitsOnly}`
          : ilike(membersTable.email, val)
      )
      .limit(1);

    if (!member) return res.status(404).json({ error: "No member found with that phone number." });

    res.json(member);
  } catch (err) {
    req.log.error({ err }, "Member lookup failed");
    res.status(500).json({ error: "Member lookup failed" });
  }
});

// POST /api/admin/members — create a new member
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, isExistingMember, policyAgreed, membershipYear } = req.body as {
      name?: string; email?: string; phone?: string;
      isExistingMember?: boolean; policyAgreed?: boolean; membershipYear?: number;
    };

    const [member] = await db
      .insert(membersTable)
      .values({
        name:             name?.trim() || null,
        email:            email?.trim() || null,
        phone:            phone?.trim() || null,
        isExistingMember: isExistingMember ?? false,
        policyAgreed:     policyAgreed ?? false,
        membershipYear:   membershipYear ?? null,
      })
      .returning();

    res.status(201).json(member);
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      return res.status(409).json({ error: "A member with this email and phone already exists." });
    }
    req.log.error({ err }, "Member creation failed");
    res.status(500).json({ error: "Member creation failed" });
  }
});

// PUT /api/admin/members/:id — full update
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid member id" });

    const { name, email, phone, isExistingMember, policyAgreed, membershipYear } = req.body as {
      name?: string; email?: string; phone?: string;
      isExistingMember?: boolean; policyAgreed?: boolean; membershipYear?: number | null;
    };

    const [member] = await db
      .update(membersTable)
      .set({
        name:             name?.trim() ?? null,
        email:            email?.trim() ?? null,
        phone:            phone?.trim() ?? null,
        isExistingMember: isExistingMember ?? false,
        policyAgreed:     policyAgreed ?? false,
        membershipYear:   membershipYear ?? null,
      })
      .where(eq(membersTable.id, id))
      .returning();

    if (!member) return res.status(404).json({ error: "Member not found" });

    res.json(member);
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      return res.status(409).json({ error: "A member with this email and phone already exists." });
    }
    req.log.error({ err }, "Member update failed");
    res.status(500).json({ error: "Member update failed" });
  }
});

// PATCH /api/admin/members/:id — partial update (policyAgreed, membershipYear)
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { policyAgreed, membershipYear } = req.body as { policyAgreed?: boolean; membershipYear?: number };

    const updateData: Record<string, unknown> = {};
    if (policyAgreed  !== undefined) updateData.policyAgreed  = policyAgreed;
    if (membershipYear !== undefined) updateData.membershipYear = membershipYear;
    if (Object.keys(updateData).length === 0) updateData.policyAgreed = true;

    const [member] = await db
      .update(membersTable)
      .set(updateData)
      .where(eq(membersTable.id, id))
      .returning();

    res.json(member);
  } catch (err) {
    req.log.error({ err }, "Member patch failed");
    res.status(500).json({ error: "Member update failed" });
  }
});

// DELETE /api/admin/members/:id — only allowed if no linked students
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid member id" });

    const [{ linkedCount }] = await db
      .select({ linkedCount: count() })
      .from(studentsTable)
      .where(eq(studentsTable.memberId, id));

    if (Number(linkedCount) > 0) {
      return res.status(409).json({
        error: `Cannot delete — this member has ${linkedCount} linked student(s). Unlink or delete the students first.`,
      });
    }

    await db.delete(membersTable).where(eq(membersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Member delete failed");
    res.status(500).json({ error: "Member delete failed" });
  }
});

// GET /api/admin/members/:id/students — fetch all students linked to a member
router.get("/:id/students", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid member id" });

    const students = await db
      .select({
        id:              studentsTable.id,
        studentCode:     studentsTable.studentCode,
        name:            studentsTable.name,
        dob:             studentsTable.dob,
        grade:           studentsTable.grade,
        curriculumYear:  studentsTable.curriculumYear,
        motherName:      studentsTable.motherName,
        motherPhone:     studentsTable.motherPhone,
        motherEmail:     studentsTable.motherEmail,
        motherEmployer:  studentsTable.motherEmployer,
        fatherName:      studentsTable.fatherName,
        fatherPhone:     studentsTable.fatherPhone,
        fatherEmail:     studentsTable.fatherEmail,
        fatherEmployer:  studentsTable.fatherEmployer,
        address:         studentsTable.address,
        volunteerParent: studentsTable.volunteerParent,
        volunteerArea:   studentsTable.volunteerArea,
      })
      .from(studentsTable)
      .where(eq(studentsTable.memberId, id))
      .orderBy(asc(studentsTable.studentCode));

    res.json(students);
  } catch (err) {
    req.log.error({ err }, "Member students lookup failed");
    res.status(500).json({ error: "Failed to fetch students for member" });
  }
});

export default router;
