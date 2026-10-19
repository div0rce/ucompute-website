// Static site build, no dependencies. One source, three outputs:
//   prelaunch  ucompute.org today: the public page only, indexable.
//   preview    preview.ucompute.org: the complete site, noindex, behind Cloudflare Access.
//   public     the complete site, indexable. Used only after the owner approves launch.
// Usage: node build.mjs [mode] [outDir]. Mode defaults to $UCOMPUTE_SITE, then "prelaunch",
// so a missing setting can never publish the full site.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MODES = ['prelaunch', 'preview', 'public'];
export const ORIGIN = 'https://ucompute.org';
export const GITHUB = 'https://github.com/div0rce/common';
export const PREVIEW = 'https://preview.ucompute.org';

export const NAV = [
  ['/product/', 'Product'],
  ['/demo/', 'Demo'],
  ['/architecture/', 'Architecture'],
  ['/developers/', 'Developers'],
  ['/docs/', 'Docs'],
  ['/roadmap/', 'Roadmap'],
  ['/open-source/', 'Open source'],
];

export const DOCS = [
  ['/docs/', 'Overview'],
  ['/docs/install/', 'Install'],
  ['/docs/run/', 'Run models'],
  ['/docs/configuration/', 'Configuration'],
  ['/docs/mesh/', 'Trusted devices'],
  ['/docs/api/', 'API reference'],
  ['/docs/troubleshooting/', 'Troubleshooting'],
];

const FOOTER = [
  ['Product', [['/product/', 'Product'], ['/demo/', 'Mac ↔ Windows demo'], ['/vision/', 'Vision'], ['/architecture/', 'Architecture'], ['/roadmap/', 'Roadmap']]],
  ['Use and build', [['/download/', 'Download and releases'], ['/docs/', 'Documentation'], ['/developers/', 'Developers'], ['/docs/api/', 'API reference']]],
  ['Project', [['/open-source/', 'Open source'], ['/community/', 'Community'], ['/open-source/#security', 'Security'], [GITHUB, 'GitHub']]],
];

// Lowest-common-denominator escaping for values that land in attributes.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// A page file starts with a comment of "key: value" lines, then the body HTML.
export function parsePage(src, file) {
  const m = src.match(/^<!--\n([\s\S]*?)\n-->\n/);
  if (!m) throw new Error(`${file}: missing front matter comment`);
  const meta = Object.fromEntries(m[1].split('\n').filter(Boolean).map(l => {
    const i = l.indexOf(':');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }));
  for (const k of ['title', 'description']) if (!meta[k]) throw new Error(`${file}: front matter needs ${k}`);
  return { meta, body: src.slice(m[0].length) };
}

