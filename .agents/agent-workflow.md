# Agent execution boundary

## Purpose

Keep the human in control of executable tooling, databases, repository history and deployment.
Read this file and [git.md](git.md) on every task; tool availability does not grant permission.

## Mandatory workflow

1. Read root instructions, the rule index and all relevant topic rules completely before editing.
   Read [prettier.md](prettier.md) before code/configuration edits. Do not delegate rule reading.
2. Inspect files and read-only Git state. Identify user changes, dependencies, ownership and the
   requested outcome. A diagnosis request authorizes investigation, not implementation.
3. Edit only authorized project files. Preserve unrelated work and existing deletions. Do not
   modify sibling API/DB repositories to make a frontend workaround seem complete.
4. Statically review imports, contracts, error paths, security boundaries and diff scope. Read-only
   file inspection and Git diagnostics are allowed; execution checks below are reserved for humans.
5. Give exact human commands with the correct working directory and prerequisites. Explicitly say
   what was not run and what requires real backend, browser or deployment verification.
6. Finish with all uncommitted files accounted for and per-file messages/commands under the Git rule.

## Human-only operations

Humans execute scaffolding, dependency installs, formatters, lint, type checks, tests, builds,
development servers, browser verification, Git writes and deployment. Database connections,
migrations, seed scripts and administrative operations are not frontend implementation steps.
A separate explicit user instruction is required to change this execution boundary.

Never bypass the boundary through an npm script, Node/Python wrapper, subprocess, IDE automation,
CI trigger or another agent. A script named "inspect" is still prohibited if it runs a build.

## Do

```text
Edited: the BFF handler and its negative-case tests.
Reviewed: source contracts, imports, Origin rejection and response allowlisting.
Not run: formatting, lint, typecheck, tests or build.
Human next steps from app/manager:
  npm run format:check
  npm run lint
  npm run typecheck
  npm test
  npm run build
```

Only include commands that actually exist in `package.json`. Explain needed services before E2E
commands; do not silently start them.

## Do not

```text
WRONG: "I ran npm test to be safe" without human authorization.
WRONG: "All checks passed" based only on reading code.
WRONG: Execute a helper script that secretly installs packages or starts Next.
```

## Prevented failures and review checklist

- Inspection first prevents overwriting user work or implementing an outdated assumption.
- Human execution prevents unauthorized network, database and repository mutations.
- Honest status prevents unexecuted tests being mistaken for release evidence.
- If missing information materially changes scope, explain the blocker and request direction.
- Report remaining risks instead of claiming production readiness from a static review.
