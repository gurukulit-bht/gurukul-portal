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

export default router;
