# Implementation facts the docs were written against

Website rules: `docs/SPEC_HANDOFF_V2.md` at eec6d6e, sections 26.1, 26.2, 29.1, 29.5 and WP-13. Ledger counts unchanged at eec6d6e for the 148 original rows; U-01..U-04 added, all NOT_STARTED.

Source: `div0rce/common`, commit `af3e37c` (2026-10-18), read on 2026-10-19. The engineering working copy had uncommitted changes at the time; nothing below relies on them. When the engineering repository moves, re-check each line and update the pages listed in brackets.

## Evidence used for claims

- `docs/evidence/desktop-two-machine-2026-10-19.md`: installed Mac and Windows apps paired through their UIs on one phone hotspot. Windows app → Mac: 112 tokens, first token 2,325 ms (model loaded on demand), 508 tok/s, "Ran on Mous", served on MTL0 (Apple M2). Mac → Windows via the Mac daemon API: 48 tokens, engine TTFT 128 ms, 910 tok/s on Arc 140V (Vulkan). Model stories15M-q4_0. Windows installer `Common_0.1.0_x64-setup.exe`, NSIS, 4.24 MiB, from caf1497, sha256 `df13fe79e80a447d7e495a62cceae1ce6bcbbdbb0768daed6cf44889763a4ce0`. Open defects listed there. [/, /demo/, /download/]
- `docs/evidence/m3-two-machine-2026-10-18.md`: daemon-only runs on eduroam (discovery failed: network drops multicast) and on a hotspot (discovery passed). Pairing, remote execution both ways, local_only refusal, audit without prompt text, revocation, kill/restart recovery. [/demo/]
- `docs/PROGRESS.md`, `docs/BLOCKERS.md`, `docs/decisions/ADR-0004-infrastructure-program.md`, `docs/SPEC_HANDOFF_V2.md` sections 14 and 25–33. [/roadmap/, /vision/, /product/, /download/]
- `docs/REQUIREMENTS.csv` at af3e37c: 148 P0 rows; VERIFIED 36, IMPLEMENTED_UNVERIFIED 8, IN_PROGRESS 3, NOT_STARTED 101. Per milestone: M0 1/1 V; M1 18 V, 3 IU of 21; M2 3 V, 3 IU of 6; M3 14 V, 2 IU, 1 NS of 17; M4 5 NS; M5 17 NS; M6 14 NS; M7 10 NS; M8 14 NS; M9 4 NS; M10 9 NS, 1 IP; M11 8 NS; M12 11 NS; M13 8 NS; M14 2 IP. [/, /roadmap/]
- Screenshots: `docs/evidence/img/windows-app-chat-ran-on-mac-2026-10-19.png`, `windows-app-wrong-pairing-code-2026-10-19.png`, converted to WebP without other edits. [/, /demo/]

## CLI (`crates/common-cli`)

Global: `--json`, `-v`/`-vv` (RUST_LOG overrides). Errors print `error[<code>]: <message>` and exit 1; Ctrl-C/SIGTERM exit 130.

