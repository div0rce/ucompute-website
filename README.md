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

`npm test` fails on: broken internal links or anchors, missing title, description, canonical or `<h1>`, inline styles, scripts or event handlers (the Content-Security-Policy blocks them), unfilled `{{placeholders}}`, images without `alt` or dimensions, broken ARIA references, any file in the public prelaunch build that isn't on its allow-list, a preview page without `noindex`, and anything that looks like a secret.

## Layout

```
build.mjs            layout, navigation, sitemap, robots.txt, _headers, per-mode output
check.mjs            validation of the built output
src/pages/           the complete site; each file starts with a front-matter comment
src/prelaunch/       the public page and its 404
public/              copied as-is: assets/ucompute.css (the design system), site.js, prelaunch.js, fonts, images
reference/           the original concept site, its renders, the OG image source, implementation facts
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

`{{github}}`, `{{github-icon}}`, `{{brand}}` and `{{preview}}` are filled in by the build.

## Content rules

Every product claim must match the engineering evidence in the project repository (`div0rce/ucompute`). In particular:

- The Mac and Windows demonstration is remote execution of a whole request on one other machine. It is not pooling or model partitioning. Never imply that one model has been split across devices until the evidence says so.
- The 508 and 910 tokens per second figures were measured with stories15M, a 15-million-parameter test model. Always name the model when showing them.
- There is no public release. Don't link internal test builds as downloads.
- Use the status vocabulary defined on `/roadmap/#status-labels`.
- Open defects stay listed as open until engineering evidence shows them fixed.

`reference/implementation-facts.md` records the exact commands, flags, routes and error codes the docs were written against, with the source commit. When the engineering repository changes, diff against it and update the pages.

## Deploy

Cloudflare Pages, connected to this repository. Pushes to `preview` (and any other non-production branch) build the complete site behind Cloudflare Access; pushes to `main` build only the prelaunch page. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Licenses

Code and content: Apache-2.0. Fonts: DM Sans, DM Mono and Space Grotesk, SIL Open Font License 1.1 (texts in `public/assets/fonts/`).
