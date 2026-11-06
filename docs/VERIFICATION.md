# Verification record

> This record uses the current names. The builds and repositories it describes carried the project's earlier name; the original text is in this repository's git history (D-030).


## 2026-11-06: first-run guide verified on the approved build; this workstream becomes DevEx

The owner made this workstream Website & Developer Experience. Charter, measures and roadmap: `docs/DEVEX.md`.

State recovered first, unchanged by this entry: `main` 5446992, `preview` bd21b47, `stage-snapshot` 6bba842, `home-refresh` 2f75cdc. `node verify-live.mjs` with both aliases: 36 checks, all passed. `npm run verify:release`: the 0.1.1 disk image through Access, 6,425,890 bytes, SHA-256 `c1166ba9…b937`. Engineering's newest commit at that point was 1038a7f. The Access token file exists; the Cloudflare token file does not, so the prune stays with the owner.

Why this improvement: every path sent people to `cargo build` on unpublished source, while the approved disk image is the only thing anyone can get, and no page said it contains the `ucompute` command (`Contents/MacOS/ucompute`, seen by mounting the image read-only). That stops every invited developer at the first step of install, first inference and API use.

Delivered: `/docs/first-run/`, on builds that offer a private-alpha download only (`alpha: true`; `check.mjs` fails otherwise); pointers from `/start/`, `/docs/`, `/docs/install/`, `/developers/`, `/docs/troubleshooting/` and `/download/`; `tools/verify-first-run.mjs`, which runs the page's own code blocks; `reference/interfaces.json` re-exported at the 0.1.1 source 7d4d194 (32 commands, 34 routes, 27 error codes; one new field, `commit`, on `/health`).

The old handoff says the website team never starts a UCompute app or daemon. The owner's directive of this date requires verification in a supported environment, so the run was announced to the owner in chat and to engineering beforehand, and engineering declared the Mac clear after holding it for WP-04 P1. It used only the approved artifact, its own data folder and test ports 18510 and 18511, and no app window. No reserved port was bound and the default data folder was not touched. An earlier attempt was held back because P1 had just started on this Mac.

Run on this Mac (Apple M2, 8 GB, macOS 26.2), level L1, evidence in `docs/evidence/first-run-2026-11-06.json`: all 19 steps passed.
- Engine setup 2.2 s and the 491.4 MB model 14 s on this connection. First answer with `ucompute run` 13.1 s (6 s on the previous run, with less else running on the Mac).
- Service up in 1.4 s, `/health` reports 0.1.1, first answer through `curl` 9.5 s including the model load (3.3 s on the previous run). A model that is not downloaded returns `model_not_downloaded`.
- The official OpenAI Python client on Apple Python 3.9.6 (openai 2.48.0) and python.org 3.13.7 (openai 3.46.0), and the JavaScript client (openai 7.52.0), ran the page's code unchanged.
- The daemon stopped cleanly with nothing left running. The data folder is 522 MB and the app 13 MB.

Cold read, level L2, an agent given only the page and an installed copy; not a person and not user evidence.
- `curl`, JavaScript, the command line and Control-C worked from the page alone. It answered all five comprehension questions correctly, with quotes.
- Fixed from it: "only the base URL changed" was wrong, since the model and an API key string also change; the stuck list ignored `ucompute serve` and client errors; `ucompute doctor` does not report the service; nothing said to remove the alias line; `/docs/` still said version 0.1.0.
- Python failed, and that was the most important finding. Homebrew Python 3.14.8 cannot load `pyexpat` on this macOS, so `python3 -m venv` fails partway. The guide's block then went on to a bare `pip install`, which installs wherever `pip` first appears on PATH. My checker hid this because it put Apple's Python first. The block now calls the folder's own `pip`, so a failed folder installs nothing; the guide names the failure and the way out; the checker runs the block with every Python on the Mac and refuses a bare `pip`. These fixes are verified at L1, not re-read at L2.

