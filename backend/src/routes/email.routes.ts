import { Router } from "express";
import crypto from "crypto";
import { prisma } from "../config/prisma";
import { emailQueue } from "../queues/email.queue";
import {
  indexEmail,
  searchEmails,
} from "../integrations/elasticsearch/elasticsearch.service";

const router = Router();

router.use((req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  next();
});

router.post("/schedule", async (req, res) => {
  try {
    const userId = req.user!.id;

    const {
    senderId,
    recipient,
    recipients,
    subject,
    body,
    scheduledAt,
    delaySeconds,
    hourlyLimit,
    } = req.body;

    const recipientList: string[] = Array.isArray(recipients)
      ? recipients
      : recipient
        ? [recipient]
        : [];

    const cleanedRecipients = [
      ...new Set(
        recipientList
          .map((email) => String(email).trim().toLowerCase())
          .filter((email) =>
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          )
      ),
    ];

    if (
      !senderId ||
      cleanedRecipients.length === 0 ||
      !subject ||
      !body ||
      !scheduledAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "senderId, recipients, subject, body and scheduledAt are required",
      });
    }

    const scheduleDate = new Date(scheduledAt);

    if (Number.isNaN(scheduleDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduledAt",
      });
    }

    if (scheduleDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "scheduledAt must be in the future",
      });
    }

    const sender = await prisma.sender.findFirst({
      where: {
        id: senderId,
        userId,
      },
    });

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    const parsedDelaySeconds = Math.max(
      0,
      Number(delaySeconds) || 0
    );

    const parsedHourlyLimit = Math.max(
      0,
      Number(hourlyLimit) || 0
    );

    const batch = await prisma.emailBatch.create({
      data: {
        userId,
        subject,
        body,
        startTime: scheduleDate,
        delaySeconds: Math.max(0, Number(delaySeconds) || 0),
        hourlyLimit: Math.max(1, Number(hourlyLimit) || 1),
      },
    });

    const createdEmails = [];

    for (let i = 0; i < cleanedRecipients.length; i++) {
      const emailScheduledAt = new Date(
        scheduleDate.getTime() +
          i * parsedDelaySeconds * 1000
      );

      const email = await prisma.email.create({
        data: {
          batchId: batch.id,
          userId,
          senderId: sender.id,
          recipient: cleanedRecipients[i],
          subject,
          body,
          scheduledAt: emailScheduledAt,
          idempotencyKey: crypto.randomUUID(),
        },
      });

      const delay = Math.max(
        0,
        emailScheduledAt.getTime() - Date.now()
      );

      await emailQueue.add(
        "send-email",
        {
          emailId: email.id,
        },
        {
          delay,
          jobId: email.id,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      await indexEmail({
        id: email.id,
        userId: email.userId,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: null,
        status: email.status,
        senderEmail: sender.email,
        senderDisplayName: sender.displayName,
        errorMessage: null,
      });

      createdEmails.push({
        id: email.id,
        batchId: email.batchId,
        recipient: email.recipient,
        subject: email.subject,
        scheduledAt: email.scheduledAt,
        status: email.status,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${createdEmails.length} email(s) scheduled successfully`,
      batch: {
        id: batch.id,
        startTime: batch.startTime,
        delaySeconds: batch.delaySeconds,
        hourlyLimit: batch.hourlyLimit,
        totalEmails: createdEmails.length,
      },
      emails: createdEmails,
    });
  } catch (error) {
    console.error("Failed to schedule emails:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to schedule emails",
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const userId = req.user!.id;
    const query = String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const emails = await searchEmails(userId, query);

    return res.json({
      success: true,
      emails,
    });
  } catch (error) {
    console.error("Failed to search emails:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search emails",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;

    const emails = await prisma.email.findMany({
      where: {
        userId,
      },
      include: {
        sender: {
          select: {
            email: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "desc",
      },
    });

    return res.json({
      success: true,
      emails,
    });
  } catch (error) {
    console.error("Failed to fetch emails:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch emails",
    });
  }
});

export default router;