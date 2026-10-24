// Static site build, no dependencies. One source, three outputs:
//   prelaunch  ucompute.org today: the public page only, indexable.
//   preview    preview.ucompute.org: the complete site, noindex, behind Cloudflare Access.
//   public     the complete site, indexable. Used only after the owner approves launch.
// Usage: node build.mjs [mode] [outDir]. Mode defaults to $UCOMPUTE_SITE, then "prelaunch",
// so a missing setting can never publish the full site.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const MODES = ['prelaunch', 'preview', 'public'];
export const ORIGIN = 'https://ucompute.org';
export const PREVIEW = 'https://preview.ucompute.org';

export const NAV = [
  ['/product/', 'Product'],
  ['/demo/', 'Demo'],
  ['/architecture/', 'Architecture'],
  ['/developers/', 'Developers'],
  ['/docs/', 'Docs'],
  ['/roadmap/', 'Roadmap'],
  ['/open-source/', 'Project'],
];

export const DOCS = [
  ['/docs/', 'Overview'],
  ['/docs/install/', 'Install'],
  ['/docs/run/', 'Run models'],
  ['/docs/configuration/', 'Configuration'],
  ['/docs/mesh/', 'Trusted devices'],
  ['/docs/api/', 'API reference'],
  ['/docs/cli/', 'Command line'],
  ['/docs/troubleshooting/', 'Troubleshooting'],
];

const FOOTER = [
  ['Product', [['/product/', 'Product'], ['/demo/', 'Mac ↔ Windows demo'], ['/vision/', 'Vision'], ['/architecture/', 'Architecture'], ['/roadmap/', 'Roadmap']]],
  ['Use and build', [['/start/', 'Start here'], ['/download/', 'Release status'], ['/docs/', 'Documentation'], ['/developers/', 'Developers'], ['/docs/api/', 'API reference'], ['/docs/cli/', 'Command line']]],
  ['Project', [['/faq/', 'Questions'], ['/open-source/', 'License and rules'], ['/community/', 'Community'], ['/open-source/#security', 'Security']]],
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
      { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'UCompute', url: ORIGIN + '/', logo: ORIGIN + '/assets/img/ucompute-mark.png' },
      { '@type': 'WebSite', '@id': ORIGIN + '/#site', name: 'UCompute', url: ORIGIN + '/', publisher: { '@id': ORIGIN + '/#org' } },
    ],
  })}</script>` : meta.layout === 'docs' && path !== '/docs/' ? `\n<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Documentation', item: ORIGIN + '/docs/' },
      { '@type': 'ListItem', position: 2, name: meta.title, item: url },
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
<meta property="og:image:alt" content="${mode === 'prelaunch' ? 'UCompute: compute better, together.' : 'The UCompute logo'}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/ucompute-mark.png">
<link rel="stylesheet" href="/assets/ucompute.css?v=${assets.css}">${mode === 'prelaunch' ? '' : `
<link rel="preload" href="/assets/fonts/dm-sans-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/space-grotesk-var.woff2" as="font" type="font/woff2" crossorigin>`}
${(meta.scripts || 'site').split(/\s+/).map(s => `<script src="/assets/${s}.js?v=${assets[s]}" defer></script>`).join('\n')}${ld}
</head>`;
}

function header(path, mode) {
  const current = href => path === href || (href !== '/' && path.startsWith(href)) ? ' aria-current="page"' : '';
  const announce = mode === 'preview'
    ? `<aside class="announce announce-preview" aria-label="Site notice"><span class="announce-dot" aria-hidden="true"></span>Team preview. Not public, not indexed. Claims follow the engineering capability snapshot of 23 October 2026 (draft 3).</aside>`
    : `<aside class="announce" aria-label="News"><span class="announce-dot" aria-hidden="true"></span>Recorded on 19 October 2026 with development builds: a Windows laptop ran a prompt on a Mac across a paired connection. <a href="/demo/">See the evidence</a></aside>`;
  return `<a href="#main" class="skip-link">Skip to content</a>
