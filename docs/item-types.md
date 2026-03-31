# Item Types

DevStash has 7 built-in system item types. All are immutable (`isSystem: true`), seeded globally without a `userId`, and available to every user.

---

## The 7 Types

| Name    | Icon (Lucide) | Color             | Content Type | Route             | Pro Only |
| ------- | ------------- | ----------------- | ------------ | ----------------- | :------: |
| snippet | `Code`        | `#3b82f6` blue    | TEXT         | `/items/snippets` |    No    |
| prompt  | `Sparkles`    | `#8b5cf6` purple  | TEXT         | `/items/prompts`  |    No    |
| command | `Terminal`    | `#f97316` orange  | TEXT         | `/items/commands` |    No    |
| note    | `StickyNote`  | `#fde047` yellow  | TEXT         | `/items/notes`    |    No    |
| file    | `File`        | `#6b7280` gray    | FILE         | `/items/files`    |   Yes    |
| image   | `Image`       | `#ec4899` pink    | FILE         | `/items/images`   |   Yes    |
| link    | `Link`        | `#10b981` emerald | URL          | `/items/links`    |    No    |

---

## Per-Type Details

### snippet — `#3b82f6`
Reusable code blocks with syntax highlighting. The `language` field drives the highlighter (e.g. `"typescript"`, `"python"`, `"bash"`).

**Key fields:** `content` (Text), `language` (optional)

---

### prompt — `#8b5cf6`
AI prompts, system messages, and templates for LLM interactions (ChatGPT, Claude, etc.).

**Key fields:** `content` (Text)

---

### command — `#f97316`
Terminal/shell commands — git, Docker, npm, deployment scripts, etc. `language` can be set to `"bash"` or `"zsh"` for syntax highlighting.

**Key fields:** `content` (Text), `language` (optional)

---

### note — `#fde047`
Freeform markdown notes — quick references, documentation, explanations.

**Key fields:** `content` (Text)

---

### file — `#6b7280` *(Pro)*
Arbitrary file uploads stored in Cloudflare R2. Tracks original filename and byte size.

**Key fields:** `fileUrl` (R2 URL), `fileName`, `fileSize` (bytes)

---

### image — `#ec4899` *(Pro)*
Image uploads (screenshots, diagrams, design references) stored in Cloudflare R2.

**Key fields:** `fileUrl` (R2 URL), `fileName`, `fileSize` (bytes)

---

### link — `#10b981`
URL bookmarks with an optional description for external resources, docs, and tools.

**Key fields:** `url`, `description` (optional)

---

## Content Type Classification

| ContentType | Types                          | Editable via       | Storage        |
| ----------- | ------------------------------ | ------------------ | -------------- |
| `TEXT`      | snippet, prompt, command, note | Markdown editor    | DB (`content`) |
| `FILE`      | file, image                    | File upload        | Cloudflare R2  |
| `URL`       | link                           | URL input          | DB (`url`)     |

---

## Shared Item Properties

All types share these fields regardless of content type:

| Field         | Type    | Purpose                          |
| ------------- | ------- | -------------------------------- |
| `title`       | String  | Display name                     |
| `description` | String? | Optional metadata / notes        |
| `isFavorite`  | Boolean | Star / favorite flag             |
| `isPinned`    | Boolean | Pin to top of lists              |
| `tags`        | Tag[]   | Many-to-many tag relationships   |
| `collections` | ItemCollection[] | Many-to-many collection membership |
| `createdAt`   | DateTime | Creation timestamp              |
| `updatedAt`   | DateTime | Last modified timestamp         |

---

## Icon Mapping (source: `src/lib/constants/item-types.ts`)

```typescript
import { Code, Sparkles, Terminal, StickyNote, File, Image, Link } from "lucide-react";

export const ITEM_TYPE_ICONS = {
  snippet: Code,
  prompt:  Sparkles,
  command: Terminal,
  note:    StickyNote,
  file:    File,
  image:   Image,
  link:    Link,
} as const;

export const ITEM_TYPE_COLORS = {
  snippet: "#3b82f6",
  prompt:  "#8b5cf6",
  command: "#f97316",
  note:    "#fde047",
  file:    "#6b7280",
  image:   "#ec4899",
  link:    "#10b981",
} as const;
```

---

## Display Differences

**TEXT types** — render a markdown editor; snippet and command support a `language` selector for syntax highlighting.

**FILE types** — render a file upload input; image type may additionally preview the uploaded image inline.

**URL type** — renders a URL text input; the link card can optionally fetch and display link metadata (title, favicon) in the future.
