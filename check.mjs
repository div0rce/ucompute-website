// Validates built output. No dependencies.
//   node check.mjs              build all three modes into a temp dir and check each
//   node check.mjs dist         check an existing build (mode read from dist/build.json)
//   node check.mjs --external   also fetch every external link once
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, posix } from 'node:path';
import { tmpdir } from 'node:os';
import { build, releasesFor } from './build.mjs';

const args = process.argv.slice(2);
const external = args.includes('--external');
const dirArg = args.find(a => !a.startsWith('--'));
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const walk = d => readdirSync(d).flatMap(n => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);
const attrs = (html, name) => [...html.matchAll(new RegExp(`\\s${name}="([^"]*)"`, 'g'))].map(m => m[1]);

function resolveFile(root, urlPath) {
  const p = decodeURIComponent(urlPath);
  const candidates = p.endsWith('/') ? [p + 'index.html'] : [p, p + '/index.html'];
  return candidates.map(c => join(root, c)).find(f => existsSync(f) && statSync(f).isFile());
}

// Every file in the public prelaunch deployment must be on this list.
const PRELAUNCH_ALLOWED = /^(index\.html|404\.html|robots\.txt|sitemap\.xml|_headers|build\.json|favicon\.svg|assets\/ucompute\.css|assets\/prelaunch\.js|assets\/fonts\/[\w.-]+|assets\/img\/(og-ucompute|ucompute-mark)\.png)$/;

