import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { membersTable, studentsTable } from "@workspace/db/schema";
import { or, eq, ilike, asc, sql } from "drizzle-orm";

const router: IRouter = Router();

// POST /api/admin/members/lookup — find existing member by email OR phone (normalizes phone formatting)
router.post("/lookup", async (req, res) => {
  try {
    const { emailOrPhone } = req.body as { emailOrPhone?: string };
    const val = emailOrPhone?.trim();
    if (!val) {
      return res.status(400).json({ error: "Email or phone is required" });
    }

    // Strip all non-digits to normalize phone numbers regardless of formatting
    const digitsOnly = val.replace(/\D/g, "");
    const isPhone = digitsOnly.length >= 10 && !val.includes("@");

    const [member] = await db
      .select()
      .from(membersTable)
      .where(
        isPhone
          // Compare digits-only against stored phone (strip formatting on both sides)
          ? sql`REGEXP_REPLACE(${membersTable.phone}, '[^0-9]', '', 'g') = ${digitsOnly}`
          : ilike(membersTable.email, val)
      )
      .limit(1);

    if (!member) {
      return res.status(404).json({ error: "No member found with that phone number." });
    }

    res.json(member);
  } catch (err) {
    req.log.error({ err }, "Member lookup failed");
    res.status(500).json({ error: "Member lookup failed" });
  }
});

// POST /api/admin/members — create a new temple member or parent membership
// isExistingMember=true → verified temple member
// isExistingMember=false (default) → parent membership created during student registration
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, isExistingMember, policyAgreed } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      isExistingMember?: boolean;
      policyAgreed?: boolean;
    };

    const [member] = await db
      .insert(membersTable)
      .values({
        name:             name?.trim() || null,
        email:            email?.trim() || null,
        phone:            phone?.trim() || null,
        isExistingMember: isExistingMember ?? false,
        policyAgreed:     policyAgreed ?? false,
      })
      .returning();

    res.status(201).json(member);
  } catch (err: unknown) {
    const pg = err as { code?: string };
    if (pg?.code === "23505") {
      return res.status(409).json({ error: "A member with this email and phone number already exists." });
    }
    req.log.error({ err }, "Member creation failed");
    res.status(500).json({ error: "Member creation failed" });
  }
});

// GET /api/admin/members/:id/students — fetch all students linked to a member (for form pre-fill)
router.get("/:id/students", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid member id" });

    const students = await db
      .select({
        id:             studentsTable.id,
        studentCode:    studentsTable.studentCode,
        name:           studentsTable.name,
        dob:            studentsTable.dob,
        grade:          studentsTable.grade,
        curriculumYear: studentsTable.curriculumYear,
        motherName:     studentsTable.motherName,
        motherPhone:    studentsTable.motherPhone,
        motherEmail:    studentsTable.motherEmail,
        motherEmployer: studentsTable.motherEmployer,
        fatherName:     studentsTable.fatherName,
        fatherPhone:    studentsTable.fatherPhone,
        fatherEmail:    studentsTable.fatherEmail,
        fatherEmployer: studentsTable.fatherEmployer,
        address:        studentsTable.address,
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

// PATCH /api/admin/members/:id — update policyAgreed and/or membershipYear
router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { policyAgreed, membershipYear } = req.body as { policyAgreed?: boolean; membershipYear?: number };

    const updateData: Record<string, unknown> = {};
    if (policyAgreed !== undefined)  updateData.policyAgreed  = policyAgreed;
    if (membershipYear !== undefined) updateData.membershipYear = membershipYear;
    if (Object.keys(updateData).length === 0) updateData.policyAgreed = true;

    const [member] = await db
      .update(membersTable)
      .set(updateData)
      .where(eq(membersTable.id, id))
      .returning();

    res.json(member);
  } catch (err) {
    req.log.error({ err }, "Member update failed");
    res.status(500).json({ error: "Member update failed" });
  }
});

export default router;
