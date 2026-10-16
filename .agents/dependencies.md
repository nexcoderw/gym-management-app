# Dependencies and lockfiles

## Purpose

Keep dependency changes deliberate, reproducible and compatible. Humans own installation and npm's
generated lockfile; agents may propose reviewed changes, not fabricate resolved dependency data.

## Mandatory requirements

1. Preserve the reviewed Next/React combination unless an upgrade is explicitly in scope. Check
   installed engines, peer requirements, license, maintenance and security implications for additions.
2. Use existing packages before introducing alternatives. Hugeicons, server-only, Zod and test
   tooling are approved directions only when the implementing feature needs them and the human has
   reviewed and installed exact versions. The current scaffold does not include those packages.
3. New direct dependencies must use reviewed exact versions. Do not add `latest`, wildcard or
   speculative ranges. Existing scaffold ranges are not permission to broaden new dependencies.
4. Humans execute installs with `--save-exact` and let npm produce `package-lock.json`.
   Agents must not execute install/ci, edit lockfile integrity/resolved data or invent a lockfile.
5. Review manifest and lockfile together after human execution. A manifest change with an unrelated,
   absent or stale lockfile is incomplete for a reproducible handoff.
6. Commit a changed manifest and its corresponding human-generated lockfile as consecutive separate
   commits: manifest first. Do not confuse a legitimate npm lockfile with generated build output.
7. Do not introduce Tailwind, a heavy UI framework, another icon set or a state/animation library
   without an explicit scoped need and approval. Do not install packages just to inspect their docs.

## Do

For an explicitly approved installation at the version currently declared in this project, the
human command is:

```bash
npm install --save-exact zod@4.6.7
```

This is an example, not approval to add that package or select that version.
For another approved version, substitute that reviewed exact version. Inspect both package files
afterward and verify compatibility with existing schemas.

## Do not

```json
{
	"dependencies": {
		"zod": "latest",
		"unreviewed-ui-framework": "*"
	}
}
```

Do not hand-edit a lockfile to make versions appear installed or claim `npm audit` passed when it
was not run. A package being popular is not evidence it is safe or needed.

## Prevented failures and review checklist

- Exact reviewed additions and a matching lockfile prevent non-reproducible installations.
- Purpose/compatibility review prevents unnecessary weight and peer-version breakage.
- Confirm version provenance, engines, purpose, manifest/lockfile parity and human-only execution.
- See [icons.md](icons.md), [performance.md](performance.md) and [git.md](git.md).