${announce}
<header class="site-header${path === '/' ? ' header-over-hero' : ''}">
<nav class="nav shell" aria-label="Main">
<a class="brand" href="/" aria-label="UCompute home">${brand}</a>
<div class="nav-links" id="nav-links">
${NAV.map(([href, label]) => `<a href="${href}"${current(href)}>${label}</a>`).join('\n')}
<a class="nav-mobile-only" href="/start/"${current('/start/')}>Start here</a>
</div>
<div class="nav-right">
<a class="btn btn-dark" href="/start/">Start here</a>
<button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links"><span></span><span></span></button>
</div>
</nav>
</header>`;
}

function footer(mode) {
  return `<footer class="footer">
<div class="shell">
<div class="footer-main">
<div class="footer-brand"><a class="brand" href="/" aria-label="UCompute home">${brand}</a><p>Our direction: compute better, together, with an open computing layer for the devices you own and trust.</p></div>
<nav class="footer-nav" aria-label="Footer">
${FOOTER.map(([h, links]) => `<div><h2>${h}</h2><ul>${links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}</ul></div>`).join('\n')}
</nav>
</div>
<div class="footer-bottom"><span>© 2026 UCompute project. Licensed under Apache-2.0; the source has not been published yet. UCompute was formerly called Common; trademark clearance is open.</span><button class="motion-toggle" type="button" aria-pressed="false" hidden>Pause motion</button>${mode === 'preview' ? '<a href="/prelaunch/">Review the public page</a>' : '<a href="#main">Back to top</a>'}</div>
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
${path === '/docs/' ? body : body.replace('</h1>', '</h1>\n<p class="fine">Development code as of 23 October 2026. The source has not been published yet, so this page describes how the development builds work.</p>')}
<nav class="docs-pager" aria-label="Previous and next">${prev ? `<a href="${prev[0]}"><span>Previous</span>${prev[1]}</a>` : '<span></span>'}${next ? `<a href="${next[0]}"><span>Next</span>${next[1]}</a>` : ''}</nav>
</article>
</div>`;
}

// Claim markers (reference/claims.json): {{claim:ID}} ties a statement to its evidence and renders as nothing;
// {{if:gate}}A{{else}}B{{/if}} renders A once that gate is true, B until then. Unknown IDs or gates fail the build.
const CLAIMS = JSON.parse(readFileSync(join(ROOT, 'reference/claims.json'), 'utf8'));
const gate = (g, file) => { if (!(g in CLAIMS.gates)) throw new Error(`${file}: unknown gate "${g}"`); return CLAIMS.gates[g]; };
export function resolveClaims(s, file) {
  return s
    .replace(/\{\{if:([\w-]+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, g, yes, no) => gate(g, file) ? yes : no)
    .replace(/\{\{claim:([\w-]+)\}\}/g, (_, id) => { if (!CLAIMS.claims[id]) throw new Error(`${file}: unknown claim "${id}"`); return ''; })
    .replace(/\{\{q:([\w-]+)\}\}/g, (_, id) => { if (!CLAIMS.qualifiers[id]) throw new Error(`${file}: unknown qualifier "${id}"`); return CLAIMS.qualifiers[id]; });
}

// {{cli-reference}}: the command reference, rendered from reference/interfaces.json (exported from the
// engineering source) plus reference/cli-notes.json (website text for empty help). Stale or missing text fails the build.
export function cliReference() {
  const I = JSON.parse(readFileSync(join(ROOT, 'reference/interfaces.json'), 'utf8'));
  const { notes } = JSON.parse(readFileSync(join(ROOT, 'reference/cli-notes.json'), 'utf8'));
  const used = new Set();
  const text = (key, help) => {
    const note = notes[key];
    if (key in notes) used.add(key);
    // A note starting with "= " replaces engineering's text, for wording the site's claim rules don't allow.
    const t = note?.startsWith('= ') ? note.slice(2) : [help?.replace(/\.$/, ''), note].filter(Boolean).join('. ');
    if (!t) throw new Error(`cli reference: no text for "${key}"; add it to reference/cli-notes.json`);
    // `code` in help text becomes <code>, and so does a bare --flag outside it.
    return esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').split(/(<code>.*?<\/code>)/)
      .map((s, i) => i % 2 ? s : s.replace(/(^|[\s(])(--[a-z][\w-]*(?:=[\w|]+)?)/g, '$1<code>$2</code>')).join('');
  };
  const argName = a => a.kind === 'positional' ? (a.optional ? `[${a.name}]` : `<${a.name}>`) : [a.long, a.short].filter(Boolean).join(', ') + (a.value ? (a.equals ? '=' : ' ') + a.value : '');
  const table = (rows, key) => rows.length ? `<div class="table-wrap"><table>
