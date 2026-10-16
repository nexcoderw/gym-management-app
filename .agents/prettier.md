# Formatting and editor alignment

## Source of truth

The root `.prettierrc.json` controls formatting. `.editorconfig` supplies editor defaults and
`.vscode/settings.json` selects the Prettier extension. The Button excerpt below is the formatting
reference until a reviewed shared Button exists in this minimal scaffold.
Read this rule before editing authored code or configuration.

## Mandatory requirements

1. Use tabs for code indentation, displayed at a width of two spaces. Add one tab per nesting level.
   Do not insert repeated spaces to align assignments, values or JSX attributes into columns.
2. Use a preferred print width of 100, single-quoted JS/TS strings, double-quoted JSX attributes,
   semicolons and trailing commas where Prettier and syntax allow them. A rest parameter such as
   `...props` must not receive a manually added trailing comma.
3. Use UTF-8, LF, a final newline and no trailing whitespace except meaningful Markdown whitespace.
   Markdown and YAML indentation uses spaces. Let Prettier format each language appropriately.
4. Let Prettier decide wrapping. Long prop lists wrap; short elements may remain inline.
   `printWidth` is a wrapping preference, not a hard character-count limit for every line.
5. Put multiline JSX closing brackets on their own line and parenthesize multiline JSX returns.
   Use spaces around operators. Separate import groups intentionally; Prettier does not sort imports.
6. Humans run formatting and inspect its diff. Agents manually author matching formatting and supply
   commands, but must not run Prettier, format-on-save automation or a formatting wrapper themselves.
7. Respect `.prettierignore`. Do not format dependencies, generated files, secrets, build output or
   the lockfile. Do not mix unrelated whole-project formatting into a targeted behavior fix.

## Do: match the shared Button

This excerpt illustrates formatting, not a complete replacement implementation:

```tsx
export function Button({
	pending = false,
	icon,
	variant = 'primary',
	width = 'medium',
	disabled,
	children,
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			type="button"
			disabled={disabled || pending}
			aria-busy={pending}
			data-variant={variant}
			data-width={width}
		>
			<span className={styles.icon} aria-hidden="true">
				{pending ? (
					<span className={styles.spinner} data-loading-indicator />
				) : (
					<HugeiconsIcon icon={icon} size={18} color="currentColor" />
				)}
			</span>
			<span className={styles.label}>{children}</span>
		</button>
	);
}
```

The short spinner stays inline intentionally; do not force every element to be multiline.
The shared icon/loading slot belongs to Button; callers only pass an icon and pending state.

## Do not

```text
// WRONG: compressed JSX, inconsistent quotes and manual column alignment.
const pending       =false
const variant       ="primary"
return <button type="button" disabled={disabled||pending}>{children}</button>
```

Do not introduce a competing formatter, change settings to silence a single diff, or assume
formatting proves lint, types or runtime behavior are correct.

## Human editor setup

Open `app/manager` as a VS Code folder or workspace folder. Install the recommended **Prettier - Code
formatter** extension. Nested `.vscode` settings do not automatically apply to a window opened only
at the parent `gym` folder; add the manager folder to the workspace or configure that window explicitly.

On macOS, Option+Shift+F invokes Format Document, not necessarily Prettier. If necessary choose
**Format Document With… → Configure Default Formatter → Prettier**. Ensure any language-specific
user override also selects Prettier. The workspace enables format-on-save and requires a config.

## Human commands

From `app/manager`, format the rule/configuration changes without formatting unrelated source:

```bash
npx prettier --write .agents .prettierrc.json .vscode AGENTS.md CLAUDE.md
npm run format:check
```

Do not pass `.editorconfig` to Prettier: it has no built-in parser for that file. A whole-project
check may report older, unformatted files. For an intentional whole-project pass, the human runs:

```bash
npm run format
npm run format:check
npm run lint
```

Inspect every changed file and use one-file commits. No formatter was run merely by authoring rules.

## Prevented failures and review checklist

- Shared settings prevent editor/CLI drift and invisible indentation differences.
- Review tabs, wrapping, quotes, LF, ignored files and behavior-preserving changes.
- Report formatting as unverified until the human supplies actual results.
- See [git.md](git.md) and [code-quality.md](code-quality.md).
