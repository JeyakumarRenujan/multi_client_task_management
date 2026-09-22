import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Check whether SMTP email service credentials are configured in .env
 */
export function isEmailConfigured() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
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
  const user = process.env.SMTP_USER.trim();
  const pass = process.env.SMTP_PASS.trim();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    // Optional TLS configuration for flexibility
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
function buildOtpEmailHtml({ otp, userName, toEmail }) {
  const greeting = userName ? `Hello ${userName}` : 'Hello';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Verification Code</title>
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
          We received a request to reset your password for your <strong>Me Plus</strong> account (<code>${toEmail}</code>).
          Use the 6-digit verification code below to complete your password reset:
        </p>
        
        <div class="otp-card">
          <div class="otp-label">Verification Code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expiry">⏱️ Valid for 10 minutes</div>
        </div>

        <div class="security-notice">
          <strong>Security Reminder:</strong> Never share this code with anyone. Me Plus support will never ask for your verification code or password.
        </div>

        <p class="description" style="margin-bottom: 0; font-size: 13px;">
          If you did not request a password reset, you can safely disregard this email. Your account remains secure.
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
 * @returns {Promise<{ success: boolean, messageId?: string, isRealEmail: boolean }>}
 */
export async function sendOtpEmail({ toEmail, otp, userName }) {
  const normalizedEmail = (toEmail || '').trim().toLowerCase();

  // If email service is configured, send real email
  if (isEmailConfigured()) {
    const transporter = getEmailTransporter();
    const fromAddress =
      process.env.SMTP_FROM?.trim() ||
      `"Me Plus Workspace" <${process.env.SMTP_USER.trim()}>`;

    const mailOptions = {
      from: fromAddress,
      to: normalizedEmail,
      subject: `${otp} is your Me Plus password reset verification code`,
      text: `Hello ${userName || 'there'},\n\nYour Me Plus password reset verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nMe Plus Workspace Team`,
      html: buildOtpEmailHtml({ otp, userName, toEmail: normalizedEmail }),
    };

    console.log(`📨 [EMAIL SERVICE] Sending real email via SMTP to: ${normalizedEmail}...`);
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
  console.log(`Subject: ${otp} is your Me Plus password reset verification code`);
  console.log(`OTP Code: 👉 ${otp} 👈 (Valid for 10 minutes)`);
  console.log(`💡 Tip: To send real emails to inboxes, configure SMTP_USER and SMTP_PASS in .env`);
  console.log(`======================================================\n`);

  return {
    success: true,
    isRealEmail: false,
  };
}