<thead><tr><th scope="col">Argument</th><th scope="col">Default</th><th scope="col">Meaning</th></tr></thead>
<tbody>
${rows.map(a => `<tr><td><code>${esc(argName(a))}</code></td><td>${a.default ? `<code>${esc(a.default)}</code>` : ''}</td><td>${text(`${key} ${a.long || a.name}`, a.help)}${a.values?.some(v => v.help) ? `<ul>${a.values.map(v => `<li><code>${esc(v.name)}</code>: ${text(`${key} ${a.long || a.name} ${v.name}`, v.help)}</li>`).join('')}</ul>` : ''}</td></tr>`).join('\n')}
</tbody>
</table></div>` : '';
  const id = path => path.split(' ').slice(1).join('-');
  const usage = c => `<div class="code-wrap"><pre class="code-block"><code>${esc([c.path, ...c.args.filter(a => a.kind === 'positional').map(argName), c.args.some(a => a.kind === 'option') ? '[options]' : ''].filter(Boolean).join(' '))}</code></pre></div>`;
  const top = I.commands.filter(c => c.path.split(' ').length === 2);
  const subs = c => I.commands.filter(s => s.path.startsWith(c.path + ' '));
  const leaves = I.commands.filter(c => !c.group);
  const date = new Date(I.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const html = `<p class="fine">Generated from the development source as of ${date}. Commands may change before a release.</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Command</th><th scope="col">What it does</th></tr></thead>
<tbody>
${leaves.map(c => `<tr><td><a href="#${id(c.path)}"><code>${esc(c.path)}</code></a></td><td>${text(c.path, c.help)}</td></tr>`).join('\n')}
</tbody>
</table></div>
<h2 id="global">Options for every command</h2>
${table(I.global, 'common')}
${top.map(c => c.group
  ? `<h2 id="${id(c.path)}"><code>${esc(c.path)}</code></h2>\n<p>${text(c.path, c.help)}</p>\n${subs(c).map(s => `<h3 id="${id(s.path)}"><code>${esc(s.path)}</code></h3>\n<p>${text(s.path, s.help)}</p>\n${usage(s)}\n${table(s.args, s.path)}`).join('\n')}`
  : `<h2 id="${id(c.path)}"><code>${esc(c.path)}</code></h2>\n<p>${text(c.path, c.help)}</p>\n${usage(c)}\n${table(c.args, c.path)}`).join('\n')}
<h2 id="environment">Environment variables</h2>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Variable</th><th scope="col">Meaning</th></tr></thead>
<tbody>
${I.env.filter(v => notes[`env ${v}`] !== null || !used.add(`env ${v}`)).map(v => `<tr><td><code>${esc(v)}</code></td><td>${text(`env ${v}`, '')}</td></tr>`).join('\n')}
</tbody>
</table></div>`;
  const stale = Object.keys(notes).filter(k => !used.has(k));
  if (stale.length) throw new Error(`reference/cli-notes.json: no such command, argument or variable: ${stale.join(', ')}`);
  return html;
}

// {{api-bodies}}: request body fields for every route that takes one, from the OpenAPI document via interfaces.json.
export function apiBodies() {
  const I = JSON.parse(readFileSync(join(ROOT, 'reference/interfaces.json'), 'utf8'));
  const code = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  return I.routes.filter(r => r.body).map(r => { const helps = r.body.fields.some(f => f.help); return `<h3 id="body-${(r.method + r.path).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}"><code>${r.method} ${esc(r.path)}</code></h3>
