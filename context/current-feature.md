# Current Feature

## Status

## Goals

## Notes

## History

- **2026-03-27** — Initial Next.js setup from Create Next App; cleaned up default assets, added project context files, updated CLAUDE.md with project instructions.
- **2026-03-27** — Dashboard UI Phase 1: ShadCN UI initialized, dark mode by default, /dashboard route with layout, TopBar with DevStash logo, centered search, and action buttons, sidebar and main area placeholders.
- **2026-03-27** — Dashboard UI Phase 2: Collapsible sidebar with Navigation header and toggle, item types with color icons and counts linking to `/items/TYPE`, favorite and recent collections (collections section collapsible), user avatar area at the bottom, mobile drawer with slide transition, mobile open button in TopBar.
- **2026-03-27** — Dashboard UI Phase 3: Main content area with 4 stats cards (total items, collections, favorite items, favorite collections), collections grid, pinned items list, and 10 most recent items. Fixed mobile full-width layout issue in TopBar and DashboardShell.
- **2026-03-28** — Prisma 7 + Neon PostgreSQL setup: installed `prisma@7`, `@prisma/client@7`, `@prisma/adapter-neon`, `@neondatabase/serverless`, `tsx`, `dotenv`. Created `prisma/schema.prisma` with full data model (User, Item, ItemType, Collection, ItemCollection, Tag + NextAuth models), `prisma.config.ts` (Prisma 7 config with dotenv and DIRECT_URL/DATABASE_URL fallback), `src/lib/prisma.ts` singleton (PrismaNeon adapter required by Prisma 7), `prisma/seed.ts` (seeds 7 system item types), `.env.example`, and `scripts/test-db.ts`. Ran initial migration (`20260328112453_init`) and confirmed all 7 system item types seeded successfully.
- **2026-03-28** — Seed demo data: expanded `prisma/seed.ts` to seed a demo user (`demo@devstash.io`, bcryptjs 12 rounds) and 5 collections with 18 items — React Patterns (3 TS snippets), AI Workflows (3 prompts), DevOps (1 snippet, 1 command, 2 links), Terminal Commands (4 commands), Design Resources (4 links). Added `neonConfig.webSocketConstructor = ws` to fix Neon serverless driver incompatibility with Node.js native WebSocket. Installed `bcryptjs` and `ws`. Seed is fully idempotent.
- **2026-03-28** — Dashboard collections from DB: created `src/lib/db/collections.ts` with `getRecentCollections()` (fetches 6 most recent collections with item types, computes dominant color and type icon list per collection) and `getCollectionStats()`. Made dashboard page async; collection cards now use a colored left border derived from the most-used item type, show real type icons sorted by frequency, and stats cards for collections/favorites pull from the DB. Items sections remain on mock data.
