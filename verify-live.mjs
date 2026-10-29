// Checks the deployed sites from outside, without credentials.
//   node verify-live.mjs [extra preview URLs...]
// Public hostnames must serve the prelaunch page and nothing from the complete site.
// Every other address must stop at Cloudflare Access (302 to *.cloudflareaccess.com, or 401/403).
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const PROJECT = 'ucompute-website';
const publicUrls = ['https://ucompute.org/', `https://${PROJECT}.pages.dev/`];
const privateUrls = ['https://preview.ucompute.org/', 'https://preview.ucompute.org/docs/', `https://preview.${PROJECT}.pages.dev/`, ...process.argv.slice(2)];
const fullSitePaths = ['/docs/', '/demo/', '/product/', '/prelaunch/', '/assets/site.js', '/assets/img/windows-app-chat-ran-on-mac-2026-10-19.webp'];

const results = [];
const record = (ok, what) => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`); };
const get = url => fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });

for (const url of publicUrls) {
  const r = await get(url);
  const body = await r.text();
  record(r.status === 200 && body.includes('The network is taking shape.'), `${url} -> ${r.status}, prelaunch page`);
  record(!/noindex/.test(body) && !r.headers.get('x-robots-tag'), `${url} is indexable`);
  record(!!r.headers.get('content-security-policy'), `${url} sends a Content-Security-Policy`);
  record(!!r.headers.get('strict-transport-security'), `${url} sends Strict-Transport-Security`);
  record(!/cloudflareinsights/.test(await (await fetch(url, { headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0 Chrome/130' } })).text()), `${url} has no injected analytics beacon`);
  for (const p of fullSitePaths) {
    const s = await get(new URL(p, url));
    record(s.status === 404, `${new URL(p, url)} -> ${s.status} (complete site not served)`);
  }
}
const http = await get('http://ucompute.org/');
record([301, 302, 307, 308].includes(http.status) && (http.headers.get('location') || '').startsWith('https://'), `http://ucompute.org/ -> ${http.status} ${http.headers.get('location')}`);
const www = await get('https://www.ucompute.org/docs/?x=1');
record([301, 308].includes(www.status) && www.headers.get('location') === 'https://ucompute.org/docs/?x=1', `https://www.ucompute.org/docs/?x=1 -> ${www.status} ${www.headers.get('location')}`);

for (const url of privateUrls) {
  const r = await get(url);
  const loc = r.headers.get('location') || '';
  const body = r.status === 200 ? await r.text() : '';
  record((r.status === 302 && /\.cloudflareaccess\.com\//.test(loc)) || r.status === 401 || r.status === 403, `${url} -> ${r.status} ${loc.split('?')[0]}`);
  record(!body.includes('Two computers'), `${url} does not leak complete-site content`);
}

// Through Access with the service token in ~/.config/ucompute/access.env (never printed): every hosted installer of
// a shown release downloads and matches its recorded size and SHA-256.
const envFile = `${process.env.HOME}/.config/ucompute/access.env`;
if (existsSync(envFile)) {
  const env = Object.fromEntries(readFileSync(envFile, 'utf8').split('\n').filter(l => l.includes('=')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
  const headers = { 'CF-Access-Client-Id': env.CF_ACCESS_CLIENT_ID, 'CF-Access-Client-Secret': env.CF_ACCESS_CLIENT_SECRET };
  const base = 'https://stage-snapshot.ucompute-website.pages.dev';
  const page = await fetch(`${base}/download/`, { headers, redirect: 'manual', signal: AbortSignal.timeout(20000) });
  record(page.status === 200, `${base}/download/ with the service token -> ${page.status}`);
  const { releases } = JSON.parse(readFileSync(new URL('./reference/releases.json', import.meta.url), 'utf8'));
  for (const r of releases.filter(r => r.approval?.owner && r.approval?.cohort)) for (const a of r.artifacts.filter(a => a.url.startsWith('/releases/'))) {
    const res = await fetch(base + a.url, { headers, redirect: 'manual', signal: AbortSignal.timeout(120000) });
    const data = res.status === 200 ? Buffer.from(await res.arrayBuffer()) : Buffer.alloc(0);
    const sha = createHash('sha256').update(data).digest('hex');
    record(res.status === 200 && data.length === a.bytes && sha === a.sha256, `${base}${a.url} with the service token -> ${res.status}, ${data.length} bytes, sha256 ${sha.slice(0, 12)}… (record ${a.sha256.slice(0, 12)}…)`);
  }
} else console.log('skip  authenticated checks: no ~/.config/ucompute/access.env');

const failed = results.filter(ok => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : '\nall live checks passed');
process.exit(failed ? 1 : 0);
