# Deployment

## Architecture

One Cloudflare Pages project, `ucompute-website`, connected to this GitHub repository. Which site a deployment contains is decided by one environment variable, and the build defaults to the public prelaunch page when it is missing.

| Pages environment | Branch | `UCOMPUTE_SITE` | Serves | Hostnames |
|---|---|---|---|---|
| Production | `main` | `prelaunch` | The public prelaunch page only | `ucompute.org`, `ucompute-website.pages.dev` |
| Preview | `preview` and any other branch | `preview` | The complete site, noindex, plus `/prelaunch/` for review | `preview.ucompute.org`, `preview.ucompute-website.pages.dev`, `<hash>.ucompute-website.pages.dev`, `<branch>.ucompute-website.pages.dev` |

Build settings: build command `npm run cf-build` (build, then `check.mjs` on the output, so a failing check fails the deployment), output directory `dist`, root directory empty. `NODE_VERSION` is 24 for Preview (passed) and 22 for Production; move Production to 24 at the next production change.

Why one project rather than two: a single Git connection and build configuration, and the security boundary is still at Cloudflare's edge. The production build physically contains only the prelaunch files (`check.mjs` enforces an allow-list), so the production `pages.dev` address is safe to leave public. Every non-production address is behind Access.

## Access control

Cloudflare Zero Trust, Access, with the One-time PIN login method. One reusable policy, **UCompute team**: action Allow, include these emails:

- moustafa.nasr@rutgers.edu
- mn801@scarletmail.rutgers.edu

Everyone else is denied: Access denies by default when no Allow policy matches.

Two Access applications use that policy (team domain `sparkling-brook-03de.cloudflareaccess.com`):

1. **UCompute preview site**: self-hosted application for `preview.ucompute.org`. Login method One-time PIN only, instant authentication, 24-hour session.
2. **ucompute-website - Cloudflare Pages**: created by Pages, Settings, General, Preview access ("Restrict previews"), for `*.ucompute-website.pages.dev`. Its default policy (one Cloudflare account member) was removed and replaced with the UCompute team policy. Login method One-time PIN only. This covers every hash URL and branch alias, including `preview.ucompute-website.pages.dev` and `main.ucompute-website.pages.dev`.

The Cloudflare Workers and Pages GitHub app is installed on `div0rce` with access to `div0rce/ucompute-website` only.

`noindex` (meta tag, `X-Robots-Tag` header and `robots.txt`) is set on the preview as well, but Access is the protection; `noindex` only keeps search engines quiet.

## DNS

| Name | Type | Target | Proxied | Purpose |
|---|---|---|---|---|
| `ucompute.org` | CNAME (flattened) | `ucompute-website.pages.dev` | Yes | Created by Pages when the custom domain is added |
| `preview` | CNAME | `preview.ucompute-website.pages.dev` | Yes | Pages custom domain, retargeted to the `preview` branch alias. Must stay proxied, or Cloudflare serves production instead |

## Zone rules

| Rule | Type | What it does |
|---|---|---|
| www.ucompute.org to ucompute.org | Single Redirect | `http*://www.ucompute.org/*` → `https://ucompute.org/${2}`, 301, query string preserved. Needs the proxied placeholder record `www A 192.0.2.1` |
| No analytics injection | Configuration Rule, all requests | Disable Real User Monitoring. Cloudflare had started injecting its Web Analytics beacon into HTML responses; the site uses no third-party analytics (spec section 29.5) |

## Everyday workflow

1. Work on the `preview` branch, or on a feature branch.
2. Push. Cloudflare builds and runs the checks. A feature branch appears at `<branch>.ucompute-website.pages.dev`; `preview` appears at `https://preview.ucompute.org`. Both need the email PIN.
3. Review there, including `/prelaunch/` if the public page changed.
4. To change the public page: open a pull request from `preview` into `main` and merge it once the owner approves. Production rebuilds in `prelaunch` mode, so merging never exposes the complete site.

Run `npm test` before pushing; the Cloudflare build runs the same checks on the mode it builds.

