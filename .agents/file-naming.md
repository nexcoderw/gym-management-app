# File and identifier naming

## Purpose

Make files predictable to find and imports portable across case-sensitive deployment systems.

## Mandatory requirements

1. Use kebab-case for authored files: `login-form.tsx`, `get-session.ts`, `error-message.tsx`.
   Match a component's stylesheet: `login-form.module.css`.
2. Export React components in PascalCase, functions/values in camelCase and descriptive types in
   PascalCase. Name operations by intent, such as `getSession`, rather than `doRequest`.
3. Preserve framework-reserved names: `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`,
   `error.tsx` and `not-found.tsx`. Preserve required configuration names and route-group syntax.
4. Use `.test.ts`/`.test.tsx` for Vitest tests and `.spec.ts` for Playwright tests under the
   established test locations. Follow configuration discovery patterns, not a new convention.
5. Match exact import casing and update every importer after an authorized rename. Do not rely on a
   case-insensitive macOS filesystem to hide a Linux deployment failure.
6. Use names that reveal feature ownership. Do not create vague `data.ts`, `helpers.ts` or multiple
   unrelated components all called `Content`.

## Do

```tsx
// File: components/auth/login-form.tsx
import styles from './login-form.module.css';

export function LoginForm() {
	return <form className={styles.form}>{/* Form content belongs here. */}</form>;
}
```

A framework entry remains `src/app/login/page.tsx` even if it exports `LoginPage`.

## Do not

```ts
// WRONG: casing differs from the actual login-form.tsx file.
import { loginForm } from './LoginForm';

// WRONG: obscures which operation this function performs.
export function handleStuff() {}
```

Do not rename framework entrypoints to make them kebab-case or rename untouched files for cosmetics.

## Prevented failures and review checklist

- Exact casing prevents imports working locally but failing in deployment.
- Intent-based names reduce ambiguous ownership and time spent searching.
- Verify filenames, exports, CSS pairing, test discovery and updated import references.
- See [folder-structure.md](folder-structure.md) and [prettier.md](prettier.md).
