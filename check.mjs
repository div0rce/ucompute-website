// Validates built output. No dependencies.
//   node check.mjs              build all three modes into a temp dir and check each
//   node check.mjs dist         check an existing build (mode read from dist/build.json)
//   node check.mjs --external   also fetch every external link once
import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { tmpdir } from 'node:os';
import { build } from './build.mjs';

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
    if (!/<title>[^<]{5,}<\/title>/.test(html)) fail(where, 'missing <title>');
    if (!/<meta name="description" content="[^"]{40,}">/.test(html)) fail(where, 'missing or short meta description');
    if (!/<link rel="canonical" href="https:\/\/ucompute\.org\//.test(html)) fail(where, 'missing canonical');
    if (!/<meta name="viewport"/.test(html)) fail(where, 'missing viewport');
    if (html.includes('{{')) fail(where, 'unfilled {{placeholder}}');
    if (/\sstyle="/.test(html)) fail(where, 'inline style attribute (blocked by the CSP)');
    if (/\son[a-z]+="/.test(html)) fail(where, 'inline event handler (blocked by the CSP)');
    for (const m of html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>/g)) if (!m[1].includes('application/ld+json')) fail(where, 'inline script (blocked by the CSP)');
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
  }
  for (const f of files.filter(f => /\.(html|css|js|txt|json|xml)$/.test(f) || f === '_headers')) {
    const text = readFileSync(join(root, f), 'utf8');
    if (/-----BEGIN [A-Z ]*PRIVATE KEY-----|\bghp_[A-Za-z0-9]{20,}|\bAKIA[0-9A-Z]{16}\b|\bsk-[A-Za-z0-9]{20,}/.test(text)) fail(`${mode}/${f}`, 'looks like a secret');
  }
  console.log(`${mode}: ${pages.length} pages, ${files.length} files checked`);
  return externalLinks;
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
