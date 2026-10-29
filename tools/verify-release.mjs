// Download every released artifact from a deployed site, through Cloudflare Access, and compare its size and
// SHA-256 with reference/releases.json. The Access service token is read from a local env file and never printed.
//   node tools/verify-release.mjs [base URL]   (default: the stage-snapshot alias)
//   UCOMPUTE_ACCESS_ENV=<file> overrides ~/.config/ucompute/access.env (CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET)
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { RELEASES, approved } from '../build.mjs';

const base = (process.argv[2] || 'https://stage-snapshot.ucompute-website.pages.dev').replace(/\/$/, '');
const envFile = process.env.UCOMPUTE_ACCESS_ENV || join(homedir(), '.config/ucompute/access.env');
const env = Object.fromEntries(readFileSync(envFile, 'utf8').split('\n')
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*["']?(.*?)["']?\s*$/)).filter(Boolean).map(m => [m[1], m[2]]));
const headers = { 'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID, 'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET };
if (!headers['CF-Access-Client-Id'] || !headers['CF-Access-Client-Secret']) { console.error(`${envFile} needs CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET`); process.exit(2); }

let failed = 0;
const page = await fetch(`${base}/download/`, { headers, redirect: 'manual' });
console.log(`${page.status === 200 ? 'PASS' : 'FAIL'}  ${base}/download/ through Access: HTTP ${page.status}`);
if (page.status !== 200) failed++;
for (const r of RELEASES.filter(approved)) {
  for (const a of r.artifacts) {
    const url = a.url.startsWith('/') ? base + a.url : a.url;
    const res = await fetch(url, { headers, redirect: 'manual' });
    const body = res.ok ? Buffer.from(await res.arrayBuffer()) : Buffer.alloc(0);
    const sha = createHash('sha256').update(body).digest('hex');
    const ok = res.status === 200 && body.length === a.bytes && sha === a.sha256;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.version} ${a.file}: HTTP ${res.status}, ${body.length} bytes, sha256 ${sha}`);
    if (!ok) failed++;
  }
}
process.exit(failed ? 1 : 0);
