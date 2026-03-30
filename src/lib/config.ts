/**
 * Set EMAIL_VERIFICATION_ENABLED=true in your environment to require users
 * to verify their email after registration. When false (default), users can
 * sign in immediately after registering without email verification.
 *
 * Keep this false in development unless you have a Resend domain configured.
 */
export const EMAIL_VERIFICATION_ENABLED =
  process.env.EMAIL_VERIFICATION_ENABLED === "true";