## Claims and the capability snapshot

Every capability statement on a page carries a `{{claim:ID}}` marker that resolves in `reference/claims.json` to its snapshot row, requirement IDs, evidence file and commit. The build strips the markers and fails on an unknown ID. `check.mjs` fails if an identifier, commit, milestone number or private address reaches a rendered page, and if a section 9 phrase appears without a limiting word in the same sentence. Wording that waits on an engineering run sits in `{{if:gate}}…{{else}}…{{/if}}`; the first branch renders only once that gate is `true` in `claims.json`.

When engineering publishes a new snapshot:

1. On `stage-snapshot` (or a fresh branch from `preview`), read the snapshot's diff against the one named in `claims.json` → `snapshot`.
2. Update each affected row in `claims.json`, and the page text that cites it. Update ledger counts on home and the roadmap only from the snapshot's own commit.
3. For every gated item the snapshot marks "confirmed fixed", keep its first branch and adjust the wording to what was confirmed. For every item still open, move it out of the gate so it keeps its current text. Then set the gate to `true`, or delete the gate markers.
4. Set `claims.json` → `snapshot` to the new file and commit.
5. `npm test`, then push; review the branch alias behind Access.
6. Merge into `preview`; check `preview.ucompute.org` and run `node verify-live.mjs` with the new deployment aliases.

## The live prelaunch page is frozen (D-023)

ucompute.org must keep rendering exactly as it does at production commit 1267b34 until the owner decides otherwise. The prelaunch page and its 404 share `assets/ucompute.css` with the full site, so any merge into `main` before launch must keep them identical:
- new styles must be scoped to full-site markup (for example `main>.notfound`, never bare `.notfound`);
- shared rules (`:root`, `body`, `.btn`, `.shell`, `.pl-*`) must not change;
- compare screenshots of `/` and `/404.html` in prelaunch mode against production before merging.

## Publishing a download

`check.mjs` fails on any link to an installer or archive (`.dmg`, `.exe`, `.msi`, `.pkg`, `.zip`, `.AppImage`, `.deb`, `.rpm`), so nothing can be offered for download by accident. A download goes on the site only after engineering's release promotion record approves that exact artifact. That record gives the file name, size, SHA-256, signing and notarization status, and the approving commit. Then:

1. Add the release to `reference/releases.json`. A release needs:
   - its version, stage and date;
   - the engineering promotion record and the date the owner approved publishing;
   - for each artifact: platform, file name, https URL, size in bytes, SHA-256 and signature status.

   The build renders it in "Release information" on `/download/`, and refuses a record with a missing or malformed field.
2. `check.mjs` allows installer links only to those exact URLs, and keeps failing on every other one.
3. Update the release-status rows and the claims in `reference/claims.json`, then follow the snapshot steps above.

Tested on 2026-10-23 with a temporary record: a complete one renders and its link passes, while a short hash or a missing owner approval fails the build. The file ships empty.

## Launching the complete site publicly

Only with the owner's explicit approval, after the items in `docs/LAUNCH.md` are closed.

1. Merge `preview` into `main`.
2. Pages, Settings, Environment variables, Production: set `UCOMPUTE_SITE=public`.
3. Retry the latest production deployment (or push to `main`).
4. Check `https://ucompute.org/` shows the complete site, `robots.txt` allows indexing, and no page carries `noindex`.
5. Keep `preview.ucompute.org` and its Access applications for future previews.

To roll back, set `UCOMPUTE_SITE=prelaunch` and retry the deployment, or use Pages' rollback to the previous production deployment.

## Verifying access after any change

```bash
for u in https://preview.ucompute.org/ https://preview.ucompute-website.pages.dev/ https://<hash>.ucompute-website.pages.dev/; do
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "$u"
done
```

Every line must show `302` to `*.cloudflareaccess.com`, or `403`. `https://ucompute.org/` and `https://ucompute-website.pages.dev/` must return `200` with the prelaunch page and no complete-site paths (`/docs/` must be 404).