${r.body.required ? '' : '<p>The body is optional.</p>\n'}<div class="table-wrap"><table>
<thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Default</th>${helps ? '<th scope="col">Meaning</th>' : ''}</tr></thead>
<tbody>
${r.body.fields.map(f => `<tr><td><code>${esc(f.name)}</code>${f.required ? '<br><span class="fine">required</span>' : ''}</td><td>${esc(f.type)}</td><td>${f.default ? `<code>${esc(f.default)}</code>` : ''}</td>${helps ? `<td>${f.help ? code(f.help) : ''}</td>` : ''}</tr>`).join('\n')}
</tbody>
</table></div>`; }).join('\n');
}

// {{api-responses}}: success status, content types, error statuses and response fields for every route.
export function apiResponses() {
  const I = JSON.parse(readFileSync(join(ROOT, 'reference/interfaces.json'), 'utf8'));
  const code = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  const kind = t => ({ 'application/json': 'JSON', 'text/event-stream': 'server-sent events', 'text/plain': 'plain text' })[t] || t;
  return I.routes.filter(r => r.response).map(r => {
    const x = r.response, helps = x.fields.some(f => f.help);
    const what = `${x.status}${x.types.length ? `, ${x.types.map(kind).join(' or ')}` : ', no content'}${x.errors.length ? `; errors ${x.errors.join(', ')}` : ''}`;
    return `<details class="api-response"><summary><code>${r.method} ${esc(r.path)}</code> <span class="fine">${what}</span></summary>
${x.fields.length ? `<div class="table-wrap"><table>
<thead><tr><th scope="col">Field</th><th scope="col">Type</th>${helps ? '<th scope="col">Meaning</th>' : ''}</tr></thead>
<tbody>
${x.fields.map(f => `<tr><td><code>${esc(f.name)}</code></td><td>${esc(f.type)}</td>${helps ? `<td>${f.help ? code(f.help) : ''}</td>` : ''}</tr>`).join('\n')}
</tbody>
</table></div>` : `<p>${x.types.includes('text/event-stream') ? 'A stream of server-sent events.' : x.types.length ? 'The document is not described field by field.' : 'No body.'}</p>`}
</details>`;
  }).join('\n');
}

// {{releases}}: approved downloads from reference/releases.json. A record missing any field fails the build,
// so nothing reaches the page without its checksum, signature status and both approvals.
export const RELEASES = JSON.parse(readFileSync(join(ROOT, 'reference/releases.json'), 'utf8')).releases;
const STAGES = ['private alpha', 'developer alpha', 'developer beta', 'stable'];
// The two alpha stages go to invited testers only: they render on the preview build, behind Cloudflare Access,
// and never on a public build.
export const PRIVATE_STAGES = ['private alpha', 'developer alpha'];
export const releasesFor = mode => RELEASES.filter(r => mode === 'preview' || !PRIVATE_STAGES.includes(r.stage));
// A release ships only with the owner's approval of the artifact and a named cohort (spec section 31); until then it is
// shown as awaiting approval: no download link, and its files never ship.
export const approved = r => Boolean(r.approval?.owner && r.approval?.cohort);
export const downloadsFor = mode => releasesFor(mode).filter(approved);
function releasesHtml(mode) {
  const shown = releasesFor(mode);
  if (!shown.length) return '<p>There are no tagged releases and no release notes yet. If a release is approved, this page will link to its installers and their SHA-256 checksums.</p>';
  return shown.map(r => {
    const where = `reference/releases.json ${r.version}`;
    const need = (ok, what) => { if (!ok) throw new Error(`${where}: ${what}`); };
    need(/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(r.version), 'version must be x.y.z');
    need(STAGES.includes(r.stage), `stage must be one of: ${STAGES.join(', ')}`);
    need(/^\d{4}-\d{2}-\d{2}$/.test(r.date), 'date must be YYYY-MM-DD');
    need(r.approval?.promotion, 'approval needs the engineering promotion record (the owner approval may follow)');
    need(!r.install || (Array.isArray(r.install) && r.install.every(s => typeof s === 'string' && s)), 'install must be a list of sentences');
    need(r.artifacts?.length, 'no artifacts');
    for (const a of r.artifacts) {
      need(a.platform && a.signature, `${a.file}: platform and signature status are required`);
      need(/^(https:\/\/\S+|\/releases\/[\w.-]+\/[\w.-]+)$/.test(a.url) && a.url.split('/').pop() === a.file, `${a.file}: url must be https, or /releases/<version>/<file> on this site, and end in the file name`);
      need(/^[0-9a-f]{64}$/.test(a.sha256), `${a.file}: sha256 must be 64 lowercase hex characters`);
      need(Number.isInteger(a.bytes) && a.bytes > 0, `${a.file}: bytes must be a positive integer`);
    }
    const mb = b => `${(b / 1048576).toFixed(1)} MB`;
    const ok = approved(r);
    return `<h3>UCompute ${esc(r.version)}, ${esc(r.stage)} (${new Date(r.date + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })})</h3>
