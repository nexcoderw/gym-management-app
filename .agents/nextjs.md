# Next.js App Router

## Purpose

Use the installed framework version intentionally. This project uses Server Components and explicit
BFF routes; familiar older Next.js patterns may not match the installed APIs.

## Mandatory requirements

1. Read relevant installed Next documentation under `node_modules/next/dist/docs/` before changing
   framework APIs. If unavailable, report it and consult official version-matched documentation;
   agents must not install packages to bypass the execution boundary.
2. Default pages/layouts to Server Components. Use narrow Client Components for forms, active-nav
   behavior and browser interactions. Do not add `'use client'` to the root layout for convenience.
3. Await asynchronous request APIs such as `cookies()`/`headers()` for the installed version.
   Do not copy synchronous examples from older versions without checking compatibility.
4. Authenticate and authorize each protected page/data boundary and route handler independently.
   Layout protection does not secure every handler or nested operation.
5. RSC reads call typed server endpoint modules directly. Do not make a server request to the
   application's own `/api` route or depend on browser-relative fetch URLs on the server.
6. Use Node runtime for BFF operations requiring Node crypto. Mark server modules `server-only`;
   serialize only safe client props, never cookies, internal origins or session credentials.
7. Keep private fetches no-store. Do not enable Cache Components or persistent identity caching
   without a separately reviewed isolation strategy and measured need.

## Do

```tsx
// Server Component excerpt; use the established server helpers.
export default async function DashboardPage() {
	const session = await requireManagerSession();
	return <p>Signed in as {session.displayName}</p>;
}
```

A real dashboard also checks its permission before requesting protected summary data.

## Do not

```tsx
// WRONG: moves the full page tree into the client for a server-owned session read.
'use client';

// WRONG in an RSC: self-HTTP adds another boundary and does not forward cookies safely.
const summary = await fetch('/api/dashboard/summary');
```

Do not use `'use cache'` for private identity data or assume an example from another Next major is
compatible without reading the installed docs.

## Prevented failures and review checklist

- Version-aware APIs prevent framework migration regressions.
- Server/client separation prevents leaking secrets and shipping unnecessary JavaScript.
- Check rendering mode, safe serialization, private caching, independent guards and error boundaries.
- See [performance.md](performance.md), [authorization.md](authorization.md) and [security.md](security.md).
