# Auth Security Review

**Last Audited:** 2026-03-30
**Auditor:** auth-auditor agent
**Scope:** Registration, email verification, password reset, sign-in, profile/account management

---

## Findings

### CRITICAL

_No critical issues found._

---

### HIGH

#### [HIGH] No Rate Limiting on Auth Endpoints

**Files:**
- `src/app/api/auth/register/route.ts` (entire route)
- `src/app/(auth)/forgot-password/page.tsx` (line 16 — `forgotPasswordAction`)
- `src/app/(auth)/sign-in/page.tsx` (line 26 — `credentialsAction`)

**Description:**
None of the three sensitive auth entry points implement any rate limiting or brute-force protection. Any anonymous actor can make unlimited requests without throttling.

Concrete impact per endpoint:

- **`/api/auth/register`** — An attacker can create thousands of accounts to exhaust free-tier slots or spam the email provider (Resend).
- **`/forgot-password` (`forgotPasswordAction`)** — With `EMAIL_VERIFICATION_ENABLED` off (the default), this endpoint will generate and send a reset email on every submission for a real account. An attacker can flood a target user's inbox and exhaust Resend's send quota.
- **`/sign-in` (`credentialsAction`)** — No lockout exists on the Credentials `authorize` path. An attacker can iterate passwords against a known email address without restriction.

**Evidence:**

```ts
// src/app/api/auth/register/route.ts — no rate limit guard
export async function POST(request: Request) {
  const body = await request.json();
  // ... directly proceeds to bcrypt.hash and user creation
}

// src/app/(auth)/forgot-password/page.tsx — no rate limit guard
async function forgotPasswordAction(formData: FormData) {
  'use server';
  // ... directly proceeds to token creation and email send
}
```

**Fix:**
Use an in-process sliding-window counter (e.g., `@upstash/ratelimit` with Vercel KV, or `lru-cache` for single-instance deployments) keyed by IP address. Apply it at the top of each action/route before any DB or email work. Example:

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { headers } from 'next/headers';

const ratelimit = new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(5, '1 m') });

// In forgot-password action:
const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';
const { success } = await ratelimit.limit(ip);
if (!success) redirect('/forgot-password?error=too_many_requests');
```

---

### MEDIUM

#### [MEDIUM] Reset Token Accepted by Email Verification Endpoint

**File:** `src/app/(auth)/verify-email/page.tsx` (lines 17–35)

**Description:**
The `/verify-email` page looks up the token with `prisma.verificationToken.findUnique({ where: { token } })` but does **not** check that `record.identifier` is a plain email (as opposed to the `reset:<email>` namespace used by password-reset tokens). If an attacker obtains a valid password-reset token (e.g., via a link in their own email, a shared computer, server logs, or Referrer header leakage), they can submit it to `/verify-email?token=<reset-token>` and it will:

1. Match the record successfully (no namespace check).
2. Call `prisma.user.update({ where: { email: record.identifier }, ... })` with `email = "reset:someone@example.com"` — which will fail silently (no user has that email), and the token is **not deleted**, so the reset link remains valid.

While the actual damage in this specific code path is low (the `where: { email: "reset:..." }` update simply finds no row), the lack of namespace isolation is a latent defect. Future changes to this page (e.g., also marking the account as verified without a DB lookup) could escalate this to a real vulnerability. Additionally, the reverse is currently exploitable in a subtle way: a verification token **can** pass through the reset-password flow's namespace check (`record.identifier.startsWith('reset:')`) — it fails that check and redirects to `invalid_token`, so that direction is safe. But the forward direction (reset token → verify-email page) lands in an unguarded code path.

**Evidence:**

```ts
// src/app/(auth)/verify-email/page.tsx
const record = await prisma.verificationToken.findUnique({ where: { token } });

if (!record) { /* invalid */ }

