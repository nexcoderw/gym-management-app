# TypeScript

## Purpose

Make invalid states visible at authoring time while still validating untrusted runtime data.
A TypeScript interface is not a substitute for checking a network response.

## Mandatory requirements

1. Keep strict TypeScript and `noUncheckedIndexedAccess` enabled. Handle missing array entries,
   optional fields and null explicitly; never weaken compiler options to suppress an error.
2. Treat request JSON, upstream JSON and caught errors as `unknown`. Validate them through the
   established Zod schema before access. Infer DTO types from schemas rather than duplicating guesses.
3. Use `import type` for type-only imports. Keep browser-safe contracts separate from server-only
   modules; type convenience is not permission to import server code into a Client Component.
4. Prefer discriminated unions for mutually exclusive phases and exhaustive branches for state
   transitions. Keep readonly props and immutable contract values where mutation is not intended.
5. Avoid `any`, unchecked `as` casts, non-null assertions and `@ts-ignore`. A narrow literal
   `as const` is acceptable; it preserves inference rather than asserting unverified external data.
6. Give exported reusable functions a clear input/output contract. Let inference simplify local code
   when it remains obvious; do not add elaborate generic types without demonstrated need.

## Do

```ts
type LoginPhase =
	{ readonly step: 'password' } | { readonly step: 'mfa'; readonly challengeToken: string };

const parsed = loginRequestSchema.safeParse(untrustedBody);

if (!parsed.success) {
	throw new BffError(400, 'INVALID_REQUEST', 'Check your sign-in details.');
}

const input = parsed.data;
```

Only validated `input` crosses the endpoint boundary.

## Do not

```ts
// WRONG: casts do not validate incoming data.
const input = (await request.json()) as LoginInput;
const response: any = await upstreamResponse.json();
return response.session.token;
```

Do not hide a nullability error by asserting a secret or session always exists.

## Prevented failures and review checklist

- Runtime validation prevents false confidence in network DTO types.
- Explicit phases prevent impossible combinations such as MFA without a challenge.
- Review nullable branches, array access, type-only imports and server/client separation.
- See [endpoints.md](endpoints.md), [state-management.md](state-management.md) and [testing.md](testing.md).
