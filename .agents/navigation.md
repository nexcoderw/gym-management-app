# Navigation and context switching

## Purpose

Keep destinations and authorized organization/branch context predictable without confusing link
visibility with access control.

## Mandatory requirements

1. Keep frontend routes in `src/constants/routes.ts` and one navigation registry in
   `src/constants/navigation.ts`.
2. Each entry has a stable key, clear label, frontend href, named icon and backend-verified capability
   requirement where applicable.
3. Filter from the live validated manager session for presentation only. Every destination and BFF
   operation independently enforces membership, scope, permission and entitlement.
4. Organization/branch switchers display only backend-authorized contexts. Switching triggers a new
   authorized server read; it never mutates a trusted ID only in browser state.
5. Use Next `Link`, `aria-current="page"` and deliberate active matching. Keep core navigation
   available on compact screens with logical focus order.
6. Redirect authentication only to fixed reviewed destinations. Never accept arbitrary `returnTo`,
   external URLs, upstream paths or a tenant-selected callback.

## Do

```ts
const overview = {
	key: 'overview',
	label: 'Overview',
	href: routes.dashboard,
	icon: DashboardSquare01Icon,
	requiredCapability: verifiedDashboardCapability,
} as const;
```

The capability value must originate from an inspected backend contract, not this example.

## Do not

```ts
router.push(searchParams.get('returnTo') ?? '/dashboard');
setActiveOrganization(searchParams.get('organizationId'));
```

## Prevented failures and review checklist

- One registry prevents desktop/mobile drift.
- Authorized switching prevents cross-organization context forgery.
- Review route existence, focus, compact reachability and independent server enforcement.
- See [authorization.md](authorization.md), [icons.md](icons.md) and [responsive.md](responsive.md).
