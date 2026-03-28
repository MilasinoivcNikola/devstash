---
name: DevStash Project Architecture
description: Key architectural patterns, conventions, and anti-patterns found during the initial audit of DevStash
type: project
---

DevStash is in early development (dashboard-only stage). As of 2026-03-28, no authentication is wired up yet — the app uses hardcoded `mockUser` data in `src/lib/mock-data.ts`. All DB queries are completely unauthenticated (no `userId` filter based on session).

**Why:** Auth (NextAuth v5) is planned but not yet implemented. This is intentional for now but must be addressed before launch.

**How to apply:** Do not flag missing auth as CRITICAL until NextAuth is integrated. Flag the pattern of unscoped DB queries (missing `where: { userId }`) as a pre-auth concern to address in parallel with auth implementation.

Key architecture facts:
- No API routes exist yet — only server components and one layout with DB queries
- No Server Actions exist yet
- `src/lib/mock-data.ts` is still imported in `Sidebar.tsx` (mockUser only — for initials/name display)
- `mockItemTypes`, `mockCollections`, `mockItems` exports in mock-data.ts are dead code (not imported anywhere)
- `getSidebarCollections()` fetches ALL collections without a limit, then filters in JS — scales poorly
- `getRecentCollections()` and `getSidebarCollections()` duplicate the dominant-color computation logic
- DB queries in `items.ts` and `collections.ts` have no `where: { userId }` filter — return all rows globally
- Dashboard layout fires 2 DB queries; dashboard page fires 5 — total 7 serial-capable queries, all parallelized via Promise.all (good pattern)
- Prisma schema: `datasource db` block has no `url` field (relies on prisma.config.ts for URL injection — Prisma 7 pattern)
- `prisma/seed.ts` hardcodes demo password "12345678" — acceptable for seed data
