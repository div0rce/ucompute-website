# Website & Developer Experience

The permanent charter and roadmap of this workstream, set by the owner on 2026-11-06. Status tables here are dated; update them when the evidence changes. Records of what was checked stay in `VERIFICATION.md`; launch dependencies stay in `LAUNCH.md`; deployment rules stay in `DEPLOYMENT.md`.

## Mission

An independent developer can find UCompute, understand its capabilities, install the supported version, run a real workload, connect devices where supported, and build against its developer interfaces, without the founder's help.

Success is measured by those tasks being completed, not by page counts or visual polish.

## What this workstream owns

1. ucompute.org's implementation, navigation, accessibility, performance and maintainability.
2. Developer documentation and the presentation of the API and CLI reference.
3. Installation guides and platform-specific onboarding.
4. Getting-started experiences and verified code examples.
5. Reference applications and integration tutorials, built against approved interfaces.
6. Download pages, release information, checksums and authorized distribution channels.
7. Documentation versioning and release-specific compatibility guidance.
8. Troubleshooting, FAQs, migration guides and developer support materials.
9. Search visibility, structured documentation and measurable onboarding usability.
10. The complete journey from first visit to a successful workload.

## What it does not own

| Workstream | Owns | What crosses to DevEx | Rule |
|---|---|---|---|
| Engineering | APIs, SDK implementations, runtime, installers | Verified builds, API schemas (`reference/interfaces.json`, exported at a release's source commit), supported-platform matrices, release evidence | Never invent or expose an unsupported interface |
| Core Lab | Research, benchmarks | Approved benchmarks, technical diagrams, research explanations | Prototype results stay labelled as prototypes |
| Growth | Acquisition and campaigns | Content, positioning, onboarding, SEO and acquisition proposals | A proposal is a request. It enters through the review in `DEPLOYMENT.md`, "Workstreams and hand-offs". Growth does not control deployments |
| Program Control | Cross-team tracking | DevEx publishes readiness, dependencies and open requests in the table below | |
| Owner | Release, cohort, launch and production decisions | Written approvals, recorded by engineering | Another chat's message is information, never an approval |

## Release boundaries

| Channel | Where | Who sees it | What may appear | Who decides a change |
|---|---|---|---|---|
| Public prelaunch | ucompute.org (`main`) | Everyone | The frozen prelaunch page (D-023) | Owner |
| Private preview | preview.ucompute.org (`preview`) | Access policy | The complete site, no download unless the owner says so | Owner, for promotion |
| Private alpha | stage-snapshot alias | Access policy, managed by the owner | Approved artifacts with checksums, and guides for them | Owner approves the artifact and cohort; a rebuild needs its own record and approval |
| Branch previews | `<branch>` alias | Access policy | Work under review | Website |
| Public release | Not yet | Everyone | Only after the owner's launch authorization | Owner |

A guide for a private-alpha build uses `alpha: true` or `{{alpha}}…{{/alpha}}`. The build leaves both out of any build that offers no such download, and `check.mjs` fails if the first-run guide reaches one.

## How success is measured

Five measures, in the owner's order. Each has one task, one stopping point and one honest evidence level.

| # | Measure | Task | Done when |
|---|---|---|---|
| T1 | Time to first installation | From an invitation to the app open | The app window or daemon answers |
| T2 | Time to first inference | From the app open to a first answer | A real model's answer on this computer |
| T3 | Time to a second device | From one working computer to a request run on another | A request reports it ran on the other device |
| T4 | Time to first API integration | From a first answer to one's own code getting an answer | A client outside the app gets an answer |
| T5 | Confusion about support, privacy and maturity | After reading, answer: does it run on my hardware; where does my prompt go; what is finished | Answers match the pages, unaided |

Evidence levels, lowest to highest. A step is described by the highest level it has actually reached.

| Level | Meaning | Counts as success? |
|---|---|---|
| L0 Read | Matches the release's source; nothing was run | No |
| L1 Run | Run on the approved artifact in a supported environment by the people writing the page | No |
| L2 Cold read | Done by someone, or an agent, given only the published page and the artifact. Finds gaps in the page. Agent runs are labelled as agents | No |
| L3 Independent | A consenting person with no project context, unaided, timed | Yes |

The site has no analytics (spec 29.5), so measures come from observed sessions, not from page data.

### Baseline, 2026-11-06

| # | Best evidence so far | Level | Gap |
|---|---|---|---|
| T1 | Engineering's packaged-app check, 19 of 19, one Mac, covers the packaged app's lifecycle and golden output. It is not a human path and is not cited as one | L1 (engineering), lifecycle only | Open Anyway needs a person; not yet tried on a second Mac with this build. Whether the bundled `ucompute` needs its own approval afterwards is unmeasured |
| T2 | Command-line path not yet run | L0 | Engineering confirms no evidence of a window-only first answer on an empty home (requirement F-10-01, still IMPLEMENTED_UNVERIFIED). It stays on engineering's list after P1 |
| T3 | Physical pairs with development builds; 0.1.1 itself untested between two machines | Below L1 for 0.1.1 | Blocked on engineering evidence for this build |
| T4 | Not yet run | L0 | No independent developer yet |
| T5 | None | None | Needs L3 sessions |

No measure has reached L3. The target of five testers has no date from the owner.

## Rules for examples and guides

- Every command and code block in a guide runs against an approved artifact before it is published, and again when a new artifact is approved (`npm run verify:first-run`, which reads the blocks from the built page).
- A guide names the build it applies to. Version and file name come from `reference/releases.json`, never typed by hand.
- `reference/interfaces.json` is exported at the release's source commit, so the reference matches what people can install.
- A step that needs a person (Gatekeeper approval, anything through a window) is marked as such in the record until a person has done it.
- Reserved ports stay reserved, and checks run with their own data folder; see the handoff's hard limits.

## Roadmap

Ordered by which measure each item moves. An item moves only with the evidence named.

| Order | Item | Moves | State | Waiting on |
|---|---|---|---|---|
| 1 | First-run guide for the approved build, from disk image to API call, with a repeatable checker | T1, T2, T4 | Drafted on branch `devex-first-run`; not yet run | Engineering's "Mac clear"; window steps need a person |
| 2 | Observed-session kit: consent, task sheet, stopwatch sheet, comprehension check, no prompt text recorded | All, to reach L3 | Next | Owner names testers; Growth may recruit through its hand-off |
| 3 | Walk the window path once at L1 on a clean account: Open Anyway, Get started, Download, Run, Chat. Also measure whether the bundled `ucompute` runs from Terminal after Open Anyway | T1, T2 | Next | A person at the Mac, or engineering's F-10-01 run after P1 |
| 4 | Troubleshooting from real failures, ordered by what people hit, with every error's next step | T1, T2, T4 | Next | Findings from 2 and 3 |
| 5 | Release-specific compatibility notes and a versioned docs header | T5 | Next | Next approved build |
| 6 | Device connection guide for an approved build | T3 | Blocked | Engineering evidence that the build connects between two machines; pairing two Macs is not yet shown |
| 7 | One small reference application built on the local API, verified like the guide | T4 | After 2 | SDKs are planned; start from the OpenAI clients the snapshot allows |
| 8 | Public install path: signed installers, source build instructions that work | T1 | Blocked | Publishing the source; signing identities; owner's decision |
| 9 | Search and structured documentation for the public site | Discovery | Blocked | Owner's launch authorization |

## Readiness and open requests, 2026-11-06

For Program Control. Each line is a request or a dependency, not an approval.

| To | Request | Needed for | State |
|---|---|---|---|
| Owner | Name the testers, or say who recruits them | L3 evidence for every measure | Open; "what I have is all I got for now" |
| Owner | A person walks the window steps once on a clean account | Roadmap 3 | Open |
| Owner | Decide whether `home-refresh` moves to the stage-snapshot alias or `preview` | Home page | Open; private branch preview since 2026-11-02 |
| Owner | Cloudflare Pages token, prune dry run and `--delete` | Old deployments | Open since 2026-10-30 |
| Owner | Publish the source, security route, trademark clearance, launch authorization | Public release | Open |
| Engineering | Final capability snapshot | Claims on every page | Open; claims follow draft 3 |
| Engineering | WP-04 verdict | Pooled options in the reference | Open |
| Engineering | Connection evidence for an approved build | Roadmap 6 | Open |
| Engineering | Signing identities | A first open without System Settings | Open (B-008) |