function check(root, mode) {
  const files = walk(root).map(f => f.slice(root.length + 1));
  const pages = files.filter(f => f.endsWith('.html'));
  const ids = new Map();
  const externalLinks = new Set();
  const seen = new Map();

  for (const f of pages) {
    const html = readFileSync(join(root, f), 'utf8');
    const pageIds = attrs(html, 'id');
    ids.set(f, new Set(pageIds));
    const dup = pageIds.filter((id, i) => pageIds.indexOf(id) !== i);
    if (dup.length) fail(f, `duplicate ids: ${[...new Set(dup)].join(', ')}`);
  }

  for (const f of pages) {
    const html = readFileSync(join(root, f), 'utf8');
    const where = `${mode}/${f}`;
    if (!/<html lang="en">/.test(html)) fail(where, 'missing <html lang>');
    if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(where, 'needs exactly one <h1>');
    // Search snippets: a title search engines show whole, a 50 to 160 character description, both unique.
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || '', desc = html.match(/<meta name="description" content="([^"]*)">/)?.[1] || '';
    if (title.length < 5 || title.length > 65) fail(where, `title is ${title.length} characters; keep it 5 to 65`);
    // 404 pages are noindex, and the prelaunch one is frozen (D-023).
    if (!f.endsWith('404.html') && (desc.length < 50 || desc.length > 160)) fail(where, `meta description is ${desc.length} characters; keep it 50 to 160`);
    for (const [kind, v] of [['title', title], ['description', desc]]) {
      if (f.endsWith('404.html')) break;
      if (seen.has(kind + v)) fail(where, `same ${kind} as ${seen.get(kind + v)}`); else seen.set(kind + v, f);
    }
    if (!/<link rel="canonical" href="https:\/\/ucompute\.org\//.test(html)) fail(where, 'missing canonical');
    if (!/<meta name="viewport"/.test(html)) fail(where, 'missing viewport');
    if (html.includes('{{')) fail(where, 'unfilled {{placeholder}}');
    if (/\sstyle="/.test(html)) fail(where, 'inline style attribute (blocked by the CSP)');
    if (/\son[a-z]+="/.test(html)) fail(where, 'inline event handler (blocked by the CSP)');
    for (const m of html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>/g)) if (!m[1].includes('application/ld+json')) fail(where, 'inline script (blocked by the CSP)');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch { fail(where, 'structured data is not valid JSON'); } }
    if (/href="#"/.test(html)) fail(where, 'empty href="#"');
    const noindex = html.includes('<meta name="robots" content="noindex');
    if (mode === 'preview' && !noindex) fail(where, 'preview page without noindex');
    if (mode !== 'preview' && noindex && !f.endsWith('404.html')) fail(where, 'public page marked noindex');
    for (const img of html.match(/<img\b[^>]*>/g) || []) {
      if (!/\salt="/.test(img)) fail(where, `image without alt: ${img.slice(0, 80)}`);
      if (!/\swidth="\d+"/.test(img) || !/\sheight="\d+"/.test(img)) fail(where, `image without width/height: ${img.slice(0, 80)}`);
    }
    for (const ref of [...attrs(html, 'aria-controls'), ...attrs(html, 'aria-labelledby').flatMap(v => v.split(' '))]) {
      if (!ids.get(f).has(ref)) fail(where, `aria reference to missing id "${ref}"`);
    }
    for (const a of html.match(/<a\b[^>]*>/g) || []) if (/target="_blank"/.test(a) && !/rel="[^"]*noopener/.test(a)) fail(where, `target=_blank without rel=noopener: ${a}`);

    const base = '/' + f.replace(/index\.html$/, '');
    for (const raw of [...attrs(html, 'href'), ...attrs(html, 'src')]) {
      if (/^(mailto:|tel:)/.test(raw)) continue;
      if (/^https?:\/\//.test(raw)) {
        if (raw.startsWith('http://') && !raw.startsWith('http://127.0.0.1') && !raw.startsWith('http://localhost')) fail(where, `insecure link ${raw}`);
        if (!/^https:\/\/ucompute\.org\//.test(raw)) externalLinks.add(raw);
        continue;
      }
      const [pathAndQuery, hash] = raw.split('#');
      const path = pathAndQuery.split('?')[0];
      const target = path === '' ? f : (() => {
        const abs = path.startsWith('/') ? path : posix.join(base, path);
        const file = resolveFile(root, abs);
        if (!file) { fail(where, `broken link ${raw}`); return null; }
        return file.slice(root.length + 1);
      })();
      if (target && hash && target.endsWith('.html') && !ids.get(target)?.has(hash)) fail(where, `missing anchor ${raw}`);
    }
  }

  const robots = readFileSync(join(root, 'robots.txt'), 'utf8');
  const headers = readFileSync(join(root, '_headers'), 'utf8');
  if (!headers.includes('Content-Security-Policy')) fail(mode, '_headers missing CSP');
  if (mode === 'preview') {
    if (!robots.includes('Disallow: /')) fail(mode, 'robots.txt must disallow everything');
    if (!headers.includes('X-Robots-Tag: noindex')) fail(mode, '_headers missing X-Robots-Tag');
  } else {
    if (robots.includes('Disallow: /')) fail(mode, 'robots.txt blocks a public deployment');
    if (headers.includes('X-Robots-Tag')) fail(mode, 'X-Robots-Tag on a public deployment');
  }
  if (mode === 'prelaunch') {
    for (const f of files) if (!PRELAUNCH_ALLOWED.test(f)) fail(mode, `file not allowed in the public prelaunch build: ${f}`);
    // Source is unpublished: the public page links to no repository (snapshot 2026-10-22, section 9).
    for (const f of files) if (/\.html$/.test(f) && /github\.com/i.test(readFileSync(join(root, f), 'utf8'))) fail(mode, `repository link in the public prelaunch build: ${f}`);
  }
  for (const f of files.filter(f => /\.(html|css|js|txt|json|xml)$/.test(f) || f === '_headers')) {
    const text = readFileSync(join(root, f), 'utf8');
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|\bghp_[A-Za-z0-9]{20,}|\bAKIA[0-9A-Z]{16}\b|\bsk-[A-Za-z0-9]{20,}/.test(text)) fail(`${mode}/${f}`, 'looks like a secret');
  }
  // Page weight budget: the page's HTML plus the local CSS and JS it loads (fonts and images excluded).
  for (const f of pages) {
    const html = readFileSync(join(root, f), 'utf8');
    let bytes = Buffer.byteLength(html);
    for (const m of html.matchAll(/(?:href|src)="(\/assets\/[^"?]+\.(?:css|js))/g)) bytes += statSync(join(root, m[1])).size;
    if (bytes > 250 * 1024) fail(`${mode}/${f}`, `page weight ${(bytes / 1024).toFixed(0)} KB is over the 250 KB budget`);
  }
  // Dead CSS: every class the stylesheet styles must appear in a page or script of the complete site
  // (the preview build carries the prelaunch page; its 404 is read from source).
  if (mode === 'preview') {
    const used = files.filter(f => /\.(html|js)$/.test(f)).map(f => readFileSync(join(root, f), 'utf8')).join('\n') + readFileSync(new URL('./src/prelaunch/404.html', import.meta.url), 'utf8');
    const css = readFileSync(join(root, 'assets/ucompute.css'), 'utf8').replace(/\{[^}]*\}/g, '{}');
    for (const c of new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]))) if (!used.includes(c)) fail(mode, `unused CSS class .${c}`);
  }
  claimCheck(root, pages, mode);
  if (mode !== 'prelaunch') interfaceCheck(root, pages, mode);
  // Hosted installers: every file under releases/ belongs to a release this build shows, and matches its record.
  const shown = releasesFor(mode).flatMap(r => r.artifacts.map(a => ({ ...a, version: r.version })));
  for (const f of files.filter(f => f.startsWith('releases/'))) {
    const a = shown.find(a => f === `releases/${a.version}/${a.file}`);
    if (!a) { fail(mode, `${f} is not an artifact of a release this build shows`); continue; }
    const data = readFileSync(join(root, f));
    if (data.length !== a.bytes) fail(mode, `${f} is ${data.length} bytes; its record says ${a.bytes}`);
    if (createHash('sha256').update(data).digest('hex') !== a.sha256) fail(mode, `${f} does not match its recorded SHA-256`);
  }
  console.log(`${mode}: ${pages.length} pages, ${files.length} files checked`);
  return externalLinks;
}