// No check: record.identifier must NOT start with 'reset:'
await prisma.user.update({
  where: { email: record.identifier },  // could be "reset:user@example.com"
  data: { emailVerified: new Date() },
});
await prisma.verificationToken.delete({ where: { token } }); // reset token consumed!
```

The worst-case scenario: if `record.identifier` happened to equal a real user email (impossible with the current `reset:` prefix, but a one-character typo away in future code), the reset token would silently mark that account as email-verified and consume the reset token.

**Fix:**
Add an explicit namespace guard at the top of the verify-email handler, mirroring the check already present in the reset-password action:

```ts
if (!record || record.identifier.startsWith('reset:')) {
  return <Result success={false} message="This verification link is invalid." />;
}
```

---

#### [MEDIUM] Open Redirect via Unvalidated `callbackUrl`

**File:** `src/app/(auth)/sign-in/page.tsx` (lines 24, 41, 55)

**Description:**
The `callbackUrl` query parameter is read directly from `searchParams` and passed without any validation to both the credentials `signIn` call and the GitHub OAuth `signIn` call:

```ts
const { error, callbackUrl = '/dashboard', reset } = await searchParams;
// ...
await signIn('credentials', { ..., redirectTo: callbackUrl });
// ...
await signIn('github', { redirectTo: callbackUrl });
```

An attacker can craft a phishing URL such as:

```
https://devstash.app/sign-in?callbackUrl=https://evil.com
```

After a successful sign-in (credentials or GitHub OAuth), the user is redirected to `https://evil.com`. This is a classic open redirect that can be used for phishing, stealing OAuth codes in redirect chains, or SSO abuse.

NextAuth v5's built-in `redirectTo` validation restricts redirects to the same origin **only when the redirect is initiated internally by NextAuth** (e.g., when it sets the callbackUrl cookie itself during an OAuth flow). When `redirectTo` is supplied directly in application code as a runtime value from an untrusted source, NextAuth passes it through — the origin validation does not apply to caller-supplied values.

**Evidence:**

```ts
// line 24 — callbackUrl comes directly from query string, no validation
const { error, callbackUrl = '/dashboard', reset } = await searchParams;

// line 41 — passed to credentials sign-in without origin check
await signIn('credentials', {
  email,
  password: formData.get('password') as string,
  redirectTo: callbackUrl,     // <-- unvalidated external URL
});

// line 55 — same issue for GitHub OAuth
await signIn('github', { redirectTo: callbackUrl });  // <-- unvalidated
```

**Fix:**
Validate that `callbackUrl` is a relative path (starts with `/`) or matches the application origin before use:

```ts
function isSafeRedirect(url: string): boolean {
  // Allow relative paths only
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  // Optionally allow same-origin absolute URLs
  try {
    const parsed = new URL(url);
    return parsed.origin === process.env.NEXT_PUBLIC_APP_URL;
  } catch {
    return false;
  }
}

const rawCallbackUrl = (await searchParams).callbackUrl ?? '/dashboard';
const callbackUrl = isSafeRedirect(rawCallbackUrl) ? rawCallbackUrl : '/dashboard';
```

---

### LOW

#### [LOW] Registration Reveals Whether an Email Is Already Registered

**Files:**
- `src/app/(auth)/register/page.tsx` (line 47 — redirect to `?error=email_taken`)
- `src/app/api/auth/register/route.ts` (line 26 — HTTP 409 with `"Email already in use"`)

**Description:**
Both the Server Action path (used by the UI) and the raw API route return a distinct error when a submitted email already exists in the database. This allows an attacker to enumerate registered email addresses by simply submitting registration attempts.

This is a lower-severity finding for most applications — the registration form is public by design, and account enumeration via registration is widely accepted as a minor risk. However, it is inconsistent with the forgot-password flow, which correctly uses silent-success enumeration prevention. Some users have privacy expectations that their email not be disclosed.

**Evidence:**

```ts
// src/app/(auth)/register/page.tsx line 47
if (existing) {
  redirect('/register?error=email_taken');  // distinct error key
}

// ERROR_MESSAGES map:
email_taken: 'An account with this email already exists.',
```

```ts
// src/app/api/auth/register/route.ts line 26
return NextResponse.json({ error: "Email already in use" }, { status: 409 });
```

**Fix:**
Either accept this as a product decision (most apps do) and document it, or replace the distinct `email_taken` message with a generic "If this email is not yet registered, your account has been created. Check your inbox." flow — effectively merging registration and verification into a silent path.

---

#### [LOW] Email Verification Disabled by Default — Deployment Risk

**File:** `src/lib/config.ts` (line 8)

**Description:**
`EMAIL_VERIFICATION_ENABLED` defaults to `false`, meaning that in any deployment where this environment variable is not explicitly set to `"true"`, users can register with any email address they do not own and immediately gain access. This is documented as intentional for development, but there is no runtime guard preventing this from going to production in this state.

**Evidence:**

```ts
export const EMAIL_VERIFICATION_ENABLED =
  process.env.EMAIL_VERIFICATION_ENABLED === "true";
```

