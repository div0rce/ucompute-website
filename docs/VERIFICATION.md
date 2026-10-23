# Verification record

## 2026-10-23: platform pass (staging only)

On `stage-snapshot`, behind Access. preview.ucompute.org and the live prelaunch page (D-023) are unchanged: the prelaunch build's `/` and `/404.html` are byte-identical to production's apart from asset hashes, with the same file list.

| Piece | What changed | How it is checked |
|---|---|---|
| Interfaces from the source | `tools/interfaces.mjs` exports every CLI command and flag, route, error code with its HTTP status, and environment variable from the engineering repository at d00fa7e, read-only through `git show` | `check.mjs` fails on any command, subcommand, flag, route, base URL, error code, status or `COMMON_*` variable a page names that the export lacks, and on any route or error code left undocumented. Negative test: six planted mistakes, six failures |
| Command-line reference | `/docs/cli/`, rendered from the export, with website wording for empty help text in `reference/cli-notes.json` | The build fails if a note matches nothing, or if a command, argument or variable has no text |
| Start here | `/start/`: four paths (run locally, connect a trusted computer, build on the API, follow the project). Each path is a run of real steps linking to the docs, ending in "Where it stops today". Also in the home band, the header button, the docs index and the footer | Claim markers on every capability sentence. Snapshot qualifiers are quoted verbatim |
| Structured data | BreadcrumbList on docs pages, next to the existing Organization and WebSite on home | `check.mjs` parses every JSON-LD block |
| Engineering review | 22 October revocation timing marked as a development-build API run. Linux wording no longer states what the newer source contradicts, and adds nothing until a snapshot records it | Engineering's WP-13 review of 167d734 |
| Downloads | No release-records file yet. `docs/DEPLOYMENT.md` gives the procedure for the first approved artifact | `check.mjs` still fails on any installer link |

Browsers, run on the Linux test host (sentinel, Ubuntu 26.04) with `tools/browsers.mjs`, so that engineering's load-sensitive tests keep this Mac to themselves. Setup:
- Node 24.22.1 and Playwright 1.64.0, user-level in `~/ucompute-website-check`;
- five WebKit libraries extracted there from Ubuntu packages, with no sudo and no system changes.

Every page was checked at 1440 and 390 px in Chromium 156, Firefox 157 and WebKit 27.2. Results:
- no page errors, console errors, failed requests or horizontal overflow;
- axe-core 4.10.2 WCAG 2.2 AA: 0 violations;
- the mobile menu opens;
- the home fabric animates in Chromium and WebKit (26 to 32 frames a second in software GL);
- 0 frames a second when paused or with reduced motion;
- without WebGL, the static dot field appears and the canvas stays hidden.

Firefox headless on that host has no WebGL, so the fallback was seen there for real. Screenshots are with the session evidence, not in the repository.

## 2026-10-23: living redesign (staging only)

The owner asked for a site that feels alive. These changes are on `stage-snapshot`, behind Access; preview.ucompute.org and the live prelaunch page (D-023) are unchanged.

