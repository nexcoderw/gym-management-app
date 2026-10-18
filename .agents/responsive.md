# Responsive layout

## Purpose

Keep all manager actions and information usable across small screens, desktop, zoom and long content.

## Mandatory requirements

1. Start with a compact single-column layout. Add columns when content has enough space, not because
   a familiar device width exists. Prefer fluid widths and bounded maximum content widths.
2. Use shrinkable flex/grid children: `min-width: 0` and `minmax(0, 1fr)` where appropriate.
   Permit text wrapping; use overflow containment for legitimately wide content, not the whole page.
3. Stack authentication columns and metric groups at compact widths. Adapt the sidebar into a
   compact header without hiding essential destinations or relying on hover.
4. Preserve touch targets, keyboard focus and reading order. A visually rearranged layout must not
   create a confusing DOM or tab order.
5. Handle long names, email addresses, translated-length labels and multi-line errors. Avoid fixed
   heights that clip text. Reserve reasonable loading space to limit disruptive layout shifts.
6. Review portrait/landscape and zoom as well as width. Browser emulation is useful but not proof of
   actual mobile device behavior. Humans run browser verification.
7. Below 40rem, secondary descriptions and redundant shell metadata may be hidden to reduce noise.
   Keep metric labels/counts, permission errors, form labels, MFA choices, navigation and logout
   available. Never hide core actions or fabricate replacement data to make a layout fit.
8. Follow the compact type tokens from globals.css. Shared inputs use 14px text on wider screens and
   restore 16px text below 40rem to prevent mobile browser zoom. Keep touch controls at least 44px
   high and preserve natural text wrapping; do not shrink everything to fit a desktop layout.

## Do

```css
.metrics {
	display: grid;
	grid-template-columns: minmax(0, 1fr);
	gap: var(--space-4);
}

@media (min-width: 48rem) {
	.metrics {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}
```

The breakpoint is illustrative: retain it only if the actual content fits comfortably.

## Do not

```css
/* WRONG: a fixed desktop canvas overflows compact viewports. */
.dashboard {
	width: 1440px;
	height: 900px;
	overflow: hidden;
}
```

Do not solve overflow by hiding the affected information or shrinking controls below usable sizes.

## Prevented failures and review checklist

- Fluid, shrinkable layouts prevent horizontal page scrolling and clipped operational data.
- Preserved navigation prevents mobile users losing functionality.
- Review 320/768/1440px, zoom, orientation, long content, errors and pending states.
- See [styling.md](styling.md), [accessibility.md](accessibility.md) and [design.md](design.md).
