# Item CRUD Architecture

A unified CRUD system for all 7 item types using one action file, shared DB query functions, a single dynamic route, and type-adaptive components.

---

## File Structure

```
src/
├── actions/
│   └── items.ts                  # All item mutations (create, update, delete)
│
├── lib/db/
│   └── items.ts                  # All item read queries (already exists, extend it)
│
├── app/(dashboard)/
│   └── items/
│       └── [type]/
│           └── page.tsx          # Single route for all 7 types
│
└── components/
    └── items/
        ├── ItemList.tsx          # List + empty state, renders ItemCard[]
        ├── ItemCard.tsx          # Display card, adapts by contentType
        ├── ItemDialog.tsx        # Create/edit modal (controlled)
        ├── ItemForm.tsx          # Form fields, adapts by contentType
        ├── DeleteItemButton.tsx  # Confirmation + delete action call
        └── fields/
            ├── TextField.tsx     # Markdown editor for TEXT types
            ├── FileField.tsx     # File upload input for FILE types
            └── UrlField.tsx      # URL input for URL types
```

---

## Routing: `/items/[type]`

The `[type]` segment matches the item type name: `snippets`, `prompts`, `commands`, `notes`, `files`, `images`, `links`.

```
/items/snippets  →  app/(dashboard)/items/[type]/page.tsx  (type = "snippets")
/items/prompts   →  same file
/items/links     →  same file
```

The page receives `params.type`, strips the trailing `s` to get the canonical type name, then fetches the matching `ItemType` row and all items of that type for the current user.

```typescript
// app/(dashboard)/items/[type]/page.tsx
export default async function ItemTypePage({ params }: { params: { type: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const typeName = params.type.replace(/s$/, ""); // "snippets" → "snippet"
  const [itemType, items] = await Promise.all([
    getItemTypeByName(typeName),
    getItemsByType(session.user.id, typeName),
  ]);

  if (!itemType) notFound();

  return <ItemList items={items} itemType={itemType} />;
}
```

---

## Data Fetching: `src/lib/db/items.ts`

Extend the existing file with two new query functions. All queries are called directly from server components — never from client components.

```typescript
// Add to src/lib/db/items.ts

export async function getItemTypeByName(name: string): Promise<ItemType | null>
export async function getItemsByType(userId: string, typeName: string): Promise<ItemWithMeta[]>
```

`ItemWithMeta` already exists in the file; reuse the same shape and `mapItem()` helper.

---

## Mutations: `src/actions/items.ts`

One file, three exported Server Actions. Type-specific field logic is handled by the caller (the form), not here — the action accepts a flat `FormData` and writes whatever fields are present.

```typescript
// src/actions/items.ts
"use server";

export async function createItem(_prevState: string | null, formData: FormData): Promise<string | null>
export async function updateItem(_prevState: string | null, formData: FormData): Promise<string | null>
export async function deleteItem(itemId: string): Promise<string | null>
```

### createItem

1. Call `auth()` — redirect to `/sign-in` if no session.
2. Parse and validate with Zod (see schema below).
3. Look up `itemTypeId` from the `type` field value.
4. `prisma.item.create(...)` with only the fields relevant to the content type.
5. Return `null` on success (triggers optimistic UI reset), or an error string.

### updateItem

Same as create but includes `id` in FormData. Uses `prisma.item.update()`. Verifies `userId` matches before updating (ownership check).

### deleteItem

Accepts `itemId` directly (not FormData — called from a button, not a form). Verifies ownership, then `prisma.item.delete()`. Returns `null` or error string.

### Zod Schema

```typescript
import { z } from "zod";
import { ContentType } from "@/generated/prisma";

const baseItemSchema = z.object({
  title:      z.string().min(1).max(255),
  type:       z.enum(["snippet","prompt","command","note","file","image","link"]),
  description: z.string().max(1000).optional(),
  language:   z.string().optional(),
  tags:       z.string().optional(), // comma-separated, split in action
});

const textItemSchema = baseItemSchema.extend({
  content: z.string().min(1),
});

const urlItemSchema = baseItemSchema.extend({
  url: z.string().url(),
});

// FILE types validated separately after upload; fileUrl comes from R2 response
```

