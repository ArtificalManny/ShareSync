// utils/email/sendInviteEmail.js
const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  INVITES_BASE_URL = 'http://localhost:3000' // frontend base (for link)
} = process.env;

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for others
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends an invite email with a token link.
 * @param {Object} params
 * @param {string} params.to  recipient email
 * @param {string} params.projectName display name
 * @param {string} params.token invite token (server will validate)
 */
async function sendInviteEmail({ to, projectName, token }) {
  const url = `${INVITES_BASE_URL}/invite/accept?token=${encodeURIComponent(token)}`;

  // If SMTP is not configured, log and pretend success
  const tx = getTransporter();
  if (!tx) {
    console.log(`[sendInviteEmail] SMTP not configured. Would have emailed ${to} invite to "${projectName}" -> ${url}`);
    return { queued: false, simulated: true };
  }

  const info = await tx.sendMail({
    from: `"ShareSync" <${SMTP_USER}>`,
    to,
    subject: `You’ve been invited to ${projectName}`,
    text: `You’ve been invited to the project "${projectName}". Accept here: ${url}`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
        <h2>Project Invite: ${projectName}</h2>
        <p>You’ve been invited to collaborate on <strong>${projectName}</strong>.</p>
        <p><a href="${url}" target="_blank" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#4f46e5;color:#fff;text-decoration:none">Accept Invite</a></p>
        <p>If the button doesn’t work, open this link:<br/><a href="${url}" target="_blank">${url}</a></p>
      </div>
    `,
  });

  return { queued: true, messageId: info.messageId };
}

module.exports = { sendInviteEmail };