- `hardware`
- `models list | search <q> | pull <id> [-y] | inspect <id|path.gguf> | import <path> [--id] [--license] | verify <id> | rm <id>`
- `run <model> -p <prompt>` with `--peer <id|label>` (conflicts with --device/--threads/--ctx), `-n/--max-tokens` 256, `--device auto|cpu|gpu`, `--ctx` (capped to trained context with a reason), `--threads` (backend's choice), `--temp` 0.7, `--top-p` 0.95, `--seed` (random, recorded), `--save-prompt`, `--chat` (send as a chat message so the template applies)
- `chat <model> [--device] [--ctx]`, `/quit` exits
- `bench <model> [--device] [--runs 3] [-n 64]` → `./benchmarks/results/`
- `replay <manifest.json>` (from `run --save-prompt`)
- `setup [--fixtures]` (pinned engine; fixtures = stories15M-q4_0, stories260K)
- `doctor` (no changes; warnings for engine not ready, < 2,000,000,000 bytes disk, < 1,000,000,000 bytes memory; `ok       no problems found`)
- `serve --host 127.0.0.1 --port 8192 [--api-key] [--max-concurrent 4] [--exit-with-parent] [--network] [--serve-peers] [--listen-port 8193] [--listen-addr 0.0.0.0] [--no-mdns]`; `--network`/`--serve-peers` persist to config.json; non-loopback host without key refused
- `peers list | discover [--wait-secs 3] | pair [--name] | join <ip:port|qr> [code] [--name] | rm <id> | revoke <id>`
- `groups list | create <name> [--allow-remote] [--allow-pooled] | add <group> <peer> | remove <group> <peer> | policy <group> [--allow-remote=true|false] [--allow-pooled=true|false]`
- `privacy [local-only|trusted-devices] [--yes]` (trusted-devices also enables peer networking)
- `audit [--n 50]`, `diagnostics [--out <path>]`

Environment: `COMMON_HOME`, `COMMON_MDNS=0`, `COMMON_API_KEY` (CLI mesh commands to a keyed daemon), `RUST_LOG`.

## Data folder

macOS `~/Library/Application Support/Common`; Windows `%LOCALAPPDATA%\Common`; Linux `$XDG_DATA_HOME/common` or `~/.local/share/common`. Contents: `backends/<name>/<release>/`, `models/blobs/sha256-*`, `models/manifests/<id>.json`, `models/partial/`, `runs/<utc>-<pid>/manifest.json`, `logs/audit.jsonl`, `identity/device.key|device.pub|peers.json`, `serve.json`, `config.json` (0600): `privacy` local_only, `network_enabled` false, `serve_peers` false, `peer_quota` {requests_per_minute 120, tokens_per_minute 200000, max_concurrent 4}.

## Catalog

`qwen2.5-0.5b-instruct-q4_k_m` 491,400,032 B Apache-2.0 (recommended); `qwen2.5-0.5b-instruct-q8_0` 675,710,816; `qwen2.5-0.5b-instruct-q2_k` 415,182,688; `qwen2.5-1.5b-instruct-q4_k_m` 1,117,320,736; `smollm2-360m-instruct-q8_0` 386,404,992; `nomic-embed-text-v1.5-q8_0` 146,146,432 (embeddings); `stories15M-q4_0` 19,077,344 (license unknown, fixture); `stories260K` 1,185,376 (license unknown, fixture). Engine llama.cpp b11609 (MIT) for macos-arm64, win-x64 (Vulkan), win-arm64 (Vulkan); no Linux or Intel Mac pin.

## HTTP API v1.0.0 (`crates/common-api`)

Routes: `GET /health` (`{"status":"ok","version":"0.1.0"}`, no auth), `/ready`, `/metrics`, `/openapi.json`; `GET /v1/models`, `/v1/models/{id}`, `POST /v1/chat/completions`, `/v1/completions`, `/v1/embeddings`; `GET /api/hardware`, `/api/status`, `/api/models`, `POST /api/models/{id}/pull`, `/api/models/{id}/load`, `/api/unload`, `DELETE /api/models/{id}`, `POST /api/models/import`; mesh: `GET|PUT /api/network`, `GET /api/peers`, `DELETE /api/peers/{id}`, `POST /api/peers/{id}/revoke`, `POST /api/pair/start`, `GET /api/pair/status`, `POST /api/pair/join`, `GET|PUT /api/groups`, `GET|PUT /api/privacy`, `GET /api/audit?n=`.

Uncommitted at the time (not documented on the site): `POST /api/peers/{id}/connect`, `POST /api/shutdown`.

Auth: Bearer key on every route except /health when `--api-key` is set; 401 `unauthorized`. CORS allow-list: `tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`, `http://localhost:1420`; allowed headers `authorization, content-type` only (so browsers use the `target` body field). Body cap 2 MiB. `target`: `local` (default) or `peer:<64-hex|xxxx-xxxx-xxxx>`, body wins over `X-Common-Target`; echoed in every response and chunk; embeddings local only.

Error codes and statuses: see `/docs/api/#errors`, transcribed from `crates/common-core/src/error.rs`.

## Desktop app

Navigation: Run (Home, Models, Chat), This computer (Hardware, Performance, Diagnostics), Devices and network (Peers, Cluster, Jobs, Contributions, Privacy), Settings. Peers: networking switch, Pair this device (6-digit code, pair_addr, QR payload, countdown), Join a device, Paired devices with revoke/remove, Groups with two switches, Nearby, not paired → Pair. Privacy: local only / trusted devices / public (disabled). Run on menu in Chat and Home when not local-only. Daemon sidecar started with `serve --host 127.0.0.1 --port 8192 --exit-with-parent`, reused if `/health` already answers. Build: macOS `pnpm tauri build --bundles app,dmg`; Windows `pnpm tauri build --bundles nsis`.
