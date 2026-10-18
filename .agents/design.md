# Design system

## Purpose

Keep the manager interface calm, readable and operationally truthful. Establish the reviewed light
palette and shape tokens in `src/app/globals.css` before feature UI; do not create a different visual
language per feature.

## Mandatory requirements

1. Use semantic tokens from `src/app/globals.css` for surfaces, text, borders, states, spacing,
   radii and motion once that foundation exists. Add a missing reusable token deliberately; do not
   scatter new literal colors. The current minimal scaffold does not yet contain this stylesheet.
2. Use only Albert Sans for headings/brand headings and DM Sans for body, controls and data.
   Load both through next/font in the root layout. Generic fallbacks are for loading/failure only,
   not a third design font. Use tabular numerals for comparable operational counts.
3. Follow the 4px-based spacing scale through tokens. Shared text inputs and buttons use the pill
   radius, ordinary controls use 8px corners and panels use 20px corners. Do not give every nested
   element the same oversized radius.
4. Name metrics according to the verified backend definition. Active staff means account status,
   not online staff, concurrent users or recent activity. Display only real validated values.
5. Give each screen one primary purpose and a clear main heading. Prefer useful labels, grouped
   information and restrained borders over decorative cards or meaningless visualizations.
6. Light is the supported theme: white surfaces, #111111 text and #003087 primary actions.
   Hover uses #00246a; #009cde is decorative only, never body text or a button fill. Do not restore
   dark mode or add system-theme switching without a separately reviewed complete token set.
7. Preserve visible focus and non-color status cues. Loading, error and empty states belong to the
   same design system as successful content.
8. Use the compact scale: 14px body/data, 13px secondary text, 12px metadata, 20–24px page headings
   and 24–28px metrics. Shared inputs use 14px text on wider screens and restore 16px text below
   40rem to prevent disruptive mobile browser zoom. Compact button labels remain at least 13px.
   Controls remain at least 44px high; small type must not create small tap targets. Respect browser
   zoom and use rem rather than reducing the root size.
9. The reviewed manager authentication image may use restrained liquid-glass overlays to preserve
   image context and text contrast. Keep this treatment decorative, non-interactive and confined to
   that media panel; it is not a general card or dashboard surface style.

## Do

```css
.value {
	color: var(--text-primary);
	font-variant-numeric: tabular-nums;
}

.label {
	color: var(--text-secondary);
	margin-block-start: var(--space-2);
}
```

Label a backend active-staff count "Active staff accounts", not "Staff online".

## Do not

```tsx
// WRONG: invents operational data and misrepresents its meaning.
<StatCard label="Staff online" value={summary.activeStaff || 125} />
```

Outside the reviewed authentication image overlays, do not use gradients, glassmorphism,
decorative charts, fake trends or hardcoded component colors. Do not show a plausible placeholder
number when the backend failed.

## Prevented failures and review checklist

- Shared tokens prevent visual drift; honest labels prevent incorrect operational decisions.
- Review hierarchy at compact and desktop widths, contrast, focus and empty/error states.
- Check that every displayed metric has a documented backend meaning.
- See [styling.md](styling.md), [responsive.md](responsive.md) and [error-handling.md](error-handling.md).
