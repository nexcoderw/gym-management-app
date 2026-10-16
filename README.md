# NEXCODE Gym Manager

Organization-manager frontend foundation for the NEXCODE Gym platform. Next.js owns the manager UI
and explicit BFF adapters. NestJS owns authentication, organization/branch memberships, effective
permissions, entitlements and business policy. `gym-db` owns every Prisma schema and migration.

The project currently remains a minimal scaffold. The engineering rules under `.agents/` define the
required boundaries before manager authentication, organization switching or operational features
are implemented. Do not infer endpoint contracts from planned UI; inspect the corresponding Nest
controller and DTO first.

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
npm ci
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Start the manager application only when local development is intended:

```bash
npm run dev
```

Then open `http://localhost:4001`. No test runner has been registered yet; add one only with the first
real behavior and its reviewed test strategy. Agents do not execute these commands; see
`.agents/agent-workflow.md`.

## Configuration boundary

Future BFF adapters should use server-only `GYM_API_BASE_URL` and `MANAGER_ORIGIN` configuration.
Real `.env.local` files remain ignored. Never expose the upstream API URL through `NEXT_PUBLIC_`, add
a database URL to this frontend, or trust browser-selected organization/branch context.
