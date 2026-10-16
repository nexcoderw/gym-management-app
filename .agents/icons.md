# Hugeicons

## Purpose

Use one consistent, accessible icon system without unnecessary package weight.

## Mandatory requirements

1. After the human approves and installs the exact dependencies, render icons with `HugeiconsIcon`
   from `@hugeicons/react` and named definitions from `@hugeicons/core-free-icons`. Confirm an icon
   export exists in the installed package. The current scaffold does not include Hugeicons.
2. Import only the definitions a component or registry uses. Do not import the complete namespace
   or guess unsupported deep paths to work around an export error.
3. Icons support text, not replace it without an accessible name. Decorative icons use
   `aria-hidden="true"`; an icon-only button needs a meaningful `aria-label`.
4. Let icon color follow semantic text color/currentColor. Keep size and stroke treatment consistent
   with the control and readable at small sizes.
5. Reference navigation icons from the central registry, not duplicated feature-specific arrays.
   Humans install/update packages; agents may not run install commands.

## Do

```tsx
import { DashboardSquare01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export function OverviewLabel() {
	return (
		<>
			<HugeiconsIcon icon={DashboardSquare01Icon} size={20} aria-hidden="true" />
			<span>Overview</span>
		</>
	);
}
```

Compose this decorative icon and visible label inside the actual navigation link.

## Do not

```tsx
// WRONG: namespace import and a control with no accessible name.
import * as icons from '@hugeicons/core-free-icons';

<button>
	<HugeiconsIcon icon={icons.DashboardSquare01Icon} />
</button>;
```

Do not mix in another icon library, emoji substitutes or copied unreviewed SVG assets.

## Prevented failures and review checklist

- One icon system prevents inconsistent appearance and unnecessary dependencies.
- Named imports keep usage explicit; labels prevent silent screen-reader controls.
- Verify official package names, available exports, size, contrast and accessible names.
- See [navigation.md](navigation.md), [accessibility.md](accessibility.md) and [dependencies.md](dependencies.md).
