# Verification record

## 2026-10-19: alignment with the committed website rules (spec eec6d6e)

Source of rules: `docs/SPEC_HANDOFF_V2.md` at `div0rce/common` commit eec6d6e, sections 26.1, 26.2, 29.1, 29.5 and WP-13.

| Rule | Change |
|---|---|
| 26.1 naming | Footer and docs: "UCompute is the public name in use; trademark clearance is open"; each UCompute name maps one-to-one to the Common name |
| 26.2 labels, owner's three levels | Pills limited to Verified, Implemented awaiting verification, Planned, Strategic hypothesis, and the 27.1 term Experimental; roadmap may show ledger statuses. Removed Development build, Gated, Hypothesis, Demonstrated, Exists, Not built yet |
| 29.1 demonstration | Every figure shown with model (stories15M fixture), hardware and commits (apps caf1497 and 5f0c580, evidence af3e37c); "path check, not performance"; the Mac-to-Windows request named as the Mac daemon API; Mode B only, no model split |
| 29.5 roadmap | No dates: removed the dated progress log; counts from the ledger at eec6d6e (148 original, 36 verified; U-01..U-04 not started); WP statuses from section 30, WP-13 added |
| 29.5 compatibility | Download table follows section 27.1 (2026-10-18 baseline, Windows and NAS rows updated 2026-10-19); no platform SUPPORTED |
| 29.5 community | No security or conduct route advertised until tested; GitHub described as holding only the license and brief |
| WP-13 citations | Capability statements on home, product, developers and architecture cite ledger IDs or the evidence path at a commit |
| WP-13 claim check | `check.mjs` fails on pooling/split, SUPPORTED, speedup, privacy-guarantee or Swarm/Cloud/credit-availability wording unless the sentence limits it, and on any binary download link. It caught and the wording was fixed for: two present-tense pooling descriptions, two definitional uses of "supported" |
| Owner direction: credits | Vision page section "One network, one credit system", labelled Strategic hypothesis, with "None of this exists yet" |

Results: `npm test` passes in all three modes; axe-core 0 violations and no horizontal overflow on the changed pages at 1440, 768, 390 and 320 px. Public source check (GitHub API): `div0rce/common` contains only LICENSE and PROJECT_COMMON_AUTONOMOUS_HANDOFF_V2.md, one branch, last push 2026-10-14; private vulnerability reporting disabled.

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
