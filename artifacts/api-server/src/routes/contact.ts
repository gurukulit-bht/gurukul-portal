import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { contactsTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, message } = req.body as {
      name?: string; email?: string; phone?: string; message?: string;
    };

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Name is required." });
    }
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    await db.insert(contactsTable).values({
      senderName:  name.trim(),
      senderEmail: email?.trim() || null,
      senderPhone: phone?.trim() || null,
      message:     message.trim(),
      courseInterest: null,
    });

    return res.json({
      success: true,
      message: "Thank you for reaching out! We will get back to you shortly.",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit contact form");
    return res.status(500).json({ success: false, message: "Failed to submit form. Please try again." });
  }
});

export default router;
