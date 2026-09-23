import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEFAULT_SMTP_USER = 'renujanrenu03@gmail.com';
const DEFAULT_SMTP_PASS = 'fjfaqfayqwqcdbiv';

/**
 * Check whether SMTP email service credentials are configured in .env or defaults
 */
export function isEmailConfigured() {
  const user = (process.env.SMTP_USER || DEFAULT_SMTP_USER)?.trim();
  const pass = (process.env.SMTP_PASS || DEFAULT_SMTP_PASS)?.trim();
  return Boolean(user && pass);
}

/**
 * Get configured nodemailer transporter
 */
export function getEmailTransporter() {
  if (!isEmailConfigured()) {
    return null;
  }

  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || DEFAULT_SMTP_USER).trim();
  // Strip any spaces if the user copied Google's formatted App Password (e.g. 'abcd efgh ijkl mnop')
  const pass = (process.env.SMTP_PASS || DEFAULT_SMTP_PASS).trim().replace(/\s+/g, '');

  if (host === 'smtp.gmail.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  });
}

/**
 * Test SMTP connection status
 */
export async function testSmtpConnection() {
  const transporter = getEmailTransporter();
  if (!transporter) {
    return {
      configured: false,
      message: 'SMTP credentials (SMTP_USER / SMTP_PASS) are not configured in .env',
    };
  }

  try {
    await transporter.verify();
    return {
      configured: true,
      connected: true,
      message: `Successfully connected to SMTP server (${process.env.SMTP_HOST || 'smtp.gmail.com'})`,
    };
  } catch (err) {
    console.error('❌ [SMTP] Connection test failed:', err.message);
    return {
      configured: true,
      connected: false,
      error: err.message,
    };
  }
}

/**
 * Build responsive HTML template for OTP verification email
 */