| Piece | What it is | How it stays honest and accessible |
|---|---|---|
| Device fabric (home hero) | WebGL shader: a dot field where two paired devices glow and a request travels between them; pointer and scroll parallax | Decoration over complete HTML. Static dot-field fallback without WebGL; one still frame with reduced motion. Pauses off screen and in hidden tabs. 60 fps (p95 frame 17.6 ms) at 1440×920 on the M2 Mac under load |
| Scroll story (home) | A sticky diagram of the 19 October run that follows five steps as you scroll | Every step is real text with the approved claim 6 wording. Without JS the diagram shows the final step. The current step is marked with a bar rather than by fading the others, so all text keeps AA contrast |
| Instruments (home, roadmap) | Ledger as 148 squares (36 lit); revocation times on a 0–0.1 s scale; memory-fit error as a range inside ±15% | Numbers and qualifiers from the snapshot's sections 7–8, each next to its claim. Drawn once on view; already complete with reduced motion |
| Vision rings (home) | Run and Mesh solid at the centre; split model, Swarm and Cloud as dashed and dotted outer rings, with scroll parallax | Every ring is labelled Experimental, Planned or Strategic hypothesis. "Coming soon" is not used: the snapshot and spec forbid dates or availability wording for planned work |
| Mode explorer (product) | Tabbed diagrams of Local, Remote, Split model (planned), Spread jobs (planned) | Uses the site's WAI-ARIA tabs; planned modes are drawn dashed and labelled planned |
| Later additions (2026-10-23) | Demo: an "Every recorded run" timeline (18–22 October, development builds; claims 9, 16 and 17 with claim 5's qualifier). Product: capability tiles for what works today and dashed items for what doesn't yet. Release status: the four stages as a track. Vision: an opening with the rings. Home: labels that track the fabric's two nodes. Fabric falls back to the static field if the WebGL context is lost | Copy pass: the ring description corrected (Mesh is built, not planned), the credits line quotes the owner's tagline verbatim, and planned vision rows are written as "would". `check.mjs` gained rules for "too big for one machine" and "picks the best device", plus a 250 KB page-weight budget (the heaviest page is 98 KB) |
| Pause motion (WCAG 2.2.2) | A "Pause motion" button in every full-site footer and in the home hero pauses CSS animations, SVG animations and the shader. It is remembered per viewer in localStorage and hidden when reduced motion is set | Tested: pausing on home carries to the architecture page, where the SVG animations report paused; resuming restarts them |
| Smaller touches | Dark header over the home hero; recorded-run figure on the demo page; dot-field page headers; packets on the architecture diagram; interactive target switch on the developers page | All motion is switched off under reduced motion |

Browsers: the redesign was verified in Chromium (Playwright). The WebKit and Firefox runs are deferred, because the Mac was swapping (about 55 MB free), had 4.6 GB of disk free, and engineering's load-sensitive tests were due. The features used were checked by hand against Safari support: prefixed `-webkit-mask`, SVG `transform-box`, `:is()`, `aspect-ratio`, optional chaining and WebGL 1. WebKit and Firefox were run later the same day on the Linux test host; see the platform pass above.

Frozen prelaunch page (D-023): the prelaunch build was rendered with staging's stylesheet and with production's (1267b34), at 1440 and 390 px, for `/` and `/404.html`, with reduced motion and the pointer parked. Wherever production renders identically to itself, the two are byte-identical. The pairs that differ also differ between two captures of production alone, which is rendering noise. Print and forced-colors rules are scoped to full-site markup, and page cross-fades were dropped because they can't be scoped.

Checks: `npm test` passes in all three modes. axe-core 4.10.2 reports 0 violations on all 19 pages at 1440, 768 and 390 px, plus the dark home header. There is no horizontal overflow from 320 to 1440 px. Forced colors and print were checked, and there are no console errors.

## 2026-10-22: snapshot refresh staged (branch `stage-snapshot`, not on preview.ucompute.org)

Staged against the DRAFT capability snapshot (div0rce/common dc2502c) for a mechanical swap when the final snapshot lands. It is built by Cloudflare Pages as a branch preview behind Access; `preview` and production are unchanged.

| Change | Detail |
|---|---|
| Claim map | `reference/claims.json`: each claim → snapshot row, requirement IDs, evidence file, commit. Pages carry `{{claim:ID}}` markers that the build strips; an unknown ID fails the build |
| Acceptance gate | Wording that depends on tonight's Mac and Windows acceptance run sits in `{{if:acceptance}}…{{else}}…{{/if}}`. It covers pairing started on Windows, connecting at a new address, and the six open demo issues. Flipping `gates.acceptance` to true switches all of it; both states build and pass `check.mjs` |
| Identifiers off pages | `check.mjs` fails if requirement, blocker, decision or work-package IDs, `§`, a 7-character commit or a non-documentation IPv4 address appears in rendered text. Removed 34 citation tags and every commit, evidence path and mode letter from the pages |
| Private data | Both internal screenshots deleted; the host name replaced by "the Mac"; example address moved to 192.0.2.20 |
| Repository links | All removed; "Licensed under Apache-2.0; the source has not been published yet" in the footer, home, project, community and install pages (snapshot claim 15) |
| Section 9 wording | "Download" button and labels became "Release status"; "Open source" nav became "Project"; "Apple Silicon" claims narrowed to Apple M2; "open protocol" and "open source" removed from the vision and project pages; direction text introduced with "Our direction" plus "Credits do not exist yet. Free does not mean unlimited."; OpenAI-client claim gained "tool calling is not yet verified" |
| Ledger | As of 22 October 2026: original 148 unchanged (36 verified); five added requirements, all not started |
| Layout fix | A sticky section heading overlapped its intro text when the column held both; the heading now sticks only when it is alone |
| Draft 2 snapshot (2026-10-23, e4ed731) | Staging now follows draft 2:
  - Claim 5's new qualifier: pairing shown starting from either the Mac or the Windows laptop; Mac-to-Mac not yet shown.
  - New claims 16 (connect by address where discovery is blocked) and 17 (Windows firewall consent step), each with its qualifier, published on staging since both are confirmed on hardware.
  - Claim 7's inbound half carries "tested on one computer, not yet between two machines".
  - Claims 3 and 4 carry the Mac-only qualifier.
  - Claim 9 cites three runs, and the revoked device's error code is no longer named.
  - Claim 12 names the exact Windows hardware.
  - The demo's open issues follow the per-item verdicts in section 4.1: confirmed fixes say so with date and build; code-only fixes (chat without a local model, redials between Mac and Windows, Windows wording beyond the chat view) stay behind `gates.acceptance`, which stays false |
| Review against the snapshot (2026-10-22) | A full read-through found 10 must-fix and 19 should-fix items. Fixed:
  - Scheduler and SDK now labelled planned.
  - Cloud described as planned and not offered.
  - Claim 2, 3 and 5 qualifiers now sit next to the Run and Mesh claims.
  - Mac-to-Mac and Windows-started pairing marked unproven in the docs.
  - Windows on ARM and Linux shown as Planned.
  - "public ledger" removed.
  - The owner tagline introduced as direction ("What we are building toward"; footer "Our direction").
  - Numbers outside the snapshot's register removed.
  - Tool calling caveat added.
  - "any OpenAI client" narrowed to the official clients.
  - The credits cash-out line aligned with the stage list.
  - The chat-header defect added to the open issues.
  - Roadmap anchors use slugs.

  Kept: the catalog count and the architecture design description. `check.mjs` now also flags section 9 phrases (open source, open protocol and interoperability, Apple Silicon, availability, offline and internet, privacy and verification, install ease) without a limiting word |
| Native Mobile Safari (2026-10-22) | Attempted with engineering's clearance: iPhone 17 Pro simulator, iOS 26.5. It is inconclusive, not passed. Under load (average up to about 63, Mac swapping), both URL opens timed out, and the page had not rendered when the agreed 10-minute window closed. The simulator was shut down at 21:02:54. Retry when engineering says the Mac is clear |
| Name (owner, 2026-10-22) | The project is UCompute; Common is the former name. Prose, the footer, the docs naming note and the architecture diagram now say UCompute and "formerly called Common". Literal identifiers the development builds still use stay as they are until the code is renamed: the `common` command, `Common.app`, the `Common` data folder and `X-Common-Target` |
| Engineering answers (2026-10-22) | Milestone badges M0–M14 replaced by list position 1–15, and the check now also fails on M-numbers (except "Apple M2"). App step text made UI-neutral: no screen names such as Peers, Nearby, Run on or Models view, because tonight's run drives the daemon APIs and certifies no UI flow. The Remote label stays Experimental; Mac-to-Mac stays outside the gate; ledger counts wait for the final snapshot |

Results on the local preview build: `npm test` passes in all three modes. axe-core 4.10.2 (wcag2a/aa, 21a/aa, 22aa, best-practice) reports 0 violations on 19 pages at 1440, 768 and 375 px (57 page views), before and after the follow-up. There is no horizontal overflow at 1440, 768, 375 or 320 px.

## 2026-10-22: repository links removed from the public page (live)

Owner approved 2026-10-22, following capability snapshot 2026-10-22 section 9 (no repository link while the source is unpublished). Commit 3574e43 on `main` removes the GitHub header and footer links and the structured-data `sameAs`, and added "source not yet published" to the footer. The owner asked for a links-only change, so commit 1267b34 restores the footer to "Apache-2.0 licensed."; compared with 2dc0aed, the prelaunch source now differs only by the removed links. `check.mjs` now fails on any `github.com` link in the prelaunch build; a test with an injected link confirmed it fails. Cloudflare Pages builds: success for both commits.

| Check | Result |
|---|---|
| `node verify-live.mjs` plus the new deployment (62fa94b0), `main` and `preview` aliases, after 1267b34 | 36/36 pass: 200 prelaunch page, CSP, HSTS, no analytics beacon, full-site paths 404, http and www redirects, every preview and pages.dev alias 302 to Access with no content |
| `github` on ucompute.org and its 404 page | 0 occurrences; live links are `#main`, `/` and preview.ucompute.org |
| Footer | "© 2026 UCompute project. Apache-2.0 licensed." (unchanged from 2dc0aed) |
| Desktop (1024 px) and phone (375 px) | No horizontal overflow; the header keeps the brand and "Team preview" |

## 2026-10-21: final QA (cross-browser, denied email, economics refresh)

Evidence: `docs/evidence/2026-10-21-qa/` (compressed screenshots, `xbrowser-results.json`, `live-verify.txt`).

Environment: macOS 26.2 on an Apple M2, Playwright 1.49.1. Public pages were tested live on ucompute.org. Private pages were tested on a local preview-mode build of a3ac99a, which is the commit deployed to `preview` (Cloudflare Pages check run: success).

| Engine | Version | Desktop | Mobile |
|---|---|---|---|
| Chrome (installed, driven by Playwright) | 155.0.8059.85 | 1440×900 | Pixel 7 emulation (412×915, touch, mobile UA) |
| Firefox (Playwright build) | 132.0 | 1440×900 | 390×844 viewport only (Playwright cannot emulate mobile Firefox) |
| WebKit (Playwright build) | 18.2 | 1440×900 | iPhone 13 emulation (390×844, touch, iOS UA) |

Playwright WebKit is Safari's engine, but it is not Safari. Native Safari on macOS and Mobile Safari on iOS were not tested. An iOS Simulator run was started but stopped because it hung while the Mac was heavily loaded by the engineering acceptance tests.

| Check | Result in all six runs |
|---|---|
| ucompute.org | 200, prelaunch page, no horizontal overflow |
| `www.ucompute.org/docs/?q=1` | Redirects to `https://ucompute.org/docs/?q=1` |
| `ucompute.org/docs/` | 404 |
| preview.ucompute.org with no session | Lands on `sparkling-brook-03de.cloudflareaccess.com` |
| 18 private pages | 200, no horizontal overflow |
| Code tabs | Switch panels |
| Mobile menu | Opens; Escape closes it |

Console errors:
- Chrome: one, on Cloudflare's own Access login page (its CSP blocks a `data:` SVG). Nothing from this site.
- Firefox: none.
- WebKit: one report on ucompute.org, "Refused to apply a stylesheet ... style-src". It did not reproduce in three replays, and the served HTML has no inline style. Recorded as not reproducible.

| Other check | Result |
|---|---|
| Denied email | An address not on the allowlist was entered on preview.ucompute.org and on preview.ucompute-website.pages.dev. Access showed its usual "code sent" page, which it shows for every address, and no code arrived. The screenshots show the tester's address, so they are kept outside the repository |
| `node verify-live.mjs` with hash and branch aliases | 42/42 pass |
| Economics refresh (a3ac99a, from spec ae552bf section 26.5, D-019) | `/vision/#economics` is labelled Planned with "Not started", quotes the owner's model verbatim, and says "None of this exists yet" and "No cryptocurrency". The home headline is described as a design goal, not achieved isolation. The production prelaunch page is unchanged |

## 2026-10-19: deployment verification (live)

| Check | Result |
|---|---|
| `node verify-live.mjs` plus hash and branch aliases | All checks pass: public routing, HTTPS and www redirect, complete-site paths 404 publicly, every private address 302 to Access without a session |
| Authorized access (owner signed in with the PIN) | All 18 private pages 200 (404 page 404), noindex meta and header, robots Disallow, no console errors |
| Live equals source | SHA-256 of 8 live files equals the local build of the deployed commit |
| Live public accessibility | axe-core 0 violations at 1440 and 390 px and on the 404 |
| Third-party requests on ucompute.org | None, after disabling Cloudflare's injected Web Analytics beacon with a Configuration Rule |
| Final local suite on the deployed commit | 57 page views 0 axe violations; no overflow 320–1440 px; menu, tabs, copy, skip link, reduced motion pass; no console errors |

Full report: `docs/REPORT-2026-10-19.md`.

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
- Browsers tested: Chrome, Playwright Firefox 132 and Playwright WebKit 18.2 on macOS (2026-10-21); Playwright Chromium 156, Firefox 157 and WebKit 27.2 headless on Ubuntu 26.04 (2026-10-23). Native Safari, Mobile Safari on a device or simulator, the Firefox app, Windows and Android were not tested.
- Lighthouse was not run; no performance scores are claimed. Page weight is small (one stylesheet, under 10 kB of script, four self-hosted fonts).
