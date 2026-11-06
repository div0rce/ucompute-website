# Website & Developer Experience

The permanent charter and roadmap of this workstream, set by the owner on 2026-11-06. Status tables here are dated; update them when the evidence changes. Records of what was checked stay in `VERIFICATION.md`; launch dependencies stay in `LAUNCH.md`; deployment rules stay in `DEPLOYMENT.md`.

## Mission

An independent developer can find UCompute, understand its capabilities, install the supported version, run a real workload, connect devices where supported, and build against its developer interfaces, without the founder's help.

Success is measured by those tasks being completed, not by page counts or visual polish.

**Measures inform; they do not gate.** No tester count or evidence level holds up a build or a release: the owner's decision of 2026-11-06, relayed by Program Control (HO-017). Access and release rules stay as they are until engineering records the change.

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

| Level | Meaning | Independent evidence? |
|---|---|---|
| L0 Read | Matches the release's source; nothing was run | No |
| L1 Run | Run on the approved artifact in a supported environment by the people writing the page | No |
| L2 Cold read | Done by someone, or an agent, given only the published page and the artifact. Finds gaps in the page. Agent runs are labelled as agents | No |
| L3 Independent | A consenting person with no project context, unaided, timed | Yes |

The site has no analytics (spec 29.5), so measures come from observed sessions, not from page data.

### Baseline, 2026-11-06

| # | Best evidence so far | Level | Gap |
|---|---|---|---|
| T1 | The approved disk image checked and the app copied out, in seconds. Engineering's packaged-app check, 19 of 19, covers lifecycle and golden output; it is not a human path and is not cited as one | L1 without the window | Open Anyway needs a person; not yet tried on a second Mac with this build. Whether the bundled `ucompute` needs its own approval afterwards is unmeasured |
| T2 | Command-line path: engine and model in about 16 s on this connection, first answer in 6 to 13 s on one 8 GB M2. Window path: read from the source only | L1 command line, L0 window | Engineering confirms no evidence of a window-only first answer on an empty home (requirement F-10-01, still IMPLEMENTED_UNVERIFIED). It stays on engineering's list after P1 |
| T3 | Physical pairs with development builds; 0.1.1 itself untested between two machines | Below L1 for 0.1.1 | Blocked on engineering evidence for this build |
| T4 | `curl`, and the official Python and JavaScript clients, ran the page's code unchanged on the approved build. An agent cold read finished `curl` and JavaScript from the page alone; its Python failure led to the fix, which is verified at L1 | L1, L2 in part | No independent developer yet |
| T5 | An agent answered five support, privacy and maturity questions correctly from the page alone | L2 | Needs L3 sessions |

No measure has reached L3. That is information, not a gate.

## Rules for examples and guides

- Every command and code block in a guide runs against an approved artifact before it is published, and again when a new artifact is approved (`npm run verify:first-run`, which reads the blocks from the built page).
- A guide names the build it applies to. Version and file name come from `reference/releases.json`, never typed by hand.
- `reference/interfaces.json` is exported at the release's source commit, so the reference matches what people can install.
- A step that needs a person (Gatekeeper approval, anything through a window) is marked as such in the record until a person has done it.
- Reserved ports stay reserved, and checks run with their own data folder; see the handoff's hard limits.
- Before running anything on a shared host, check what is running there and get engineering's "Mac clear".
- A cold read runs with HOME and PATH both restricted, so no tool outside its folder is reachable. A redirected HOME alone let one reach the owner's own Python environment on 2026-11-06 (`VERIFICATION.md`).
- A guide's block must fail safely when a line fails. Copied blocks keep going after an error, so call a virtual environment's tools by path and never rely on `activate` before a bare `pip`.
- A checker uses the tools a reader has, in the order they have them. Each Python on the machine is tried, because the first checker used Apple's and hid a failure with Homebrew's.

## Roadmap

Ordered by which measure each item moves. An item moves only with the evidence named.

| Order | Item | Moves | State | Waiting on |
|---|---|---|---|---|
| 1 | First-run guide for the approved build, from disk image to API call, with a repeatable checker | T1, T2, T4 | Done on 2026-11-06 for everything but the window; see `VERIFICATION.md` | Window steps need a person (item 3) |
| 2 | Task sheet and consent form, for recording any developer who tries UCompute the same way (`ONBOARDING-TEST.md`) | All, as information | Shelved on 2026-11-06: the cohort work was withdrawn (HO-016, HO-017). Ready if wanted | Nothing |
| 3 | Walk the window path once at L1 on a clean account: Open Anyway, Get started, Download, Run, Chat. Also measure whether the bundled `ucompute` runs from Terminal after Open Anyway | T1, T2 | Waiting | Engineering's F-10-01 run after P1 (the owner's choice, 2026-11-06) |
| 4 | Troubleshooting from real failures, ordered by what people hit, with every error's next step | T1, T2, T4 | Next | Findings from 2 and 3 |
| 5 | Release-specific compatibility notes and a versioned docs header | T5 | Next | Next approved build |
| 6 | Device connection guide for an approved build | T3 | Blocked | Engineering evidence that the build connects between two machines; pairing two Macs is not yet shown. Pooling is not claimable: WP-04 has no verdict |
| 7 | One small reference application built on the local API, verified like the guide | T4 | After 2 | SDKs are planned; start from the OpenAI clients the snapshot allows |
| 8 | SDK quickstarts for the external developer alpha, verified like the guide | T4 | Waiting | Engineering's Python and TypeScript SDKs, in progress; engineering will say when they land |
| 9 | Growth's four claim pages: networks, platforms, data and connections, API compatibility | T5 | Deferred (HO-005) | The final capability snapshot |
| 10 | Public install path: signed installers, source build instructions that work | T1 | Blocked | Publishing the source; signing identities; owner's decision |
| 11 | Search and structured documentation for the public site | Discovery | Blocked | Owner's launch authorization |

## Readiness and open requests, 2026-11-06

For Program Control. Each line is a request or a dependency, not an approval.

| To | Request | Needed for | State |
|---|---|---|---|
| Owner | Cloudflare Pages token, prune dry run and `--delete` | Old deployments | Open since 2026-10-30 |
| Owner | Publish the source, security route, trademark clearance, launch authorization | Public release | Open |
| Engineering | Record the owner's decision that user counts do not gate a release (HO-017) | `/download/` still lists the spec's tester targets; it changes once this is recorded | Open |
| Engineering | Final capability snapshot | Claims on every page | Open; claims follow draft 3 |
| Engineering | WP-04 verdict | Pooled options in the reference | Open |
| Engineering | Connection evidence for an approved build | Roadmap 6 | Open |
| Engineering | Signing identities | A first open without System Settings | Open (B-008) |
| Engineering | Measure whether the bundled `ucompute` runs from Terminal after Open Anyway | The guide's command-line section | Open; engineering asked that it be measured, not stated |
| Engineering | A window-only first answer on an empty home (F-10-01), following `/docs/first-run/` and reporting where the page differs | T1, T2 at L1 | Open; after P1. The owner left this with engineering on 2026-11-06 |
