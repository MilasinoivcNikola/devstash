import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import bcrypt from "bcryptjs";

// Provide a WebSocket constructor for the Neon serverless driver in Node.js
neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const systemItemTypes = [
  { name: "snippet", icon: "Code", color: "#3b82f6", isSystem: true },
  { name: "prompt", icon: "Sparkles", color: "#8b5cf6", isSystem: true },
  { name: "command", icon: "Terminal", color: "#f97316", isSystem: true },
  { name: "note", icon: "StickyNote", color: "#fde047", isSystem: true },
  { name: "file", icon: "File", color: "#6b7280", isSystem: true },
  { name: "image", icon: "Image", color: "#ec4899", isSystem: true },
  { name: "link", icon: "Link", color: "#10b981", isSystem: true },
];

async function seedSystemItemTypes() {
  console.log("Seeding system item types...");
  for (const type of systemItemTypes) {
    await prisma.itemType.upsert({
      where: { name_userId: { name: type.name, userId: null } },
      update: {},
      create: type,
    });
  }
}

async function seedDemoUser() {
  console.log("Seeding demo user...");
  const hashedPassword = await bcrypt.hash("12345678", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@devstash.io" },
    update: {},
    create: {
      email: "demo@devstash.io",
      name: "Demo User",
      password: hashedPassword,
      isPro: false,
      emailVerified: new Date(),
    },
  });
  return user;
}

async function getTypeId(name: string) {
  const type = await prisma.itemType.findFirst({
    where: { name, isSystem: true, userId: null },
  });
  if (!type) throw new Error(`System item type "${name}" not found`);
  return type.id;
}