// WP-13 claim check (spec section 29.5): risky wording must sit in a sentence that limits it.
// ponytail: sentence-level keyword heuristic; a reviewer still reads the output, it only catches regressions.
const RISKY = [
  [/\b(pool(?:ed|ing)?|split|partition(?:ed|ing)?|combined[- ]device|across devices)\b/i, 'pooling/split'],
  [/\bsupported\b/i, 'SUPPORTED'],
  [/\b(speed-?ups?|faster than|faster on)\b/i, 'speedup'],
  [/\b(privacy guarantee|guaranteed privacy|complete(?:ly)? private|fully private)\b/i, 'privacy guarantee'],
  [/\b(swarm|cloud|credits?|purchase|buy)\b.*\b(available|live|launched|operational|open now|today)\b/i, 'Swarm/Cloud/credits availability'],
  // Capability snapshot 2026-10-22, section 9: phrases that need a limiting word in the same sentence.
  [/\bopen[- ]source\b/i, 'open source'],
  [/\b(open protocol|open standard|interoperab\w*|interoperate\w*)\b/i, 'open protocol / interoperability'],
  [/\b(Apple Silicon|any Mac|M[134] Macs?)\b/i, 'Apple Silicon'],
  [/\b(download now|get the app|install now|available (?:for|on|now)|early access|waitlist|try the beta|join the beta)\b/i, 'availability'],
  [/\b(works offline|no internet|air-gapped|across the internet|from anywhere|remote access)\b/i, 'offline / internet'],
  [/\b(zero-knowledge|end-to-end private|military-grade|provable|verifiable inference|confidential comput\w*)\b/i, 'privacy / verification'],
  [/\b(one-click|in minutes|no setup)\b/i, 'install ease'],
  [/\btoo (?:big|large) for (?:one|a single|any single|either|any one)\b/i, 'models too big for one machine'],
  [/\b(picks?|chooses?) the best device\b|\bautomatically (?:picks?|chooses?)\b/i, 'automatic scheduling'],
  [/\bprivate mode\b|\b(?:never|nothing) leaves? (?:this|your) (?:device|computer)\b|\bnever leaves? (?:this|your) (?:device|computer)\b/i, 'private / never leaves', 'always'],
  // Snapshot draft 3, section 9: Linux and the Disconnect hold.
  [/\b(runs? on Linux|Linux (?:version|app)|works on Ubuntu|runs? on your home server)\b/i, 'Linux'],
  [/\b(stays disconnected|until you reconnect)\b/i, 'Disconnect hold', 'always'],
];
const LIMIT = /\b(not|no|never|none|nothing|isn't|aren't|doesn't|don't|won't|cannot|can't|without|until|before|planned|future|direction|hypothesis|would|disabled|gated|unsupported|yet|only|says nothing)\b|n't\b/i;
// Wording the snapshot itself prescribes, per rule.
const ALLOW = { SUPPORTED: /\bsupported (models?|kinds?|work|workloads?|release)\b/i, 'Apple Silicon': /\bcalibrated for Apple Silicon\b/i };
function claims(html) {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ');
  const out = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    for (const [re, label, always] of RISKY) {
      // The risky phrase itself never counts as its own limit; an 'always' rule has no limiting word at all.
      if (re.test(sentence) && (always || !LIMIT.test(sentence.replace(re, ' '))) && !ALLOW[label]?.test(sentence)) out.push(`${label}: "${sentence.trim().slice(0, 160)}"`);
    }
  }
  return out;
}
// While the source is unpublished, evidence identifiers stay in reference/claims.json, not on pages
// (capability snapshot 2026-10-22, "How to read references"); addresses only from the documentation range.
const IDENT = /\b(?:[FXIU]-\d{2}(?:-\d{2})?|B-0\d{2}|D-0\d{2}|WP-\d{2})\b|(?<!Apple )\bM(?:1[0-4]|\d)\b|§|\b[0-9a-f]{7}\b/;
const IP = /\b(?!127\.0\.0\.1\b|0\.0\.0\.0\b|192\.0\.2\.)\d{1,3}(?:\.\d{1,3}){3}\b/;
function claimCheck(root, pages, mode) {
  for (const f of pages) {
    const html = readFileSync(join(root, f), 'utf8');
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
    for (const re of [IDENT, IP]) { const m = text.match(re); if (m) fail(`${mode}/${f}`, `identifier on a rendered page: "${text.slice(Math.max(0, m.index - 40), m.index + 30).replace(/\s+/g, ' ').trim()}"`); }
    for (const c of claims(html)) fail(`${mode}/${f}`, `claim check, ${c}`);
    // Installer links only for artifacts recorded, with both approvals, in reference/releases.json.
    // Alpha releases are allowed only on the preview build (behind Access); a public build may link only public stages.
    const approved = new Set(releasesFor(mode).flatMap(r => r.artifacts.map(a => a.url)));
    for (const href of attrs(html, 'href')) if (/\.(dmg|exe|msi|pkg|zip|appimage|deb|rpm)(\?|$)/i.test(href) && !approved.has(href)) fail(`${mode}/${f}`, `download link with no release record: ${href}`);
  }
}

