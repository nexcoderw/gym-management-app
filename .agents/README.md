# gym-manager engineering rules

## Scope and interpretation

These rules govern `app/manager`: the organization-manager frontend and its fixed BFF adapters.
Nest owns authentication, memberships, effective permissions, organization/branch scope,
entitlements and business policy. The DB package owns Prisma and schemas. MUST means required;
MUST NOT means forbidden.

## Reading and precedence

1. Explicit human instructions take precedence within applicable platform constraints.
2. Read root `AGENTS.md`/`CLAUDE.md`, this index and every relevant topic completely.
3. Read `git.md` and `agent-workflow.md` on every task; read `prettier.md` before code/config edits.
4. Apply related rules together. Resolve uncertainty with the stricter tenant, security and privacy
   interpretation instead of weakening authorization.
5. Examples illustrate patterns; they do not authorize endpoint guesses, installs or execution.

## Rule index

- [Design](design.md): tokens, hierarchy and truthful operational data.
- [Endpoints](endpoints.md): fixed frontend/BFF/Nest contracts.
- [Folder structure](folder-structure.md): ownership and server/client boundaries.
- [File naming](file-naming.md): predictable paths and identifiers.
- [Components](components.md): accessible primitives and composition.
- [Styling](styling.md): CSS Modules, tokens and selector scope.
- [Icons](icons.md): official Hugeicons imports and accessible labels.
- [Next.js](nextjs.md): installed-version APIs, RSC and private rendering.
- [TypeScript](typescript.md): strict types and runtime validation.
- [Code quality](code-quality.md): focused responsibilities and diffs.
- [Performance](performance.md): small client islands and measured targets.
- [Security](security.md): Origin, CSRF, cookies, transport and disclosure.
- [Authentication](authentication.md): credential, MFA and session lifecycle.
- [Authorization](authorization.md): live membership, scope, permissions and entitlements.
- [Hooks](hooks.md): justified browser behavior and cleanup.
- [State management](state-management.md): server authority and temporary client state.
- [Forms](forms.md): validation, pending state and credential handling.
- [Navigation](navigation.md): one registry and safe context switching.
- [Accessibility](accessibility.md): semantics, keyboard, labels and announcements.
- [Responsive](responsive.md): mobile-first reflow and long-content resilience.
- [Error handling](error-handling.md): safe failures and honest empty states.
- [Testing](testing.md): meaningful negative cases and human-only execution.
- [Environment](environment.md): server-only origins and safe configuration.
- [Dependencies](dependencies.md): reviewed versions and human lockfiles.
- [Documentation](documentation.md): accurate setup and handoff.
- [Prettier](prettier.md): formatting and human commands.
- [Comments](comments.md): document invariants, not syntax.
- [Git](git.md): inspection and per-file commit plans.
- [Agent workflow](agent-workflow.md): permitted edits and human-only execution.

## Non-negotiable manager boundary

A route, slug, Host, organization ID or branch ID may select context but never authorize it. Every
protected read and mutation must use a live Nest-established principal, active membership, allowed
organization/branch scope, exact effective permission and required entitlement. UI visibility is
presentation only.

## Review checklist

- Relevant rules, source contracts and current files were inspected before editing.
- No browser claim, route parameter or frontend cache became authorization authority.
- No Prisma, migration, arbitrary proxy or server secret entered this frontend.
- Unexecuted checks and every changed file are reported at handoff.
