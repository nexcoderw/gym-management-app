# Forms

## Purpose and scope

Forms collect untrusted input without making authentication harder to use or easier to bypass.
Apply this rule to login, MFA and any future manager mutation; also read authentication and security.

## Mandatory requirements

1. Use a native `form`, associated visible labels and a submit button. Support Enter submission and
   password managers. Use `autoComplete="username"` for login email, `current-password` for password
   and `one-time-code` for TOTP. Do not use a number input for codes: leading zeroes matter.
2. Match the verified Nest DTO. Client validation provides guidance; the BFF repeats strict runtime
   validation before any upstream request. Do not silently loosen or tighten backend policy.
3. Disable duplicate submission, expose pending state and prevent stale responses from advancing a
   restarted form. Keep error messages associated with their fields and announce submission failures.
4. Preserve useful non-secret input such as email. Clear password state after submission and discard
   challenges when restarting or completing MFA. Never put credentials in URLs or browser storage.
5. Distinguish authenticator-code and recovery-code modes according to the contract. Do not apply a
   six-digit constraint to a recovery code or trim/normalize passwords without backend agreement.
6. Respect payload bounds and expiry. An expired MFA challenge requires restarting login, not retrying
   indefinitely with the same challenge. Do not invent password reset or registration endpoints.
7. Supply a leading icon to text Input fields while retaining visible labels, hints and autocomplete.
   Use a full-width primary submit button with an icon. Let shared Button render its pending state;
   do not swap labels between "Continue", "Checking" and "Verifying" at the caller.

## Do

Illustrative JSX using the shared Input and Button:

```tsx
<form onSubmit={handleSubmit}>
	<Input
		id="email"
		name="email"
		label="Email"
		icon={Mail01Icon}
		autoComplete="username"
		required
	/>
	<Input
		id="password"
		name="password"
		label="Password"
		icon={LockPasswordIcon}
		type="password"
		autoComplete="current-password"
		required
	/>
	<Button type="submit" icon={ArrowRight01Icon} width="full" pending={pending}>
		Continue
	</Button>
</form>
```

The handler must still implement validation, error state and secret cleanup; native attributes alone
are not a security boundary.

## Do not

```text
// WRONG: no label, password-manager support disabled, and secrets retained.
<input placeholder="Password" autoComplete="off" />
localStorage.setItem('password', password);
```

Do not assume an eight-character login policy because bootstrap uses a different minimum. If Nest
login requires twelve characters, report that discrepancy and change policy only in its owning task.

## Prevented failures and review checklist

- Labels and autocomplete prevent inaccessible forms and blocked password-manager workflows.
- Repeated server validation prevents bypassing browser-only restrictions.
- Check keyboard submit, duplicate requests, leading zeroes, recovery mode, expiry and safe errors.
- See [authentication.md](authentication.md), [accessibility.md](accessibility.md) and [testing.md](testing.md).
