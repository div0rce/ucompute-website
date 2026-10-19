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

## Launching the complete site publicly

Only with the owner's explicit approval, after the launch-readiness items in `docs/VERIFICATION.md` are closed.

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
