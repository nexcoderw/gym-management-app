# CSS Modules and tokens

## Purpose

Keep styles local, predictable and consistent with the shared light design system.

## Mandatory requirements

1. Use colocated CSS Modules for component styles. Global CSS is limited to tokens, reset,
   document-level defaults (including native form controls) and shared semantic utilities.
2. Establish and use semantic variables for colors, spacing, radii, shadows, typography and motion.
   A new literal belongs in the token layer when it expresses a reusable design decision.
3. Prefer logical properties such as `margin-block`, `padding-inline` and `inset-inline-start`.
   Use grid/flex for layout and minimum-zero tracks or `min-width: 0` where content must shrink.
4. Keep selectors shallow and scoped to the component. Avoid reaching into a sibling component's
   internal markup; add an explicit prop or composition boundary instead.
5. Use `:focus-visible` for keyboard focus and retain global focus visibility. Motion must respect
   reduced-motion preferences. Do not add essential information exclusively through animation.
6. Let content determine breakpoints and wrapping. Long labels and error messages must not overflow.
   Use static class composition instead of inline presentation objects for ordinary styles.
7. Follow [prettier.md](prettier.md): tab indentation, readable declarations and LF.
8. Native text inputs, selects and textareas share the low-specificity global control baseline.
   Input modules own field layout, labels and hints; buttons own their pill/variant styles.
   Keep native select keyboard behavior. The browser's options popup can vary by operating system;
   do not claim an exact custom-popup match from CSS tokens alone.

## Do

```css
.card {
	min-width: 0;
	padding: var(--space-6);
	border: 1px solid var(--border);
	border-radius: var(--radius-panel);
	background: var(--surface);
}

.title {
	overflow-wrap: anywhere;
	color: var(--text-primary);
}
```

## Do not

```css
/* WRONG: global leakage, literal theme color and unnecessary specificity override. */
body div button {
	background: #123abc !important;
}
```

Do not introduce Tailwind, CSS-in-JS, pervasive `!important`, inline color literals or duplicated
feature styles in globals. A narrowly documented reset exception is not permission for general use.

## Prevented failures and review checklist

- CSS Modules prevent unrelated screens changing when a feature selector is edited.
- Tokens prevent color/spacing drift; shrinkable layouts prevent long-content overflow.
- Review specificity, style ownership, keyboard focus, reduced motion and responsive behavior.
- See [design.md](design.md), [components.md](components.md) and [responsive.md](responsive.md).
