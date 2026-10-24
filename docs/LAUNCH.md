# Launch checklist for the complete site

Status on 2026-10-24. The live page at ucompute.org stays frozen (D-023) until the owner authorizes a public launch. Everything below is on `stage-snapshot`, behind Access.

**Website priority:** be able to publish an engineering-approved build to invited testers the same day it is approved. The pipeline is rehearsed: alpha releases render and ship only behind Access, and each hosted file is verified against its recorded hash (`docs/DEPLOYMENT.md`, "Publishing a download").

**Dependencies, in order:**
1. Engineering: a release promotion record for a private-alpha build (artifact, size, SHA-256, signing status). This depends on engineering's release-blocking work: the Windows post-fix run and the app-window steps in snapshot draft 3, section 10.
2. Owner: approval to publish that build to named testers, and their emails on the Access policy (Cloudflare Zero Trust is the owner's).
3. Website: add the record and files, merge `stage-snapshot` into `preview`, verify behind Access. Same day.
4. Engineering: the final capability snapshot. The website then swaps claims and reruns browsers and Lighthouse.
5. Owner: publishing the source, a tested security contact, trademark clearance and launch authorization, for a public launch.

## Waiting on the owner

| Item | Why it blocks a launch |
|---|---|
| Publish the source | Install, Run, Mesh, Troubleshooting and Start describe development builds, and each docs page says the source is unpublished. Contribution is planned for after publication |
| A tested private security route and a named responder | The security policy requires both before any external beta. GitHub private vulnerability reporting is off on the engineering repository |
| Naming and trademark clearance for UCompute | The footer says clearance is open |
| Authorize the public launch | Then: merge `preview` into `main`, set Production `UCOMPUTE_SITE=public`, redeploy, and run `verify-live.mjs` with the public expectations (`docs/DEPLOYMENT.md`) |

## Waiting on engineering

| Item | What the site does now |
|---|---|
| Final capability snapshot | Claims follow draft 2 (e4ed731). On the final snapshot: update `reference/claims.json`, resolve the `acceptance` gate items, and merge `stage-snapshot` into `preview` (`docs/DEPLOYMENT.md`, "Claims and the capability snapshot") |
| An approved release (release promotion record) | `/download/` offers nothing. `reference/releases.json` is empty; adding a complete record publishes it (`docs/DEPLOYMENT.md`, "Publishing a download") |
| CLI help strings using claim 8's wording | `reference/cli-notes.json` overrides `common privacy` and `local-only`; drop both overrides after re-exporting at the fixing commit |
| Test hosts free ("Mac clear", "sentinel clear") | Both suites ran in the sentinel window on 2026-10-23. Rerun before a launch |

## Website work before a launch

| Item | Status |
|---|---|
| Lighthouse scores for every page, mobile and desktop | Done 2026-10-23: performance 97 to 100 (mobile) and 100 (desktop); accessibility, best practices and SEO 100 everywhere. Rerun after the snapshot swap |
| Chromium, Firefox and WebKit on every page | Passed on 2026-10-23 on the Linux test host, all 21 pages; rerun after the snapshot swap |
| Human checks: VoiceOver, native Safari on macOS and iOS, the Firefox app | Not done; they need a person at a device |
| Prelaunch page unchanged | Checked after every shared change (HTML identical to production apart from asset hashes) |
