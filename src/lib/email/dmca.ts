/**
 * DMCA Email Templates
 *
 * NOTE: This module provides email sending functionality for DMCA-related notifications.
 * Currently implements a basic Resend integration. To enable emails:
 *
 * 1. Install Resend: npm install resend
 * 2. Set RESEND_API_KEY in your environment variables
 * 3. Set DMCA_AGENT_EMAIL in your environment variables
 *
 * If Resend is not configured, emails will be logged to console instead.
 */

const DMCA_AGENT_EMAIL = process.env.DMCA_AGENT_EMAIL || 'dmca@auteur.film';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@auteur.film';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://auteur.film';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  // Check if Resend is configured
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    // Log to console in development
    console.log('=== EMAIL (not sent - RESEND_API_KEY not configured) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.replace(/<[^>]*>/g, '')}`);
    console.log('=== END EMAIL ===');
    return { success: true, messageId: 'dev-mode' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Email template wrapper
function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auteur.film</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF6B6B; padding: 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; letter-spacing: 2px; }
    .content { background: #FFF8F0; padding: 30px; border: 3px solid #1a1a1a; }
    .warning-box { background: #FFE66D; border: 2px solid #1a1a1a; padding: 15px; margin: 20px 0; }
    .alert-box { background: #FF6B6B; color: white; border: 2px solid #1a1a1a; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    a { color: #FF6B6B; }
    .button { display: inline-block; background: #4ECDC4; color: white; padding: 12px 24px; text-decoration: none; border: 2px solid #1a1a1a; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AUTEUR.FILM</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Auteur.film - The Platform for Next-Gen Filmmakers</p>
      <p><a href="${APP_URL}/dmca">DMCA Policy</a> | <a href="${APP_URL}/terms">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>
`;
}

// 1. Reporter confirmation email
export async function sendDMCAReportConfirmation(params: {
  reporterEmail: string;
  contentTitle: string;
  reportId: string;
  reason: string;
}): Promise<EmailResult> {
  const { reporterEmail, contentTitle, reportId, reason } = params;

  const reasonLabels: Record<string, string> = {
    copyright: 'Copyright Infringement',
    publicity: 'Right of Publicity Violation',
    other: 'Other Violation',
  };

  const html = wrapTemplate(`
    <h2>Report Received</h2>
    <p>Thank you for submitting your report. We have received your complaint and will review it promptly.</p>

    <div class="warning-box">
      <p><strong>Report Details:</strong></p>
      <p>Report ID: ${reportId}</p>
      <p>Content: ${contentTitle}</p>
      <p>Reason: ${reasonLabels[reason] || reason}</p>
    </div>

    <p>Our team will review your report and take appropriate action in accordance with our
    <a href="${APP_URL}/dmca">DMCA Policy</a>. You will receive a follow-up notification
    when a decision has been made.</p>

    <p>If you have additional information to provide, please reply to this email or contact
    our DMCA Agent at <a href="mailto:${DMCA_AGENT_EMAIL}">${DMCA_AGENT_EMAIL}</a>.</p>

    <p>Thank you for helping us maintain a safe platform.</p>
  `);

  return sendEmail(reporterEmail, `[Auteur.film] Report Received - ${reportId.slice(0, 8)}`, html);
}

// 2. DMCA Agent notification
export async function sendDMCANotificationToAgent(params: {
  reportId: string;
  contentTitle: string;
  contentId: string;
  reporterEmail: string;
  reason: string;
  description: string;
  originalWorkUrl?: string | null;
}): Promise<EmailResult> {
  const { reportId, contentTitle, contentId, reporterEmail, reason, description, originalWorkUrl } = params;

  const html = wrapTemplate(`
    <h2>New DMCA Report Submitted</h2>

    <div class="alert-box">
      <p><strong>Action Required:</strong> A new content report requires review.</p>
    </div>

    <p><strong>Report ID:</strong> ${reportId}</p>
    <p><strong>Content:</strong> ${contentTitle}</p>
    <p><strong>Content ID:</strong> ${contentId}</p>
    <p><strong>Reporter:</strong> ${reporterEmail}</p>
    <p><strong>Reason:</strong> ${reason}</p>

    <div class="warning-box">
      <p><strong>Description:</strong></p>
      <p>${description}</p>
      ${originalWorkUrl ? `<p><strong>Original Work URL:</strong> <a href="${originalWorkUrl}">${originalWorkUrl}</a></p>` : ''}
    </div>

    <p><a href="${APP_URL}/admin/dmca" class="button">Review in Admin Dashboard</a></p>

    <p>Please review this report and take appropriate action within 24 hours.</p>
  `);

  return sendEmail(DMCA_AGENT_EMAIL, `[URGENT] New DMCA Report - ${contentTitle}`, html);
}

// 3. Takedown notification to uploader
export async function sendTakedownNotification(params: {
  creatorEmail: string;
  creatorName: string;
  contentTitle: string;
  reason: string;
  reporterDescription: string;
}): Promise<EmailResult> {
  const { creatorEmail, creatorName, contentTitle, reason, reporterDescription } = params;

  const html = wrapTemplate(`
    <h2>Content Removed - DMCA Notice</h2>

    <p>Dear ${creatorName},</p>

    <div class="alert-box">
      <p>Your content "<strong>${contentTitle}</strong>" has been removed from Auteur.film
      following a DMCA takedown request.</p>
    </div>

    <p><strong>Reason:</strong> ${reason}</p>
    <p><strong>Complaint Details:</strong> ${reporterDescription}</p>

    <h3>Your Rights - Counter-Notification</h3>
    <p>If you believe this takedown was made in error or you have the right to use the content,
    you may file a counter-notification. Your counter-notification must include:</p>

    <ol>
      <li>Identification of the material that was removed</li>
      <li>A statement under penalty of perjury that you believe the material was removed by mistake</li>
      <li>Your name, address, and telephone number</li>
      <li>Consent to jurisdiction of federal court</li>
      <li>Your physical or electronic signature</li>
    </ol>

    <p>Send your counter-notification to: <a href="mailto:${DMCA_AGENT_EMAIL}">${DMCA_AGENT_EMAIL}</a></p>

    <div class="warning-box">
      <p><strong>Important Deadline:</strong> You have 10-14 business days from this notice to
      file a counter-notification. If the original complaining party does not file a court action
      after receiving your counter-notification, your content may be restored.</p>
    </div>

    <p>Please review our <a href="${APP_URL}/dmca">DMCA Policy</a> for more information.</p>
  `);

  return sendEmail(creatorEmail, `[Auteur.film] Content Removed - DMCA Notice`, html);
}

// 4. Strike warning (1st and 2nd)
export async function sendStrikeWarning(params: {
  creatorEmail: string;
  creatorName: string;
  contentTitle: string;
  strikeNumber: number;
  reason: string;
}): Promise<EmailResult> {
  const { creatorEmail, creatorName, contentTitle, strikeNumber, reason } = params;

  const isFirstStrike = strikeNumber === 1;

  const html = wrapTemplate(`
    <h2>Copyright Strike Warning - Strike ${strikeNumber} of 3</h2>

    <p>Dear ${creatorName},</p>

    <div class="${isFirstStrike ? 'warning-box' : 'alert-box'}">
      <p>You have received ${isFirstStrike ? 'a' : 'another'} copyright strike on your account.</p>
      <p><strong>Current Strikes: ${strikeNumber} of 3</strong></p>
    </div>

    <p><strong>Content:</strong> ${contentTitle}</p>
    <p><strong>Reason:</strong> ${reason}</p>

    ${isFirstStrike ? `
    <p>This is your first strike. Please review our content guidelines and ensure all future
    uploads comply with copyright laws. Repeated violations will result in account suspension.</p>
    ` : `
    <div class="alert-box">
      <p><strong>FINAL WARNING:</strong> This is your second strike. One more copyright violation
      will result in <strong>permanent suspension</strong> of your Auteur.film account and
      removal of all your content.</p>
    </div>
    `}

    <h3>Repeat Infringer Policy</h3>
    <ul>
      <li><strong>Strike 1:</strong> Warning (current)</li>
      <li><strong>Strike 2:</strong> Final warning</li>
      <li><strong>Strike 3:</strong> Permanent account suspension</li>
    </ul>

    <p>If you believe this strike was issued in error, you may file a counter-notification.
    See our <a href="${APP_URL}/dmca">DMCA Policy</a> for details.</p>
  `);

  return sendEmail(
    creatorEmail,
    `[Auteur.film] Copyright Strike ${strikeNumber} - ${isFirstStrike ? 'Warning' : 'FINAL WARNING'}`,
    html
  );
}

// 5. Account suspension notice (3rd strike)
export async function sendAccountSuspensionNotice(params: {
  creatorEmail: string;
  creatorName: string;
  contentTitle: string;
}): Promise<EmailResult> {
  const { creatorEmail, creatorName, contentTitle } = params;

  const html = wrapTemplate(`
    <h2>Account Suspended - Repeat Infringer Policy</h2>

    <p>Dear ${creatorName},</p>

    <div class="alert-box">
      <p><strong>Your Auteur.film account has been suspended.</strong></p>
      <p>This action was taken following your third copyright violation related to: "${contentTitle}"</p>
    </div>

    <h3>What This Means</h3>
    <ul>
      <li>Your account has been suspended and you can no longer access the platform</li>
      <li>All of your content has been removed from public view</li>
      <li>You are prohibited from creating new accounts</li>
    </ul>

    <h3>Appeal Process</h3>
    <p>If you believe this suspension was made in error, you may submit an appeal to our
    DMCA Agent at <a href="mailto:${DMCA_AGENT_EMAIL}">${DMCA_AGENT_EMAIL}</a>. Your appeal
    should include:</p>

    <ul>
      <li>Your account information</li>
      <li>Detailed explanation of why you believe the suspension is in error</li>
      <li>Any supporting documentation</li>
    </ul>

    <p>Appeals are reviewed on a case-by-case basis. We will respond within 10 business days.</p>

    <p>For more information, please review our <a href="${APP_URL}/dmca">DMCA Policy</a> and
    <a href="${APP_URL}/terms">Terms of Service</a>.</p>
  `);

  return sendEmail(creatorEmail, `[Auteur.film] Account Suspended - Repeat Infringer Policy`, html);
}