Incident in that cold read: the agent's brief redirected HOME but not PATH, so the old block's bare `pip install openai` ran in the owner's `~/.platformio/penv` at 03:34. It added openai 3.46.0, httpx2 2.16.0, httpcore2 2.16.0 and truststore 0.10.5, and reinstalled idna 3.20 and jiter 0.18.0; their earlier versions were not captured. `pip check` is clean. The owner was told at once with the exact rollback command and ran it themselves the same day, removing the four added packages; idna and jiter stay at those versions, since the earlier ones are unknown. Afterwards `pip check` is clean, and requests, anthropic and platformio import. Cold reads now run with a restricted PATH (`docs/DEVEX.md`).

Not verified, and not claimed: anything through the app window, the Open Anyway path, and whether the bundled `ucompute` needs a second approval after it. Engineering confirms there is no evidence of a window-only first answer on an empty home (requirement still IMPLEMENTED_UNVERIFIED) and asks that the second approval be measured, not stated. The page says both. No measure has reached L3.

WP-04: engineering reports P1's first generating run passed at 1038a7f, with no verdict; nothing about pooling is claimable, and no page changed for it. Growth's docs-pages request (HO-005) is deferred to the next snapshot in `docs/LAUNCH.md`.

## 2026-11-02: home page refresh on its own branch preview

At the owner's direction, `home-refresh` (2f75cdc) carries the refreshed home page: full-screen hero with a WebGL particle brain, "How it works" steps, a closable preview notice, tighter sections, and smoother motion site-wide. The owner approved pushing it to a private preview; it has not been merged into `stage-snapshot` or `preview`.

Before and after the push:
- At a real 60 Hz (Energy Saver off), 4 s idle: frames over 20 ms went from 2 to 0, and main-thread rendering work on the home page from about 138 ms to about 7 ms per 2 s. Chrome's Energy Saver caps every site at 30 fps at or below 20% battery; the site cannot change that.
- `npm test` passes in all modes. D-023: the prelaunch tree and both pages match `origin/main` apart from asset hashes.
- Deployed: the alias serves the same asset hashes as the local build. `verify-live.mjs` with the alias passes, and the alias stops at Access. `verify:release` passes on it. Rendered through Access with no console errors.

Not done for this branch: the three-browser suite and Lighthouse, which are owed before any merge into `stage-snapshot`.

## 2026-10-30: candidate 2 (0.1.1) published to the stage-snapshot alias

The owner approved candidate 2 in writing in the engineering session, and engineering recorded it as D-031 (ee56ffa, 2026-10-30): `UCompute_0.1.1_aarch64.dmg`, 6,425,890 bytes, SHA-256 `c1166ba91cf07d0af7d57e3563a4f592b0de077fefc9e0725192aae38c42b937`, to the existing private-alpha channel, the stage-snapshot alias behind Access, with preview.ucompute.org and production unchanged. The owner named no cohort and manages it directly through the Access policy, so no Access change was requested. The record was read from the engineering repository itself with `git show`, not taken from the relayed message.