function buildOtpEmailHtml({ otp, userName, toEmail, type = 'reset' }) {
  const greeting = userName ? `Hello ${userName}` : 'Hello';
  const isRegistration = type === 'registration';
  const pageTitle = isRegistration ? 'Account Verification Code' : 'Password Reset Verification Code';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f1f5f9;
      padding: 36px 12px;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #0d9488 50%, #10b981 100%);
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .brand-title {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #ecfdf5;
      opacity: 0.92;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .description {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .otp-card {
      background: #f8fafc;
      border: 2px dashed #059669;
      border-radius: 14px;
      padding: 22px 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 34px;
      font-weight: 800;
      color: #047857;
      letter-spacing: 8px;
      margin: 0;
      padding: 4px 0;
    }
    .otp-expiry {
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
      font-weight: 500;
    }
    .security-notice {
      background-color: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 12px 16px;
      font-size: 12px;
      line-height: 1.5;
      color: #92400e;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #f1f5f9;
      padding: 20px 28px;
      background-color: #f8fafc;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">Me Plus Workspace</h1>
        <p class="brand-tagline">Multi-Client Task Management Platform</p>
      </div>
      <div class="content">
        <p class="greeting">${greeting},</p>
        <p class="description">
          ${isRegistration
            ? `Thank you for creating your account on <strong>Me Plus Workspace</strong> (<code>${toEmail}</code>). Please use the 6-digit verification code below to verify your email address and activate your workspace:`
            : `We received a request to reset your password for your <strong>Me Plus</strong> account (<code>${toEmail}</code>). Use the 6-digit verification code below to complete your password reset:`
          }
        </p>
        
        <div class="otp-card">
          <div class="otp-label">${isRegistration ? 'Account Verification Code' : 'Verification Code'}</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">⏱️ Valid for 10 minutes</div>
        </div>

        <div class="security-notice">
          <strong>Security Reminder:</strong> Never share this code with anyone. Me Plus support will never ask for your verification code or password.
        </div>

        <p class="description" style="margin-bottom: 0; font-size: 13px;">
          ${isRegistration
            ? 'If you did not attempt to create a Me Plus account with this email address, you can safely disregard this email.'
            : 'If you did not request a password reset, you can safely disregard this email. Your account remains secure.'
          }
        </p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Me Plus Workspace • All rights reserved.<br>
        Sent to ${toEmail}
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Send 6-digit OTP verification email to recipient
 *
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} options.otp
 * @param {string} [options.userName]
 * @param {'registration' | 'reset'} [options.type]
 * @returns {Promise<{ success: boolean, messageId?: string, isRealEmail: boolean }>}
 */
export async function sendOtpEmail({ toEmail, otp, userName, type = 'reset' }) {
  const normalizedEmail = (toEmail || '').trim().toLowerCase();
  const isRegistration = type === 'registration';

  const subject = isRegistration
    ? `${otp} is your Me Plus account verification code`
    : `${otp} is your Me Plus password reset verification code`;

  const textBody = isRegistration
    ? `Hello ${userName || 'there'},\n\nYour Me Plus account verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not create this account, you can safely ignore this email.\n\nBest regards,\nMe Plus Workspace Team`
    : `Hello ${userName || 'there'},\n\nYour Me Plus password reset verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nMe Plus Workspace Team`;

  // If email service is configured, send real email
  if (isEmailConfigured()) {
    const transporter = getEmailTransporter();
    const fromAddress =
      process.env.SMTP_FROM?.trim() ||
      `"Me Plus Workspace" <${process.env.SMTP_USER.trim()}>`;

    const mailOptions = {
      from: fromAddress,
      to: normalizedEmail,
      subject,
      text: textBody,
      html: buildOtpEmailHtml({ otp, userName, toEmail: normalizedEmail, type }),
    };

    console.log(`📨 [EMAIL SERVICE] Sending real ${type} verification email via SMTP to: ${normalizedEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EMAIL SERVICE] Email delivered successfully! MessageId: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      isRealEmail: true,
    };
  }

  // Fallback dev mode (SMTP not yet configured in .env)
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE - SIMULATED / DEV MODE]`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`OTP Code: 👉 ${otp} 👈 (Valid for 10 minutes)`);
  console.log(`💡 Tip: To send real emails to inboxes, configure SMTP_USER and SMTP_PASS in .env`);
  console.log(`======================================================\n`);

  return {
    success: true,
    isRealEmail: false,
  };
}

/**
 * Build responsive HTML template for Urgent Work & Deadline Alert email
 */
function buildUrgentWorkEmailHtml({
  userName,
  toEmail,
  task,
  urgentCount = 1,
  summary,
  reminderStage = 'urgent_task',
  hoursRemaining,
  appUrl = 'https://multiclienttaskmanagement.vercel.app/',
}) {
  const greeting = userName ? `Hello ${userName}` : 'Hello';
  const rawTitle = task?.title || 'Urgent Deliverable Task';
  const taskTitle = rawTitle;
  const projectName = task?.projectName || task?.projectTitle || 'Client Project';
  const clientName = task?.clientName || 'Assigned Client';
  const dueTime = task?.dueTime ? ` at ${task.dueTime}` : '';
  const dueDate = `${task?.dueDate || 'Approaching Deadline'}${dueTime}`;
  const priority = (task?.priority || 'urgent').toUpperCase();

  let bannerTitle = '🚨 Urgent Work &amp; Approaching Deadline Alert';
  let bannerStyle = 'background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border: 1px solid #fecdd3; border-left: 5px solid #e11d48;';
  let bannerTitleColor = '#9f1239';
  let bannerTextColor = '#881337';
  let badgeText = `🔥 ${priority} PRIORITY`;
  let stageDescription = `You have an urgent task requiring your attention. Because you may not currently be active in your workspace, we are alerting you directly via your registered login email.`;

  if (reminderStage === '24h') {
    bannerTitle = '📅 Tomorrow\'s Deadline Alert (Due in 24 Hours)';
    bannerStyle = 'background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-left: 5px solid #059669;';
    bannerTitleColor = '#065f46';
    bannerTextColor = '#047857';
    badgeText = '📅 DUE TOMORROW';
    stageDescription = `This deliverable is scheduled for completion <strong>tomorrow (${dueDate})</strong>. Review your progress today so you can deliver comfortably ahead of deadline without last-minute rush.`;
  } else if (reminderStage === 'imminent') {
    const hoursText = hoursRemaining ? `${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}` : '1-2 hours';
    bannerTitle = `⏰ Final Deadline Warning: Due in ${hoursText}!`;
    bannerStyle = 'background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%); border: 1px solid #fecdd3; border-left: 5px solid #e11d48;';
    bannerTitleColor = '#9f1239';
    bannerTextColor = '#881337';
    badgeText = `⏰ DUE IN ${hoursText.toUpperCase()}`;
    stageDescription = `Target milestone deadline is in <strong>${hoursText} (${dueDate})</strong>! Immediate attention recommended to finalize the deliverable or notify the client.`;
  } else if (reminderStage === 'overdue') {
    bannerTitle = '⚠️ Overdue Notice: Deliverable Deadline Passed';
    bannerStyle = 'background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 1px solid #fed7aa; border-left: 5px solid #ea580c;';
    bannerTitleColor = '#9a3412';
    bannerTextColor = '#c2410c';
    badgeText = '⚠️ OVERDUE';
    stageDescription = `The scheduled deadline for this deliverable (<strong>${dueDate}</strong>) has passed and is still marked incomplete. Please mark it complete or update the project milestone.`;
  }

  const summaryText =
    summary ||
    `Task "${rawTitle}" requires your attention: ${badgeText}.`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bannerTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 32px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f766e 0%, #128c7e 100%);
      padding: 28px 32px;
      text-align: left;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-size: 12px;
      color: #ccfbf1;
      margin: 4px 0 0;
      font-weight: 500;
    }
    .content {
      padding: 32px;
    }
    .alert-banner {
      ${bannerStyle}
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .alert-banner-title {
      font-size: 14px;
      font-weight: 800;
      color: ${bannerTitleColor};
      margin: 0 0 4px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .alert-banner-text {
      font-size: 13px;
      color: ${bannerTextColor};
      margin: 0;
      line-height: 1.5;
    }
    .task-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .task-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 12px 0;
      line-height: 1.4;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 20px;
      background-color: #e0f2fe;
      color: #0369a1;
      margin-bottom: 12px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 10px;
      font-size: 12px;
    }
    .meta-label {
      color: #64748b;
      font-weight: 500;
    }
    .meta-value {
      color: #0f172a;
      font-weight: 700;
      text-align: right;
    }
    .cta-button {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: linear-gradient(135deg, #128c7e 0%, #0d9488 100%);
      color: #ffffff !important;
      text-decoration: none;
      text-align: center;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      margin: 24px 0 16px;
      box-shadow: 0 4px 12px rgba(18, 140, 126, 0.25);
    }
    .footer {
      border-top: 1px solid #f1f5f9;
      padding: 20px 28px;
      background-color: #f8fafc;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="brand-title">Me Plus Workspace</h1>
        <p class="brand-tagline">Multi-Client Task Management Platform</p>
      </div>
      <div class="content">
        <div class="alert-banner">
          <div class="alert-banner-title">${bannerTitle}</div>
          <p class="alert-banner-text">${summaryText}</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
          ${greeting},<br>
          ${stageDescription}
        </p>

        <div class="task-card">
          <span class="badge">${badgeText}</span>
          <div class="task-title">${taskTitle}</div>

          <div class="meta-row">
            <span class="meta-label">Client</span>
            <span class="meta-value">${clientName}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Project</span>
            <span class="meta-value">${projectName}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Target Deadline</span>
            <span class="meta-value" style="color: #e11d48;">${dueDate}</span>
          </div>
        </div>

        <a href="${appUrl}" class="cta-button" target="_blank">
          👉 Open Workspace &amp; View Task
        </a>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; text-align: center; margin-bottom: 0;">
          Deliverables completed on time keep client satisfaction and billable income at their highest.
        </p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} Me Plus Workspace • All rights reserved.<br>
        This alert was dispatched to your account email: <strong>${toEmail}</strong><br>
        You can adjust your alert preferences anytime in Settings &rarr; Notifications.
      </div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Send Urgent Work & Deadline Alert email to recipient
 *
 * @param {Object} options
 * @param {string} options.toEmail
 * @param {string} [options.userName]
 * @param {string} [options.alertType]
 * @param {string} [options.reminderStage] - '24h' | 'imminent' | 'overdue' | 'urgent_task'
 * @param {number} [options.hoursRemaining]
 * @param {Object} [options.task]
 * @param {number} [options.urgentCount]
 * @param {string} [options.summary]
 * @returns {Promise<{ success: boolean, messageId?: string, isRealEmail: boolean, recipient: string }>}
 */
export async function sendUrgentWorkEmail({
  toEmail,
  userName,
  alertType = 'urgent_task',
  reminderStage = 'urgent_task',
  hoursRemaining,
  task,
  urgentCount = 1,
  summary,
}) {
  const normalizedEmail = (toEmail || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Recipient email address is required');
  }

  const transporter = getEmailTransporter();
  const user = (process.env.SMTP_USER || DEFAULT_SMTP_USER).trim();
  const fromAddress = process.env.SMTP_FROM?.trim() || `"Me Plus Workspace" <${user}>`;
  const taskTitle = task?.title ? `"${task.title}"` : 'Urgent Deliverable';
  const dueTime = task?.dueTime ? ` at ${task.dueTime}` : '';
  const dueDisplay = `${task?.dueDate || 'Approaching Deadline'}${dueTime}`;

  let subject = `🚨 Urgent Work Alert: ${taskTitle} requires attention`;
  if (reminderStage === '24h') {
    subject = `📅 Deadline Tomorrow: ${taskTitle} is due in 24 hours`;
  } else if (reminderStage === 'imminent') {
    const hoursText = hoursRemaining ? `${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}` : '1-2 hours';
    subject = `⏰ Final Warning: ${taskTitle} is due in ${hoursText}!`;
  } else if (reminderStage === 'overdue') {
    subject = `⚠️ Overdue Notice: ${taskTitle} deadline has passed`;
  }

  const html = buildUrgentWorkEmailHtml({
    userName,
    toEmail: normalizedEmail,
    task,
    urgentCount,
    summary,
    reminderStage,
    hoursRemaining,
  });

  const text = `🚨 DEADLINE & WORK DELIVERABLE ALERT\n\nHello ${userName || 'there'},\n\nDeliverable: ${task?.title || 'Deliverable Task'}\nProject: ${task?.projectName || 'Project'}\nClient: ${task?.clientName || 'Client'}\nDeadline: ${dueDisplay}\nPriority: ${(task?.priority || 'urgent').toUpperCase()}\nStage: ${reminderStage.toUpperCase()}\n\nOpen your workspace to review: https://multiclienttaskmanagement.vercel.app/\n\nBest regards,\nMe Plus Workspace Team`;

  if (transporter) {
    try {
      console.log(`📨 [EMAIL SERVICE] Sending [${reminderStage}] alert via SMTP to: ${normalizedEmail}...`);
      const info = await transporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject,
        text,
        html,
      });
      console.log(`✅ [EMAIL SERVICE] [${reminderStage}] alert delivered! MessageId: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        isRealEmail: true,
        recipient: normalizedEmail,
      };
    } catch (err) {
      console.error('❌ [EMAIL SERVICE] SMTP dispatch error:', err.message);
      // Fallback
    }
  }

  // Fallback dev/simulation
  console.log(`\n======================================================`);
  console.log(`📧 [EMAIL SERVICE - ${reminderStage.toUpperCase()} ALERT SIMULATED]`);
  console.log(`To: ${normalizedEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Task: ${task?.title || 'Urgent Deliverable'} (${dueDisplay})`);
  console.log(`======================================================\n`);

  return {
    success: true,
    messageId: `sim-${Date.now()}`,
    isRealEmail: false,
    recipient: normalizedEmail,
  };
}
