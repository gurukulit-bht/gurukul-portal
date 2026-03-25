import { Router } from "express";
import { db } from "@workspace/db";
import { portalSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const router = Router();

async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(portalSettingsTable).where(eq(portalSettingsTable.key, key));
  return rows[0]?.value ?? null;
}

// GET /api/payments/config — returns publishable key for the frontend (safe to expose)
router.get("/config", async (_req, res) => {
  const publishableKey = await getSetting("stripe_publishable_key");
  res.json({ publishableKey: publishableKey ?? "" });
});

// POST /api/payments/create-intent — creates a Stripe PaymentIntent
router.post("/create-intent", async (req, res) => {
  try {
    const { amount, studentCode, studentName, description } = req.body as {
      amount: number;      // in cents
      studentCode: string;
      studentName: string;
      description: string;
    };

    if (!amount || amount < 100) {
      res.status(400).json({ error: "Invalid payment amount." });
      return;
    }

    const secretKey = await getSetting("stripe_secret_key");
    if (!secretKey || secretKey.startsWith("sk_test_placeholder") || secretKey === "") {
      res.status(503).json({
        error: "Payment gateway is not yet configured. Please contact the Gurukul office to complete payment.",
        notConfigured: true,
      });
      return;
    }

    const stripe = new Stripe(secretKey);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      description,
      metadata: { studentCode, studentName },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err: unknown) {
    console.error("Stripe create-intent error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to initiate payment. Please try again.",
    });
  }
});

export default router;