On `stage-snapshot`, commit ce71dc1:
- The disk image was copied from `~/UCompute-release-candidates/0.1.1-7d4d194/` to `public/releases/0.1.1/`; its SHA-256 matches `SHA256SUMS` and D-031.
- `reference/releases.json`: `approval.owner` and `approval.cohort` cite D-031 and ee56ffa. The preview build links the file and drops the awaiting notice; public and prelaunch builds contain no `releases/` folder. The `_redirects` rule for candidate 1's URLs stays.
- `npm test` passes in all three modes (preview: 22 pages, 42 files; the hosted file's size and hash verified).
- D-023: the prelaunch tree built from this branch has the same files as one built from `origin/main`, and `index.html` and `404.html` are identical apart from the stylesheet's `?v=` hash. The stylesheet and the `_headers` cache lines differ as they did before this change, because the branch's build is ahead of `main`. `main` was not touched.

Deployed and checked at 05:49 UTC, GET only:
- The alias's `build.json` reports preview mode, commit ce71dc1, branch `stage-snapshot`.
- `npm run verify:release`: `/download/` through Access HTTP 200; the disk image HTTP 200, 6,425,890 bytes, SHA-256 `c1166ba9…b937`, matching the record.
- `node verify-live.mjs` with the alias: ucompute.org and ucompute-website.pages.dev serve the prelaunch page only and return 404 for the complete site; every other address, including the alias and the file URL, redirects to Access from outside; through Access the file matches its record. All checks passed.
- `preview` (bd21b47) and `main` (5446992) are unchanged, as D-031 requires.

Independent re-check, then fixes (commit 4441b78):
- Five independent reviewers each tried to refute the publication (the record against D-031 and the artifact; the rendered pages against the content rules; the production freeze and branch heads; the live hosts from outside and through the project's tools; these records against primary sources), and two further reviewers reproduced and judged each finding. Nine findings: four confirmed, five refuted.
- Confirmed and fixed. `/download/` said "Current version 0.1.0", the withdrawn candidate, above the 0.1.1 link; it now says "Development builds only. No binary is offered for public download." `/download/` and `/vision/` said "No stage has started", and the private-alpha stage was pilled "Not started", on the page that publishes a private-alpha build; they now say the private alpha is under way with invited testers and no stage has met its targets, the pill is "In progress", and the `release-stages` claim cites D-025 (amended) and D-031 rather than "no cohort started". `docs/LAUNCH.md` still said the download page showed "being prepared" and that 0.1.1 would replace candidate 1 only after approval. `docs/DEPLOYMENT.md` and the `about` text in `reference/releases.json` said artifact URLs are https, while the record uses `/releases/<version>/<file>`, which `build.mjs` accepts; both now say so, and the `about` gate names both approval fields.
- Refuted, left as they are: the dated candidate 1 records in the present tense; the 0.1.1 row under "Waiting on engineering" (its one open item is the WP-04 verdict); the deployed-check time, which GitHub's check run confirms (the Pages build of ce71dc1 finished at 05:49:16 UTC, 24 seconds after the push).
- `npm test` passes in all three modes. D-023: the prelaunch tree and both pages still match `origin/main` apart from the `?v=` hash (neither edited page is in the prelaunch build). The local preview build was opened in a browser: the hero text, the pill and the file link render, with no console errors.
- Deployed at 11:04 UTC and checked through Access, GET only: `build.json` reports commit 4441b78; `/download/` and `/vision/` contain the new sentences and neither old one; `npm run verify:release` passes (HTTP 200, 6,425,890 bytes, SHA-256 `c1166ba9…b937`); `node verify-live.mjs` passes every check.

## 2026-10-29: candidate 2 (0.1.1) staged, awaiting the owner

Engineering's promotion record (3470f8d, source 7d4d194): `UCompute_0.1.1_aarch64.dmg`, 6,425,890 bytes, SHA-256 `c1166ba91cf07d0af7d57e3563a4f592b0de077fefc9e0725192aae38c42b937`, ad-hoc signed, not notarized; packaged-app check ALL PASS 19/19 on one Mac. Re-checked here: same size and hash, `SHA256SUMS` OK. `reference/releases.json` holds it with empty `approval.owner` and `approval.cohort`, so the preview build shows "Awaiting the owner's approval" with no link, and no build contains the file. Its install notes say how to replace candidate 1 (D-029: nothing deleted automatically, models downloaded again or kept only where checksums match, devices paired again once). `npm test` passes.
## 2026-10-29: D-030, no trace of the earlier name; candidate 1 withdrawn

The owner's decision D-030 (engineering 851f275) supersedes the plan to keep the earlier names until the next build. On `stage-snapshot`:
- Every page uses the current names: the `ucompute` command, `UCOMPUTE_*` variables, `X-UCompute-*` headers, `UCompute` and `ucompute` data folders, `ucompute-*` crates and the `ucompute-pair:v1:` payload. The earlier-name sentences, the FAQ answer and the plain word in our own text are gone. The demo record now uses the current names and carries one note saying the builds carried the earlier name.
- Candidate 1 is withdrawn. Its disk image is removed from `public/releases/`. Its record in `reference/releases.json` keeps the version, approvals, size and SHA-256, and adds `withdrawn`, without a file name. A withdrawn release never renders, ships a file or counts as approved. The preview download page says the next build is being prepared.
- The CLI and API reference is exported from engineering 851f275. Pooled inference's options and fields are kept off both pages by `null` entries in `reference/cli-notes.json` and the new `reference/api-notes.json`, until the WP-04 verdict. Each page says so in one sentence.
- Records in this repository use the current names, each with one note: this file, `DEPLOYMENT.md`, `LAUNCH.md`, the 19 October report, `reference/implementation-facts.md` and the concept-site copy. Git history keeps the originals, and the licence text is verbatim.
- `check.mjs` now fails if the word reaches any rendered page.

Results:
- `npm test` passes in all three modes.
- Built preview and public output contain no occurrence of the word, and no pooled-split option or field.
- The prelaunch tree matches production apart from asset hashes (D-023). The live page contains no occurrence.

Deployed, checked through Access with the service token (GET only):
- `stage-snapshot` (bd21b47) and `preview.ucompute.org`: twelve pages return 200, each with no occurrence and no pooled-split text. `/download/` shows the withdrawal, and `npm run verify:release` passes.
- Candidate 1's old URL still served the file from Cloudflare's edge cache (HIT, `s-maxage=604800`), while the deployment itself returned 404. Preview builds now write a `_redirects` rule, `/releases/0.1.0/* /download/ 302`, and the old URL returns 302 on both hosts.
- `preview` was fast-forwarded to `stage-snapshot`. The owner's earlier "leave preview.ucompute.org alone" kept candidate 1 off it; no build is offered there now, so it gets the same site.
- `main` (5446992): names only, in the full-site copies production never serves. `npm test` passes. The production build output is byte-identical to the deployed one, and the push skipped the Pages build. ucompute.org still serves the same asset hashes.
- The merged `rename-ucompute` branch was deleted. All three branches contain the word only in the verbatim licence.
- Not changeable from here, and reported to the owner: earlier Pages deployments at their hash addresses still hold the old text and candidate 1's file, behind Access. Removing them is a Cloudflare action on the owner's account. The Access service token's display name is the owner's to check. No other deployment name contains the word: the Pages project, both Access applications, the policy, the branches and `UCOMPUTE_SITE`.

## 2026-10-29: candidate 1's first-open note corrected for macOS 15 and later

The install note told testers to open the app from the Finder's context menu or with Open Anyway. Since macOS 15 (Sequoia), Apple no longer lets the context-menu Open get past Gatekeeper, and the tested Mac runs macOS 26.2. The note now gives one path: after the first refused open, System Settings › Privacy & Security › Open Anyway, then the password. Engineering has since checked the refusal itself (`spctl` rejects a downloaded copy, engineering 7e6b470), and the note cites that. Approving the app this way has still not been tried on a second Mac.
- Commit 7b17476. `npm test` passes. The prelaunch output differs from an `origin/main` build only in the stylesheet hash (D-023).
- Through Access, the deployed `/download/` page shows the new note. `npm run verify:release` passes again: HTTP 200, 6,306,797 bytes, SHA-256 `a3239588…dd6d`.
- Engineering was told, because its promotion record has the same context-menu wording.

## 2026-10-29: signed-in download of candidate 1 verified from the live deployment

The owner set up a Cloudflare Access service token for website checks. It is kept on this Mac at `~/.config/ucompute/access.env`, outside the repository. `npm run verify:release` (`tools/verify-release.mjs`) downloads every approved artifact through Access from a deployed site, and compares its size and SHA-256 with `reference/releases.json`.
- On the stage-snapshot alias, `/download/` returned HTTP 200 through Access. candidate 1's disk image returned HTTP 200, 6,306,797 bytes, SHA-256 `a3239588cfd925d51aeb4bb39a592a49433d9bce7cd9421abe9d7f38fce5dd6d`. That matches D-025.
- Negative check: against `https://ucompute.org` it fails, with 404 for the page and the file, as production must.

This closes the website's end-to-end proof for candidate 1: the deployed, Access-gated file is the approved artifact. The first launch and the Gatekeeper path on a second Mac remain with engineering.

## 2026-10-29: browsers and Lighthouse after draft 3 and the release pipeline

Run in engineering's sentinel window, 04:25 to 04:32 UTC, against stage-snapshot at 50ccabf. That build includes the snapshot draft 3 wording, the fix-round-6 API fields, the Questions page and the candidate 1 release on `/download/`.
- `tools/browsers.mjs`: all 22 complete-site pages at 1440 and 390 px in Chromium, Firefox and WebKit. No page or console errors, no failed requests, no horizontal overflow, 0 axe WCAG 2.2 AA violations. The mobile menu opens. The fabric animates in Chromium (21 frames a second) and WebKit (29). It shows 0 frames a second when paused or with reduced motion, and the static field without WebGL.
- `tools/lighthouse.mjs`, public build, 20 pages: mobile performance 99 to 100 and desktop 100. Accessibility, best practices and SEO are 100 everywhere, and CLS is 0 on every page.

## 2026-10-29: private-alpha candidate 1 delivered to its cohort

UCompute 0.1.0 private-alpha candidate 1 (the macOS disk image, 6,306,797 bytes, SHA-256 `a3239588cfd925d51aeb4bb39a592a49433d9bce7cd9421abe9d7f38fce5dd6d`) went to its cohort, the owner alone, on the stage-snapshot alias behind Access. It was published at a9c4166. Its approvals are engineering's D-025 and its amendment for the cohort.

- Every build checks the hosted file's size and hash against the record (`check.mjs`). Only preview builds contain it; public and prelaunch builds have no `releases/` folder, and the prelaunch tree matches production.
- From outside, on 2026-10-29, the release page and the file URL both redirect to Access. ucompute.org returns 404 for the file. `preview.ucompute.org` and `main` are unchanged.
- The owner then downloaded it signed in. Asked "Did the download match the checksum and launch?", the owner answered "Yes, it works". The answer was relayed to engineering verbatim.

## 2026-10-24: snapshot draft 3 (staging only)

Engineering committed capability snapshot draft 3 (`snapshot-2026-10-23b.md`, f052074). It is still a draft, and every launch gate stays false. `stage-snapshot` now follows it; `preview` and the live page (D-023) are unchanged, and the prelaunch HTML still matches production apart from asset hashes.

- Qualifiers are now `{{q:name}}` entries in `reference/claims.json`, quoted from section 8 word for word: claim 2's and claim 5's new text, claim 16's, claim 17's dated text, and claim 7's capture sentence. Each one appears in one place instead of about 30.
- Claim 9 covers four runs, 0.002 to 0.061 s, and the home scale has a fourth mark. Claim 12 now reads "phones (as clients)".
- The demo timeline has the 23 October run: a Mac and a Linux desktop, fixed builds, daemon API. Its figures come from sections 3.2 and 7: 0.002 s, 0.52 s and 3.8 s, with the not-the-timeout-path note. The Disconnect-hold result is left out, as section 9 requires.
- Open issues follow section 4.1: redials are fixed on a Mac and a Linux computer, and the nearby-list findings N1 and N2 are added. The Linux rows describe the test machine without claiming support.
- An independent review against draft 3 found 9 items, all fixed:
  - sentences about which networks discovery works on were removed (claim 16 with its qualifier instead);
  - the 23 October Mac build with the fix rounds is on release status;
  - the mesh known issues match section 4.1;
  - claim 8 in the FAQ carries claim 5's qualifier;
  - smaller wording fixes.
- `check.mjs` gained section 9 rules for Linux, "faster on" and Disconnect-hold wording; negative tests pass.

## 2026-10-23: platform pass (staging only)

On `stage-snapshot`, behind Access. preview.ucompute.org and the live prelaunch page (D-023) are unchanged: the prelaunch build's `/` and `/404.html` are byte-identical to production's apart from asset hashes, with the same file list.

| Piece | What changed | How it is checked |
|---|---|---|
| Interfaces from the source | `tools/interfaces.mjs` exports every CLI command and flag, route, error code with its HTTP status, and environment variable from the engineering repository at d00fa7e, read-only through `git show` | `check.mjs` fails on any command, subcommand, flag, route, base URL, error code, status or `UCOMPUTE_*` variable a page names that the export lacks, and on any route or error code left undocumented. Negative test: six planted mistakes, six failures. Separately, all 57 field and value names in code on the docs and developers pages (such as `pair_addr`, `allow_remote_inference`, `peer_quota`, `trusted_group`) occur in the source at d00fa7e. The one exception is `extra_body`, the OpenAI Python client's own parameter |
| Request bodies and responses | The exporter also reads `crates/ucompute-api/openapi.json`. It flattens every request body (11 routes: fields, types, limits, defaults, descriptions) and every response (success status, content types, error statuses, fields), and both render on `/docs/api/`, responses as expandable rows. Engineering's field descriptions pass the claim check unchanged | `check.mjs` fails when an example sends a JSON key the route does not accept, whether in a `curl -d` example or a `PUT /path {…}` example. Negative test: a misspelt `temprature` and an unknown `ack` both fail. Every existing example passes |
| Command-line reference | `/docs/cli/`, rendered from the export, with website wording for empty help text in `reference/cli-notes.json` | The build fails if a note matches nothing, or if a command, argument or variable has no text |
| Start here | `/start/`: four paths (run locally, connect a trusted computer, build on the API, follow the project). Each path is a run of real steps linking to the docs, ending in "Where it stops today". Also in the home band, the header button, the docs index and the footer | Claim markers on every capability sentence. Snapshot qualifiers are quoted verbatim |
| Questions | `/faq/`: 15 questions on getting it, privacy, devices, developers, cost and the source. Answers use the snapshot's approved claim sentences word for word, each with its full qualifier; the cost answer opens with "Our direction:" and adds "Credits do not exist yet. Free does not mean unlimited." | Claim markers on every answer; claim and identifier checks pass. Browsers and Lighthouse pass (see below) |
| Structured data and snippets | BreadcrumbList on docs pages, next to the existing Organization and WebSite on home. Eleven descriptions trimmed to 160 characters | `check.mjs` parses every JSON-LD block, and fails on a title over 65 characters, a description outside 50 to 160, or a title or description another page also uses. 404 pages are exempt: they are noindex, and the prelaunch one is frozen |
| Independent accuracy review | An independent reviewer checked `/start/`, the home paths band, `/docs/cli/`, the docs index and the release section against snapshot draft 2 and `interfaces.json`, and found 21 items. Fixed: claim 3 and claim 5 qualifiers placed next to their statements; the unpublished source stated wherever a step implies building it; claim 10's exact audit wording; device choice described as shown in the Windows app only; no implied Linux; the CLI page no longer says it covers every app action; "every environment variable" corrected; no promised dates or reporting routes. Engineering's own help text used section 9 wording ("the only private mode", "never leave this device"), so `cli-notes.json` can now replace engineering text (a note starting `= `), and engineering was told | `check.mjs` now flags "private mode" and "never leaves your device" in every case, and no longer lets the risky phrase count as its own limiting word |
| Full-site accuracy review | Two more independent reviewers read every other page against snapshot draft 2 and the source at c2cd6dc. Fixed:<br>• Demo: the 22 October revocation was a later run, and all runs that day used pre-fix builds.<br>• Qualifiers now sit next to the statements they qualify: home hero and API section, product cards, run, API, mesh, troubleshooting.<br>• `peer_held` is marked experimental, and revocation reaching other group members is marked single-host.<br>• Group checks are marked single-host.<br>• Source fixes: fit is shown only for downloaded models, `runs/` holds every run's manifest, a key is needed on loopback when `--api-key` is set, and the app only uses port 8192.<br>• Linux rows removed from the data-folder tables.<br>• No "best device" or "heavy model" vision rows; no stage has started; prompt-logging claims scoped to the tested Mac.<br>• Windows key files described as inheriting only.<br>Every docs page now says, under its title, that the source is unpublished. Kept on purpose: the internal build file names on `/download/`. They were the builds' real file names at the time | Reviewed numbers all match the snapshot: ledger, revocation times, memory fit, 19 October figures. All 34 routes, 27 error codes, flags, defaults, catalog sizes and doctor thresholds match the source |
| Engineering review | 22 October revocation timing marked as a development-build API run. Linux wording no longer states what the newer source contradicts, and adds nothing until a snapshot records it | Engineering's WP-13 review of 167d734 |
| Downloads | `reference/releases.json`, empty, renders approved releases on `/download/` with file, size, signature status and full SHA-256 | The build refuses a record with a missing field, a malformed hash, a non-https URL or a missing approval. `check.mjs` allows installer links only to recorded artifacts. Tested with a temporary record: a complete one renders and passes, and a short hash or a missing owner approval fails the build |

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

Lighthouse 13.5.0 ran at 23:51 UTC in engineering's sentinel window (`tools/lighthouse.mjs`). It covered the public build of all 20 pages, mobile and desktop, served gzipped like Cloudflare. The first run found two problems, both fixed and rerun the same evening:
- The home page's decorative "u." failed color contrast in all three browsers. It is now drawn by CSS, so it is no longer text that contrast checks measure.
- Text-heavy pages shifted when their fonts loaded, on desktop only: `/faq/` CLS 0.305 (performance 85), `/start/` 0.167, and docs pages 0.09 to 0.14. The complete site now preloads the two text fonts. The prelaunch head is unchanged (D-023).

Final run: every page passes the thresholds (performance at least 90, accessibility 100, best practices and SEO at least 95).
- Mobile: performance 97 to 100. LCP 1.8 s, CLS 0. TBT is 0 except 200 ms on the home page, which runs the WebGL shader.
- Desktop: performance 100, LCP 0.4 s, CLS 0.
- Accessibility, best practices and SEO are 100 on every page.
- The browser suite passed again on all 21 pages, including `/faq/`, in Chromium, Firefox and WebKit.

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

Staged against the DRAFT capability snapshot (engineering dc2502c) for a mechanical swap when the final snapshot lands. It is built by Cloudflare Pages as a branch preview behind Access; `preview` and production are unchanged.

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
| Name (owner, 2026-10-22) | The project is UCompute. Prose, the footer, the docs naming note and the architecture diagram changed to UCompute; the literal identifiers the development builds used then stayed until the code was renamed (D-028, D-030) |
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

Source of rules: `docs/SPEC_HANDOFF_V2.md` at the engineering repository at commit eec6d6e, sections 26.1, 26.2, 29.1, 29.5 and WP-13.

| Rule | Change |
|---|---|
| 26.1 naming | Footer and docs: "UCompute is the public name in use; trademark clearance is open"; each name maps one-to-one to the earlier one |
| 26.2 labels, owner's three levels | Pills limited to Verified, Implemented awaiting verification, Planned, Strategic hypothesis, and the 27.1 term Experimental; roadmap may show ledger statuses. Removed Development build, Gated, Hypothesis, Demonstrated, Exists, Not built yet |
| 29.1 demonstration | Every figure shown with model (stories15M fixture), hardware and commits (apps caf1497 and 5f0c580, evidence af3e37c); "path check, not performance"; the Mac-to-Windows request named as the Mac daemon API; Mode B only, no model split |
| 29.5 roadmap | No dates: removed the dated progress log; counts from the ledger at eec6d6e (148 original, 36 verified; U-01..U-04 not started); WP statuses from section 30, WP-13 added |
| 29.5 compatibility | Download table follows section 27.1 (2026-10-18 baseline, Windows and NAS rows updated 2026-10-19); no platform SUPPORTED |
| 29.5 community | No security or conduct route advertised until tested; GitHub described as holding only the license and brief |
| WP-13 citations | Capability statements on home, product, developers and architecture cite ledger IDs or the evidence path at a commit |
| WP-13 claim check | `check.mjs` fails on pooling/split, SUPPORTED, speedup, privacy-guarantee or Swarm/Cloud/credit-availability wording unless the sentence limits it, and on any binary download link. It caught and the wording was fixed for: two present-tense pooling descriptions, two definitional uses of "supported" |
| Owner direction: credits | Vision page section "One network, one credit system", labelled Strategic hypothesis, with "None of this exists yet" |

Results: `npm test` passes in all three modes; axe-core 0 violations and no horizontal overflow on the changed pages at 1440, 768, 390 and 320 px. Public source check (GitHub API): `div0rce/ucompute` contained only the licence and the project brief, one branch, last push 2026-10-14; private vulnerability reporting disabled.

## 2026-10-19: first complete build (local)

Environment: macOS 26.2 (Apple M2), Node 26.10.0, Python 3 `http.server` on 127.0.0.1:4173, Playwright Chromium, axe-core 4.10.2.

| Check | Command or method | Result |
|---|---|---|
| Build and static checks, all three modes | `npm test` | Pass. prelaunch: 2 pages, 18 files; preview: 19 pages, 38 files; public: 18 pages, 37 files |
| External links | `npm run test:links` | `github.com/div0rce/ucompute` 200, `github.com/ggml-org/llama.cpp` 200. `preview.ucompute.org` did not resolve before deployment (expected) |
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
- Lighthouse scores come from a headless Chromium on the Linux test host with simulated mobile throttling, against a local server; real-world field data does not exist before launch.
