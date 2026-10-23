// Export the engineering repository's public interfaces to reference/interfaces.json, read-only.
//   node tools/interfaces.mjs <path-to-engineering-repo> <commit-or-branch>
// Reads source only through `git show <commit>:<path>`. The build renders /docs/cli/ from the file,
// and check.mjs fails when a page mentions a route, error code, command or flag that is not in it.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [repo, ref] = process.argv.slice(2);
if (!repo || !ref) { console.error('usage: node tools/interfaces.mjs <repo> <commit-or-branch>'); process.exit(2); }
const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', maxBuffer: 1 << 26 });
const commit = git('rev-parse', '--short', ref).trim();
const date = git('show', '-s', '--format=%cs', commit).trim();
const show = path => git('show', `${commit}:${path}`);
const kebab = s => s.replace(/_/g, '-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
// Internal requirement and milestone references stay out of the website (snapshot "How to read references").
const clean = s => s.replace(/\s*\((?:[FXIUBD]-\d{2}(?:-\d{2})?|M\d{1,2}|WP-\d{2}|E\d)\)/g, '').replace(/\s+/g, ' ').trim();

// ---- A small reader for clap derive definitions
function splitTop(body) { // split a struct/enum body on top-level commas
  const out = []; let depth = 0, cur = '', str = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    // Line comments (doc comments included) can hold commas; copy them whole.
    if (!str && ch === '/' && body[i + 1] === '/') { const nl = body.indexOf('\n', i); const end = nl < 0 ? body.length : nl; cur += body.slice(i, end); i = end - 1; continue; }
    if (ch === '"' && body[i - 1] !== '\\') str = !str;
    if (!str) { if ('([{<'.includes(ch)) depth++; if (')]}>'.includes(ch)) depth--; }
    if (ch === ',' && depth === 0 && !str) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
function parseItem(text) { // doc comments, attributes, declaration
  const docs = [], attrs = []; let rest = text;
  for (;;) {
    rest = rest.replace(/^\s+/, '');
    if (rest.startsWith('//')) { const nl = rest.indexOf('\n'); const line = rest.slice(0, nl < 0 ? undefined : nl); if (line.startsWith('///')) docs.push(line.slice(3).trim()); rest = nl < 0 ? '' : rest.slice(nl + 1); continue; }
    if (rest.startsWith('#[')) { let d = 0, j = 1; for (; j < rest.length; j++) { if (rest[j] === '[') d++; else if (rest[j] === ']' && --d === 0) break; } attrs.push(rest.slice(2, j)); rest = rest.slice(j + 1); continue; }
    break;
  }
  return { help: clean(docs.join(' ')), attrs, decl: rest.trim() };
}
const blocks = new Map(); // name -> { kind, items }
function readFile(src) {
  const re = /#\[derive\(([^)]*)\)\]\s*(?:#\[[\s\S]*?\]\s*)*(?:pub(?:\([^)]*\))?\s+)?(struct|enum)\s+(\w+)\s*\{/g;
  for (const m of src.matchAll(re)) {
    const kind = ['Parser', 'Subcommand', 'ValueEnum', 'Args'].find(k => new RegExp(`\\b${k}\\b`).test(m[1]));
    if (!kind) continue;
    let d = 1, j = m.index + m[0].length;
    for (; j < src.length && d; j++) { if (src[j] === '{') d++; else if (src[j] === '}') d--; }
    blocks.set(m[3], { kind, items: splitTop(src.slice(m.index + m[0].length, j - 1)).map(parseItem).filter(i => i.decl) });
  }
}
for (const f of git('ls-tree', '-r', '--name-only', commit, 'crates/common-cli/src').split('\n').filter(f => f.endsWith('.rs'))) readFile(show(f));

const lastSeg = t => t.replace(/<.*$/, '').split('::').pop().trim();
function argsOf(items) {
  const args = [], subs = [];
  for (const { help, attrs, decl } of items) {
    const field = decl.match(/^(?:pub(?:\([^)]*\))?\s+)?(\w+)\s*:\s*([\s\S]+)$/);
    if (!field) continue;
    const [, name, type] = field;
    const cmd = attrs.find(a => a.startsWith('command('));
    if (cmd && /flatten/.test(cmd)) { args.push(...argsOf(blocks.get(lastSeg(type))?.items || []).args); continue; }
    if (cmd && /subcommand/.test(cmd)) { subs.push(lastSeg(type)); continue; }
    const arg = attrs.find(a => a.startsWith('arg(')) || '';
    const optional = /^Option</.test(type.trim());
    const isBool = /^bool$/.test(type.trim());
    const inner = type.replace(/^Option<\s*|\s*>$/g, '').trim();
    const values = /value_enum/.test(arg) ? (blocks.get(lastSeg(inner))?.items || []).map(i => ({ name: kebab(i.decl.replace(/\W.*$/s, '')), help: i.help })) : null;
    const dflt = (arg.match(/default_value(?:_t)?\s*=\s*("([^"]*)"|[^,)]+)/) || [])[0];
    let def = dflt ? (dflt.match(/=\s*"([^"]*)"/)?.[1] ?? dflt.split('=').slice(1).join('=').trim()) : null;
    if (def && /::/.test(def)) def = kebab(def.split('::').pop());
    if (def === 'false') def = null;
    if (/\blong\b/.test(arg) || /\bshort\b/.test(arg)) {
      const long = arg.match(/long\s*=\s*"([^"]+)"/)?.[1] ?? (/\blong\b/.test(arg) ? kebab(name) : null);
      const short = arg.match(/short\s*=\s*'(.)'/)?.[1] ?? (/\bshort\b/.test(arg) ? name[0] : null);
      args.push({ kind: 'option', long: long && `--${long}`, short: short && `-${short}`, value: isBool || /ArgAction::Count/.test(arg) ? null : values ? values.map(v => v.name).join('|') : /^bool$/.test(inner) ? 'true|false' : kebab(name).toUpperCase(), equals: /require_equals/.test(arg) || undefined, default: def, help, values: values || undefined, global: /\bglobal\b/.test(arg) || undefined, repeat: /ArgAction::Count/.test(arg) || undefined });
    } else {
      args.push({ kind: 'positional', name: kebab(name), optional, help, values: values || undefined });
    }
  }
  return { args, subs };
}
const commands = [];
function walk(enumName, prefix) {
  for (const { help, decl } of blocks.get(enumName)?.items || []) {
    const v = decl.match(/^(\w+)\s*(?:\{([\s\S]*)\}|\(([\s\S]*)\))?$/);
    if (!v) continue;
    const word = kebab(v[1]), path = `${prefix} ${word}`;
    const { args, subs } = v[2] !== undefined ? argsOf(splitTop(v[2]).map(parseItem)) : v[3] !== undefined ? argsOf(blocks.get(lastSeg(v[3]))?.items || []) : { args: [], subs: [] };
    if (subs.length) { commands.push({ path, help, args, group: true }); for (const s of subs) walk(s, path); }
    else commands.push({ path, help, args });
  }
}
const root = [...blocks].find(([, b]) => b.kind === 'Parser');
const top = argsOf(root[1].items);
for (const s of top.subs) walk(s, 'common');

// ---- Routes and error codes
// The ROUTES table is the source of truth (engineering's tests check it against openapi.json).
const libSrc = show('crates/common-api/src/lib.rs');
const table = libSrc.slice(libSrc.indexOf('pub const ROUTES'), libSrc.indexOf('];', libSrc.indexOf('pub const ROUTES')));
// Request bodies come from the OpenAPI document, flattened one row per field (nested as a.b, arrays as a[].b).
const oa = JSON.parse(show('crates/common-api/openapi.json'));
const deref = s => s?.$ref ? deref(oa.components.schemas[s.$ref.split('/').pop()]) : s || {};
const merge = s => {
  s = deref(s);
  if (!s.allOf) return s;
  const parts = s.allOf.map(merge);
  return { type: 'object', properties: Object.assign({}, ...parts.map(p => p.properties)), required: parts.flatMap(p => p.required || []) };
};
const typeOf = s => {
  s = merge(s);
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map(v => JSON.stringify(v)).join(' | ');
  if (s.oneOf) return s.oneOf.map(typeOf).join(' or ');
  if (s.type === 'array') return `array of ${typeOf(s.items)}`;
  return s.type || 'any';
};
const flatten = (s, prefix = '') => {
  s = merge(s);
  return Object.entries(s.properties || {}).flatMap(([k, v0]) => {
    const v = merge(v0), name = prefix + k;
    const limits = [v.minimum !== undefined && `≥ ${v.minimum}`, v.maximum !== undefined && `≤ ${v.maximum}`, v.maxLength && `up to ${v.maxLength} characters`, v.minItems && `at least ${v.minItems}`, v.maxItems && `at most ${v.maxItems}`].filter(Boolean).join(', ');
    const row = { name, type: typeOf(v) + (limits ? ` (${limits})` : ''), required: (s.required || []).includes(k) || undefined, default: v.default !== undefined ? JSON.stringify(v.default) : undefined, help: v.description ? clean(v.description) : undefined };
    const inner = v.type === 'array' ? merge(v.items) : v;
    return [row, ...(inner.properties ? flatten(inner, name + (v.type === 'array' ? '[].' : '.')) : [])];
  });
};
const bodyOf = (method, path) => {
  const rb = oa.paths[path]?.[method.toLowerCase()]?.requestBody;
  const schema = rb?.content?.['application/json']?.schema;
  return schema ? { required: rb.required === true, fields: flatten(schema) } : undefined;
};
const routes = [...table.matchAll(/\("(GET|POST|PUT|DELETE)", "([^"]+)"\)/g)].map(m => ({ method: m[1], path: m[2], body: bodyOf(m[1], m[2]) }));
const errSrc = show('crates/common-core/src/error.rs');
const statusOf = {};
for (const m of errSrc.matchAll(/((?:ErrorCode::\w+\s*\|?\s*)+)=>\s*(\d{3})/g)) for (const c of m[1].matchAll(/ErrorCode::(\w+)/g)) statusOf[c[1]] = +m[2];
const errors = [...errSrc.matchAll(/ErrorCode::(\w+) => "([a-z_]+)"/g)].map(m => ({ code: m[2], status: statusOf[m[1]] ?? null }));

// Environment variables the CLI and runtime read.
const envVars = new Set();
for (const f of git('ls-tree', '-r', '--name-only', commit, 'crates').split('\n').filter(f => /^crates\/common-[^/]+\/src\/.*\.rs$/.test(f))) {
  const src = show(f);
  for (const m of src.matchAll(/var(?:_os)?\("(COMMON_[A-Z_]+)"\)/g)) if (!/TEST/.test(m[1])) envVars.add(m[1]);
  if (/EnvFilter::(?:try_)?from_default_env/.test(src)) envVars.add('RUST_LOG');
}
const out = { source: 'div0rce/common (unpublished)', commit, date, global: top.args, commands, routes, errors, env: [...envVars].sort() };
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'reference', 'interfaces.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`reference/interfaces.json: ${commands.length} commands, ${routes.length} routes, ${errors.length} error codes at ${commit} (${date})`);
