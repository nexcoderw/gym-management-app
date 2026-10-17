# NEXCODE Gym Manager

Organization-manager frontend foundation for the NEXCODE Gym platform. Next.js owns the manager UI
and explicit BFF adapters. NestJS owns authentication, organization/branch memberships, effective
permissions, entitlements and business policy. `gym-db` owns every Prisma schema and migration.

The first owner-portal slice provides fragment-only invitation handoff, purpose-scoped enrollment,
existing-owner authentication, atomic invitation acceptance, separate owner sessions, and a minimal
organization dashboard. The browser talks only to same-origin BFF routes; it never receives the
upstream API origin or stores invitation/session tokens in Web Storage.

## Local ports

| Service    | Port |
| ---------- | ---: |
| Nest API   | 3000 |
| Superadmin | 4000 |
| Manager    | 4001 |

## Human setup and verification

Use Node.js 22.14 or newer and npm 10 or newer. Review `package.json` with the npm-generated
`package-lock.json`; commit them as consecutive single-file commits when their dependency data agrees.

```bash
cd /Users/dvniels/Desktop/projects/gym/app/manager
npm install
npm run format
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Start the manager application only when local development is intended:

```bash
npm run dev
```

Then open `http://localhost:4001`. Invitation links use
`http://localhost:4001/invitations/accept#token=<opaque-token>` locally. The portal transfers the
fragment into a short-lived server challenge and removes it from the address bar. If the page is
closed or reloaded before that transfer succeeds, reopen the original email link; the cleaned URL
intentionally cannot reconstruct the secret. A temporary API outage can be retried from the same
open page because the token remains only in that page's memory. Agents do not execute these commands;
see `.agents/agent-workflow.md`.

## Configuration boundary

The BFF adapters use server-only `GYM_API_BASE_URL` configuration. Local development uses the exact
`MANAGER_ORIGIN=http://localhost:4001`; production uses `MANAGER_BASE_DOMAIN=mucyora.rw` and accepts
only one-label organization hosts such as `soho.mucyora.rw`. The validated hostname is routing
context only—Nest still authorizes the authenticated membership for the matching stored slug.

Real environment files remain ignored. Never expose the upstream API URL through `NEXT_PUBLIC_`, add
a database URL to this frontend, use a wildcard Origin value, or trust browser-selected
organization/branch context.

Production infrastructure must route `*.mucyora.rw` to this application with a matching wildcard
TLS certificate and preserve the original `Host` header. Wildcard DNS and TLS only deliver traffic;
the BFF still rejects reserved, nested and foreign hosts, and Nest still proves live organization
membership for the stored slug.

Rendered pages use a fresh Content Security Policy nonce per request so Next.js can hydrate without
allowing arbitrary inline scripts. Keep this policy in `src/proxy.ts`; a static `script-src 'self'`
header prevents the invitation client from starting and leaves the server-rendered loading state on
screen.
