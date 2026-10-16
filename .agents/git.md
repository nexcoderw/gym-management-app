# Git workflow

## Purpose and authority

Keep every change reviewable while the human retains every Git write. Read this file on every task.
A request to generate commit messages is not permission to stage, commit or push. These rules match
the API project's human-only boundary and apply to documentation and formatting too.

## Mandatory procedure

1. Inspect current status with read-only Git commands: `git status --short`, `git diff`,
   `git diff --cached` and `git ls-files`. Inspect untracked files before describing them. Do not
   print secrets. If no repository exists, report that fact; never assume it or initialize one.
2. Distinguish pre-existing user changes from task changes. Preserve modified files, deletions and
   untracked files. Do not restore a deleted file simply because you expected it to exist.
3. Account for every uncommitted file at handoff. Provide a message and commands, or explicitly
   explain why it must remain uncommitted. Do not silently omit work you did not create.
4. Suggest exactly one file per commit, with one explicit `git add -- <path>` followed by one
   `git commit -m "<subject>"`. Stage a tracked deletion using that same exact-path add command.
5. Order configuration, contracts and utilities before consumers, then tests and documentation.
   Keep all changed `.agents/` files in one uninterrupted group of individual commits. This does
   not mean putting the whole directory into one commit.
6. If both change, place `package.json` immediately before its human-generated `package-lock.json`.
   Inspect their correspondence. Never invent or manually edit a lockfile or stage an absent one.
7. State the working directory. Use project-relative paths and quote paths with shell-special
   characters, for example `'src/app/(protected)/layout.tsx'`.
8. Report unexecuted checks and blockers. An old commit plan is not proof of today's changes or
   authorization to stage them. The human reviews and executes the current plan.

## Commit subject contract

The entire subject must be at most 72 characters: `type(scope): imperative summary`.
Use lowercase wording, an informative scope, an imperative verb and no final period.

- `feat`: new behavior or capability.
- `fix`: correct broken behavior.
- `docs`: documentation, instructions or agent rules.
- `refactor`: restructure without intended behavior changes.
- `test`: coverage, fixtures or test configuration.
- `chore`: dependencies, tooling or repository maintenance.
- `style`: formatting only; not a new visual design.
- `perf`: a justified performance improvement.

Describe the actual diff. Never claim tests passed or production is secure without evidence.
One-file commits can represent intermediate states: verify the complete change set first and do not
publish or deploy a partial sequence.

## Do

Human commands from `app/manager`, with an otherwise empty staging area:

```bash
git add -- .agents/forms.md
git commit -m "docs(rules): clarify form validation requirements"

git add -- .agents/git.md
git commit -m "docs(rules): define per-file git handoff"

git add -- src/components/shared/button.tsx
git commit -m "style(button): apply prettier formatting"
```

Before each commit, the human checks `git diff --cached --name-only`: only the intended file may be
listed. A single-file add does not remove unrelated files already staged. If the index contains
somebody else's changes, stop and ask the human to resolve ownership; agents must not unstage them.

## Do not

```bash
# WRONG: blanket staging and an uninformative, multi-file commit.
git add .
git commit -m "update everything"

# WRONG: credentials must never enter history.
git add -f .env.local
```

Agents must not execute add, commit, push, pull, merge, rebase, reset, restore, checkout, switch,
stash, tag, cherry-pick, clean, init, branch writes or history rewrites. Do not hide writes in shell
scripts, wrappers or IDE operations. Do not use blanket staging or force-add ignored files.

## Prevented failures and review checklist

- Read-only inspection protects user work from accidental loss.
- Exact paths and index review prevent committing unrelated changes.
- Dependency order and consecutive manifest/lockfile commits keep history reconstructable.
- Exclude secrets, ignored files, dependencies and generated build/test output.
- Every uncommitted file has a reviewed message and command pair or an explicit exclusion.
- No Git write was performed by the agent. See [agent-workflow.md](agent-workflow.md).
