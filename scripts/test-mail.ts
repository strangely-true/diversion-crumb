/**
 * Quick SMTP smoke test — run with:
 *   pnpm tsx scripts/test-mail.ts
 */
import nodemailer from "nodemailer";
import { config } from "dotenv";

config(); // load .env

const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
const user = process.env.SMTP_EMAIL;
const pass = process.env.SMTP_PASSWORD;
const supportEmail = process.env.SUPPORT_EMAIL;

if (!user || !pass) {
  console.error("❌  SMTP_EMAIL / SMTP_PASSWORD not set in .env");
  process.exit(1);
}

console.log(`\n📬  Connecting to ${host}:${port} as ${user} …`);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

async function main() {
  // 1. Verify SMTP connection
  await transporter.verify();
  console.log("✅  SMTP connection verified\n");

  // 2. Send test email to SMTP_EMAIL itself (and SUPPORT_EMAIL if set)
  const recipients = [...new Set([user, supportEmail].filter(Boolean) as string[])];

  const info = await transporter.sendMail({
    from: `"Crumbs & Co. Test" <${user}>`,
    to: recipients.join(", "),
    subject: "✅ Crumbs & Co. — SMTP test email",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.6;max-width:500px">
        <h2 style="color:#1a1a1a">SMTP test — Crumbs &amp; Co.</h2>
        <p>If you're reading this, nodemailer + Gmail SMTP is configured correctly.</p>
        <ul>
          <li><strong>Host:</strong> ${host}:${port}</li>
          <li><strong>From:</strong> ${user}</li>
          <li><strong>Recipients:</strong> ${recipients.join(", ")}</li>
          <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
        </ul>
      </div>
    `,
  });

  console.log(`✅  Email sent!`);
  console.log(`   Message ID : ${info.messageId}`);
  console.log(`   Accepted   : ${info.accepted.join(", ")}`);
  if (info.rejected.length) {
    console.warn(`⚠️  Rejected   : ${info.rejected.join(", ")}`);
  }
}

main().catch((err) => {
  console.error("❌  Test failed:", err.message ?? err);
  process.exit(1);
});
