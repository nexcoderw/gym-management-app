# Testing

## Purpose and evidence

Author tests that exercise real security decisions at the appropriate boundary. Only humans execute
test tooling. A mocked frontend contract test is not Nest/PostgreSQL integration evidence.

## Mandatory requirements

1. Introduce one reviewed test stack with the first real behavior: Vitest for unit/component and BFF
   contract tests, and Playwright when browser coverage is justified. The current scaffold has no
   test runner or test scripts; do not pretend these commands already exist.
2. Mock transport boundaries and external services, not the authorization/Origin/CSRF logic under
   test. Tests must demonstrate rejection before upstream fetch or privileged work occurs.
3. Cover valid/invalid payloads, unknown fields, body limits, missing/foreign Origin, invalid CSRF,
   expired sessions, missing permissions, redirects, unsafe cookies and malformed upstream data.
4. Test safe errors and no-store behavior. Verify that secrets and internal provider details do not
   appear in responses. Cookie tests must cover attributes and local/production names.
5. For forms/components, cover labels, keyboard submission, pending/disabled states, safe errors,
   MFA expiry and recovery mode. Test navigation filtering without treating it as authorization.
6. Isolate fixtures, restore mocks and avoid shared mutable state. Use fictional identities/tokens;
   never connect tests to production or embed real credentials.
7. Browser tests require human-started services and explicit environment setup. Explain which checks
   use mocks and which exercise the real backend. Do not silently start servers or install browsers.
8. Report checks as not run until human results are available. A test file existing is not a pass.

## Do

```ts
// Illustrative assertion sequence for an Origin-rejection test.
expect(response.status).toBe(403);
expect(fetchMock).not.toHaveBeenCalled();
expect(response.headers.get('cache-control')).toBe('no-store');
```

Also assert the safe error contract. Reuse test factories and mock conventions after they exist.

## Do not

```ts
// WRONG: bypasses the policy being tested and proves only the mock works.
vi.mock('@/lib/server/authorization', () => ({
	requirePermission: () => true,
}));
```

Do not use broad snapshots instead of behavior assertions, run production mutations or claim mocked
tests prove the backend's real role revocation, database isolation or cookie deployment behavior.

## Human verification commands

From `app/manager`, after dependencies are installed and formatting is reviewed:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
```

Once reviewed test scripts exist, run them only after following the documented prerequisites and
human-started server setup. If required tools are absent, report the prerequisite instead of
inventing a command or installing them as an agent.

## Prevented failures and review checklist

- Negative cases catch bypasses hidden by happy-path-only coverage.
- Honest evidence prevents mocked success being mistaken for production integration.
- Check isolation, fixtures, rejection order, safe output and explicit unexecuted status.
- See [security.md](security.md) and [agent-workflow.md](agent-workflow.md).
