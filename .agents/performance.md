# Performance

## Purpose

Keep the interface fast without weakening privacy or adding complexity without evidence.

## Mandatory requirements

1. Prefer Server Components and small client islands. Do not send the whole shell or a server-owned
   data layer to the browser merely for one interactive button.
2. Call server endpoint modules directly from RSC. Avoid self-HTTP, redundant reads and unnecessary
   waterfalls. Run independent authorized reads concurrently only after required access checks.
3. Once a canonical request-scoped React.cache session helper exists, use it for RSC deduplication.
   React.cache is not a blanket cache for route handlers and does not authorize persistent or
   cross-user session caching. Private transport remains no-store.
4. Import individual icons and avoid unnecessary global providers, large libraries, polling or
   speculative memoization. Measure a problem before adding an optimization abstraction.
5. Reserve useful loading space, prevent layout shifts and keep primary controls responsive.
   Avoid font/image decisions that introduce blocking downloads without a demonstrated benefit.
6. Target representative p75 LCP ≤2.5s, INP ≤200ms and CLS ≤0.1. These are project targets, not
   measured results. State device/network/sample limitations when reporting measurements.
7. Humans run builds, browser profiling and measurement tools. Agents may inspect code and recommend
   checks, but must not claim bundle size or Core Web Vitals from source inspection alone.

## Do

```text
Server-rendered shell and dashboard data
  + narrow client navigation-active-state component
  + narrow client logout interaction
  = less browser JavaScript without moving authorization into the browser
```

Deduplicate repeated session reads within the same server render using the canonical reviewed helper.

## Do not

```ts
// WRONG: private sessions persist across requests in process-global state.
const sessionCache = new Map<string, ManagerSession>();

// WRONG: speculative frequent polling creates load without an agreed freshness need.
setInterval(refreshDashboard, 1000);
```

Do not replace no-store with persistent caching to make an authentication request appear faster.

## Prevented failures and review checklist

- Small islands reduce client work; request isolation prevents performance changes leaking identities.
- Review import weight, waterfalls, loading stability, unnecessary requests and actual measurements.
- Distinguish a proposed improvement from a verified performance result.
- See [nextjs.md](nextjs.md), [security.md](security.md) and [testing.md](testing.md).
