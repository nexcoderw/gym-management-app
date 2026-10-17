# Environment configuration

## Purpose

Keep manager deployment configuration server-only, validated and explicit. Environment names,
hostnames and slugs never establish authorization.

## Mandatory requirements

1. Read `GYM_API_BASE_URL`, local `MANAGER_ORIGIN`, and production `MANAGER_BASE_DOMAIN` only through
   a `server-only` environment module.
   Never expose upstream configuration through `NEXT_PUBLIC_` or client props.
2. Local development validates one exact origin: approved scheme, no credentials, wildcard, path,
   query or fragment. Production validates an HTTPS origin derived from exactly one organization
   slug label beneath the configured base domain; the base domain is never an Origin wildcard.
3. `MANAGER_ORIGIN` must match Nest locally. `MANAGER_BASE_DOMAIN` must match Nest's production
   organization portal base domain. Do not reuse `PLATFORM_ADMIN_ORIGIN` as a manager contract.
4. Cookie mode follows the deployment environment and must agree with Nest. Never silently downgrade
   Secure cookies or accept a browser-controlled override.
5. Keep development values in `.env.development.local` and production values in `.env.production`.
   `.env.local` has higher precedence than `.env.production` during `next build` and must not carry
   local HTTP values. Track only fictional example values; real environment files, credentials and
   deployment secrets remain ignored and uncommitted.
6. Missing/malformed configuration fails safely; never fall back to production or another app.
7. This frontend never receives a Prisma or database URL.

## Do

```dotenv
GYM_API_BASE_URL=http://127.0.0.1:3000
MANAGER_ORIGIN=http://localhost:4001
```

The local port map is API 3000, admin 4000 and manager 4001.

Production uses a DNS base domain rather than one tenant-specific origin:

```dotenv
GYM_API_BASE_URL=https://api.example.com
MANAGER_BASE_DOMAIN=example.com
```

## Do not

```dotenv
NEXT_PUBLIC_GYM_API_BASE_URL=https://internal-api.example.invalid
DATABASE_URL=postgresql://example
```

## Prevented failures and review checklist

- Validated local origins and production tenant hosts prevent SSRF and cross-environment mistakes.
- Confirm ignored secrets, production HTTPS and exact Nest agreement.
- See [security.md](security.md), [authentication.md](authentication.md) and [dependencies.md](dependencies.md).
