<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NEXCODE Gym Manager instructions

Every coding agent MUST read `.agents/README.md` and every relevant topic rule before editing.
Read `.agents/prettier.md` before code or configuration changes. Follow `.agents/git.md` and
`.agents/agent-workflow.md` on every task. Humans execute scaffolding, installation, formatting,
linting, type-checking, tests, builds, servers, Git writes and deployment.

This project owns the organization-manager frontend and explicit BFF adapters only. NestJS remains
authoritative for sessions, memberships, organization and branch access, permissions, entitlements
and business policy. Prisma belongs exclusively to `gym-db`. A route, slug, hostname or browser
claim can select context but can never authorize it.

Use the installed Next.js documentation under `node_modules/next/dist/docs/`. If it is unavailable,
report the missing installation and consult official version-matched documentation; do not install
dependencies to bypass the human-only execution boundary.
