# Launch checklist for the complete site

Status on 2026-10-30. The live page at ucompute.org stays frozen (D-023) until the owner authorizes a public launch. Everything below is on `stage-snapshot`, behind Access.

**Website priority:** be able to publish an engineering-approved build to invited testers the same day it is approved. The pipeline is rehearsed: alpha releases render and ship only behind Access, and each hosted file is verified against its recorded hash (`docs/DEPLOYMENT.md`, "Publishing a download").

**Published:** UCompute 0.1.1 private-alpha candidate 2 has been on the stage-snapshot alias behind Access since 2026-10-30, approved by the owner in writing and recorded by engineering as D-031 (ee56ffa). The owner manages the cohort through the Access policy; preview.ucompute.org and production are unchanged. The deployed file matches its recorded size and SHA-256 (`docs/VERIFICATION.md`).

**Withdrawn:** UCompute 0.1.0 private-alpha candidate 1 was published to the owner's cohort (the owner's two emails) on the stage-snapshot alias on 2026-10-29, behind Access, approved by D-025 with the cohort the owner named in writing. The owner confirmed it the same day ("Yes, it works"), relayed to engineering verbatim. D-030 withdrew it on 2026-10-29, because its file and the app inside it carried the project's earlier name: the file is gone from the site, and its record stays in `reference/releases.json` as withdrawn. The download page said the next build was being prepared until 0.1.1 replaced it on 2026-10-30, under its own promotion record and the owner's approval of its SHA-256 (above). On 2026-10-29 the owner said no further testers are available for now ("what i have is all i got for now"), so the private-alpha cohort stays the owner alone. The stage's five-tester target is open, with no date. This file uses the current names; the original text is in git history (D-030).

**Dependencies, in order:**
1. Engineering: a release promotion record for a private-alpha build (artifact, size, SHA-256, signing status). Done for candidate 2: 3470f8d (source 7d4d194, packaged-app check ALL PASS 19/19). The DMG is about 6 MB, hosted on Pages.
2. Owner: approval to publish that build, and the testers' emails on the Access policy (Cloudflare Zero Trust is the owner's). Done for candidate 2: D-031, 2026-10-30; the owner manages the policy directly.
3. Website: add the record and file, publish behind Access, verify. Done for candidate 2 the same day, on the stage-snapshot alias; `preview` is left alone, as D-031 requires.
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
| Final capability snapshot | Claims follow draft 3 (f052074). On the final snapshot: update `reference/claims.json`, resolve the `acceptance` gate items, and merge `stage-snapshot` into `preview` (`docs/DEPLOYMENT.md`, "Claims and the capability snapshot") |
| Version 0.1.1, candidate 2 (engineering promotion record 3470f8d, source 7d4d194, SHA-256 c1166ba9…b937, 6,425,890 bytes) | Published 2026-10-30 on the stage-snapshot alias behind Access, approved by D-031 (ee56ffa): the download page links the disk image with its checksum and install notes (replacing candidate 1 per D-029), `npm run verify:release` matches its size and SHA-256, and public and prelaunch builds contain no release files. preview.ucompute.org and production are unchanged; the owner manages the cohort through the Access policy. Pooled inference's options and fields stay off the CLI and API pages until the WP-04 verdict |
| Linux headless install (engineering milestone C, met 2026-11-01 at d3b178b; records fd13aa1 and 856c41b) | Nothing on the site changes yet: both results are SINGLE-HOST (one Linux machine), which D-032 does not make claimable, and the tarball is unsigned and not distributed (a release is the owner's decision). Every page still says Linux is planned. On the final snapshot or a Linux release, revisit the Linux rows and sentences on `/download/`, `/docs/install/`, `/start/`, `/faq/`, `/product/`, home and `/roadmap/` ("no Linux app, package or installer") |
| Test hosts free ("Mac clear", "sentinel clear") | Both suites ran in the sentinel window on 2026-10-23. Rerun before a launch |

## Website work before a launch

| Item | Status |
|---|---|
| Lighthouse scores for every page, mobile and desktop | Rerun 2026-10-29 after draft 3 and the release pipeline: performance 99 to 100 (mobile) and 100 (desktop); accessibility, best practices and SEO 100; CLS 0. Rerun after the final snapshot |
| Chromium, Firefox and WebKit on every page | Passed again 2026-10-29, all 22 pages; rerun after the final snapshot |
| Human checks: VoiceOver, native Safari on macOS and iOS, the Firefox app | Not done; they need a person at a device |
| Prelaunch page unchanged | Checked after every shared change (HTML identical to production apart from asset hashes) |
