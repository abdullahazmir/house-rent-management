interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * No real email provider is wired up yet (needs an API key from the user, e.g. SendGrid/Postmark/SES).
 * Logs to the console instead so every code path that should send an email is already wired —
 * swap this function's body for a real provider call later without touching any call site.
 */
async function sendEmail(message: EmailMessage): Promise<void> {
  console.log(`[email] to=${message.to} subject="${message.subject}"\n${message.body}`);
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
