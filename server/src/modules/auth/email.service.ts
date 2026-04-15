import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

interface PasswordResetEmail {
  to: string;
  name: string;
  tempPassword: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = process.env.EMAIL_FROM || 'My Squad <onboarding@resend.dev>';
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY not set — emails will be logged instead of sent.',
      );
    }
  }

  async sendPasswordReset({ to, name, tempPassword }: PasswordResetEmail) {
    const subject = 'Your new My Squad password';
    const html = renderResetEmail({ name, tempPassword });

    if (!this.resend) {
      this.logger.log(`[DEV EMAIL] To: ${to} — temp password: ${tempPassword}`);
      return;
    }
    await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
  }
}

function renderResetEmail({
  name,
  tempPassword,
}: {
  name: string;
  tempPassword: string;
}): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
      <h1 style="font-size: 20px; margin: 0 0 16px;">Your new password</h1>
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received a password reset request for your My Squad account. Use the temporary password below to sign in, then change it from the user menu.</p>
      <div style="margin: 24px 0; padding: 16px; background: #f1f5f9; border-radius: 8px; text-align: center;">
        <code style="font-size: 20px; font-family: 'SF Mono', Menlo, monospace; letter-spacing: 2px; color: #0f172a;">${escapeHtml(tempPassword)}</code>
      </div>
      <p style="font-size: 12px; color: #64748b;">If you didn't request this, change your password immediately — someone may have requested a reset using your email.</p>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
