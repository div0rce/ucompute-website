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

## Workstreams and hand-offs

Since 2026-11-06 this workstream is Website & Developer Experience (DevEx), responsible for the complete journey from discovery through installation, first inference, device connection, API learning, troubleshooting and developer integration. Its permanent charter, measures, release boundaries and roadmap are in `docs/DEVEX.md`, and Program Control reads readiness and open requests there. Engineering still owns the APIs, SDK implementations, runtime and installers. Growth still owns acquisition and campaigns, and its material still enters through the review below. Nothing here changes who approves a release, a cohort or a launch.

Since the owner's announcement of 2026-10-30, UCompute has four workstreams: Engineering (product, integration, security, testing, releases), Core Lab (distributed-computing research, benchmarks, verification), Website (this repository: the site, documentation, downloads, Cloudflare and the release gates) and Growth (marketing, positioning, technical content, community, developer adoption, growth analytics). Growth works in its own repository and environment. Website is its interface to the public product: Growth develops content and acquisition strategy, and Website integrates approved material into ucompute.org and keeps the implementation and deployment authority.

What Website hands over, in this repository and with no new infrastructure:
- approved public claims: `reference/claims.json` and the snapshot it names; nothing beyond it may be stated about the product;
- release information: `reference/releases.json` (approved artifacts, sizes, SHA-256) and `/download/`;
- verification evidence and the record of every deployed change: `docs/VERIFICATION.md`, newest first;
- the launch dependencies and their status: `docs/LAUNCH.md`.

What reaches Website from Growth is a request, never an approval. It is integrated only if it passes this repository's checks and content rules (`README.md`, "Content rules") and the owner's standing rules: the D-023 freeze, the D-030 names, no screenshots without the owner's approval, and no analytics (spec section 29.5; the zone rule that disables Cloudflare's beacon stays until the owner decides otherwise). Growth cannot change what this site deploys, expand the private-alpha cohort or the Access policy, publish unreleased source, or alter a release gate; those stay with the owner, engineering and this repository. For now, requests arrive as messages between the workstreams' sessions, with these files as the shared record, and each one acted on is logged in `docs/VERIFICATION.md`; a durable read-only channel (for example issues on this repository) is a later step, taken only if routine coordination needs it.

Engineering recorded the same change as D-032 (engineering 29c0c8e), with a hand-off section in its `docs/design/critical-path.md`. Its side of the hand-off, which this site reads for claims and releases: `docs/VERIFICATION.md`, `docs/PROGRESS.md`, the `VERIFIED` rows of `docs/REQUIREMENTS.csv` with their evidence, and the release decisions in `docs/DECISIONS.md`. Only a `VERIFIED` row is a claimable capability.

## Claims and the capability snapshot

Snapshot qualifiers live in `reference/claims.json` → `qualifiers` and are written `{{q:name}}` on pages, so a new snapshot changes each one in one place. Every capability statement on a page carries a `{{claim:ID}}` marker that resolves in `reference/claims.json` to its snapshot row, requirement IDs, evidence file and commit. The build strips the markers and fails on an unknown ID. `check.mjs` fails if an identifier, commit, milestone number or private address reaches a rendered page, and if a section 9 phrase appears without a limiting word in the same sentence. Wording that waits on an engineering run sits in `{{if:gate}}…{{else}}…{{/if}}`; the first branch renders only once that gate is `true` in `claims.json`.

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

`check.mjs` fails on any link to an installer or archive (`.dmg`, `.exe`, `.msi`, `.pkg`, `.zip`, `.AppImage`, `.deb`, `.rpm`) that is not a recorded artifact, so nothing can be offered for download by accident. A download goes on the site only after two approvals:
- engineering's release promotion record, which approves that exact artifact;
- the owner's approval to publish it.

The steps:
1. Add the release to `reference/releases.json`. A release needs:
   - its version, stage and date;
   - the engineering promotion record and the date the owner approved publishing;
   - for each artifact: platform, file name, URL (https, or `/releases/<version>/<file>` for a file hosted with the site), size in bytes, SHA-256 and signature status.

   The build refuses a record with a missing or malformed field.
2. Choose where the release appears:
   - Private alpha and developer alpha releases go to invited testers only. They render only on the preview build, behind Cloudflare Access; testers need their email on the Access policy.
   - Developer beta and stable releases render on every complete-site build.
