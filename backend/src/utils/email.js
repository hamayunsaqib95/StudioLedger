const nodemailer = require("nodemailer");

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function sendWelcomeEmail({ to, fullName, email, tempPassword }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL SKIPPED] No SMTP config. Credentials for ${email}: ${tempPassword}`);
    return;
  }

  const transporter = getTransporter();
  const appUrl = process.env.APP_URL || "https://studioledger-production.up.railway.app";

  await transporter.sendMail({
    from: `"Studio Ledger · Invogue Technologies" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: "Your Studio Ledger Account is Ready",
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc; padding: 32px 20px;">
        <div style="background: #0f172a; border-radius: 16px; padding: 28px 32px; margin-bottom: 24px; text-align: center;">
          <div style="display:inline-block; background: linear-gradient(135deg,#6366f1,#2563eb); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;">
            <span style="color:#fff; font-size:20px; font-weight:900;">SL</span>
          </div>
          <div style="color:#818cf8; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px;">Invogue Technologies</div>
          <div style="color:#fff; font-size:22px; font-weight:800;">Studio Ledger</div>
        </div>

        <div style="background:#fff; border-radius: 16px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <h2 style="margin:0 0 8px; color:#0f172a; font-size:20px; font-weight:800;">Welcome, ${fullName}!</h2>
          <p style="margin:0 0 24px; color:#64748b; font-size:14px;">Your Studio Ledger account has been created. Use the credentials below to sign in.</p>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin-bottom:24px;">
            <div style="margin-bottom:12px;">
              <div style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">Email</div>
              <div style="font-size:15px; font-weight:600; color:#0f172a; font-family:monospace;">${email}</div>
            </div>
            <div>
              <div style="font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px;">Temporary Password</div>
              <div style="font-size:18px; font-weight:800; color:#6366f1; font-family:monospace; letter-spacing:0.05em;">${tempPassword}</div>
            </div>
          </div>

          <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; margin-bottom:24px;">
            <span style="color:#92400e; font-size:13px; font-weight:600;">⚠ You will be asked to change your password on first login.</span>
          </div>

          <a href="${appUrl}" style="display:block; text-align:center; background:linear-gradient(135deg,#6366f1,#2563eb); color:#fff; text-decoration:none; padding:14px; border-radius:12px; font-weight:700; font-size:15px;">
            Sign in to Studio Ledger →
          </a>
        </div>

        <p style="text-align:center; margin-top:20px; color:#94a3b8; font-size:12px;">
          Invogue Technologies · Studio Ledger · Developed by HMS
        </p>
      </div>
    `
  });
}

module.exports = { sendWelcomeEmail };
