import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { portalUsersTable, adminUsersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const MAX_ATTEMPTS  = 5;
const LOCK_MINUTES  = 15;
const SUPER_ADMIN_EMAIL = "admin@gurukul.org";

// ── Ensure super admin record exists ─────────────────────────────────────────
// Called once at startup from index.ts. Idempotent.
export async function seedSuperAdmin() {
  const existing = await db
    .select({ id: adminUsersTable.id })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.role, "super_admin"))
    .limit(1);
  if (existing.length > 0) return;

  const pinHash = await bcrypt.hash("JaiHanuman2026$", 10);
  await db.insert(adminUsersTable).values({
    name:    "Super Admin",
    email:   SUPER_ADMIN_EMAIL,
    phone:   null,
    pinHash,
    role:    "super_admin",
    status:  "active",
  });
  console.log("[auth] Super admin seeded.");
}

// ── POST /api/auth/admin-login ────────────────────────────────────────────────
// Unified admin login:
//   - credential = "admin@gurukul.org"  → super admin (email + password)
//   - credential = 10-digit phone       → regular admin (phone + 4-digit PIN)
router.post("/admin-login", async (req, res) => {
  try {
    const { credential, secret } = req.body as { credential?: string; secret?: string };
    if (!credential || !secret) {
      return res.status(400).json({ error: "Credential and secret are required." });
    }

    const isSuperAdminAttempt = credential.toLowerCase().trim() === SUPER_ADMIN_EMAIL;

    if (isSuperAdminAttempt) {
      // Super admin: email + password
      const [sa] = await db
        .select()
        .from(adminUsersTable)
        .where(eq(adminUsersTable.role, "super_admin"))
        .limit(1);

      if (!sa) return res.status(401).json({ error: "Invalid credentials." });
      if (sa.status !== "active") return res.status(403).json({ error: "Account is inactive." });

      const valid = await bcrypt.compare(secret, sa.pinHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password." });

      return res.json({
        id:           sa.id,
        name:         sa.name,
        email:        sa.email,
        phone:        sa.phone ?? "",
        role:         "admin",      // front-end role for RBAC
        dbRole:       "super_admin",
        isSuperAdmin: true,
        initials:     sa.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
      });
    }

    // Regular admin: phone + 4-digit PIN
    const cleanPhone = credential.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "Credential must be the super admin email or a 10-digit phone number." });
    }
    if (!/^\d{4}$/.test(secret)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits." });
    }

    const [admin] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.phone, cleanPhone))
      .limit(1);

    if (!admin) return res.status(401).json({ error: "Invalid phone number or PIN." });
    if (admin.status !== "active") return res.status(403).json({ error: "Account is inactive. Contact the super admin." });

    const valid = await bcrypt.compare(secret, admin.pinHash);
    if (!valid) return res.status(401).json({ error: "Invalid phone number or PIN." });

    return res.json({
      id:           admin.id,
      name:         admin.name,
      email:        admin.email ?? "",
      phone:        admin.phone ?? "",
      role:         "admin",
      dbRole:       "admin",
      isSuperAdmin: false,
      initials:     admin.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
    });
  } catch (err) {
    console.error("[admin-login]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/pin-login ──────────────────────────────────────────────────
// Teacher / assistant login via portal_users table. Unchanged.
router.post("/pin-login", async (req, res) => {
  try {
    const { phone, pin } = req.body as { phone?: string; pin?: string };
    if (!phone || !pin) {
      return res.status(400).json({ error: "Phone and PIN are required." });
    }
    const clean = phone.replace(/\D/g, "");
    if (clean.length !== 10) {
      return res.status(400).json({ error: "Phone must be 10 digits." });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: "PIN must be 4 digits." });
    }

    const [user] = await db
      .select()
      .from(portalUsersTable)
      .where(eq(portalUsersTable.phone, clean))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Invalid phone number or PIN." });
    }
    if (user.status === "inactive") {
      return res.status(403).json({ error: "Account is inactive. Contact your administrator." });
    }

    // Check lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({ error: `Account locked. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` });
    }

    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      const attempts = user.loginAttempts + 1;
      const locked   = attempts >= MAX_ATTEMPTS;
      await db
        .update(portalUsersTable)
        .set({
          loginAttempts: attempts,
          lockedUntil: locked
            ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(portalUsersTable.id, user.id));

      if (locked) {
        return res.status(429).json({
          error: `Too many failed attempts. Account locked for ${LOCK_MINUTES} minutes.`,
        });
      }
      const remaining = MAX_ATTEMPTS - attempts;
      return res.status(401).json({
        error: `Invalid phone number or PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      });
    }

    // Success — reset attempts
    await db
      .update(portalUsersTable)
      .set({ loginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(portalUsersTable.id, user.id));

    return res.json({
      id:          user.id,
      name:        user.name,
      phone:       user.phone,
      role:        user.role,
      initials:    user.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase(),
    });
  } catch (err) {
    console.error("[pin-login]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ── POST /api/auth/change-pin ─────────────────────────────────────────────────
// Change a teacher/assistant PIN. Unchanged.
router.post("/change-pin", async (req, res) => {
  try {
    const { phone, currentPin, newPin } = req.body as {
      phone?: string; currentPin?: string; newPin?: string;
    };
    if (!phone || !currentPin || !newPin) {
      return res.status(400).json({ error: "phone, currentPin and newPin are required." });
    }
    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: "New PIN must be exactly 4 digits." });
    }

    const clean = phone.replace(/\D/g, "");
    const [user] = await db
      .select()
      .from(portalUsersTable)
      .where(eq(portalUsersTable.phone, clean))
      .limit(1);

    if (!user) return res.status(404).json({ error: "User not found." });
    if (user.status === "inactive") {
      return res.status(403).json({ error: "Account is inactive." });
    }

    const valid = await bcrypt.compare(currentPin, user.pinHash);
    if (!valid) return res.status(401).json({ error: "Current PIN is incorrect." });

    if (await bcrypt.compare(newPin, user.pinHash)) {
      return res.status(400).json({ error: "New PIN must be different from current PIN." });
    }

    const newHash = await bcrypt.hash(newPin, 10);
    await db
      .update(portalUsersTable)
      .set({ pinHash: newHash, updatedAt: new Date() })
      .where(eq(portalUsersTable.id, user.id));

    return res.json({ success: true });
  } catch (err) {
    console.error("[change-pin]", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
