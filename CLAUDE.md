# Mandatory coding agent instructions

Read `AGENTS.md`, `.agents/README.md` and every relevant topic rule completely before editing.
Follow the human-only boundary in `.agents/agent-workflow.md`, the formatting policy in
`.agents/prettier.md`, and the per-file handoff in `.agents/git.md`.

This project owns the manager frontend and fixed BFF adapters. It never owns NestJS authorization,
organization membership policy, entitlements, Prisma schemas or migrations. Agents do not run
installations, formatting, verification commands, servers, Git writes or deployment.
