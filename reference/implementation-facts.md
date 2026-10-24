# Implementation facts the docs were written against

Website rules: `docs/SPEC_HANDOFF_V2.md` at eec6d6e, sections 26.1, 26.2, 29.1, 29.5 and WP-13. Economics direction: section 26.5 and D-019 at ae552bf (owner model quoted verbatim on /vision/; all planned, NOT_STARTED). Ledger counts unchanged at eec6d6e for the 148 original rows; U-01..U-04 added, all NOT_STARTED.

Source: `div0rce/common`, commit `af3e37c` (2026-10-18), read on 2026-10-19; interfaces, CLI behaviour, API notes and the catalog re-checked at `d00fa7e` (2026-10-23). Since 2026-10-23 capability claims follow the engineering capability snapshot (draft 2, e4ed731), mapped statement by statement in `reference/claims.json`. The engineering working copy had uncommitted changes at the time; nothing below relies on them. When the engineering repository moves, re-check each line and update the pages listed in brackets.

## Evidence used for claims

- `docs/evidence/desktop-two-machine-2026-10-19.md`: installed Mac and Windows apps paired through their UIs on one phone hotspot. Windows app → Mac: 112 tokens, first token 2,325 ms (model loaded on demand), 508 tok/s, "Ran on Mous", served on MTL0 (Apple M2). Mac → Windows via the Mac daemon API: 48 tokens, engine TTFT 128 ms, 910 tok/s on Arc 140V (Vulkan). Model stories15M-q4_0. Windows installer `Common_0.1.0_x64-setup.exe`, NSIS, 4.24 MiB, from caf1497, sha256 `df13fe79e80a447d7e495a62cceae1ce6bcbbdbb0768daed6cf44889763a4ce0`. Open defects listed there. [/, /demo/, /download/]
- `docs/evidence/m3-two-machine-2026-10-18.md`: daemon-only runs on eduroam (discovery failed: network drops multicast) and on a hotspot (discovery passed). Pairing, remote execution both ways, local_only refusal, audit without prompt text, revocation, kill/restart recovery. [/demo/]
- `docs/PROGRESS.md`, `docs/BLOCKERS.md`, `docs/decisions/ADR-0004-infrastructure-program.md`, `docs/SPEC_HANDOFF_V2.md` sections 14 and 25–33. [/roadmap/, /vision/, /product/, /download/]
- `docs/REQUIREMENTS.csv` at af3e37c: 148 P0 rows; VERIFIED 36, IMPLEMENTED_UNVERIFIED 8, IN_PROGRESS 3, NOT_STARTED 101. Per milestone: M0 1/1 V; M1 18 V, 3 IU of 21; M2 3 V, 3 IU of 6; M3 14 V, 2 IU, 1 NS of 17; M4 5 NS; M5 17 NS; M6 14 NS; M7 10 NS; M8 14 NS; M9 4 NS; M10 9 NS, 1 IP; M11 8 NS; M12 11 NS; M13 8 NS; M14 2 IP. [/, /roadmap/]
- Screenshots: `docs/evidence/img/windows-app-chat-ran-on-mac-2026-10-19.png`, `windows-app-wrong-pairing-code-2026-10-19.png`, converted to WebP without other edits. [/, /demo/]

## Interfaces

Commands, flags, defaults, HTTP routes, error codes with their statuses, and environment variables are no longer transcribed here. They live in `reference/interfaces.json`, exported read-only from the engineering source by `npm run interfaces:update` (run at d00fa7e, 2026-10-23, again at c2cd6dc the same evening, and at c122812 on 2026-10-24, with no interface changes). `/docs/cli/` is rendered from it, and `check.mjs` fails when a page names a command, flag, route, error code or variable that is not in it, or leaves an error code undocumented.

## CLI behaviour (re-checked at d00fa7e)

Errors print `error[<code>]: <message>` and exit 1; Ctrl-C/SIGTERM exit 130 after the engine stops. `run --peer` conflicts with `--device`, `--threads` and `--ctx`. `doctor` changes nothing and warns below 2,000,000,000 bytes of disk or 1,000,000,000 bytes of memory; a clean run ends `ok       no problems found`. `serve --network`/`--serve-peers` persist to config.json; a non-loopback host without `--api-key` is refused. `COMMON_MDNS=0` turns off mDNS even when config enables it. Peer arguments take a 64-hex id, a short label (`ab12-cd34-ef56`) or a unique hex prefix.

## Data folder

macOS `~/Library/Application Support/Common`; Windows `%LOCALAPPDATA%\Common`; Linux `$XDG_DATA_HOME/common` or `~/.local/share/common`. Contents: `backends/<name>/<release>/`, `models/blobs/sha256-*`, `models/manifests/<id>.json`, `models/partial/`, `runs/<utc>-<pid>/manifest.json`, `logs/audit.jsonl`, `identity/device.key|device.pub|peers.json`, `serve.json`, `config.json` (0600): `privacy` local_only, `network_enabled` false, `serve_peers` false, `peer_quota` {requests_per_minute 120, tokens_per_minute 200000, max_concurrent 4}.

## Catalog

`qwen2.5-0.5b-instruct-q4_k_m` 491,400,032 B Apache-2.0 (recommended); `qwen2.5-0.5b-instruct-q8_0` 675,710,816; `qwen2.5-0.5b-instruct-q2_k` 415,182,688; `qwen2.5-1.5b-instruct-q4_k_m` 1,117,320,736; `smollm2-360m-instruct-q8_0` 386,404,992; `nomic-embed-text-v1.5-q8_0` 146,146,432 (embeddings); `stories15M-q4_0` 19,077,344 (license unknown, fixture); `stories260K` 1,185,376 (license unknown, fixture). Engine llama.cpp b11609 (MIT) for macos-arm64, win-x64 (Vulkan), win-arm64 (Vulkan) and, from d00fa7e, linux-x64; no Intel Mac pin. The Linux pin is not on the site until a capability snapshot records Linux (engineering, 2026-10-23).

## HTTP API v1.0.0 (`crates/common-api`, re-checked at d00fa7e)

Routes and error codes: `reference/interfaces.json`. `GET /health` returns `{"status":"ok","version":"0.1.0"}` without auth.

Auth: Bearer key on every route except /health when `--api-key` is set; 401 `unauthorized`. CORS allow-list: `tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`, `http://localhost:1420`; allowed headers `authorization, content-type` only (so browsers use the `target` body field). Body cap 2 MiB. `target`: `local` (default) or `peer:<64-hex|xxxx-xxxx-xxxx>`, body wins over `X-Common-Target`; echoed in every response and chunk; embeddings local only.


## Desktop app

Navigation: Run (Home, Models, Chat), This computer (Hardware, Performance, Diagnostics), Devices and network (Peers, Cluster, Jobs, Contributions, Privacy), Settings. Peers: networking switch, Pair this device (6-digit code, pair_addr, QR payload, countdown), Join a device, Paired devices with revoke/remove, Groups with two switches, Nearby, not paired → Pair. Privacy: local only / trusted devices / public (disabled). Run on menu in Chat and Home when not local-only. Daemon sidecar started with `serve --host 127.0.0.1 --port 8192 --exit-with-parent`, reused if `/health` already answers. Build: macOS `pnpm tauri build --bundles app,dmg`; Windows `pnpm tauri build --bundles nsis`.
