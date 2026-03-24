import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { portalUsersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

const MAX_ATTEMPTS  = 5;
const LOCK_MINUTES  = 15;

// POST /api/auth/pin-login
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

// POST /api/auth/change-pin
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