Select the right schema based on `contentType` derived from `type`:

```typescript
const contentType = TYPE_TO_CONTENT_TYPE[type]; // "snippet" → ContentType.TEXT
const schema = contentType === "TEXT" ? textItemSchema
             : contentType === "URL"  ? urlItemSchema
             : baseItemSchema; // FILE — fileUrl handled after upload
```

---

## Where Type-Specific Logic Lives

Type-specific rendering and field logic belongs in **components**, not actions.

| Concern | Lives in |
|---|---|
| Which fields to show in the form | `ItemForm.tsx` (switches on `contentType`) |
| Which editor to render | `fields/TextField.tsx`, `fields/FileField.tsx`, `fields/UrlField.tsx` |
| How to display content in a card | `ItemCard.tsx` (switches on `contentType`) |
| Which icon and color to use | `ICON_MAP` / `ITEM_TYPE_COLORS` from `lib/constants/item-types.ts` |
| Which DB fields to write | `createItem` / `updateItem` (determined by parsed `contentType`) |
| Validation rules | Zod schema selected by `contentType` in action |

The action never branches on type to decide business logic — it only uses `contentType` to know which optional fields to include in the Prisma call.

---

## Component Responsibilities

### `ItemList`
- Server or client component receiving `items: ItemWithMeta[]` and `itemType: ItemType`
- Renders a grid/list of `ItemCard`s
- Shows an empty state with a "New [type]" button when `items.length === 0`
- Renders a floating "+" button to open `ItemDialog` in create mode

### `ItemCard`
- Displays a single item
- Shows: colored left border (type color), icon, title, description excerpt, tag pills, type badge, date
- Shows content preview based on `contentType`:
  - TEXT → truncated code/text block
  - FILE → filename + size
  - URL → domain of the `url`
- Hover actions: favorite toggle, pin toggle, edit button (opens `ItemDialog`), delete

### `ItemDialog`
- Client component, controlled (`isOpen` / `onClose` props)
- Accepts optional `item` prop: if present, renders in edit mode; if absent, renders in create mode
- Renders `ItemForm` inside a `Dialog`
- Calls `createItem` or `updateItem` via `useActionState`
- Closes and triggers a router refresh on success

### `ItemForm`
- Client component
- Receives `itemType` (to know which fields to render) and optional `item` (to pre-fill)
- Always renders: `title` input, `description` textarea, `tags` input, hidden `type` field
- Conditionally renders based on `contentType`:
  - TEXT → `TextField` (markdown editor + `language` selector)
  - FILE → `FileField` (file upload input)
  - URL → `UrlField` (URL text input)

### `DeleteItemButton`
- Client component
- Renders a `Button` that opens an `AlertDialog` confirmation
- On confirm, calls `deleteItem(item.id)` directly (no form)
- Shows a toast on success/error
- Triggers `router.refresh()` after deletion

### `fields/TextField`
- Renders a `<textarea>` (or markdown editor)
- Optional `language` `<select>` dropdown for snippet/command types

### `fields/FileField`
- Renders a `<input type="file" />`
- On file select, uploads to `/api/upload` → receives `fileUrl`, stores in a hidden input
- Displays filename + size after upload

### `fields/UrlField`
- Renders a `<input type="url" />`
- Basic URL format validation on blur

---

## Authorization Pattern

Every server action follows the same ownership check:

```typescript
const session = await auth();
if (!session?.user?.id) redirect("/sign-in");

// For update/delete, verify ownership before mutating:
const item = await prisma.item.findUnique({ where: { id } });
if (!item || item.userId !== session.user.id) return "Item not found.";
```

---

## Error Handling

Actions return `string | null`:
- `null` — success
- `string` — user-facing error message

Forms consume this via `useActionState`:

```typescript
const [error, formAction, isPending] = useActionState(createItem, null);
```

Display the error below the submit button. Show a Sonner toast on success (triggered when error transitions from non-null to null after a successful revalidation, or by checking the return value directly).