If this variable is omitted from a production deployment (e.g., forgotten in Vercel environment variables), the application silently runs without email verification, allowing account takeover by email address squatting.

**Fix:**
Add a startup assertion that fails the build or throws at boot time in production:

```ts
// src/lib/config.ts
export const EMAIL_VERIFICATION_ENABLED =
  process.env.EMAIL_VERIFICATION_ENABLED === "true";

if (process.env.NODE_ENV === "production" && !EMAIL_VERIFICATION_ENABLED) {
  console.warn(
    "[SECURITY] EMAIL_VERIFICATION_ENABLED is false in production. " +
    "Users can register with unverified email addresses."
  );
  // Or throw new Error(...) to hard-fail if this is unacceptable
}
```

---

## Passed Checks

- **bcrypt cost factor**: `bcrypt.hash(password, 12)` — cost factor 12 is used consistently across register, change-password, and reset-password. Well above the minimum of 10.
- **Password not returned in responses**: `auth.ts` `authorize` returns only `{ id, email, name, image }` — the `password` field is never included. Profile DB query uses `getProfileUser` which returns `hasPassword` boolean only.
- **Old password verified before change**: `changePasswordAction` in `src/app/profile/actions.ts` correctly fetches the stored hash and calls `bcrypt.compare(currentPassword, user.password)` before hashing and saving the new password.
- **Server-side password length validation**: All three password-setting paths (register action, register API route, changePasswordAction, resetPasswordAction) check `password.length < 8` on the server before hashing.
- **CSPRNG token generation**: All tokens use `randomBytes(32).toString('hex')` from Node's `crypto` module — cryptographically secure.
- **Token expiration enforced at lookup time**: Both verify-email and reset-password check `record.expires < new Date()` immediately after finding the record, before acting on it.
- **Tokens are single-use**: Both verify-email (`src/app/(auth)/verify-email/page.tsx` line 35) and reset-password (`src/app/(auth)/reset-password/actions.ts` line 43) delete the token after successful use.
- **Namespace collision between verification and reset tokens**: Reset tokens are stored with `identifier = "reset:<email>"`, verification tokens with `identifier = "<email>"`. The reset-password action checks `record.identifier.startsWith('reset:')`. Partial — see Medium finding for the reverse direction.
- **Forgot-password silent success**: `forgotPasswordAction` always redirects to `/forgot-password?sent=1` regardless of whether the email exists, preventing enumeration on that endpoint.
- **Session userId from server session — never from request body**: `changePasswordAction` and `deleteAccountAction` both call `const session = await auth()` and use `session.user.id` exclusively. No user-controlled userId is accepted.
- **Input validation is server-side**: All auth inputs (fields required, passwords match, minimum length) are validated inside `'use server'` actions or API route handlers — client-side `required` attributes are supplemental only.
- **Token not exposed in URL post-submission**: The reset-password form passes the token via a hidden `<input type="hidden">` in a POST body, not as a URL parameter. The token only appears in the URL on the initial GET (from the email link), which is unavoidable.
- **CSRF protection**: Handled automatically by NextAuth v5 on `/api/auth/*` endpoints. Server Actions use Next.js's built-in origin check.
- **HttpOnly / Secure / SameSite cookies**: Managed by NextAuth v5's session handling — not application code.
- **OAuth state parameter**: Handled by NextAuth v5's GitHub provider — not application code.
- **JWT signing and verification**: Handled by NextAuth v5 — not application code.

---

## Summary

**0 critical, 1 high, 2 medium, 2 low** issues found.

The overall authentication implementation is solid. Password hashing uses appropriate cost factors, tokens are CSPRNG-generated and single-use, session data is always sourced from the server-side session (never from request input), and the forgot-password flow correctly prevents email enumeration.

The most impactful issue is the **absence of rate limiting** across all three auth entry points, which exposes the application to credential stuffing, password spraying, and email-send quota exhaustion. This should be addressed before launch.

The **open redirect via `callbackUrl`** is the second priority — it requires no authentication and can be weaponized for phishing in a one-click attack against any user who clicks a crafted link.

The **token namespace isolation gap** in the verify-email endpoint is a latent defect that poses minimal risk with the current code but should be patched with a one-line guard to prevent future regressions.

The two low findings (registration enumeration and the verification toggle default) are low-risk product decisions that benefit from explicit documentation and a production-time warning, respectively.
