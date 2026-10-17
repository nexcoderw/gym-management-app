# Security

## Purpose and scope

Treat browser input and Nest responses as untrusted. The manager BFF is a narrow adapter, not a
general proxy, authentication authority or tenant resolver.

## Mandatory requirements

1. Validate the exact configured local manager Origin before mutation bodies are processed or Nest
   is contacted. In production, derive the exact origin only from a single valid organization slug
   beneath the configured base domain and require the browser Origin to match it. Missing, reserved,
   nested or foreign hosts and origins fail closed.
2. Apply the Nest contract's reviewed CSRF protocol for cookie-authenticated mutations. If that
   contract is not implemented yet, stop and obtain it; CORS, SameSite or a cookie alone is not the
   complete defense.
3. Allowlist forwarded cookies and headers. Never forward arbitrary Authorization, tenant, role,
   organization, branch or permission headers from the browser.
4. Use fixed upstream origins, paths and methods; reject redirects and apply request/response limits
   and timeouts through shared transport.
5. Validate response DTOs and Set-Cookie attributes. Return only required fields and never expose
   session tokens, internal hosts, raw upstream messages or stack traces.
6. Mark private responses `no-store`, use secure host-only production cookies and avoid unsafe HTML
   insertion or user-controlled outbound URLs.
7. Keep secrets and personal data out of logs, fixtures, screenshots, analytics and Git.
8. Backend-established organization/branch scope must accompany every protected operation; client
   context is never authority.

## Do

```text
request → exact Origin/CSRF → bounded schema → live session and authorized scope
→ fixed upstream operation → validated response/cookies → safe no-store result
```

## Do not

```ts
fetch(searchParams.get('url')!, { headers: request.headers });
return Response.json({ error: String(error) });
```

## Prevented failures and review checklist

- Fixed destinations prevent SSRF; scope checks prevent tenant escape.
- Allowlists prevent credential and internal-detail leakage.
- Test redirects, cookie drift, body bounds, XSS, Origin/CSRF and cross-tenant attempts.
- See [endpoints.md](endpoints.md), [authentication.md](authentication.md) and [testing.md](testing.md).
