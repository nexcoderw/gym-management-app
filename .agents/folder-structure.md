# Folder ownership

## Purpose

Make responsibility discoverable from a file's path and keep privileged dependencies out of the
browser. Do not create folders merely because a template contains them.

## Mandatory requirements

1. Put App Router pages, layouts, framework boundaries and BFF `route.ts` files in `src/app`.
   Keep orchestration there; move reusable transport or validation logic to its owning module.
2. Put reusable UI in `src/components/shared` and feature UI in a named feature directory. Do not
   place authored component files directly in `src/components`. Authentication, invitation,
   enrollment, session and logout UI belongs in `src/components/auth`; dashboard-only UI belongs
   in `src/components/dashboard`. Shared primitives and cross-feature branding belong in
   `src/components/shared` and must not import feature services.
3. Put browser-safe Zod schemas/types in `src/lib/contracts`. These modules must not import secrets,
   Node-only transport, Next server APIs or Prisma.
4. Put fixed upstream operations in `src/lib/server/endpoints` and common transport/security
   helpers in `src/lib/server/http`. Mark privileged modules server-only.
5. Keep frontend routes and the single navigation registry in `src/constants`. Put a genuinely
   reusable browser lifecycle hook in `src/hooks`, not a server data fetch disguised as a hook.
6. Colocate component CSS Modules and follow existing test directories. Add new folders only when
   a real responsibility needs them. Do not edit sibling API/DB projects without explicit scope.
7. Keep route pages thin. A `page.tsx` composes route-owned server data and feature components; it
   must not become the permanent home of reusable forms, panels or client-side workflows. Keep
   route-only styles beside the page and move reusable presentation with its owning component.
8. Group files by responsibility rather than file type. Do not create project-wide `forms`,
   `styles`, `types` or `utils` dumping grounds. Contracts, server transport, constants, hooks and
   components stay in their dedicated ownership paths described above.

## Do

```text
src/
  app/api/auth/login/route.ts
  app/invitations/accept/page.tsx
  components/auth/login-form.tsx
  components/auth/invitation-flow.tsx
  components/auth/logout-button.tsx
  components/auth/login-form.module.css
  components/shared/brand.tsx
  components/shared/button.tsx
  constants/routes.ts
  lib/contracts/auth.ts
  lib/server/endpoints/auth/login.ts
  lib/server/http/upstream.ts
```

This is a responsibility map, not permission to scaffold duplicate files.

## Do not

```ts
// WRONG in components/shared/button.tsx: a primitive depends on a feature service.
import { getSummary } from '@/lib/server/endpoints/dashboard/get-summary';

// WRONG in a browser-safe contract: database ownership belongs elsewhere.
import { PrismaClient } from '@nexcoderw/gym-db';
```

Avoid files directly under `src/components`, dumping-ground `utils.ts` files, duplicate route
registries and empty speculative modules.

## Prevented failures and review checklist

- Clear ownership prevents circular dependencies and secret-bearing imports entering the client.
- Review each new file's owner, import direction and reason to exist.
- Shared code must remain more general than its consumers.
- See [file-naming.md](file-naming.md), [endpoints.md](endpoints.md) and [components.md](components.md).
