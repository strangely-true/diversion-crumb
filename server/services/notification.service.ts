import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/server/prisma/client";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parseFallbackRecipients() {
  const fromEnv = process.env.ADMIN_NOTIFICATION_EMAILS ?? "";
  return fromEnv
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export class NotificationService {
  static async notifyAllAdminsEscalation(input: {
    conversationId: string;
    reason: string;
    requestedDiscountPercent: number;
    allowedDiscountPercent: number;
  }) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) return;

    const [admins, conversation] = await Promise.all([
      prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { email: true },
      }),
      prisma.conversation.findUnique({
        where: { id: input.conversationId },
        select: {
          sessionId: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    const supportEmail = process.env.SUPPORT_EMAIL
      ? normalizeEmail(process.env.SUPPORT_EMAIL)
      : "";

    const recipients = [
      ...admins.map((admin) => normalizeEmail(admin.email)),
      ...parseFallbackRecipients(),
      ...(supportEmail ? [supportEmail] : []),
    ];

    const uniqueRecipients = [...new Set(recipients)].filter(Boolean);
    if (uniqueRecipients.length === 0) return;

    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const customerLabel =
      conversation?.user?.email ?? conversation?.user?.name ?? "Guest user";

    const subject = `Escalated chat requires admin takeover (${input.conversationId.slice(0, 8)})`;
    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.45">
        <h2 style="margin:0 0 12px">Conversation Escalation Alert</h2>
        <p style="margin:0 0 8px"><strong>Conversation ID:</strong> ${input.conversationId}</p>
        <p style="margin:0 0 8px"><strong>Session ID:</strong> ${conversation?.sessionId ?? "N/A"}</p>
        <p style="margin:0 0 8px"><strong>Customer:</strong> ${customerLabel}</p>
        <p style="margin:0 0 8px"><strong>Reason:</strong> ${input.reason}</p>
        <p style="margin:0 0 8px"><strong>Requested discount:</strong> ${input.requestedDiscountPercent}%</p>
        <p style="margin:0 0 14px"><strong>Allowed discount:</strong> ${input.allowedDiscountPercent}%</p>
        <a href="${appBaseUrl}/admin/conversations" style="display:inline-block;background:#111827;color:#fff;padding:9px 14px;border-radius:8px;text-decoration:none;">
          Open admin conversations
        </a>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: uniqueRecipients,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[NotificationService.notifyAllAdminsEscalation]", body);
    }
  }

  static async sendCustomCakeOrderNotification(input: {
    customerEmail: string;
    deliveryDate: string;
    cakeDescription: string;
    customerName?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey)
      return { success: false, error: "Email service not configured" };

    const supportEmail = process.env.SUPPORT_EMAIL
      ? normalizeEmail(process.env.SUPPORT_EMAIL)
      : "";

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const appBaseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
    const customerLabel = input.customerName ?? input.customerEmail;

    let formattedDate = input.deliveryDate;
    try {
      formattedDate = new Date(input.deliveryDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      // keep the original string if parsing fails
    }

    const customerHtml = `
<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;max-width:600px">
  <h2 style="margin:0 0 16px;color:#1a1a1a">Your Custom Cake Order – Crumbs &amp; Co.</h2>
  <p>Hi ${customerLabel},</p>
  <p>Thank you for placing a custom cake order with us! Here's a summary of what we received:</p>
  <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:16px;margin:16px 0;border-radius:4px">
    <p style="margin:0 0 8px"><strong>Requested Delivery Date:</strong> ${formattedDate}</p>
    <p style="margin:0"><strong>Order Details:</strong> ${input.cakeDescription}</p>
  </div>
  <p>Our team will review your request and reach out to confirm availability, pricing, and any additional details.</p>
  <p style="margin-top:24px">Warm regards,<br/><strong>The Crumbs &amp; Co. Team</strong></p>
</div>`;

    const supportHtml = `
<div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.45">
  <h2 style="margin:0 0 12px">New Custom Cake Order</h2>
  <p style="margin:0 0 8px"><strong>Customer:</strong> ${customerLabel}</p>
  <p style="margin:0 0 8px"><strong>Customer Email:</strong> ${normalizeEmail(input.customerEmail)}</p>
  <p style="margin:0 0 8px"><strong>Requested Delivery Date:</strong> ${formattedDate}</p>
  <p style="margin:0 0 14px"><strong>Order Details:</strong> ${input.cakeDescription}</p>
  <a href="${appBaseUrl}/admin/orders" style="display:inline-block;background:#111827;color:#fff;padding:9px 14px;border-radius:8px;text-decoration:none;">
    View Admin Orders
  </a>
</div>`;

    const sends: Promise<Response>[] = [
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [normalizeEmail(input.customerEmail)],
          subject: `Custom Cake Order Confirmation – ${formattedDate}`,
          html: customerHtml,
        }),
      }),
    ];

    if (supportEmail) {
      sends.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [supportEmail],
            subject: `New Custom Cake Order from ${customerLabel}`,
            html: supportHtml,
          }),
        }),
      );
    }

    const responses = await Promise.all(sends);
    const failed = responses.filter((r) => !r.ok);
    if (failed.length > 0) {
      const errBodies = await Promise.all(failed.map((r) => r.text()));
      console.error(
        "[NotificationService.sendCustomCakeOrderNotification]",
        errBodies,
      );
      return { success: false, error: "Failed to send one or more emails" };
    }

    return { success: true };
  }
}
