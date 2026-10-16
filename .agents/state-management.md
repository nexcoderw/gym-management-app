# State ownership

## Purpose

Keep authoritative session/data on the server and temporary interaction state near its UI.

## Mandatory requirements

1. Use Server Components and fixed reviewed server operations for session and dashboard data.
   Browser state may mirror safe display information, but it must never grant access.
2. Use component state for email, pending/error presentation, selected MFA mode and the current
   short-lived challenge. Model mutually exclusive phases with a discriminated union.
3. Do not store session tokens, passwords, MFA challenges or recovery codes in localStorage,
   sessionStorage, URL parameters, browser history or a global store.
4. Discard password state after submission and challenges after restart/success/expiry. Do not retain
   secrets simply to make back navigation more convenient.
5. After successful mutations, deliberately refresh or navigate so server-owned state is current.
   Handle failed mutations without pretending the server changed. Never optimistically grant access.
6. Derive values that can be computed from existing state. Introduce a state library or global
   provider only for demonstrated cross-feature needs and a separately reviewed dependency change.

## Do

```ts
type AuthState =
	| { readonly phase: 'password'; readonly error?: string }
	| {
			readonly phase: 'mfa';
			readonly challenge: MfaChallenge;
			readonly error?: string;
	  };
```

Keep this temporary state inside the login feature and discard it when the flow completes.

## Do not

```ts
// WRONG: browser persistence is not authentication authority.
localStorage.setItem('sessionToken', token);
setGlobalRole('organization.owner');
setAuthenticated(true);
```

Do not put permission state in a global store to avoid live session validation or retain private
results across users with a module-level client cache.

## Prevented failures and review checklist

- Clear authority boundaries prevent stale or forged browser state authorizing operations.
- Short-lived secret state reduces accidental retention and cross-user leakage.
- Review expiry, restart, mutation refresh, unmount cleanup and stale-response handling.
- See [authentication.md](authentication.md), [authorization.md](authorization.md) and [hooks.md](hooks.md).
