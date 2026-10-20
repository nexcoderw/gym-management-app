# NEXCODE Gym Manager

Organization-manager frontend foundation for the NEXCODE Gym platform. Next.js owns the manager UI
and explicit BFF adapters. NestJS owns authentication, organization/branch memberships, effective
permissions, entitlements and business policy. `gym-db` owns every Prisma schema and migration.

The first owner-portal slice provides fragment-only invitation handoff, purpose-scoped enrollment,
existing-owner authentication, atomic invitation acceptance, separate owner sessions, and a minimal
organization dashboard. The memberships workspace adds tenant-scoped plan listing, creation,
editing and soft archival with CSRF-protected same-origin BFF routes and optimistic concurrency.
The members workspace shows profiles, editable contact details, paginated plan history and
confirmation-based archival. New member creation is initiated from Payments, where it is combined
with plan registration and payment in a single backend transaction. Validation is inline and
command outcomes use toasts.

Member BFF operations are `GET/POST /api/members`, `GET/PATCH/DELETE /api/members/:memberId`,
and `GET /api/members/:memberId/subscriptions`. Mutations validate exact Origin and owner CSRF;
profile edits and archival forward the latest quoted `updatedAt` as `If-Match`. The BFF never
accepts an organization ID. Nest enforces live owner authorization and gym isolation. DELETE archives,
not erases: history and unique contact keys remain, and current/future registrations block archival.
Renewal and cancellation controls are not included in this frontend slice. Plan prices shown in
history are snapshots, not payment receipts or period-multiplied charges.
The browser talks only to same-origin BFF routes; it never receives the
upstream API origin or stores invitation/session tokens in Web Storage.

Membership plans, members and payments use tenant-scoped server-side status/date filters, ordering
and cursor pagination with a maximum of 24 results per request. Member registration dates and payment
transaction dates can be filtered by inclusive Africa/Kigali calendar days. Search filters only rows
loaded in the manager; use Load more to search additional pages. Server-side filters and ordering apply
to the full matching gym dataset before each page is returned.

The Payments workspace lists gym-scoped ledger entries with status, method, date and order filters,
searches by member, receipt or provider reference, and opens read-only details.
The New payment form accepts a new or existing member, active plan, start date, duration, method,
provider reference when required and optional note. Nest calculates the inclusive end date and
snapshots the plan's full price. `POST /api/payments/registrations` validates exact Origin, owner
CSRF and a UUID `Idempotency-Key`; the browser cannot select a gym or set a payment amount. The
existing `GET/POST /api/payments` and `GET /api/payments/:paymentId` routes remain available, but
the new form uses the atomic registration route. Unchanged retries reuse the key and payment time.
Cash is confirmed immediately; external methods remain pending until verified. Void and refund
controls are not part of this frontend slice.

The Reminders page lists memberships expiring within 14 days. An authorized gym owner can open an
editable, prefilled email for a member and explicitly submit one reminder per registration. The
fixed BFF route validates the subject and body, Origin and CSRF before forwarding to Nest. Nest
rechecks membership, tenant scope, recipient, opt-out, suppression and expiry, then queues exactly
the approved plain-text copy. A separate delivery worker sends queued manual emails through Resend;
the scheduler no longer creates automatic reminders. The upcoming list shows queued work; recent
activity distinguishes provider acceptance from inbox delivery. SMS is not enabled.

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

Membership plan updates and archival use the latest `updatedAt` value as an `If-Match` precondition.
If another request changes a plan first, the manager asks the owner to reload rather than overwriting
newer data. The delete-shaped API action is intentionally presented as archival because historical
membership records remain in the database.

## Configuration boundary

The BFF adapters use server-only `GYM_API_BASE_URL` configuration. Local development uses the exact
`MANAGER_ORIGIN=http://localhost:4001`; production uses `MANAGER_BASE_DOMAIN=mucyora.rw` and accepts
only one-label organization hosts such as `soho.mucyora.rw`. The validated hostname is routing
context only—Nest still authorizes the authenticated membership for the matching stored slug.

Keep local values in `.env.development.local` and production values in `.env.production`. Do not use
`.env.local` for local URLs: Next loads it ahead of `.env.production` during `next build`, so an
`http://127.0.0.1:3000` API value would correctly fail the production HTTPS validation.

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
