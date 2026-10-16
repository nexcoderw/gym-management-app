# Hooks

## Purpose

Extract genuinely reusable browser behavior with a clear lifecycle. Hooks must not move server data
ownership or authentication authority into the client.

## Mandatory requirements

1. Add a hook when repeated stateful browser behavior has a meaningful reusable contract.
   A one-use hook needs a clear lifecycle/testing benefit; extraction alone is not an improvement.
2. Keep hooks in Client Components or other client hooks. Never call them in Server Components,
   conditional branches, loops or ordinary functions.
3. Derive simple values during render instead of synchronizing duplicate state through effects.
   Keep effect dependencies accurate; do not suppress dependency warnings to stop a loop.
4. Clean up subscriptions, timers and request work on unmount or dependency changes. Abort stale
   reads where appropriate and ensure late responses cannot overwrite newer state.
5. Keep mutation pending/error state local unless real callers need sharing. Avoid a universal
   request hook that hides operation-specific security, expiry or error behavior.
6. Do not import server-only modules, store credentials or fetch server-owned page data in an effect
   merely to avoid using the established Server Component boundary.

## Do

Derive a simple display decision directly:

```tsx
const canReadDashboard = permissions.includes(requiredDashboardPermission);
```

For a justified reusable subscription, cleanup is part of the hook's contract:

```tsx
useEffect(() => {
	const unsubscribe = subscribeToViewport(updateViewport);
	return () => {
		unsubscribe();
	};
}, []);
```

The subscription example assumes stable module-level functions; real reactive dependencies must be
listed. The permissions value controls presentation, never server authorization.

## Do not

```tsx
// WRONG: duplicate derived state and an unnecessary synchronization effect.
useEffect(() => {
	setCanReadDashboard(permissions.includes(requiredDashboardPermission));
}, [permissions]);
```

Do not fetch private dashboard data through a repeated mount effect, retain secrets in a hook or
create a hook solely to rename a single useState call.

## Prevented failures and review checklist

- Derived state prevents synchronization bugs; cleanup prevents leaked subscriptions and stale writes.
- Review actual reuse, dependencies, teardown, race behavior and operation-specific failures.
- See [state-management.md](state-management.md), [nextjs.md](nextjs.md) and [performance.md](performance.md).
