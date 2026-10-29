// List the Pages project's deployments and, with --delete, delete every one except the current production
// deployment and the deployments a branch alias points at (stage-snapshot, preview). Without --delete it only prints.
//   node tools/prune-deployments.mjs            # dry run: what would be kept and deleted
//   node tools/prune-deployments.mjs --delete   # delete them (permanent)
// Reads CLOUDFLARE_API_TOKEN (Account, Cloudflare Pages, Edit) and CLOUDFLARE_ACCOUNT_ID from
// ~/.config/ucompute/cloudflare.env (override with UCOMPUTE_CF_ENV). The token is never printed.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const envFile = process.env.UCOMPUTE_CF_ENV || join(homedir(), '.config/ucompute/cloudflare.env');
const env = Object.fromEntries(readFileSync(envFile, 'utf8').split('\n')
  .map(l => l.match(/^\s*([A-Z_]+)\s*=\s*["']?(.*?)["']?\s*$/)).filter(Boolean).map(m => [m[1], m[2]]));
const { CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: account } = env;
if (!token || !account) { console.error(`${envFile} needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID`); process.exit(2); }
const api = `https://api.cloudflare.com/client/v4/accounts/${account}/pages/projects/ucompute-website`;
const call = async (path, method = 'GET') => {
  const r = await fetch(api + path, { method, headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (!j.success) throw new Error(`${method} ${path}: HTTP ${r.status} ${JSON.stringify(j.errors)}`);
  return j;
};

const project = (await call('')).result;
const all = [];
for (let page = 1; ; page++) {
  const j = await call(`/deployments?per_page=25&page=${page}`);
  all.push(...j.result);
  if (!j.result.length || all.length >= (j.result_info?.total_count ?? all.length)) break;
}
const keep = d => d.id === project.canonical_deployment?.id || d.aliases?.length > 0;
const label = d => `${d.short_id}  ${d.environment.padEnd(10)} ${(d.deployment_trigger?.metadata?.branch || '').padEnd(15)} ${(d.deployment_trigger?.metadata?.commit_hash || '').slice(0, 7)}  ${d.created_on.slice(0, 16)}`;
const kept = all.filter(keep), gone = all.filter(d => !keep(d));
console.log(`${all.length} deployments. Keeping ${kept.length}:`);
for (const d of kept) console.log(`  keep    ${label(d)}  ${d.aliases?.join(' ') || 'production'}`);
if (!process.argv.includes('--delete')) {
  console.log(`Would delete ${gone.length}. Run again with --delete to delete them.`);
  process.exit(0);
}
let failed = 0;
for (const d of gone) {
  try { await call(`/deployments/${d.id}`, 'DELETE'); console.log(`  deleted ${label(d)}`); }
  catch (e) { failed++; console.log(`  FAILED  ${label(d)}: ${e.message}`); }
}
console.log(`Deleted ${gone.length - failed} of ${gone.length}.`);
process.exit(failed ? 1 : 0);
