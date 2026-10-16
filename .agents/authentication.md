# Manager authentication

## Purpose and trust boundary

Reuse the reviewed Nest manager authentication flow. This frontend displays and adapts that flow; it
does not validate credentials, create sessions or invent account policy.

## Mandatory requirements

1. Inspect the actual Nest manager-auth controller and DTO before implementing a form or BFF route.
   Planned admin endpoints are not proof that an equivalent manager endpoint exists.
2. Treat password success as a challenge when MFA is required, not as an authenticated session.
   Keep challenges in temporary component state and render no protected data before verification.
3. Only Nest establishes a session. Validate every Set-Cookie attribute before reissuing it for the
   manager host; never widen Domain to share an admin/API host-only cookie.
4. Session cookies are HttpOnly. A reviewed CSRF cookie may be browser-readable only for the exact
   double-submit protocol. Cookie names and secure/local modes must match Nest.
5. Resolve the current session live through Nest. Expiry, revocation, suspension, inactive
   membership and password/session invalidation fail closed.
6. Confirm logout upstream before reporting success or clearing corresponding frontend cookies.
7. Keep passwords, challenge tokens, recovery codes and session values out of URLs, storage, logs,
   analytics, screenshots, examples and client-visible errors.

## Do

```text
credentials → fixed manager-auth BFF → temporary MFA challenge
→ fixed verification BFF → validated host-only cookies
→ live scoped session → authorized manager destination
```

The exact endpoints and fields come from inspected Nest contracts.

## Do not

```ts
// WRONG: browser state does not establish a manager session.
localStorage.setItem('session', challengeToken);
router.push('/dashboard');
```

Do not reuse platform-superadmin cookies or infer authentication from a gym slug or selected context.

## Prevented failures and review checklist

- Separate challenges and sessions prevent MFA bypass.
- Host-only validation prevents cross-application cookie leakage.
- Test expiry, revocation, suspension, cookie drift and logout failure.
- See [security.md](security.md), [authorization.md](authorization.md) and [environment.md](environment.md).
