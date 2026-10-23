# ucompute.org

One source, two websites:

| Hostname | What it serves | Build mode | Who can see it |
|---|---|---|---|
| `ucompute.org` | The public prelaunch page | `prelaunch` | Everyone, indexed |
| `preview.ucompute.org` | The complete website, plus `/prelaunch/` for review | `preview` | Only allow-listed emails, through Cloudflare Access; noindex |

A third mode, `public`, builds the complete website for the public domain. It is used only when the owner approves launch (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

The output is static HTML, CSS and a little JavaScript. There are no runtime dependencies, no npm packages, no server and no database. The build is `build.mjs` (Node standard library only) and the checks are `check.mjs`.

## Develop

```bash
npm run dev          # builds the complete site and serves it on http://127.0.0.1:4173
npm test             # builds all three modes and checks them
npm run test:links   # also fetches every external link
```

Requires Node 20 or newer, and Python 3 for the local server.

`npm test` fails on: identifiers, commits or private addresses in rendered text, section 9 phrases without a limiting word, unknown claim markers, broken internal links or anchors, missing title, description, canonical or `<h1>`, inline styles, scripts or event handlers (the Content-Security-Policy blocks them), unfilled `{{placeholders}}`, images without `alt` or dimensions, broken ARIA references, any file in the public prelaunch build that isn't on its allow-list, a preview page without `noindex`, invalid structured data, anything that looks like a secret, and any command, flag, route, error code or environment variable that the engineering source does not have (see Interfaces).

## Layout

```
build.mjs            layout, navigation, sitemap, robots.txt, _headers, per-mode output
check.mjs            validation of the built output
src/pages/           the complete site; each file starts with a front-matter comment
src/prelaunch/       the public page and its 404
public/              copied as-is: assets/ucompute.css (the design system), site.js, home.js, prelaunch.js, fonts, images
reference/           claims.json (the claim map), the original concept site, its renders, the OG image source, implementation facts
docs/                deployment, release procedure and verification records
```

A page file looks like this:

```html
<!--
title: Roadmap
description: One or two sentences for search and social previews.
layout: docs            (optional: "docs" adds the docs sidebar, "bare" means the page supplies its own chrome)
-->
<div class="page-hero shell">…</div>
```

`{{brand}}` and `{{preview}}` are filled in by the build. Front matter can add `scripts: site home` to load more scripts from `public/assets/`.

### Claims

Every capability statement carries a `{{claim:ID}}` marker that resolves in `reference/claims.json` to its snapshot row, requirement IDs, evidence file and commit. The marker renders as nothing, and an unknown ID fails the build. Wording that waits on an engineering run goes in `{{if:acceptance}}…{{else}}…{{/if}}`; the first branch renders once `gates.acceptance` is true. While the source is unpublished, identifiers stay out of rendered pages, and `check.mjs` enforces it.

### Interfaces

`reference/interfaces.json` is exported read-only from the engineering repository: every CLI command and flag, HTTP route, error code with its status, and environment variable. Refresh it with `COMMON_REPO=<path> COMMON_REF=<commit> npm run interfaces:update`. `/docs/cli/` is rendered from it, with website wording for empty help text in `reference/cli-notes.json`. The build fails on a stale or missing note, and `check.mjs` fails on anything a page names that the export lacks.

### Browsers

`tools/browsers.mjs <dist> [shots]` checks every page in Chromium, Firefox and WebKit at 1440 and 390 px: errors, failed requests, overflow and axe WCAG 2.2 AA. On the home page it also checks the motion rules (animates, stops when paused or under reduced motion, static field without WebGL). It needs `playwright` and `axe-core` installed next to it, so it runs on a test host rather than in `npm test`; see `docs/VERIFICATION.md`.

### Motion

`public/assets/home.js` runs the home page's WebGL device fabric, scroll story and header switch. `site.js` draws the instruments (ledger grids, scales), drives the scroll parallax (`.orbit`, `[data-parallax]`) and the "Pause motion" control. Every moving piece rests in a complete, readable state without JS, without WebGL, under `prefers-reduced-motion`, or when paused.

## Content rules

Every product claim must match the engineering capability snapshot (`docs/capabilities/` in the engineering repository; the current one is named in `reference/claims.json`). In particular:

- The Mac and Windows demonstration is remote execution of a whole request on one other machine. It is not pooling or model partitioning. Never imply that one model has been split across devices until the evidence says so.
- The 508 and 910 tokens per second figures were measured with stories15M, a 15-million-parameter test model. Always name the model when showing them.
- There is no public release. Don't link internal test builds as downloads.
- Use the status vocabulary defined on `/roadmap/#status-labels`. Unbuilt work is "Planned", never "coming soon".
- The live prelaunch page is frozen (D-023); see docs/DEPLOYMENT.md before merging into `main`.
- Open defects stay listed as open until engineering evidence shows them fixed.

`reference/implementation-facts.md` records the exact commands, flags, routes and error codes the docs were written against, with the source commit. When the engineering repository changes, diff against it and update the pages.

## Deploy

Cloudflare Pages, connected to this repository. Pushes to `preview` (and any other non-production branch) build the complete site behind Cloudflare Access; pushes to `main` build only the prelaunch page. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Licenses

Code and content: Apache-2.0. Fonts: DM Sans, DM Mono and Space Grotesk, SIL Open Font License 1.1 (texts in `public/assets/fonts/`).
