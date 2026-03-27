# DevStash

A developer knowladge hub for shippets, commands, prompts, notes, files, images, links and custom types

## Context Files

Read the following to get the full context of teh project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Important: Read the docs first

This project uses **Next.js 16**, which has breaking changes from prior versions. Before writing any Next.js-specific code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices.

Key behavioral changes in Next.js 16:

- `next build` no longer runs the linter automatically — run it via `npm run lint`
- Turbopack is the default bundler for `next dev` (use `--webpack` to opt out)
- `next lint` is removed; ESLint is invoked directly as `eslint`

## Commands

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