async function seedCollections(userId: string) {
  console.log("Seeding collections and items...");

  const snippetTypeId = await getTypeId("snippet");
  const promptTypeId = await getTypeId("prompt");
  const commandTypeId = await getTypeId("command");
  const linkTypeId = await getTypeId("link");

  // ── React Patterns ──────────────────────────────────────────────────
  const reactCollection = await prisma.collection.upsert({
    where: { id: `seed-collection-react-${userId}` },
    update: {},
    create: {
      id: `seed-collection-react-${userId}`,
      name: "React Patterns",
      description: "Reusable React patterns and hooks",
      userId,
    },
  });

  const reactItems = [
    {
      id: `seed-item-react-hooks-${userId}`,
      title: "Custom Hooks Collection",
      contentType: "TEXT" as const,
      language: "typescript",
      content: `import { useState, useEffect, useCallback, useRef } from "react";

// useDebounce — delays updating a value until after a pause
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// useLocalStorage — persists state in localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

// usePrevious — returns the previous value of a variable
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}`,
      itemTypeId: snippetTypeId,
      userId,
    },
    {
      id: `seed-item-react-context-${userId}`,
      title: "Context Provider Pattern",
      contentType: "TEXT" as const,
      language: "typescript",
      content: `import React, { createContext, useContext, useState, ReactNode } from "react";

// Generic context factory — avoids repetitive boilerplate
function createCtx<T>() {
  const ctx = createContext<T | undefined>(undefined);

  function useCtx() {
    const c = useContext(ctx);
    if (!c) throw new Error("useCtx must be used inside Provider");
    return c;
  }

  return [useCtx, ctx.Provider] as const;
}

// Example: Theme context
interface ThemeContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const [useTheme, ThemeProvider] = createCtx<ThemeContextValue>();

function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return <ThemeProvider value={{ theme, toggleTheme }}>{children}</ThemeProvider>;
}

export { useTheme, ThemeContextProvider };

// Compound component pattern
interface TabsProps { children: ReactNode; defaultTab: string }
interface TabProps  { id: string; children: ReactNode }
interface PanelProps { id: string; children: ReactNode }

const TabsContext = createContext<{ activeTab: string; setActiveTab: (id: string) => void } | undefined>(undefined);

function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return <TabsContext.Provider value={{ activeTab, setActiveTab }}>{children}</TabsContext.Provider>;
}

function Tab({ id, children }: TabProps) {
  const ctx = useContext(TabsContext)!;
  return (
    <button onClick={() => ctx.setActiveTab(id)} aria-selected={ctx.activeTab === id}>
      {children}
    </button>
  );
}

function Panel({ id, children }: PanelProps) {
  const ctx = useContext(TabsContext)!;
  return ctx.activeTab === id ? <div>{children}</div> : null;
}

Tabs.Tab = Tab;
Tabs.Panel = Panel;

export { Tabs };`,
      itemTypeId: snippetTypeId,
      userId,
    },
    {
      id: `seed-item-react-utils-${userId}`,
      title: "TypeScript Utility Functions",
      contentType: "TEXT" as const,
      language: "typescript",
      content: `// cn — merge Tailwind classes safely (requires clsx + tailwind-merge)
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// formatDate — locale-aware date formatting
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(date));
}

// truncate — shorten a string with ellipsis
export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength - 1) + "…" : str;
}

// sleep — promise-based delay
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// groupBy — group an array by a key
export function groupBy<T, K extends string>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const group = key(item);
      (acc[group] ??= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

// pick — pick specific keys from an object
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Pick<T, K>;
}`,
      itemTypeId: snippetTypeId,
      userId,
    },
  ];

  for (const item of reactItems) {
    const created = await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    await prisma.itemCollection.upsert({
      where: { itemId_collectionId: { itemId: created.id, collectionId: reactCollection.id } },
      update: {},
      create: { itemId: created.id, collectionId: reactCollection.id },
    });
  }

  // ── AI Workflows ─────────────────────────────────────────────────────
  const aiCollection = await prisma.collection.upsert({
    where: { id: `seed-collection-ai-${userId}` },
    update: {},
    create: {
      id: `seed-collection-ai-${userId}`,
      name: "AI Workflows",
      description: "AI prompts and workflow automations",
      userId,
    },
  });

  const aiItems = [
    {
      id: `seed-item-ai-review-${userId}`,
      title: "Code Review Prompt",
      contentType: "TEXT" as const,
      content: `You are an expert software engineer conducting a thorough code review. Analyze the following code and provide structured feedback:

**Review Checklist:**
1. **Correctness** — Does the logic achieve the intended goal? Are there edge cases or off-by-one errors?
2. **Security** — Any SQL injection, XSS, insecure deserialization, or exposed secrets?
3. **Performance** — N+1 queries, unnecessary re-renders, inefficient algorithms, or memory leaks?
4. **Readability** — Is the code self-documenting? Are variable/function names clear?
5. **Error Handling** — Are errors caught and surfaced appropriately?
6. **Tests** — Is the code testable? What test cases would you add?

**Output format:**
- Start with a brief overall assessment (1–2 sentences).
- List issues grouped by severity: 🔴 Critical → 🟡 Warning → 🔵 Suggestion.
- End with 2–3 specific improvements the author should prioritize.

Code to review:
\`\`\`
{{CODE}}
\`\`\``,
      itemTypeId: promptTypeId,
      userId,
    },
    {
      id: `seed-item-ai-docs-${userId}`,
      title: "Documentation Generator",
      contentType: "TEXT" as const,
      content: `Generate comprehensive documentation for the following code. Output in Markdown.

**Include:**
- **Overview** — What this module/function does in plain English (2–3 sentences).
- **Parameters** — Table with name, type, required, and description for each param.
- **Returns** — Type and description of the return value.
- **Throws** — Any exceptions or errors that may be raised.
- **Examples** — 2–3 realistic usage examples with comments.
- **Notes** — Any gotchas, performance considerations, or deprecation warnings.

Keep the tone technical but approachable. Avoid filler phrases like "This function is used to…".

Code:
\`\`\`
{{CODE}}
\`\`\``,
      itemTypeId: promptTypeId,
      userId,
    },
    {
      id: `seed-item-ai-refactor-${userId}`,
      title: "Refactoring Assistant",
      contentType: "TEXT" as const,
      content: `You are a senior engineer specializing in clean code and maintainable architecture. Refactor the following code with these goals:

**Objectives:**
- Eliminate duplication (DRY principle)
- Improve readability without over-engineering
- Apply SOLID principles where relevant
- Maintain identical external behavior (no feature changes)
- Prefer composition over inheritance

**Constraints:**
- Keep the same language and framework
- Do not add new dependencies unless critical
- Preserve existing tests; update them only if the public API changes

**Output:**
1. Refactored code in a code block
2. Bullet list of every change made and the reason
3. Any trade-offs or follow-up work you'd recommend

Original code:
\`\`\`
{{CODE}}
\`\`\``,
      itemTypeId: promptTypeId,
      userId,
    },
  ];

  for (const item of aiItems) {
    const created = await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    await prisma.itemCollection.upsert({
      where: { itemId_collectionId: { itemId: created.id, collectionId: aiCollection.id } },
      update: {},
      create: { itemId: created.id, collectionId: aiCollection.id },
    });
  }

  // ── DevOps ───────────────────────────────────────────────────────────
  const devopsCollection = await prisma.collection.upsert({
    where: { id: `seed-collection-devops-${userId}` },
    update: {},
    create: {
      id: `seed-collection-devops-${userId}`,
      name: "DevOps",
      description: "Infrastructure and deployment resources",
      userId,
    },
  });

  const devopsItems = [
    {
      id: `seed-item-devops-docker-${userId}`,
      title: "Next.js Docker + CI/CD Config",
      contentType: "TEXT" as const,
      language: "dockerfile",
      content: `# ── Dockerfile (multi-stage, production-optimised) ──────────────────
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# ── .github/workflows/deploy.yml ────────────────────────────────────
# name: Deploy
# on:
#   push:
#     branches: [main]
# jobs:
#   deploy:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: actions/setup-node@v4
#         with: { node-version: 20, cache: npm }
#       - run: npm ci
#       - run: npm run build
#       - run: npx prisma migrate deploy
#         env:
#           DATABASE_URL: \${{ secrets.DATABASE_URL }}`,
      itemTypeId: snippetTypeId,
      userId,
    },
    {
      id: `seed-item-devops-deploy-${userId}`,
      title: "Deployment Scripts",
      contentType: "TEXT" as const,
      language: "bash",
      content: `#!/usr/bin/env bash
# deploy.sh — zero-downtime deployment helper

set -euo pipefail

APP_NAME="\${APP_NAME:-devstash}"
IMAGE="\${REGISTRY}/\${APP_NAME}:\${GIT_SHA:-latest}"

echo "▶ Building image: \$IMAGE"
docker build -t "\$IMAGE" .

echo "▶ Pushing to registry"
docker push "\$IMAGE"

echo "▶ Running DB migrations"
docker run --rm --env-file .env "\$IMAGE" npx prisma migrate deploy

echo "▶ Rolling update"
docker service update --image "\$IMAGE" "\$APP_NAME"

echo "✅ Deployment complete"`,
      itemTypeId: commandTypeId,
      userId,
    },
    {
      id: `seed-item-devops-link-actions-${userId}`,
      title: "GitHub Actions Documentation",
      contentType: "URL" as const,
      url: "https://docs.github.com/en/actions",
      description: "Official GitHub Actions documentation — workflows, triggers, runners, and marketplace actions.",
      itemTypeId: linkTypeId,
      userId,
    },
    {
      id: `seed-item-devops-link-docker-${userId}`,
      title: "Docker Best Practices",
      contentType: "URL" as const,
      url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/",
      description: "Official Docker guide for writing efficient, secure, and maintainable Dockerfiles.",
      itemTypeId: linkTypeId,
      userId,
    },
  ];

  for (const item of devopsItems) {
    const created = await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    await prisma.itemCollection.upsert({
      where: { itemId_collectionId: { itemId: created.id, collectionId: devopsCollection.id } },
      update: {},
      create: { itemId: created.id, collectionId: devopsCollection.id },
    });
  }

  // ── Terminal Commands ────────────────────────────────────────────────
  const terminalCollection = await prisma.collection.upsert({
    where: { id: `seed-collection-terminal-${userId}` },
    update: {},
    create: {
      id: `seed-collection-terminal-${userId}`,
      name: "Terminal Commands",
      description: "Useful shell commands for everyday development",
      userId,
    },
  });

  const terminalItems = [
    {
      id: `seed-item-terminal-git-${userId}`,
      title: "Git Operations",
      contentType: "TEXT" as const,
      language: "bash",
      content: `# Undo last commit, keep changes staged
git reset --soft HEAD~1

# Interactively stage hunks
git add -p

# Stash with a description
git stash push -m "WIP: feature description"

# Clean merged local branches
git branch --merged main | grep -v '^\\* main' | xargs git branch -d

# Find the commit that introduced a bug
git bisect start
git bisect bad                # current commit is broken
git bisect good <good-sha>    # last known good commit

# Amend last commit message without changing code
git commit --amend --only -m "fix: correct commit message"

# Show all commits that touched a file
git log --follow --oneline -- path/to/file`,
      itemTypeId: commandTypeId,
      userId,
    },
    {
      id: `seed-item-terminal-docker-${userId}`,
      title: "Docker Commands",
      contentType: "TEXT" as const,
      language: "bash",
      content: `# Remove all stopped containers, unused images, networks, build cache
docker system prune -af --volumes

# Shell into a running container
docker exec -it <container_name> sh

# Tail logs with timestamps
docker logs -f --timestamps <container_name>

# Show resource usage
docker stats --no-stream

# Copy file from container to host
docker cp <container>:/app/file.txt ./file.txt

# Run a one-off command in a new container (auto-remove)
docker run --rm -it --env-file .env <image> sh

# Inspect container env vars
docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' <container>`,
      itemTypeId: commandTypeId,
      userId,
    },
    {
      id: `seed-item-terminal-process-${userId}`,
      title: "Process Management",
      contentType: "TEXT" as const,
      language: "bash",
      content: `# Find process using a port
lsof -ti tcp:3000

# Kill process on a port
kill -9 $(lsof -ti tcp:3000)

# List processes sorted by CPU
ps aux --sort=-%cpu | head -20

# Monitor file system events
fswatch -r ./src | xargs -I{} echo "Changed: {}"

# Run command and keep it alive after terminal close
nohup npm start > output.log 2>&1 &

# Show background jobs
jobs -l

# Watch a command every 2 seconds
watch -n 2 'docker ps --format "table {{.Names}}\\t{{.Status}}"'`,
      itemTypeId: commandTypeId,
      userId,
    },
    {
      id: `seed-item-terminal-npm-${userId}`,
      title: "Package Manager Utilities",
      contentType: "TEXT" as const,
      language: "bash",
      content: `# List outdated packages
npm outdated

# Interactive upgrade (requires npm-check-updates)
npx npm-check-updates -i

# Audit and auto-fix vulnerabilities
npm audit fix

# List installed packages (top level only)
npm ls --depth=0

# See what a package exports before installing
npx pkg-size <package-name>

# Check which version of a dep is actually resolved
npm ls <package-name>

# Remove node_modules and reinstall cleanly
rm -rf node_modules package-lock.json && npm install

# Run script in all workspaces
npm run build --workspaces`,
      itemTypeId: commandTypeId,
      userId,
    },
  ];

  for (const item of terminalItems) {
    const created = await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    await prisma.itemCollection.upsert({
      where: { itemId_collectionId: { itemId: created.id, collectionId: terminalCollection.id } },
      update: {},
      create: { itemId: created.id, collectionId: terminalCollection.id },
    });
  }

  // ── Design Resources ─────────────────────────────────────────────────
  const designCollection = await prisma.collection.upsert({
    where: { id: `seed-collection-design-${userId}` },
    update: {},
    create: {
      id: `seed-collection-design-${userId}`,
      name: "Design Resources",
      description: "UI/UX resources and references",
      userId,
    },
  });

  const designItems = [
    {
      id: `seed-item-design-tailwind-${userId}`,
      title: "Tailwind CSS v4 Docs",
      contentType: "URL" as const,
      url: "https://tailwindcss.com/docs",
      description: "Official Tailwind CSS documentation — utility classes, theming with @theme, and responsive design.",
      itemTypeId: linkTypeId,
      userId,
    },
    {
      id: `seed-item-design-shadcn-${userId}`,
      title: "shadcn/ui Components",
      contentType: "URL" as const,
      url: "https://ui.shadcn.com/docs/components",
      description: "Copy-paste accessible React components built on Radix UI and Tailwind CSS.",
      itemTypeId: linkTypeId,
      userId,
    },
    {
      id: `seed-item-design-radix-${userId}`,
      title: "Radix UI Primitives",
      contentType: "URL" as const,
      url: "https://www.radix-ui.com/primitives",
      description: "Unstyled, accessible component primitives for building high-quality design systems in React.",
      itemTypeId: linkTypeId,
      userId,
    },
    {
      id: `seed-item-design-lucide-${userId}`,
      title: "Lucide Icons",
      contentType: "URL" as const,
      url: "https://lucide.dev/icons",
      description: "Open-source icon library with 1000+ consistent SVG icons, available as React components.",
      itemTypeId: linkTypeId,
      userId,
    },
  ];

  for (const item of designItems) {
    const created = await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
    await prisma.itemCollection.upsert({
      where: { itemId_collectionId: { itemId: created.id, collectionId: designCollection.id } },
      update: {},
      create: { itemId: created.id, collectionId: designCollection.id },
    });
  }

  console.log("Collections and items seeded.");
}

async function main() {
  await seedSystemItemTypes();
  const user = await seedDemoUser();
  await seedCollections(user.id);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
