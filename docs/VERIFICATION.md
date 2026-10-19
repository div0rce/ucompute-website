# Verification record

## 2026-10-19: first complete build (local)

Environment: macOS 26.2 (Apple M2), Node 26.10.0, Python 3 `http.server` on 127.0.0.1:4173, Playwright Chromium, axe-core 4.10.2.

| Check | Command or method | Result |
|---|---|---|
| Build and static checks, all three modes | `npm test` | Pass. prelaunch: 2 pages, 18 files; preview: 19 pages, 38 files; public: 18 pages, 37 files |
| External links | `npm run test:links` | `github.com/div0rce/common` 200, `github.com/ggml-org/llama.cpp` 200. `preview.ucompute.org` did not resolve before deployment (expected) |
| Prelaunch build contains nothing from the complete site | allow-list in `check.mjs` | Pass |
| Horizontal overflow | Playwright, 18 pages at 320, 390, 768, 1024 and 1440 px | None, after fixing grid min-width and a long hash |
| Accessibility | axe-core, tags wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice; 19 pages at 1440, 768 and 390 px (57 page views) | 0 violations, after fixes: two contrast failures, link green 4.38:1 → `#3f6f1f`, announcement outside a landmark, scrollable code and tables not keyboard-focusable, an empty table header, GitHub link without a name at phone width |
| Mobile menu | Playwright at 390 px | Opens, sets `aria-expanded`, locks scroll, closes on Escape and returns focus, links navigate. Fixed a bug where the header's `backdrop-filter` collapsed the fixed menu |
| Code tabs | Keyboard: ArrowRight, End, wrap-around | Pass; panels show and hide, focus follows |
| Copy buttons | Clipboard read-back | Home Python tab and Install guide copy the exact code |
| Skip link and focus | First Tab, Enter | Skip link visible on focus, moves to `#main`; focus outline visible |
| Reduced motion | `prefers-reduced-motion: reduce` | Prelaunch drawing shows its final state; hero packets hidden |
| Console | Playwright on every page | No errors. Font preload warnings removed by dropping the preloads (each font was fetched once) |
| Claims review | Every page against `reference/implementation-facts.md` | Corrected while writing: pairing lockout is "more than five" attempts; `--ctx`, `--threads`, `--seed`, `--chat` semantics from the clap definitions; removed an unverified disk-size figure; diagnostics described as "no prompt text" |

Screenshots are kept outside the repository with the session evidence.

## Known limits of this verification

- Assistive technology was exercised through axe and the accessibility tree, not with a human screen-reader session.
- Browsers tested: Chromium (Playwright) and Chrome. Safari and Firefox were not run.
- Lighthouse was not run; no performance scores are claimed. Page weight is small (one stylesheet, under 10 kB of script, four self-hosted fonts).