function walk(dir) {
  return readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// src/pages/product/index.html -> /product/ ; src/pages/404.html -> /404.html
const urlPath = rel => rel === 'index.html' ? '/' : rel.endsWith('/index.html') ? '/' + rel.slice(0, -10) : '/' + rel;

const icon = {
  mark: '<svg viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M11 13v13.1c0 7.1 4.5 11.4 11 11.4s11-4.3 11-11.4V13" stroke="currentColor" stroke-width="6.2" stroke-linecap="square"/><path d="M22 5v9" stroke="currentColor" stroke-width="6.2" stroke-linecap="square"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .9A11.1 11.1 0 0 0 8.5 22.5c.55.1.75-.24.75-.53v-2c-3.05.66-3.69-1.3-3.69-1.3-.5-1.27-1.22-1.6-1.22-1.6-1-.68.08-.67.08-.67 1.1.07 1.67 1.13 1.67 1.13.98 1.68 2.58 1.2 3.21.92.1-.71.39-1.2.71-1.47-2.44-.28-5-1.22-5-5.48 0-1.21.43-2.2 1.13-2.98-.12-.28-.49-1.42.11-2.94 0 0 .92-.29 3.04 1.14a10.6 10.6 0 0 1 5.53 0c2.12-1.43 3.04-1.14 3.04-1.14.6 1.52.23 2.66.11 2.94.7.78 1.13 1.77 1.13 2.98 0 4.27-2.57 5.2-5.02 5.47.4.35.75 1.02.75 2.05v3.05c0 .3.2.64.76.53A11.1 11.1 0 0 0 12 .9Z"/></svg>',
};
export const brand = '<span class="brand-mark">' + icon.mark + '</span><span class="brand-word">ucompute<span>.</span></span>';

function head({ meta, path, mode, assets }) {
  const url = ORIGIN + path;
  const title = path === '/' && mode !== 'prelaunch' ? meta.title : meta.title.includes('UCompute') ? meta.title : `${meta.title} | UCompute`;
  const noindex = mode === 'preview' || meta.noindex === 'true';
  const image = ORIGIN + (meta.image || '/assets/img/og-ucompute.png');
  const ld = path === '/' ? `\n<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'UCompute', url: ORIGIN + '/', logo: ORIGIN + '/assets/img/ucompute-mark.png', sameAs: [GITHUB] },
      { '@type': 'WebSite', '@id': ORIGIN + '/#site', name: 'UCompute', url: ORIGIN + '/', publisher: { '@id': ORIGIN + '/#org' } },
    ],
  })}</script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(meta.description)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<link rel="canonical" href="${url}">
<meta name="theme-color" content="#f7f8f3">
<meta property="og:type" content="website">
<meta property="og:site_name" content="UCompute">
<meta property="og:title" content="${esc(meta.ogTitle || title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="UCompute: compute better, together.">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/ucompute-mark.png">
<link rel="stylesheet" href="/assets/ucompute.css?v=${assets.css}">
${(meta.scripts || 'site').split(/\s+/).map(s => `<script src="/assets/${s}.js?v=${assets[s]}" defer></script>`).join('\n')}${ld}
</head>`;
}

function header(path, mode) {
  const current = href => path === href || (href !== '/' && path.startsWith(href)) ? ' aria-current="page"' : '';
  const announce = mode === 'preview'
    ? `<aside class="announce announce-preview" aria-label="Site notice"><span class="announce-dot" aria-hidden="true"></span>Team preview. Not public, not indexed. Claims reflect engineering evidence up to 2026-10-19.</aside>`
    : `<aside class="announce" aria-label="News"><span class="announce-dot" aria-hidden="true"></span>Recorded on 2026-10-19: a Windows laptop ran a prompt on a Mac across a paired connection. <a href="/demo/">See the evidence</a></aside>`;
  return `<a href="#main" class="skip-link">Skip to content</a>
${announce}
<header class="site-header">
<nav class="nav shell" aria-label="Main">
<a class="brand" href="/" aria-label="UCompute home">${brand}</a>
<div class="nav-links" id="nav-links">
${NAV.map(([href, label]) => `<a href="${href}"${current(href)}>${label}</a>`).join('\n')}
<a class="nav-mobile-only" href="/download/"${current('/download/')}>Download</a>
</div>
<div class="nav-right">
<a class="icon-link" href="${GITHUB}" aria-label="UCompute on GitHub">${icon.github}</a>
<a class="btn btn-dark" href="/download/">Download</a>
<button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
</div>
</nav>
</header>`;
}

function footer(mode) {
  return `<footer class="footer">
<div class="shell">
<div class="footer-main">
<div class="footer-brand"><a class="brand" href="/" aria-label="UCompute home">${brand}</a><p>Compute better. Together. An open computing layer for the devices you own and trust.</p></div>
<nav class="footer-nav" aria-label="Footer">
${FOOTER.map(([h, links]) => `<div><h2>${h}</h2><ul>${links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul></div>`).join('\n')}
</nav>
</div>
<div class="footer-bottom"><span>© 2026 UCompute project. Apache-2.0. UCompute is the public name in use; trademark clearance is open. The implementation is named Common.</span>${mode === 'preview' ? '<a href="/prelaunch/">Review the public page</a>' : '<a href="#main">Back to top</a>'}</div>
</div>
</footer>`;
}

function docsShell(path, body) {
  const i = DOCS.findIndex(([href]) => href === path);
  const prev = DOCS[i - 1], next = DOCS[i + 1];
  return `<div class="shell docs">
<nav class="docs-nav" aria-label="Documentation"><h2>Documentation</h2><ul>
${DOCS.map(([href, label]) => `<li><a href="${href}"${href === path ? ' aria-current="page"' : ''}>${label}</a></li>`).join('\n')}
</ul></nav>
<article class="docs-main prose">
${body}
<nav class="docs-pager" aria-label="Previous and next">${prev ? `<a href="${prev[0]}"><span>Previous</span>${prev[1]}</a>` : '<span></span>'}${next ? `<a href="${next[0]}"><span>Next</span>${next[1]}</a>` : ''}</nav>
</article>
</div>`;
}

// Shared snippets pages can drop in, so icons and URLs live in one place.
const fill = s => s.replaceAll('{{brand}}', brand).replaceAll('{{github-icon}}', icon.github).replaceAll('{{github}}', GITHUB).replaceAll('{{preview}}', PREVIEW);

export function render(page, mode, assets) {
  const { meta, path } = page;
  const body = fill(page.body);
  if (meta.layout === 'bare') return `${head({ meta, path, mode, assets })}\n<body>\n${body}</body>\n</html>\n`;
  const inner = meta.layout === 'docs' ? docsShell(path, body) : body;
  return `${head({ meta, path, mode, assets })}
<body>
${header(path, mode)}
<main id="main">
${inner}
</main>
${footer(mode)}
</body>
</html>
`;
}

const hash = file => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10);

export function build(mode, out) {
  if (!MODES.includes(mode)) throw new Error(`unknown mode "${mode}"; use one of ${MODES.join(', ')}`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  // The public prelaunch deployment ships only what its page uses, so nothing from the
  // complete site (evidence screenshots, docs scripts) is reachable on ucompute.org.
  const PRELAUNCH_FILES = ['favicon.svg', 'assets', 'assets/ucompute.css', 'assets/prelaunch.js', 'assets/fonts', 'assets/img', 'assets/img/og-ucompute.png', 'assets/img/ucompute-mark.png'];
  cpSync(join(ROOT, 'public'), out, {
    recursive: true,
    filter: src => {
      const rel = src.slice(join(ROOT, 'public').length + 1);
      return mode !== 'prelaunch' || rel === '' || PRELAUNCH_FILES.some(f => rel === f || rel.startsWith('assets/fonts/'));
    },
  });
  const assets = { css: hash(join(ROOT, 'public/assets/ucompute.css')) };
  for (const f of readdirSync(join(ROOT, 'public/assets')).filter(f => f.endsWith('.js'))) assets[f.slice(0, -3)] = hash(join(ROOT, 'public/assets', f));

  // Which sources become which URLs.
  const full = mode !== 'prelaunch';
  const sources = [];
  if (full) {
    const dir = join(ROOT, 'src/pages');
    for (const f of walk(dir).filter(f => f.endsWith('.html'))) sources.push([f, urlPath(f.slice(dir.length + 1))]);
    if (mode === 'preview') sources.push([join(ROOT, 'src/prelaunch/index.html'), '/prelaunch/']);
  } else {
    sources.push([join(ROOT, 'src/prelaunch/index.html'), '/'], [join(ROOT, 'src/prelaunch/404.html'), '/404.html']);
  }

  const pages = sources.map(([file, path]) => ({ ...parsePage(readFileSync(file, 'utf8'), file), path, file }));
  for (const p of pages) {
    const dest = p.path.endsWith('/') ? join(out, p.path, 'index.html') : join(out, p.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, render(p, mode, assets));
  }

  const indexable = pages.filter(p => p.path !== '/404.html' && p.path !== '/prelaunch/' && p.meta.noindex !== 'true');
  writeFileSync(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexable.map(p => `<url><loc>${ORIGIN}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`);
  writeFileSync(join(out, 'robots.txt'), mode === 'preview'
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

  // Cloudflare Pages headers. The CSP allows only this origin; pages use no inline script or style attributes.
  const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'";
  writeFileSync(join(out, '_headers'), `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000
${mode === 'preview' ? '  X-Robots-Tag: noindex, nofollow\n' : ''}
/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable
`);
  writeFileSync(join(out, 'build.json'), JSON.stringify({ mode, pages: pages.map(p => p.path).sort(), commit: process.env.CF_PAGES_COMMIT_SHA || null, branch: process.env.CF_PAGES_BRANCH || null }, null, 2) + '\n');
  return pages;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] || process.env.UCOMPUTE_SITE || 'prelaunch';
  const out = process.argv[3] || join(ROOT, 'dist');
  const pages = build(mode, out);
  console.log(`built ${pages.length} page(s) in ${mode} mode -> ${out}`);
}
