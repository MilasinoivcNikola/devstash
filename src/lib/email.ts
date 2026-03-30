import { Resend } from 'resend';

const FROM = 'onboarding@resend.dev';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function sendPasswordResetEmail(email: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your DevStash password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="margin-bottom:8px">Reset your password</h2>
        <p style="color:#6b7280;margin-bottom:24px">
          Click the button below to reset your DevStash password.
          This link expires in 1 hour.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500">
          Reset password
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">
          If you didn&apos;t request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your DevStash email',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="margin-bottom:8px">Verify your email</h2>
        <p style="color:#6b7280;margin-bottom:24px">
          Click the button below to verify your email address and activate your DevStash account.
          This link expires in 24 hours.
        </p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#18181b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500">
          Verify email
        </a>
        <p style="color:#9ca3af;font-size:13px;margin-top:24px">
          If you didn&apos;t create a DevStash account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