${ok ? '' : r.approval?.owner ? '<p class="callout"><strong>Approved; waiting for the testers to be named.</strong> The owner has approved this exact file, but it is not available until the testers are named. There is no download link until then.</p>\n' : '<p class="callout"><strong>Awaiting the owner\'s approval.</strong> Engineering has recorded this build for promotion, but it is not available to testers until the owner approves this exact file. There is no download link until then.</p>\n'}${r.notes ? `<p>${esc(r.notes)}</p>` : ''}
<div class="table-wrap"><table>
<thead><tr><th scope="col">Platform</th><th scope="col">${ok ? 'Download' : 'File'}</th><th scope="col">Signature</th><th scope="col">SHA-256</th></tr></thead>
<tbody>
${r.artifacts.map(a => `<tr><th scope="row">${esc(a.platform)}</th><td>${ok ? `<a href="${esc(a.url)}">${esc(a.file)}</a>` : esc(a.file)}<br><span class="fine">${mb(a.bytes)}</span></td><td>${esc(a.signature)}</td><td><code class="hash">${a.sha256}</code></td></tr>`).join('\n')}
</tbody>
</table></div>
${r.install?.length ? `<h4>Before you install</h4>\n<ul>\n${r.install.map(s => `<li>${esc(s)}</li>`).join('\n')}\n</ul>` : ''}`;
  }).join('\n') + (shown.some(approved) ? `
<p>Check a download before you open it: its SHA-256 must match the one above exactly. On macOS run <code>shasum -a 256 &lt;file&gt;</code>, on Windows (PowerShell) <code>Get-FileHash &lt;file&gt; -Algorithm SHA256</code>, and on Linux <code>sha256sum &lt;file&gt;</code>. If it differs, delete the file and do not open it.</p>` : '');
}

// Shared snippets pages can drop in, so icons and URLs live in one place.
const fill = (s, file, mode) => {
  s = resolveClaims(s, file).replaceAll('{{brand}}', brand).replaceAll('{{preview}}', PREVIEW);
  if (s.includes('{{releases}}')) s = s.replace('{{releases}}', releasesHtml(mode));
  if (s.includes('{{api-bodies}}')) s = s.replace('{{api-bodies}}', apiBodies());
  if (s.includes('{{api-responses}}')) s = s.replace('{{api-responses}}', apiResponses());
  return s.includes('{{cli-reference}}') ? s.replace('{{cli-reference}}', cliReference()) : s;
};

export function render(page, mode, assets) {
  const { meta, path } = page;
  const body = fill(page.body, page.file, mode);
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
      // Hosted installers live in public/releases/<version>/ and ship only with a build that shows that release.
      if (rel.startsWith('releases/')) return downloadsFor(mode).some(r => rel.split('/')[1] === r.version) && mode !== 'prelaunch';
      return mode !== 'prelaunch' || rel === '' || rel === 'releases' || PRELAUNCH_FILES.some(f => rel === f || rel.startsWith('assets/fonts/'));
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
  // CSS and JS are linked with ?v=<content hash>, so they can be cached for a year; exact paths, so no header is set twice.
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
${Object.keys(assets).map(k => `assets/${k === 'css' ? 'ucompute.css' : k + '.js'}`).filter(f => existsSync(join(out, f))).map(f => `\n/${f}\n  Cache-Control: public, max-age=31536000, immutable\n`).join('')}`);
  writeFileSync(join(out, 'build.json'), JSON.stringify({ mode, pages: pages.map(p => p.path).sort(), commit: process.env.CF_PAGES_COMMIT_SHA || null, branch: process.env.CF_PAGES_BRANCH || null }, null, 2) + '\n');
  return pages;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] || process.env.UCOMPUTE_SITE || 'prelaunch';
  const out = process.argv[3] || join(ROOT, 'dist');
  const pages = build(mode, out);
  console.log(`built ${pages.length} page(s) in ${mode} mode -> ${out}`);
}
