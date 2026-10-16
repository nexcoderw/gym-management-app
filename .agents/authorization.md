# Organization and branch authorization

## Purpose

Nest's current principal, membership, scope, effective permissions and entitlements authorize manager
operations. Authentication alone and UI visibility never grant organization access.

## Mandatory requirements

1. Resolve the current session through Nest at every protected page, server operation and BFF route.
2. Require an active membership for the target organization and independently verify branch scope
   when an operation is branch-specific.
3. Require the exact backend-declared permission and entitlement. Never invent permission strings
   from UI labels or copy platform-superadmin permissions from `app/admin`.
4. Treat slugs, hosts, route IDs and selected context as routing input only. The backend must prove
   the principal may use the resolved stable organization/branch ID.
5. Reject suspended/archived organizations, revoked/inactive memberships and removed access on the
   next request. Do not preserve authority in client state or persistent frontend caches.
6. Filter navigation/actions using validated capabilities for presentation, then enforce again at
   the page, BFF and Nest boundaries.
7. Cross-organization support or platform access requires a separately reviewed, time-bounded and
   audited backend capability; a manager role never implies it.

## Do

```text
live manager session
  + active organization membership
  + authorized branch scope when required
  + exact effective permission
  + active entitlement when required
  = operation may proceed to Nest
```

## Do not

```ts
// WRONG: identifiers and remembered role names cannot authorize.
const allowed = params.organizationId === localStorage.getItem('organizationId');
const isOwner = localStorage.getItem('role') === 'OWNER';
```

Never add a frontend owner/admin bypass to make a denied request succeed.

## Prevented failures and review checklist

- Independent checks prevent direct-URL and direct-handler bypasses.
- Live scope prevents stale membership and cross-tenant access.
- Cover anonymous, expired, revoked, wrong organization, wrong branch, missing permission and
  missing entitlement cases.
- See [navigation.md](navigation.md), [security.md](security.md) and [testing.md](testing.md).
