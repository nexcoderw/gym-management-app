# Endpoint registration and BFF boundary

## Purpose

Expose a small explicit manager API while keeping Nest URLs, cookies and authorization context
server-only. A BFF operation adapts one verified Nest operation and is never an arbitrary proxy.

## Mandatory requirements

1. Inspect the real Nest controller, DTO, permission, membership/scope and entitlement before adding
   or changing an operation. Do not infer contracts from manager UI requirements.
2. Register browser paths in `src/constants/routes.ts`. Keep fixed upstream paths inside
   `src/lib/server/endpoints/` modules marked `server-only`.
3. Use one explicit endpoint module and matching route handler per operation. Declare method, fixed
   path, schemas, session, scope, permission, entitlement, Origin/CSRF and cookie behavior.
4. Route handlers reuse shared bounded validation, transport and error helpers. They do not duplicate
   cookie parsing or accept client-selected headers, methods, destinations or upstream paths.
5. Server Components call server operations directly. Client Components call only registered
   same-origin frontend routes.
6. Validate request JSON and upstream responses, allowlist fields/headers, reject redirects, preserve
   safe statuses and apply `no-store`.
7. Update README endpoint documentation and positive/negative contract tests with each operation.

## Do

```text
Browser: fixed /api/... manager operation
  → explicit route.ts
  → server-only endpoint adapter
  → verified Nest manager endpoint
```

## Do not

```ts
// WRONG: browser-controlled destination creates a proxy and SSRF boundary.
fetch(process.env.NEXT_PUBLIC_API_URL + searchParams.get('path'));
```

No catch-all forwarding, unrestricted cookie/header relay or guessed manager endpoints.

## Prevented failures and review checklist

- Explicit registration prevents accidental backend exposure.
- Fixed server-only transport prevents SSRF and bundle leaks.
- Check DTO parity, tenant/branch scope, permission, entitlement, Origin/CSRF and safe errors.
- See [security.md](security.md), [folder-structure.md](folder-structure.md) and [testing.md](testing.md).
