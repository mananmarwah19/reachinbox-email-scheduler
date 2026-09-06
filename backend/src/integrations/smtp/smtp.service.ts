import nodemailer from "nodemailer";

interface SendEmailOptions {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  from: string;
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const smtpPassword = options.smtpPassword.replace(/\s+/g, "").trim();

  const transporter = nodemailer.createTransport({
    host: options.smtpHost.trim(),
    port: Number(options.smtpPort),
    secure: Number(options.smtpPort) === 465,
    auth: {
      user: options.smtpUser.trim(),
      pass: smtpPassword,
    },
  });

  await transporter.verify();

  const info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.body,
  });

  return info;
}