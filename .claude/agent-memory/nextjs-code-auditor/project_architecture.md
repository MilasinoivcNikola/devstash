---
name: DevStash Project Architecture
description: Key architectural patterns, conventions, and anti-patterns found during the 2026-04-01 full security/perf/quality audit of DevStash
type: project
---

DevStash is a functioning app as of 2026-04-01. Auth is fully wired (NextAuth v5 JWT, GitHub + Credentials, email verification flow, rate limiting). DB queries are all scoped to `userId`.

## Established Safe Patterns

- `.env` is gitignored — never flag as a security issue
- Tailwind v4 CSS config in `src/app/globals.css` via `@theme` — no `tailwind.config.ts`
- Auth fully implemented: middleware in `proxy.ts` protects `/dashboard/*` and `/profile/*`
- All DB queries in `src/lib/db/` require `userId` and scope results to that user
- Server Actions consistently return `{ success, data | error }` pattern
- Rate limiting via Upstash Redis in `src/lib/rate-limit.ts`, fails open when unconfigured
- `src/lib/mock-data.ts` now only contains `mockUser` (dead export, nothing imports it)
- Split auth config: `auth.config.ts` is edge-safe (Credentials.authorize returns null), real bcrypt check in `auth.ts`

## Issues Found in 2026-04-01 Audit

### Security
1. **Open redirect** — `callbackUrl` in `/sign-in/page.tsx` is taken from query string and passed directly to NextAuth `signIn({ redirectTo: callbackUrl })` without validating it's a same-origin URL
2. **Content-Disposition header injection** — `/api/download` sets `filename="${fileName}"` where `fileName = key.split('/').pop()` (a UUID) without sanitization; this isn't the original filename and the unescaped quotes in the header could be abused if a controlled filename ever reaches this path

### Performance
3. **`getSidebarCollections` unbounded fetch** — fetches ALL collections for a user with all items eagerly loaded, called on every page load (dashboard, items/[type], profile layouts). No `take` limit. Will degrade severely for users with many collections.
4. **`getRecentCollections` no item limit** — fetches up to 6 collections but includes ALL items per collection via eager `include`. A collection with 1000 items loads all 1000.
5. **Dominant-color logic duplicated in collections.ts** — `getRecentCollections` and `getSidebarCollections` each implement the same O(n) type-counting loop independently.

### Code Quality
6. **`ActionResult<T>` type is file-local** — defined in `src/actions/items.ts` rather than `src/types/`. Not shared.
7. **`inputClass()` duplicated** — identical helper in `ItemDrawer.tsx` and `CreateItemDialog.tsx`
8. **`TYPES` array in `CreateItemDialog.tsx` duplicates constants** — colors and icon names already exist in `src/lib/constants/item-types.ts`
9. **Favorite/Pin buttons are non-functional** — `ActionButton` for Favorite and Pin in `ItemDrawer` have no `onClick` — purely decorative UI with no action wired
10. **`download=1` param silently ignored** — `FileListRow` appends `&download=1` to the download URL, but `/api/download` never reads it (disposition is determined by content type, not this flag)
11. **Email not normalized in `registerAction`** — the server action in `/register/page.tsx` does not `.trim().toLowerCase()` the email before storing it; the resend-verification route does normalize it, creating a potential mismatch

**Why:** These represent the known state of issues as of the 2026-04-01 code audit.
**How to apply:** Do not re-flag already-known issues as new findings unless the code has changed. Use this to verify whether reported issues have been fixed in subsequent audits.
