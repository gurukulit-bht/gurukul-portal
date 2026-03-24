import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminUsersTable } from "@workspace/db/schema";
import { eq, ne, sql } from "drizzle-orm";

const router: IRouter = Router();

const SUPER_ADMIN_EMAIL  = "admin@gurukul.org";
const SUPER_ADMIN_ROLE   = "super_admin";
// Special override PIN required to change super admin's password
const SUPER_ADMIN_OVERRIDE_PIN = "6148229213";

function safeAdmin(u: typeof adminUsersTable.$inferSelect, creatorName?: string | null, updaterName?: string | null) {
  return {
    id:          u.id,
    name:        u.name,
    email:       u.email ?? null,
    phone:       u.phone ?? null,
    role:        u.role,
    status:      u.status,
    createdById: u.createdById ?? null,
    createdBy:   creatorName ?? null,
    updatedById: u.updatedById ?? null,
    updatedBy:   updaterName ?? null,
    createdAt:   u.createdAt,
    updatedAt:   u.updatedAt,
  };
}

async function getEnrichedList() {
  const rows = await db.select().from(adminUsersTable).orderBy(adminUsersTable.createdAt);
  const nameById = new Map(rows.map((r) => [r.id, r.name]));
  return rows.map((r) =>
    safeAdmin(r, r.createdById ? nameById.get(r.createdById) : null, r.updatedById ? nameById.get(r.updatedById) : null)
  );
}

// GET /api/admin/admin-users
// Returns all admin users (super admin always first)
router.get("/", async (_req, res) => {
  try {
    res.json(await getEnrichedList());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin users." });
  }
});

// POST /api/admin/admin-users
// Create a regular admin (phone + 4-digit PIN)
// Body: { name, phone, pin, createdById }
router.post("/", async (req, res) => {
  try {
    const { name, phone, pin, createdById } = req.body as {
      name?: string; phone?: string; pin?: string; createdById?: number;
    };

    if (!name?.trim())  return res.status(400).json({ error: "Name is required." });
    if (!phone?.trim()) return res.status(400).json({ error: "Phone number is required." });
    if (!pin)           return res.status(400).json({ error: "PIN is required." });

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) return res.status(400).json({ error: "Phone must be exactly 10 digits." });
    if (!/^\d{4}$/.test(pin))    return res.status(400).json({ error: "PIN must be exactly 4 digits." });

    // Uniqueness check
    const [existing] = await db
      .select({ id: adminUsersTable.id })
      .from(adminUsersTable)
      .where(eq(adminUsersTable.phone, cleanPhone))
      .limit(1);
    if (existing) return res.status(409).json({ error: "An admin with this phone number already exists." });

    const pinHash = await bcrypt.hash(pin, 10);
    const [created] = await db
      .insert(adminUsersTable)
      .values({
        name:        name.trim(),
        phone:       cleanPhone,
        pinHash,
        role:        "admin",
        status:      "active",
        createdById: createdById ?? null,
        updatedById: createdById ?? null,
      })
      .returning();

    const list = await getEnrichedList();
    res.status(201).json({ admin: list.find((a) => a.id === created.id), pin });
  } catch (err) {
    console.error("[admin-users POST]", err);
    res.status(500).json({ error: "Failed to create admin user." });
  }
});

