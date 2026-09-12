---
name: storybook-visual-testing
description: Make Storybook stories deterministic for UI Verify so captures stop coming back "changed" without a real change (flaky diffs). Use when setting up story-level visual tests or debugging a story that diffs every run. Focuses only on the run-to-run variation the capturer can't neutralize from outside your app — the clock, infinite JS animations, live data, and non-Math.random randomness — and deliberately skips what UI Verify already handles for you.
---

# Deterministic Storybook stories

## Mental model — Storybook already removed most of the flake

UI Verify renders each **story** as a baseline. Because a story is an isolated component in a controlled
harness, you get for free the things that make real-page capture hard: no page scroll, no A/B / analytics
/ chat / consent scripts, no lazy-load-on-scroll races. That isolation is the point — the determinism
work here is **narrow**. If you reach for scroll-settling or third-party stubbing, you're fighting a
problem Storybook already removed; that's a real-page concern (see `playwright-visual-testing`).

**UI Verify's capturer also neutralizes these automatically — do NOT hand-fix them:**

- CSS animations & transitions (killed at render), and the Web Animations API (disabled).
- `prefers-reduced-motion: reduce` — **emulated**, so any component that honors it renders its calm state.
- `Math.random` — **seeded** before your app code runs (a shuffle/jitter driven by `Math.random` is
  already stable).
- Web fonts and `<img>` loading — **waited for** before capture.
- **Finite** JS animations (a Recharts entry draw, react-smooth) — captured at their settled final frame.
  You don't need to disable these.

So the checklist below is only the remainder — what lives *inside your app* and can't be fixed from
outside it. And like Vitest browser mode (`vitest-visual-testing`) and unlike a real page, a story has
**no SSR** — no server-rendered random pick to reconcile.

**The headline: freeze the data.** Once the list above is off the table, the one thing left that floods a
story suite with false "changes" is **live/dynamic data** — star counts, follower counts, contributor
lists, tiles, timestamps. Give every story **static args / fixtures** and that entire class disappears at
the source: static data can't churn run-to-run, so there is nothing to diff. This is the single
highest-value determinism step here — do it first (step 1), and most stories need nothing else.

Point UI Verify at your built stories:
```bash
npm run build-storybook && uiverify upload --static-dir storybook-static
```

## The checklist (only what the tool can't do for you)

### 1. Freeze the data — the one that actually matters

A story fed live/dynamic data is flaky by construction: the stars, followers, contributor list, tile
order, and timestamps move between runs, so the diff lights up with no code change. **Give every story
static args/fixtures and the whole class is gone.** Never let a story hit a real backend.

Concrete — fixed, ordered, complete data:
- fixed **counts** (stars, followers, downloads) — literal args, not a live fetch;
- a fixed **contributor/author list**: fixed names **and** avatar URLs (or inlined avatars), in a fixed
  order;
- a fixed set of **tiles/rows in a fixed order** (a live "trending" sort reorders every run);
- fixed **timestamps** (pair with the clock, step 2).

Two ways to inject them, both fine:
- **args** — the Storybook-native path: pass the component's data as fixed `args` on the story;
- **mock the fetch** — when a story fetches internally, [MSW via `msw-storybook-addon`](https://storybook.js.org/addons/msw-storybook-addon)
  returns the **same** response every time.

**One component per story file, every variant × state in one story** where you can — cheaper and easier
to eyeball than N near-identical stories. Keep each in its own file so `--only-changed` carries the
untouched ones forward, and add a path filter so the visual job only runs on UI PRs.

### 2. Freeze the clock

The one thing the capturer deliberately does **not** do (freezing time breaks entry animations). Any
component that reads the clock — a relative timestamp, a date picker defaulting to "today", a chart's day
axis — drifts every run. Pin it with
[`storybook-addon-mock-date`](https://www.npmjs.com/package/storybook-addon-mock-date) (Storybook 10+),
which mocks `Date` per story:

```ts
// .storybook/main.ts
addons: ['storybook-addon-mock-date'],
```
```ts
// .storybook/preview.ts — a fixed date for every story (meta- or story-level overrides it)
export default { parameters: { mockingDate: new Date('2020-01-01T00:00:00Z') } };
```

Pass a `Date`, a millisecond timestamp, or an ISO string as `mockingDate`; the most specific value
(story > meta > preview) wins, so a single story can pin its own "today". On older Storybook, install
[`@sinonjs/fake-timers`](https://github.com/sinonjs/fake-timers) in a decorator instead
(`install({ now: FROZEN_NOW })`) — it covers `Date`, `Date.now`, and timers in one call.

### 3. Infinite JS animations

A CSS/WAAPI/finite animation is handled for you (above). What's left is an **infinite** JS loop that
never has a final frame — framer-motion pulsing dots, a Lottie loop, an autoplay spinner, or a
`<canvas>` / `requestAnimationFrame` loop (which no media query can reach). Two fixes:

- **Preferred — honor reduced motion.** The capturer emulates `prefers-reduced-motion: reduce`, so make
  the component respect it. framer-motion ignores it by default (`reducedMotion: "never"`); opt in:
  ```tsx
  // .storybook/preview.tsx decorator
  <MotionConfig reducedMotion="user"><Story /></MotionConfig>
  ```
  or gate the loop yourself with `useReducedMotion()`. One line, and it's good app behavior anyway.

- **Escape hatch — detect the capture** and render the end state. UI Verify flags every capture with a
  `UIVerify` marker on the user-agent and a `window.__UI_VERIFY__` global, so a component can branch:
  ```ts
  export const isUIVerify = () =>
    (typeof navigator !== 'undefined' && navigator.userAgent.includes('UIVerify')) ||
    (typeof window !== 'undefined' && '__UI_VERIFY__' in window);
  ```
  ```tsx
  <RadarChart isAnimationActive={!isUIVerify()} />
  ```
  Prefer pausing at the **end** frame, not the start. For a hand-rolled `<canvas>` rAF loop the same
  branch applies: `if (isUIVerify()) drawOneStaticFrame(); else startRaf();` in the component's effect.

### 4. Non-`Math.random` randomness

`Math.random` is seeded for you, but `crypto.randomUUID()`, a `uuid` library, or faker are **not**. Use
fixed fixtures for anything that ends up on screen (an id in the DOM, a faker name), or set a fixed faker
seed.

### 5. Dynamic layout

A JS-measured layout that reflows or reorders on its own (packing driven by measured size, a shuffled
list) can vary run-to-run even with identical content. Force a deterministic variant in the story (a
fixed order/size), or mask the region.

## Anti-patterns

- **A story that fetches live data** → mock it (MSW).
- **Disabling CSS animations / seeding `Math.random` / waiting on fonts by hand** → wasted effort; the
  capturer already does all three. Spend the effort on the clock and infinite loops.
- **Unseeded `crypto`/`uuid`/faker or a bare `Date.now()`** → fixtures + freeze the clock.
- **Reaching for scroll-settle / A-B stubbing** → wrong path; that's a real-page concern.
