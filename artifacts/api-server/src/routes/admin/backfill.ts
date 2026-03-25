import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { membersTable, studentsTable } from "@workspace/db/schema";
import { isNull, or, isNotNull, inArray, sql, eq } from "drizzle-orm";

const router: IRouter = Router();

// POST /api/admin/backfill-members
// One-time idempotent backfill: creates a members row for every student whose
// member_id is still NULL, using father phone/name/email (mother as fallback).
// Siblings who share a phone are linked to the SAME member record.
// Safe to call multiple times — already-linked students are left untouched.
router.post("/members", async (req, res) => {
  try {
    // ── 1. Fetch all unlinked students that have at least one parent phone ──
    const unlinked = await db
      .select({
        id:           studentsTable.id,
        fatherName:   studentsTable.fatherName,
        fatherPhone:  studentsTable.fatherPhone,
        fatherEmail:  studentsTable.fatherEmail,
        motherName:   studentsTable.motherName,
        motherPhone:  studentsTable.motherPhone,
        motherEmail:  studentsTable.motherEmail,
      })
      .from(studentsTable)
      .where(
        isNull(studentsTable.memberId)
      );

    const fixable = unlinked.filter(
      (s) => s.fatherPhone || s.motherPhone
    );

    if (fixable.length === 0) {
      return res.json({ created: 0, linked: 0, skipped: 0, message: "Nothing to backfill." });
    }

    // ── 2. Group students by normalized phone (father first, mother fallback) ──
    type Group = {
      normalizedPhone: string;
      rawPhone:        string;
      name:            string | null;
      email:           string | null;
      studentIds:      number[];
    };

    const phoneMap = new Map<string, Group>();

    for (const s of fixable) {
      const primaryPhone = s.fatherPhone || s.motherPhone || "";
      const normalizedPhone = primaryPhone.replace(/\D/g, "");
      if (!normalizedPhone) continue;

      if (!phoneMap.has(normalizedPhone)) {
        phoneMap.set(normalizedPhone, {
          normalizedPhone,
          rawPhone:   primaryPhone,
          name:       s.fatherName  || s.motherName  || null,
          email:      s.fatherEmail || s.motherEmail || null,
          studentIds: [],
        });
      }
      phoneMap.get(normalizedPhone)!.studentIds.push(s.id);
    }

    let created = 0;
    let linked  = 0;
    let skipped = 0;
    const report: { phone: string; name: string | null; action: string; studentIds: number[] }[] = [];

    // ── 3. For each unique phone, find-or-create a member then link students ──
    for (const group of phoneMap.values()) {
      // Check whether a member with this phone already exists
      const [existing] = await db
        .select({ id: membersTable.id })
        .from(membersTable)
        .where(
          sql`regexp_replace(${membersTable.phone}, '[^0-9]', '', 'g') = ${group.normalizedPhone}`
        )
        .limit(1);

      let memberId: number;

      if (existing) {
        memberId = existing.id;
        skipped++;
        report.push({ phone: group.rawPhone, name: group.name, action: "existing member reused", studentIds: group.studentIds });
      } else {
        const [newMember] = await db
          .insert(membersTable)
          .values({
            name:             group.name,
            email:            group.email,
            phone:            group.rawPhone,
            isExistingMember: true,
            policyAgreed:     false,
          })
          .returning({ id: membersTable.id });

        memberId = newMember.id;
        created++;
        report.push({ phone: group.rawPhone, name: group.name, action: "created", studentIds: group.studentIds });
      }

      // Link all students in this group to the member
      await db
        .update(studentsTable)
        .set({ memberId })
        .where(inArray(studentsTable.id, group.studentIds));

      linked += group.studentIds.length;
    }

    return res.json({
      created,
      linked,
      reusedExisting: skipped,
      totalStudentsFixed: linked,
      detail: report,
    });
  } catch (err) {
    req.log.error({ err }, "Backfill members failed");
    res.status(500).json({ error: "Backfill failed" });
  }
});

// POST /api/admin/backfill/schema-migrate
// Idempotent DDL migration: adds member_type column + indexes if not present.
// Uses the existing DB connection pool so it works even when push-force can't connect.
router.post("/schema-migrate", async (req, res) => {
  try {
    const steps: string[] = [];

    // 1. Add member_type column (safe IF NOT EXISTS)
    await db.execute(sql`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS member_type TEXT NOT NULL DEFAULT 'parent'
    `);
    steps.push("member_type column ensured");

    // 2. Back-fill existing rows: temple members → 'temple', rest stay 'parent'
    const updated = await db.execute(sql`
      UPDATE members
         SET member_type = 'temple'
       WHERE is_existing_member = true
         AND member_type = 'parent'
    `);
    steps.push(`${(updated as unknown as { rowCount: number }).rowCount ?? 0} existing temple member rows updated to 'temple'`);

    // 3. Indexes for fast phone / email lookup
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_members_email ON members(email)
    `);
    steps.push("indexes on phone and email ensured");

    res.json({ ok: true, steps });
  } catch (err) {
    req.log.error({ err }, "Schema migration failed");
    res.status(500).json({ error: String(err) });
  }
});

export default router;