3. Optionally host the files with the site, in `public/releases/<version>/<file>`, with the root-relative URL `/releases/<version>/<file>`, so the same record works on whichever alias serves the build (the stage-snapshot alias, preview.ucompute.org, or ucompute.org for a public stage).
   - A build copies those files only if it shows that release. A public build never contains alpha installers.
   - `check.mjs` fails if a hosted file's size or SHA-256 differs from its record.
   - Cloudflare Pages caps a single file at 25 MiB; larger installers need other storage, which is an owner decision.
4. `check.mjs` allows installer links only to the artifacts the build shows. `/download/` lists each artifact with its signature status and full SHA-256, and explains how to check the hash on macOS, Windows and Linux.
5. Update the release-status rows and the claims in `reference/claims.json`, then follow the snapshot steps above.

Rehearsed on 2026-10-24 with a temporary private-alpha record and a hosted test file:
- the preview build showed the release and shipped the file;
- the public build did neither;
- a public page linking the file failed the check;
- a wrong recorded SHA-256 failed the check.

### Candidate 2 published to the stage-snapshot alias (2026-10-30)

The owner approved UCompute 0.1.1 private-alpha candidate 2 in writing, and engineering recorded it as D-031 (ee56ffa): the exact disk image (SHA-256 `c1166ba9…b937`, 6,425,890 bytes), to the existing private-alpha channel, the stage-snapshot alias behind Access, with preview.ucompute.org and production unchanged. The owner named no cohort and manages it through the UCompute team Access policy, so `approval.cohort` cites that record and no Access change was requested.

The disk image is in `public/releases/0.1.1/`, and the preview build at ce71dc1 links and ships it; public and prelaunch builds contain no `releases/` folder. Deployed checks: `npm run verify:release` and `node verify-live.mjs` (`docs/VERIFICATION.md`). An approval is read from the engineering repository's `docs/DECISIONS.md` with `git show`, never from a relayed message.

### Candidate 1 withdrawn (2026-10-29)

D-030 withdrew candidate 1 the day it was published, because its file and the app inside it carried the project's earlier name. Its record in `reference/releases.json` keeps the version, approvals, size and SHA-256, adds `withdrawn`, and has no file name or URL. A withdrawn release never renders, never ships a file and never counts as approved (`build.mjs`, `verify-live.mjs`, `tools/verify-release.mjs`). The disk image is gone from `public/releases/`, and the preview download page says the next build is being prepared. The sections below use the current names; the original text is in git history.

### Candidate 1: published to the owner on the stage-snapshot alias (2026-10-29)

On 2026-10-29 the owner named the cohort in writing: "only my own two emails, moustafa.nasr@rutgers.edu and mn801@scarletmail.rutgers.edu. Use the stage-snapshot link; leave preview.ucompute.org alone." Both emails already form the whole UCompute team Access policy, so no Access change was needed.

The DMG is in `public/releases/0.1.0/`, and `approval.cohort` records the owner's cohort, which has been relayed to engineering to amend D-025.
- Only preview-mode builds contain the file, at `/releases/0.1.0/` (the disk image). It is reachable on the `stage-snapshot` alias behind Access.
- `preview.ucompute.org` (the `preview` branch) and production are unchanged.
- Public and prelaunch builds contain no `releases/` folder, and the prelaunch tree still matches production.

### Candidate 1 (2026-10-24): staged, awaiting the owner

`reference/releases.json` holds UCompute 0.1.0 private-alpha candidate 1, from engineering's promotion record (engineering 0b0c1a4, source 3379fe9): a macOS disk image of 6,306,797 bytes, SHA-256 `a3239588cfd925d51aeb4bb39a592a49433d9bce7cd9421abe9d7f38fce5dd6d`. The size and hash were re-checked on this Mac against engineering's `SHA256SUMS`.

The owner approved the artifact: D-025 in engineering's `docs/DECISIONS.md`, commit 6ce7e90. `approval.owner` records it. `approval.cohort` stays empty until the testers are named, so the preview build shows "Approved; waiting for the testers to be named", with no download link and no file in any build. The public build shows nothing.

To publish once the owner names the testers, and engineering amends D-025 with them:
1. Set `approval.cohort` to the amended entry, its commit and the date.
2. Copy the DMG from `~/UCompute-release-candidates/0.1.0-3379fe9/` to `public/releases/0.1.0/`.
3. Run `npm test`; the check verifies the copied file's size and hash.
4. Put the testers' emails on the Access policy (owner).
5. Merge `stage-snapshot` into `preview`, push, and run `node verify-live.mjs`.

Rehearsed locally on 2026-10-24 with the real DMG:
- the preview build linked and shipped it, with a matching hash;
- the public build did neither;
- both checks passed.

The rehearsal was then undone; nothing was committed or uploaded.

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
