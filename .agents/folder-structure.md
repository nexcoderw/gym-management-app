# Folder ownership

## Purpose

Make responsibility discoverable from a file's path and keep privileged dependencies out of the
browser. Do not create folders merely because a template contains them.

## Mandatory requirements

1. Put App Router pages, layouts, framework boundaries and BFF `route.ts` files in `src/app`.
   Keep orchestration there; move reusable transport or validation logic to its owning module.
2. Put reusable UI in `src/components/shared`, with feature components under `auth`, `dashboard`
   or the existing feature folder. Shared primitives must not import feature services.
3. Put browser-safe Zod schemas/types in `src/lib/contracts`. These modules must not import secrets,
   Node-only transport, Next server APIs or Prisma.
4. Put fixed upstream operations in `src/lib/server/endpoints` and common transport/security
   helpers in `src/lib/server/http`. Mark privileged modules server-only.
5. Keep frontend routes and the single navigation registry in `src/constants`. Put a genuinely
   reusable browser lifecycle hook in `src/hooks`, not a server data fetch disguised as a hook.
6. Colocate component CSS Modules and follow existing test directories. Add new folders only when
   a real responsibility needs them. Do not edit sibling API/DB projects without explicit scope.

## Do

```text
src/
  app/api/auth/login/route.ts
  components/auth/login-form.tsx
  components/auth/login-form.module.css
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

Avoid dumping-ground `utils.ts` files, duplicate route registries and empty speculative modules.

## Prevented failures and review checklist

- Clear ownership prevents circular dependencies and secret-bearing imports entering the client.
- Review each new file's owner, import direction and reason to exist.
- Shared code must remain more general than its consumers.
- See [file-naming.md](file-naming.md), [endpoints.md](endpoints.md) and [components.md](components.md).
