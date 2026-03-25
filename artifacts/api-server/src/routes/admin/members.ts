import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { membersTable } from "@workspace/db/schema";
import { or, eq, ilike } from "drizzle-orm";

const router: IRouter = Router();

// POST /api/admin/members/lookup — find existing member by email OR phone
router.post("/lookup", async (req, res) => {
  try {
    const { emailOrPhone } = req.body as { emailOrPhone?: string };
    const val = emailOrPhone?.trim();
    if (!val) {
      return res.status(400).json({ error: "Email or phone is required" });
    }

    const [member] = await db
      .select()
      .from(membersTable)
      .where(
        or(
          ilike(membersTable.email, val),
          eq(membersTable.phone, val)
        )
      )
      .limit(1);

    if (!member) {
      return res.status(404).json({ error: "No member found with that email or phone number." });
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
