# Documentation and handoff

## Purpose

Explain the actual frontend, its security boundaries and reproducible human workflow without
creating a second, stale source of truth.

## Mandatory requirements

1. Maintain the root README for architecture, endpoint registration, cookie flow, environment
   setup, human commands, known risks and deferred work. Update it when corresponding behavior changes.
2. Document only implemented contracts or explicitly labeled proposals. Identify Nest as session/
   permission authority and the DB package as schema owner; do not imply the BFF replaces either.
3. Keep examples fictional and commands tied to the correct working directory. State prerequisites,
   placeholders and destructive effects before commands. Never include real credentials or identities.
4. State what was edited, what was statically reviewed and which checks were not executed.
   Distinguish mock coverage from real integration and verified results from expectations.
5. Record backend contract discrepancies and release blockers. Do not silently document a desired
   policy as if the backend already implements it.
6. Keep documentation scoped to this project. Do not generate sibling `api/db/docs` content or
   resurrect deleted documentation/commit-plan files without explicit authorization.
7. Put persistent engineering rules in `.agents/`, not scattered comments or competing rule files.
   Link to canonical local guidance instead of copying large vendor documents.

## Do

```text
Cookie flow:
Nest returns allowed cookies to the server-only BFF.
The BFF validates attributes and reissues host-only cookies for the manager host.
A password challenge is not an authenticated session.

Verification:
Source reviewed; formatting, lint, typecheck, tests and build were not run by the agent.
```

Provide exact human commands and explain what they establish; never present them as executed results.

## Do not

```text
WRONG: "Production-ready; all tests pass" after editing files without execution.
WRONG: Paste a real .env.local or TOTP enrollment URI into README.
WRONG: Recreate COMMIT_PLAN.md merely because it existed in an earlier task.
```

Do not create unrelated runbooks or copied setup instructions that drift from package scripts.

## Prevented failures and review checklist

- Source-aligned docs prevent operators following obsolete contracts or unsafe commands.
- Explicit evidence prevents incomplete verification being mistaken for release approval.
- Review links, working directories, fictional examples, script names, risks and deferred features.
- See [comments.md](comments.md), [git.md](git.md) and [agent-workflow.md](agent-workflow.md).
