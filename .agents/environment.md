# Environment configuration

## Purpose

Keep manager deployment configuration server-only, validated and explicit. Environment names,
hostnames and slugs never establish authorization.

## Mandatory requirements

1. Read `GYM_API_BASE_URL` and `MANAGER_ORIGIN` only through a `server-only` environment module.
   Never expose upstream configuration through `NEXT_PUBLIC_` or client props.
2. Validate exact origins: approved scheme, no credentials, wildcard, path, query or fragment.
   Production requires HTTPS; local HTTP is limited to reviewed loopback development.
3. `MANAGER_ORIGIN` must match the corresponding Nest CORS/Origin and cookie configuration exactly.
   Do not reuse `PLATFORM_ADMIN_ORIGIN` as an assumed manager contract.
4. Cookie mode follows the deployment environment and must agree with Nest. Never silently downgrade
   Secure cookies or accept a browser-controlled override.
5. Track only fictional example values. Real `.env.local`, credentials and deployment secrets remain
   ignored and uncommitted.
6. Missing/malformed configuration fails safely; never fall back to production or another app.
7. This frontend never receives a Prisma or database URL.

## Do

```dotenv
GYM_API_BASE_URL=http://127.0.0.1:3000
MANAGER_ORIGIN=http://localhost:4001
```

The local port map is API 3000, admin 4000 and manager 4001.

## Do not

```dotenv
NEXT_PUBLIC_GYM_API_BASE_URL=https://internal-api.example.invalid
DATABASE_URL=postgresql://example
```

## Prevented failures and review checklist

- Validated fixed origins prevent SSRF and cross-environment mistakes.
- Confirm ignored secrets, production HTTPS and exact Nest agreement.
- See [security.md](security.md), [authentication.md](authentication.md) and [dependencies.md](dependencies.md).
