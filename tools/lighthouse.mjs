// Lighthouse audit of a built site, every page, mobile and desktop.
//   node build.mjs public dist-public && CHROME_PATH=<chrome> node tools/lighthouse.mjs dist-public
// Audit the public build: the preview build is noindex by design, which Lighthouse scores as an SEO failure.
// Needs `lighthouse` installed next to it (it runs on the Linux test host, like tools/browsers.mjs). The local
// server gzips text like Cloudflare does. Fails below 90 performance, 100 accessibility, 95 best practices or SEO.
import lighthouse from 'lighthouse';
import desktop from 'lighthouse/core/config/desktop-config.js';
import { launch } from 'chrome-launcher';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const [dist] = process.argv.slice(2);
if (!dist) { console.error('usage: CHROME_PATH=<chrome> node tools/lighthouse.mjs <dist>'); process.exit(2); }
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  const type = TYPES[extname(p)] || 'application/octet-stream';
  let body = readFileSync(p);
  const headers = { 'content-type': type, 'cache-control': /\.(css|js|woff2)$/.test(p) ? 'public, max-age=31536000, immutable' : 'no-cache' };
  if (/^(text|application\/(json|xml)|image\/svg)/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) { body = gzipSync(body); headers['content-encoding'] = 'gzip'; }
  res.writeHead(200, headers);
  res.end(body);
}).listen(4174, '127.0.0.1');

const MIN = { performance: 90, accessibility: 100, 'best-practices': 95, seo: 95 };
const pages = JSON.parse(readFileSync(join(dist, 'build.json'), 'utf8')).pages.filter(p => p.endsWith('/'));
const chrome = await launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] });
const problems = [];
for (const [form, config] of [['mobile', undefined], ['desktop', desktop]]) {
  for (const path of pages) {
    const { lhr } = await lighthouse(`http://127.0.0.1:4174${path}`, { port: chrome.port, logLevel: 'error', onlyCategories: Object.keys(MIN) }, config);
    const s = Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
    const low = Object.keys(MIN).filter(k => s[k] < MIN[k]);
    const m = lhr.audits;
    console.log(`${low.length ? 'FAIL' : 'ok  '} ${form.padEnd(7)} ${path.padEnd(28)} perf ${s.performance} a11y ${s.accessibility} bp ${s['best-practices']} seo ${s.seo}  LCP ${m['largest-contentful-paint'].displayValue} CLS ${m['cumulative-layout-shift'].displayValue} TBT ${m['total-blocking-time'].displayValue}`);
    for (const k of low) {
      problems.push(`${form} ${path} ${k} ${s[k]}`);
      const failing = Object.values(lhr.categories[k].auditRefs).map(r => m[r.id]).filter(a => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative');
      for (const a of failing.slice(0, 5)) console.log(`       ${a.id}: ${a.displayValue || a.title}`);
    }
  }
}
await chrome.kill();
server.close();
console.log(problems.length ? `\n${problems.length} below threshold` : '\nall pages meet the thresholds');
process.exit(problems.length ? 1 : 0);
