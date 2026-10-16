# Maintainability and change scope

## Purpose

Keep the code understandable without unnecessary abstraction or broad collateral changes.
Readable formatting is required, but formatting alone does not establish maintainability.

## Mandatory requirements

1. Give each module one clear responsibility. Separate cookie verification, transport, endpoint
   contracts and route composition so security decisions can be reviewed independently.
2. Use approximate review thresholds of 120 lines for pages and 200 for components/services.
   Exceeding a threshold triggers a responsibility review, not arbitrary splitting to satisfy a count.
3. Prefer descriptive names and straightforward control flow. Extract helpers for meaningful
   repeated behavior, not one-line indirection or speculative future reuse.
4. Preserve existing user changes. Limit a fix to the relevant behavior and tests; explain any
   necessary expansion. Do not mix a feature with a repository-wide style cleanup.
5. Keep dependencies acyclic and public APIs narrow. Do not export internal transport details just
   to avoid a deliberate module boundary.
6. Handle failures explicitly and safely. Avoid hidden mutable request state, swallowed exceptions,
   fallback privileges and generic clients accepting arbitrary methods or paths.

## Do

```text
cookies.ts  → validates and reissues allowed cookies
upstream.ts → bounded fixed-origin transport
login.ts    → the verified Nest login operation
route.ts    → request orchestration and safe response
```

When a file grows, split along those responsibilities rather than moving every ten lines to a helper.

## Do not

```ts
// WRONG: hides a failure and turns an unavailable service into apparent success.
try {
	return await loadProtectedSummary();
} catch {
	return { activeStaff: 0 };
}
```

Do not introduce a universal `callAnything(path, method, headers)` abstraction or rewrite unrelated
working modules while fixing a small validation error.

## Prevented failures and review checklist

- Focused modules make security assumptions visible instead of buried in large components.
- Small diffs protect user changes and make regressions easier to identify.
- Check each abstraction's actual callers, error propagation, exports, size and dependency direction.
- See [prettier.md](prettier.md), [error-handling.md](error-handling.md) and [git.md](git.md).
