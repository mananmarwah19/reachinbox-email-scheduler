import "dotenv/config";
import { Worker } from "bullmq";
import { prisma } from "../config/prisma";
import { sendEmail } from "../integrations/smtp/smtp.service";
import { updateIndexedEmail } from "../integrations/elasticsearch/elasticsearch.service";
import { consumeHourlyLimit } from "../services/rate-limit.service";

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
};

const CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 5;

export const emailWorker = new Worker(
  "email-scheduler",
  async (job) => {
    const { emailId } = job.data as { emailId: string };

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: {
        sender: true,
        batch: true,
      },
    });

    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    if (email.status === "SENT") {
      return;
    }

    const rateLimit = await consumeHourlyLimit(
      email.senderId,
      email.batch.hourlyLimit
    );

    if (!rateLimit.allowed) {
      /*
       * Do not fail/drop the email.
       * Put the same BullMQ job back into the delayed state
       * for the next available hour.
       */
      await job.moveToDelayed(
        rateLimit.nextAvailableAt.getTime(),
        job.token
      );

      console.log(
        `Hourly limit reached for sender ${email.senderId}. ` +
          `Email ${email.id} rescheduled for ${rateLimit.nextAvailableAt.toISOString()}`
      );

      return;
    }

    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });

    try {
      await sendEmail({
        smtpHost: email.sender.smtpHost,
        smtpPort: email.sender.smtpPort,
        smtpUser: email.sender.smtpUser,
        smtpPassword: email.sender.smtpPassword,
        from: email.sender.email,
        to: email.recipient,
        subject: email.subject,
        body: email.body,
      });

      const updatedEmail = await prisma.email.update({
        where: { id: email.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
          errorMessage: null,
        },
        include: {
          sender: true,
        },
      });

      await updateIndexedEmail({
        id: updatedEmail.id,
        userId: updatedEmail.userId,
        recipient: updatedEmail.recipient,
        subject: updatedEmail.subject,
        body: updatedEmail.body,
        scheduledAt: updatedEmail.scheduledAt.toISOString(),
        sentAt: updatedEmail.sentAt?.toISOString() || null,
        status: updatedEmail.status,
        senderEmail: updatedEmail.sender.email,
        senderDisplayName: updatedEmail.sender.displayName,
        errorMessage: updatedEmail.errorMessage,
      });

      console.log(`Email ${email.id} sent successfully`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown email sending error";

      const failedEmail = await prisma.email.update({
        where: { id: email.id },
        data: {
          status: "FAILED",
          errorMessage: message,
        },
        include: {
          sender: true,
        },
      });

      await updateIndexedEmail({
        id: failedEmail.id,
        userId: failedEmail.userId,
        recipient: failedEmail.recipient,
        subject: failedEmail.subject,
        body: failedEmail.body,
        scheduledAt: failedEmail.scheduledAt.toISOString(),
        sentAt: failedEmail.sentAt?.toISOString() || null,
        status: failedEmail.status,
        senderEmail: failedEmail.sender.email,
        senderDisplayName: failedEmail.sender.displayName,
        errorMessage: failedEmail.errorMessage,
      });

      console.error(`Failed to send email ${email.id}:`, error);

      throw error;
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,

    /*
     * Global queue-level throttling:
     * at most one email starts every configured interval.
     *
     * Unlike an in-memory timer, BullMQ/Redis coordinates
     * this across worker processes.
     */
    limiter: {
      max: 1,
      duration: Number(process.env.MIN_EMAIL_DELAY_MS) || 2000,
    },
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, error) => {
  console.error(
    `Email job ${job?.id} failed:`,
    error.message
  );
});