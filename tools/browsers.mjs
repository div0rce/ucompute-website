// Cross-browser check of a built site in Chromium, Firefox and WebKit (headless).
//   node tools/browsers.mjs <dist> [outDir]
// Needs `playwright` and `axe-core` resolvable from here (the site itself has no dependencies; this runs on the
// Linux test host, see docs/VERIFICATION.md). Serves <dist> on 127.0.0.1:4173 and checks every page at 1440 and
// 390 px: page errors, failed requests, horizontal overflow and axe WCAG 2.2 AA. On the home page it also checks
// the motion rules: the fabric animates, stops under reduced motion and when paused, and falls back to the
// static dot field without WebGL. Exits 1 on any problem; screenshots go to outDir.
import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

const [dist, out = 'browser-shots'] = process.argv.slice(2);
if (!dist) { console.error('usage: node tools/browsers.mjs <dist> [outDir]'); process.exit(2); }
mkdirSync(out, { recursive: true });
const axeSrc = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
const server = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(req.url.split('?')[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(4173, '127.0.0.1');
const BASE = 'http://127.0.0.1:4173';
const pages = JSON.parse(readFileSync(join(dist, 'build.json'), 'utf8')).pages.filter(p => p.endsWith('/'));
const problems = [];
const bad = (where, msg) => { problems.push(`${where}: ${msg}`); console.log(`  FAIL ${where}: ${msg}`); };

// Count animation frames requested over one second.
const countFrames = page => page.evaluate(() => new Promise(r => { const n0 = window.__raf; setTimeout(() => r(window.__raf - n0), 1000); }));
const RAF = 'window.__raf=0;const _r=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=f=>{window.__raf++;return _r(f)};';
const NO_WEBGL = "const _g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/.test(t)?null:_g.call(this,t,...a)};";

for (const [name, type] of [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]) {
  const browser = await type.launch();
  console.log(`${name} ${browser.version()}`);
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 900 : 844 } });
    for (const path of pages) {
      const where = `${name} ${width} ${path}`;
      const page = await ctx.newPage();
      page.on('pageerror', e => bad(where, `page error: ${e.message}`));
      page.on('console', m => { if (m.type() === 'error') bad(where, `console: ${m.text()}`); });
      page.on('requestfailed', r => bad(where, `request failed: ${r.url()}`));
      page.on('response', r => { if (r.status() >= 400) bad(where, `HTTP ${r.status()} ${r.url()}`); });
      await page.goto(BASE + path, { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) bad(where, `horizontal overflow ${overflow}px`);
      await page.addScriptTag({ content: axeSrc });
      const v = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] })).violations.map(v => `${v.id} x${v.nodes.length} ${v.nodes[0].target}`));
      for (const x of v) bad(where, `axe ${x}`);
      if (path === '/') await page.screenshot({ path: join(out, `${name}-${width}-home.png`) });
      if (path === '/start/') await page.screenshot({ path: join(out, `${name}-${width}-start.png`), fullPage: true });
      await page.close();
    }
    if (width === 390) {
      const page = await ctx.newPage();
      await page.goto(BASE + '/product/');
      await page.click('.menu-toggle');
      const open = await page.evaluate(() => document.body.classList.contains('menu-open') && document.querySelector('.menu-toggle').getAttribute('aria-expanded') === 'true');
      if (!open) bad(`${name} 390`, 'menu does not open');
      await page.close();
    }
    await ctx.close();
  }

  // Motion rules on the home page.
  const motion = async (opts, init) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
    await ctx.addInitScript(RAF + (init || ''));
    const page = await ctx.newPage();
    await page.goto(BASE + '/');
    await page.waitForTimeout(600);
    return { ctx, page, live: await page.evaluate(() => document.querySelector('.fabric').classList.contains('fabric-live')) };
  };
  {
    const { ctx, page, live } = await motion({});
    const frames = await countFrames(page);
    console.log(`  motion: WebGL ${live ? 'live' : 'unavailable (static field)'}, ${frames} frames/s`);
    // Headless browsers draw WebGL in software (about 13 to 26 frames a second here); this only checks the loop runs.
    if (live && frames < 5) bad(`${name} motion`, `fabric is live but only ${frames} frames in a second`);
    const toggle = page.locator('.motion-toggle-hero');
    await toggle.click();
    await page.waitForTimeout(300);
    const paused = await page.evaluate(() => document.documentElement.classList.contains('motion-paused') && document.querySelector('.motion-toggle').getAttribute('aria-pressed') === 'true');
    const afterPause = await countFrames(page);
    if (!paused) bad(`${name} motion`, 'pause toggle did not pause');
    if (afterPause > 2) bad(`${name} motion`, `${afterPause} frames a second after pausing`);
    await toggle.click(); // leave the stored preference as it was
    await ctx.close();
  }
  {
    const { ctx, page } = await motion({ reducedMotion: 'reduce' });
    const frames = await countFrames(page);
    if (frames > 2) bad(`${name} reduced motion`, `${frames} frames a second`);
    await ctx.close();
  }
  {
    const { ctx, page, live } = await motion({}, NO_WEBGL);
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.fabric')).backgroundImage);
    if (live) bad(`${name} no WebGL`, 'fabric-live set without WebGL');
    if (!/radial-gradient/.test(bg)) bad(`${name} no WebGL`, 'no static dot field');
    await page.screenshot({ path: join(out, `${name}-1440-home-no-webgl.png`) });
    await ctx.close();
  }
  await browser.close();
}
server.close();
console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall browser checks passed');
process.exit(problems.length ? 1 : 0);
