# Components

## Purpose

Build small, accessible primitives and compose them into feature UI. Shared components provide
presentation and native behavior; they do not own authentication policy or backend transport.

## Mandatory requirements

1. Reuse the established Button and Input before introducing another primitive. Put generic UI and
   cross-feature branding in `src/components/shared`; put login, invitation, enrollment, session
   and logout UI in `src/components/auth`; put dashboard-only UI in `src/components/dashboard`.
   Never leave authored component files directly in `src/components`.
2. Use native HTML semantics and type props from the corresponding React HTML attribute interface.
   Preserve caller attributes, accessible names, input associations and expected button behavior.
3. Default ordinary buttons to `type="button"`; use explicit `type="submit"` inside forms. Pending
   buttons must prevent duplicate interaction and expose their busy state without removing their name.
4. Prefer children and explicit small variants over collections of booleans. Keep feature permission
   checks out of shared primitives. Do not make Button understand dashboard roles or upstream paths.
5. Colocate a component's CSS Module. Keep server-renderable presentation server-compatible; add
   `'use client'` only when browser APIs, hooks or event handlers require it.
6. Review components around 200 lines for responsibility splits, not mechanical fragmentation.
   Preserve useful native behavior when extracting a wrapper.
7. Once the reviewed Hugeicons dependencies are installed, every shared Button and text Input
   requires a named Hugeicons definition through its `icon` prop.
   Primitives render that decorative icon; callers must not duplicate icons inside button children.
   Labels remain visible and accessible. Radio/checkbox choices retain their native controls.
8. Button `width` is `full` (100% of its container), `medium` (12rem, the default), or `small`
   (8rem). All widths are capped at 100% and retain the same 48px minimum control height.
9. Only the shared Button owns loading presentation. Set `pending`; it disables the button, sets
   aria-busy and replaces the icon with the same 18px spinner in a fixed slot. Keep the action text
   unchanged. Do not add caller-specific spinners, changing pending labels or different animations.
10. Shared text inputs use the pill shape and compact desktop text from the reviewed design system.
    Preserve 16px input text on compact screens to prevent disruptive mobile browser zoom. Button
    labels use the compact control scale without reducing the 48px minimum target height.

## Do

```tsx
<form onSubmit={submit}>
	<Input id="email" name="email" label="Email" icon={Mail01Icon} />
	<Button type="submit" icon={ArrowRight01Icon} width="full" pending={pending}>
		Sign in
	</Button>
</form>
```

The feature owns the meaning of the count and submission; the primitive owns visual treatment.

## Do not

```text
// WRONG: non-native action and feature policy embedded in a primitive.
<div onClick={submit}>Sign in</div>
<Button isOwner isDashboard isCompact isSpecialAuth />
```

Do not duplicate primitives, add a heavy UI framework, spread unknown props onto DOM nodes or replace
a native disabled attribute with appearance alone.

## Prevented failures and review checklist

- Native semantics prevent broken keyboard interaction and inaccessible action controls.
- Feature-independent primitives prevent circular imports and permission-policy drift.
- Check prop typing, default button type, busy/disabled behavior, names and CSS ownership.
- See [accessibility.md](accessibility.md), [styling.md](styling.md) and [code-quality.md](code-quality.md).