// Interface check: commands, flags, routes, error codes and environment variables named in code on a page
// must exist in reference/interfaces.json, exported from the engineering source by tools/interfaces.mjs.
const I = JSON.parse(readFileSync(new URL('./reference/interfaces.json', import.meta.url), 'utf8'));
const CMD = new Map(I.commands.map(c => [c.path, c]));
const FLAGS = c => new Set([...I.global, ...(c?.args || [])].flatMap(a => [a.long, a.short]).filter(Boolean));
const ALL_FLAGS = new Set(I.commands.flatMap(c => [...FLAGS(c)]));
// A documented path matches a route segment by segment; {param} in the route matches anything.
const routeKnown = (path, method) => I.routes.some(r => {
  const a = r.path.split('/'), b = path.split('/');
  return (!method || r.method === method) && a.length === b.length && a.every((s, i) => s === b[i] || /^\{.+\}$/.test(s));
});
// A JSON body in an example may only use the request fields of the route it is sent to.
function checkBody(where, method, path, json) {
  const route = I.routes.find(r => r.method === method && routeKnown(path, method) && r.path.split('/').length === path.split('/').length && r.path.split('/').every((s, i) => s === path.split('/')[i] || /^\{.+\}$/.test(s)));
  if (!route?.body) return fail(where, `${method} ${path} takes no request body`);
  const allowed = new Set(route.body.fields.flatMap(f => f.name.split(/[.[\]]+/).filter(Boolean)));
  for (const k of json.matchAll(/"(\w+)"\s*:/g)) if (!allowed.has(k[1])) fail(where, `${method} ${path} has no request field "${k[1]}"`);
}
const unescape = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
function interfaceCheck(root, pages, mode) {
  const errorRows = new Map(), documented = new Set();
  for (const f of pages) {
    const html = readFileSync(join(root, f), 'utf8');
    const where = `${mode}/${f}`;
    for (const m of html.matchAll(/<code\b[^>]*>([\s\S]*?)<\/code>/g)) {
      const code = unescape(m[1]);
      for (const r of code.matchAll(/\b(GET|POST|PUT|DELETE) (\/[\w/{}.-]*)/g)) {
        if (!routeKnown(r[2], r[1])) fail(where, `unknown route ${r[1]} ${r[2]}`);
        documented.add(`${r[1]} ${r[2]}`);
      }
      for (const seg of code.split(/(?=\bcurl\s)/)) {
        const url = seg.match(/https?:\/\/(?:127\.0\.0\.1|localhost):\d+(\/[\w/{}.-]*)/), data = seg.match(/-d\s+'([\s\S]*?)'/);
        if (url && data) checkBody(where, seg.match(/-X\s+([A-Z]+)/)?.[1] || 'POST', url[1], data[1]);
      }
      for (const b of code.matchAll(/\b(POST|PUT) (\/[\w/{}.-]*) (\{[\s\S]*\})/g)) checkBody(where, b[1], b[2], b[3]);
      for (const u of code.matchAll(/https?:\/\/(?:127\.0\.0\.1|localhost):\d+(\/[\w/{}.-]*)/g)) if (u[1] !== '/' && !routeKnown(u[1]) && !I.routes.some(r => r.path.startsWith(u[1] + '/'))) fail(where, `unknown route ${u[1]}`);
      for (const line of code.split('\n')) {
        const cm = line.replace(/\s#.*$/, '').match(/^\s*(?:\$\s*)?common\s+(.+)$/);
        if (!cm) continue;
        const words = cm[1].trim().split(/\s+/);
        let path = 'common', i = 0;
        for (; i < words.length && !words[i].startsWith('-') && CMD.has(`${path} ${words[i]}`); i++) path += ` ${words[i]}`;
        if ((path === 'common' || CMD.get(path).group) && words[i] && !words[i].startsWith('-')) { fail(where, `unknown command: ${path} ${words[i]}`); continue; }
        const ok = FLAGS(CMD.get(path));
        for (const fl of cm[1].matchAll(/(?:^|\s)(--?[a-zA-Z][\w-]*)/g)) {
          const flag = fl[1].replace(/^-([a-zA-Z])\1+$/, '-$1');
          if (!ok.has(flag)) fail(where, `${path} has no ${fl[1]}`);
        }
      }
      const lone = code.match(/^(--?[a-zA-Z][\w-]*)(?:[ =,].*)?$/);
      if (lone && !ALL_FLAGS.has(lone[1].replace(/^-([a-zA-Z])\1+$/, '-$1'))) fail(where, `no command takes ${lone[1]}`);
    }
    for (const v of html.matchAll(/\bCOMMON_[A-Z_]+\b/g)) if (!I.env.includes(v[0])) fail(where, `unknown environment variable ${v[0]}`);
    // The error table: a row of codes and the HTTP status they return.
    for (const row of html.matchAll(/<tr><td>((?:<code>[a-z_]+<\/code>(?:, )?)+)<\/td><td>(\d{3})<\/td>/g)) {
      for (const c of row[1].matchAll(/<code>([a-z_]+)<\/code>/g)) errorRows.set(c[1], [+row[2], where]);
    }
  }
  if (errorRows.size) {
    for (const [code, [status, where]] of errorRows) {
      const e = I.errors.find(e => e.code === code);
      if (!e) fail(where, `unknown error code ${code}`);
      else if (e.status !== status) fail(where, `${code} returns ${e.status}, the page says ${status}`);
    }
    for (const e of I.errors) if (!errorRows.has(e.code)) fail(mode, `error code ${e.code} (${e.status}) is not documented`);
    for (const r of I.routes) if (!documented.has(`${r.method} ${r.path}`)) fail(mode, `route ${r.method} ${r.path} is not documented`);
  }
}

const links = new Set();
if (dirArg) {
  const mode = JSON.parse(readFileSync(join(dirArg, 'build.json'), 'utf8')).mode;
  check(dirArg, mode).forEach(l => links.add(l));
} else {
  const tmp = mkdtempSync(join(tmpdir(), 'ucompute-check-'));
  try {
    for (const mode of ['prelaunch', 'preview', 'public']) {
      const out = join(tmp, mode);
      build(mode, out);
      check(out, mode).forEach(l => links.add(l));
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
}

if (external) {
  for (const url of links) {
    try {
      const r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (!r.ok) fail('external', `${url} -> HTTP ${r.status}`);
      else console.log(`ok ${r.status} ${url}`);
    } catch (e) { fail('external', `${url} -> ${e.message}`); }
  }
}

if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.map(e => '  ' + e).join('\n'));
  process.exit(1);
}
console.log('all checks passed');
