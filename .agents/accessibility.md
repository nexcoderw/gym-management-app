# Accessibility

## Purpose

Make every supported flow operable with keyboard, assistive technology and zoom. Target WCAG 2.2 AA;
the project's 44px touch-target goal is a usability standard, not a claim about every WCAG criterion.

## Mandatory requirements

1. Use semantic landmarks and heading order, with one main page heading and a skip link targeting
   the main content. Use native links for navigation and buttons for actions.
2. Associate every form input with a visible label. Connect hints/errors using `aria-describedby`
   and expose invalid state. A placeholder or nearby unassociated text is not a label.
3. Preserve visible keyboard focus and logical tab order. Do not use positive tabindex or remove
   outlines without an equivalent visible focus treatment.
4. Target at least 4.5:1 contrast for normal text and 3:1 for large text; review non-text controls and
   focus indicators separately. Pair status color with text or another meaningful cue.
5. Aim for at least 44×44 CSS-pixel interactive targets. Smaller visual icons can sit inside larger
   controls; padding must create a real click/touch area.
6. Announce submission errors and relevant pending states without excessive live regions.
   Avoid repeatedly announcing decorative spinners or moving focus on every render.
7. Respect reduced motion, support 200% zoom and review reflow at 320 CSS pixels. Dialogs added later
   require deliberate focus management, Escape behavior and focus restoration.

## Do

```tsx
<>
	<label htmlFor="email">Email</label>
	<input
		id="email"
		name="email"
		aria-invalid={Boolean(error)}
		aria-describedby={error ? 'email-error' : undefined}
	/>
	{error ? (
		<p id="email-error" role="alert">
			{error}
		</p>
	) : null}
</>
```

Ensure these elements share one form and IDs are unique.

## Do not

```text
// WRONG: unlabeled icon action and mouse-only interaction.
<div onClick={logout}>×</div>
<input placeholder="Email" />
```

Do not rely on hover/color alone, hide essential controls from keyboard users or claim compliance
based only on static source inspection.

## Prevented failures and review checklist

- Semantics and labels prevent silent or misleading assistive-technology controls.
- Focus and target sizing prevent keyboard/touch users being locked out.
- Humans verify keyboard-only use, screen reader output, zoom, contrast and automated accessibility
  findings with chosen tooling; automated checks do not replace manual testing.
- See [forms.md](forms.md), [components.md](components.md) and [testing.md](testing.md).
