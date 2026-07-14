import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return transporter;
}

/** Falls back to logging when SMTP isn't configured, so every call site works in any environment. */
async function sendEmail(message: EmailMessage): Promise<void> {
  const client = getTransporter();

  if (!client) {
    console.log(`[email:not-configured] to=${message.to} subject="${message.subject}"\n${message.body}`);
    return;
  }

  try {
    await client.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: message.to,
      subject: message.subject,
      text: message.body,
    });
    console.log(`[email:sent] to=${message.to} subject="${message.subject}"`);
  } catch (err) {
    console.error(`[email:failed] to=${message.to} subject="${message.subject}"`, err);
  }
}

export function sendTenantInviteEmail(to: string, inviteLink: string): Promise<void> {
  return sendEmail({
    to,
    subject: "You're invited to set up your renter account",
    body: `Set up your account and view your lease here: ${inviteLink}`,
  });
}

export function sendPaymentReceiptEmail(to: string, amountPaid: number, dueDate: Date): Promise<void> {
  return sendEmail({
    to,
    subject: `Receipt: rent payment of $${amountPaid} received`,
    body: `We received your rent payment of $${amountPaid} for the period due ${dueDate.toISOString().slice(0, 10)}.`,
  });
}

export function sendPaymentReminderEmail(to: string, amountDue: number, dueDate: Date): Promise<void> {
  return sendEmail({
    to,
    subject: `Reminder: rent payment of $${amountDue} is due soon`,
    body: `Your rent payment of $${amountDue} is due ${dueDate.toISOString().slice(0, 10)}.`,
  });
}

export function sendMaintenanceUpdateEmail(to: string, title: string, status: string): Promise<void> {
  return sendEmail({
    to,
    subject: `Maintenance request update: ${title}`,
    body: `Your maintenance request "${title}" is now marked as: ${status.replace('_', ' ')}.`,
  });
}
