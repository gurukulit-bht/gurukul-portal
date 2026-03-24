import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { portalUsersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function safeUser(u: typeof portalUsersTable.$inferSelect) {
  return {
    id:        u.id,
    name:      u.name,
    phone:     u.phone,
    role:      u.role,
    status:    u.status,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

// GET /api/admin/portal-users
router.get("/", async (_req, res) => {
  try {
    const users = await db
      .select()
      .from(portalUsersTable)
      .orderBy(desc(portalUsersTable.createdAt));
    return res.json(users.map(safeUser));
  } catch (err) {
    console.error("[portal-users GET]", err);
    return res.status(500).json({ error: "Failed to fetch users." });
  }
});

// POST /api/admin/portal-users  — create user, returns generated PIN in plaintext (once)
router.post("/", async (req, res) => {
  try {
    const { name, phone, role } = req.body as { name?: string; phone?: string; role?: string };
    if (!name || !phone || !role) {
      return res.status(400).json({ error: "name, phone, and role are required." });
    }
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      return res.status(400).json({ error: "Phone must be 10 digits." });
    }
    if (!["teacher", "assistant"].includes(role)) {
      return res.status(400).json({ error: "Role must be teacher or assistant." });
    }

    const pin     = generatePin();
    const pinHash = await bcrypt.hash(pin, 10);

    const [created] = await db
      .insert(portalUsersTable)
      .values({
        name:      name.trim(),
        phone:     clean,
        pinHash,
        role:      role as "teacher" | "assistant",
        status:    "active",
      })
      .returning();

    return res.status(201).json({ ...safeUser(created), pin });
  } catch (err: any) {
    const pgCode = err?.code ?? err?.cause?.code;
    if (pgCode === "23505") {
      return res.status(409).json({ error: "A user with this phone number already exists." });
    }
    console.error("[portal-users POST]", err);
    return res.status(500).json({ error: "Failed to create user." });
  }
});

// PATCH /api/admin/portal-users/:id/status — toggle active/inactive
router.patch("/:id/status", async (req, res) => {
  try {
    const id     = parseInt(req.params.id, 10);
    const { status } = req.body as { status?: "active" | "inactive" };
    if (!status || !["active", "inactive"].includes(status)) {
      return res.status(400).json({ error: "status must be active or inactive." });
    }
    const [updated] = await db
      .update(portalUsersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(portalUsersTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "User not found." });
    return res.json(safeUser(updated));
  } catch (err) {
    console.error("[portal-users PATCH status]", err);
    return res.status(500).json({ error: "Failed to update status." });
  }
});

// PATCH /api/admin/portal-users/:id/reset-pin — generate and set new PIN
router.patch("/:id/reset-pin", async (req, res) => {
  try {
    const id  = parseInt(req.params.id, 10);
    const pin = generatePin();
    const pinHash = await bcrypt.hash(pin, 10);
    const [updated] = await db
      .update(portalUsersTable)
      .set({ pinHash, loginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(portalUsersTable.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "User not found." });
    return res.json({ ...safeUser(updated), pin });
  } catch (err) {
    console.error("[portal-users PATCH reset-pin]", err);
    return res.status(500).json({ error: "Failed to reset PIN." });
  }
});

// DELETE /api/admin/portal-users/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(portalUsersTable).where(eq(portalUsersTable.id, id));
    return res.json({ success: true });
  } catch (err) {
    console.error("[portal-users DELETE]", err);
    return res.status(500).json({ error: "Failed to delete user." });
  }
});

export default router;
