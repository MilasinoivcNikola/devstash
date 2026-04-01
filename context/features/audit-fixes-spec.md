# Audit Fixes

Fixes for issues identified during the codebase security & quality audit.

---

## 1. Open Redirect via Unvalidated `callbackUrl`

**Severity:** HIGH
**File:** `src/app/(auth)/sign-in/page.tsx`

### Problem

The `callbackUrl` search param is passed directly to `signIn({ redirectTo })` without validating it is a same-origin path. An attacker can craft `/sign-in?callbackUrl=https://evil.com` to redirect users to a malicious site after login.

### Fix

- Create a `isSafeRedirect(url: string): boolean` helper that checks the URL starts with `/` and does not start with `//`
- Apply it to the `callbackUrl` before passing to both `signIn('credentials', ...)` and `signIn('github', ...)`
- Fall back to `/dashboard` if the URL is not safe

```ts
function isSafeRedirect(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

const safeCallbackUrl = isSafeRedirect(callbackUrl) ? callbackUrl : '/dashboard';
```

### Files to Change

- `src/app/(auth)/sign-in/page.tsx` — add validation before both `signIn` calls

---

## 2. `getSidebarCollections` Unbounded Query

**Severity:** HIGH
**File:** `src/lib/db/collections.ts`

### Problem

`getSidebarCollections` fetches ALL of a user's collections with ALL their items (including nested itemType) on every page load across 3 layouts, just to compute a dominant color for the sidebar. No `take` limit. Grows linearly with user data.

### Fix

- Split into two bounded queries: one for favorites, one for recent non-favorites
- Add `take` limits to both (e.g. 10 each — the sidebar only shows a handful)
- Keep the existing dominant color computation but cap the items included per collection

```ts
const [favorites, recent] = await Promise.all([
  prisma.collection.findMany({
    where: { userId, isFavorite: true },
    take: 10,
    include: {
      items: {
        take: 50,
        include: { item: { include: { itemType: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  }),
  prisma.collection.findMany({
    where: { userId, isFavorite: false },
    take: 5,
    include: {
      items: {
        take: 50,
        include: { item: { include: { itemType: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  }),
]);
```

### Files to Change

- `src/lib/db/collections.ts` — rewrite `getSidebarCollections`

---

## 3. `getRecentCollections` Eager-Loads All Items

**Severity:** MEDIUM
**File:** `src/lib/db/collections.ts`

### Problem

Same pattern as #2. The 6 recent collections each load unlimited items just to compute type icon counts for the dashboard cards.

### Fix

- Add `take: 50` on the nested `items` include (only need a representative sample for icon deduction)
- Extract the shared dominant-color logic into a helper (see shared refactor below)

```ts
include: {
  items: {
    take: 50,
    include: {
      item: { include: { itemType: true } },
    },
  },
},
```

### Files to Change

- `src/lib/db/collections.ts` — add `take` to `getRecentCollections` items include

### Shared Refactor: Extract Dominant Color Helper

Both `getRecentCollections` and `getSidebarCollections` contain an identical ~15-line block for computing dominant color. Extract to a shared helper in the same file:

```ts
type ItemWithType = { item: { itemTypeId: string; itemType: { color: string } } };

function computeDominantColor(items: ItemWithType[]): string {
  const counts = new Map<string, { color: string; count: number }>();
  for (const { item } of items) {
    const existing = counts.get(item.itemTypeId);
    if (existing) existing.count++;
    else counts.set(item.itemTypeId, { color: item.itemType.color, count: 1 });
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count)[0]?.color ?? '#6b7280';
}
```

Then use it in both functions instead of the duplicated inline logic.

---

## 4. Email Not Normalized at Registration

**Severity:** MEDIUM
**File:** `src/app/(auth)/register/page.tsx`

### Problem

Email is stored as-is (no trim or lowercase) at registration. But:
- `resend-verification` normalizes with `.trim().toLowerCase()`
- PostgreSQL `findUnique({ where: { email } })` is case-sensitive

A user registering as `User@Example.com` cannot sign in with `user@example.com`.

### Fix

- Normalize email at the earliest point of input in the register action
- Also normalize in the sign-in action and forgot-password action for consistency

```ts
const email = (formData.get('email') as string).trim().toLowerCase();
```

### Files to Change

- `src/app/(auth)/register/page.tsx` — normalize email in `registerAction`
- `src/app/(auth)/sign-in/page.tsx` — normalize email in `signInAction`
- `src/app/(auth)/forgot-password/page.tsx` — normalize email (verify it already does or add)

---

## 5. Download Serves UUID Filename Instead of Original

**Severity:** MEDIUM
**File:** `src/app/api/download/route.ts`

### Problem

`Content-Disposition` uses the R2 storage key (a UUID like `550e8400...pdf`) as the filename instead of the original `fileName` stored in the Item record. Users downloading files get meaningless names.

### Fix

- Accept an optional `name` query parameter in the download route
- Use it for `Content-Disposition` when present, with sanitization to prevent header injection
- Update all call sites that link to the download route to include `&name=<originalFileName>`

```ts
// In the download route
const rawName = searchParams.get('name');
const safeName = rawName ? rawName.replace(/[^\w\-. ]/g, '_') : key.split('/').pop() ?? 'download';
const disposition = isInline ? 'inline' : `attachment; filename="${safeName}"`;
```

### Files to Change

- `src/app/api/download/route.ts` — read `name` param, sanitize, use in `Content-Disposition`
- `src/components/items/ItemDrawer.tsx` — pass `&name=` when building download URL
- `src/components/items/ItemsClientWrapper.tsx` — pass `&name=` in `FileListRow` download link