// PUT /api/admin/admin-users/:id
// Edit name, phone, status. Cannot change super admin's role.
// Body: { name, phone, status, updatedById }
router.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, status, updatedById } = req.body as {
      name?: string; phone?: string; status?: string; updatedById?: number;
    };

    const [target] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!target) return res.status(404).json({ error: "Admin user not found." });

    if (!name?.trim()) return res.status(400).json({ error: "Name is required." });

    const updates: Partial<typeof adminUsersTable.$inferInsert> = {
      name:       name.trim(),
      status:     status ?? target.status,
      updatedById: updatedById ?? null,
      updatedAt:  new Date(),
    };

    // Phone update only for non-super admins
    if (target.role !== SUPER_ADMIN_ROLE && phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.length !== 10) return res.status(400).json({ error: "Phone must be exactly 10 digits." });
      // Check uniqueness excluding self
      const [dup] = await db
        .select({ id: adminUsersTable.id })
        .from(adminUsersTable)
        .where(sql`${adminUsersTable.phone} = ${cleanPhone} AND ${adminUsersTable.id} != ${id}`)
        .limit(1);
      if (dup) return res.status(409).json({ error: "Phone number already in use by another admin." });
      updates.phone = cleanPhone;
    }

    await db.update(adminUsersTable).set(updates).where(eq(adminUsersTable.id, id));
    const list = await getEnrichedList();
    res.json(list.find((a) => a.id === id));
  } catch (err) {
    console.error("[admin-users PUT]", err);
    res.status(500).json({ error: "Failed to update admin user." });
  }
});

// PATCH /api/admin/admin-users/:id/reset-pin
// Reset a regular admin's PIN. Returns new PIN in plaintext (one-time).
router.patch("/:id/reset-pin", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { updatedById } = req.body as { updatedById?: number };

    const [target] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!target) return res.status(404).json({ error: "Admin user not found." });
    if (target.role === SUPER_ADMIN_ROLE) return res.status(403).json({ error: "Cannot reset super admin PIN this way." });

    const newPin  = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await bcrypt.hash(newPin, 10);
    await db.update(adminUsersTable).set({ pinHash, updatedById: updatedById ?? null, updatedAt: new Date() }).where(eq(adminUsersTable.id, id));

    res.json({ pin: newPin });
  } catch (err) {
    console.error("[admin-users reset-pin]", err);
    res.status(500).json({ error: "Failed to reset PIN." });
  }
});

// PATCH /api/admin/admin-users/:id/status
// Activate / deactivate. Super admin cannot be deactivated.
router.patch("/:id/status", async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const { status, updatedById } = req.body as { status?: string; updatedById?: number };

    const [target] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!target) return res.status(404).json({ error: "Admin user not found." });
    if (target.role === SUPER_ADMIN_ROLE) return res.status(403).json({ error: "Super admin cannot be deactivated." });
    if (status !== "active" && status !== "inactive") return res.status(400).json({ error: "Invalid status." });

    await db.update(adminUsersTable).set({ status, updatedById: updatedById ?? null, updatedAt: new Date() }).where(eq(adminUsersTable.id, id));
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status." });
  }
});

// DELETE /api/admin/admin-users/:id
// Soft delete (cannot delete super admin)
router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [target] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!target) return res.status(404).json({ error: "Admin user not found." });
    if (target.role === SUPER_ADMIN_ROLE) return res.status(403).json({ error: "Super admin cannot be deleted." });

    await db.delete(adminUsersTable).where(eq(adminUsersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete admin user." });
  }
});

// POST /api/admin/admin-users/super-admin/change-password
// Change super admin's password. Requires the system override PIN.
// Body: { overridePin, newPassword }
router.post("/super-admin/change-password", async (req, res) => {
  try {
    const { overridePin, newPassword } = req.body as { overridePin?: string; newPassword?: string };

    if (!overridePin || !newPassword) {
      return res.status(400).json({ error: "overridePin and newPassword are required." });
    }
    if (overridePin !== SUPER_ADMIN_OVERRIDE_PIN) {
      return res.status(403).json({ error: "Invalid override PIN. Please contact the system administrator." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const [superAdmin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.role, SUPER_ADMIN_ROLE))
      .limit(1);
    if (!superAdmin) return res.status(404).json({ error: "Super admin account not found." });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(adminUsersTable).set({ pinHash: newHash, updatedAt: new Date() }).where(eq(adminUsersTable.id, superAdmin.id));
    res.json({ success: true });
  } catch (err) {
    console.error("[super-admin/change-password]", err);
    res.status(500).json({ error: "Failed to change password." });
  }
});

export { SUPER_ADMIN_EMAIL, SUPER_ADMIN_ROLE };
export default router;
