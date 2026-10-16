# Errors, loading and empty states

## Purpose

Explain failures safely and honestly. A failed request is not an empty database, and an empty
database is not an error.

## Mandatory requirements

1. Use stable safe BFF codes/messages and no-store responses. Map upstream failures through shared
   helpers; do not echo provider messages, stack traces, SQL, internal hostnames or raw error objects.
2. Distinguish invalid input, authentication failure, forbidden access, rate limits and unavailable
   service. An authenticated permission denial must not masquerade as an anonymous session.
3. Present actionable next steps: correct a field, restart expired MFA, sign in again, wait after
   rate limiting or retry a read. Do not automatically retry credential submissions in a loop.
4. Provide appropriate loading, error and not-found boundaries. Pending UI retains an accessible
   name and enough layout stability to avoid disruptive shifts.
5. Render zero only from a successful validated result. Never substitute zero counts, invented
   metrics or cached private data when the upstream request fails.
6. Keep useful non-secret form input, clear secrets promptly and avoid revealing whether a specific
   email exists beyond the backend's safe contract.
7. Log only deliberately sanitized operational metadata where logging is authorized. Never log
   request bodies, Cookie/Authorization headers, challenges, passwords or recovery codes.

## Do

```tsx
<section aria-labelledby="summary-error">
	<h2 id="summary-error">Summary unavailable</h2>
	<p>The summary could not be loaded. Try again.</p>
	<Button icon={RefreshIcon} onClick={retry}>
		Try again
	</Button>
</section>
```

This is a client error-state excerpt; a successful summary with no records displays its real zeroes.

## Do not

```ts
// WRONG: hides an outage as an apparently valid empty result.
const summary = await getSummary().catch(() => ({ totalUsers: 0 }));

// WRONG: exposes privileged diagnostics.
return Response.json({ error: error.stack });
```

Do not swallow errors to keep a dashboard looking complete or claim logout succeeded after failure.

## Prevented failures and review checklist

- Safe translations prevent disclosure; distinct states prevent misleading operator decisions.
- Review network aborts, malformed responses, expiry, rate limits, permission denial and retry.
- Ensure user-facing errors remain understandable and never include credentials.
- See [security.md](security.md), [forms.md](forms.md) and [testing.md](testing.md).
