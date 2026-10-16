# Comments and TSDoc

## Purpose

Explain why non-obvious code exists, especially security invariants that a future refactor must
preserve. Comments are not a substitute for clear names or working validation.

## Mandatory requirements

1. Document non-obvious cookie, CSRF, authorization, caching and transport decisions near the code
   that enforces them. State the risk, not merely the syntax.
2. For reusable public contracts, describe inputs, safe failure behavior and ownership where those
   facts are not obvious from the type. Keep internal comments concise and specific.
3. Update or remove a comment when behavior changes. An obsolete security comment is dangerous
   because reviewers may trust a defense that no longer exists.
4. Use actionable TODOs only when deferred work needs tracking: state the missing behavior and the
   condition or task that will resolve it. Do not leave vague promises of future security.
5. Keep credentials, personal data, internal production hostnames and copied private output out of
   comments, examples and test fixtures.
6. Prefer explaining a narrow invariant over claiming broad properties such as "fully secure" or
   "guaranteed production-ready."

## Do

```ts
/**
 * Reissue validated cookies for the manager host without adding Domain.
 * Widening Domain would expose the session to sibling subdomains.
 */
```

Another useful comment explains that `React.cache` deduplicates a session read within an RSC request;
it does not authorize cross-request session caching.

## Do not

```ts
// WRONG: repeats obvious syntax and makes an unsupported guarantee.
// Increment count. This makes the whole application secure.
count += 1;

// WRONG: vague and easy to forget.
// TODO: add security later.
```

Do not keep commented-out implementations as a backup or add a comment to excuse a forbidden pattern.

## Prevented failures and review checklist

- Invariant comments prevent well-intentioned refactors from weakening trust boundaries.
- Accurate scope prevents documentation being mistaken for implemented enforcement.
- Check whether each comment adds information, matches current behavior and contains no secrets.
- See [security.md](security.md), [documentation.md](documentation.md) and [code-quality.md](code-quality.md).
