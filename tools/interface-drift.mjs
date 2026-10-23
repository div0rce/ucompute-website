// Compare the documentation with the interfaces in the engineering repository, read-only.
//   node tools/interface-drift.mjs <path-to-engineering-repo> <commit-or-branch>
// Reads source through `git show <commit>:<path>` (never touches the working tree) and reports:
//   STALE   documented routes, error codes, subcommands or flags that the code does not have (exit 1)
//   MISSING interfaces in the code that the docs do not mention yet (listed, exit 0)
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [repo, commit] = process.argv.slice(2);
if (!repo || !commit) { console.error('usage: node tools/interface-drift.mjs <repo> <commit>'); process.exit(2); }
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const show = path => execFileSync('git', ['-C', repo, 'show', `${commit}:${path}`], { encoding: 'utf8', maxBuffer: 1 << 26 });
const ls = dir => execFileSync('git', ['-C', repo, 'ls-tree', '-r', '--name-only', commit, dir], { encoding: 'utf8' }).split('\n').filter(Boolean);

// ---- What the code has
const routes = new Set([...show('crates/common-api/src/lib.rs').matchAll(/\("(GET|POST|PUT|DELETE)", "([^"]+)"\)/g)].map(m => `${m[1]} ${m[2]}`));
const errorCodes = new Set([...show('crates/common-core/src/error.rs').matchAll(/ErrorCode::\w+ => "([a-z_]+)"/g)].map(m => m[1]));
const kebab = s => s.replace(/_/g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const flags = new Set(['--help', '--version']);
const commands = new Set();
for (const file of ls('crates/common-cli/src').filter(f => f.endsWith('.rs'))) {
  const src = show(file);
  // clap derive: #[arg(... long ...)] on a field becomes --field-name unless long = "name" is given.
  // Attributes can hold lists ([..]) and calls, so scan for the balanced closing parenthesis.
  for (let i = src.indexOf('#[arg('); i >= 0; i = src.indexOf('#[arg(', i + 1)) {
    let depth = 0, j = i + 5;
    for (; j < src.length; j++) { if (src[j] === '(') depth++; else if (src[j] === ')' && --depth === 0) break; }
    const attr = src.slice(i + 6, j);
    const field = src.slice(j).match(/^\)\]\s*(?:(?:\/\/\/[^\n]*|#\[[^\n]*\])\s*)*(?:pub(?:\([^)]*\))?\s+)?(\w+)\s*:/);
    if (!field || !/\blong\b/.test(attr)) continue;
    const explicit = attr.match(/long\s*=\s*"([^"]+)"/);
    flags.add('--' + (explicit ? explicit[1] : kebab(field[1])));
    for (const a of attr.matchAll(/(?:visible_)?alias(?:es)?\s*=\s*\[?([^\]\)]*)/g)) for (const n of a[1].matchAll(/"([^"]+)"/g)) flags.add('--' + n[1]);
  }
  // Subcommand enums: each variant is a command word.
  for (const m of src.matchAll(/#\[derive\([^)]*Subcommand[^)]*\)\][\s\S]*?enum \w+ \{([\s\S]*?)\n\}/g)) {
    for (const v of m[1].matchAll(/^\s{4}(?:#\[command\(name\s*=\s*"([^"]+)"\)\]\s*)?([A-Z]\w*)\b/gm)) commands.add(v[1] || kebab(v[2]));
  }
}

// ---- What the docs say (page sources)
const walk = d => readdirSync(d).flatMap(n => statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]);
const pages = walk(join(ROOT, 'src/pages')).filter(f => f.endsWith('.html'));
const text = f => readFileSync(f, 'utf8').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const docRoutes = new Map(), docCodes = new Map(), docFlags = new Map(), docCommands = new Map();
const note = (map, key, file) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(file.slice(ROOT.length + 1)); };
for (const f of pages) {
  const t = text(f);
  for (const m of t.matchAll(/\b(GET|POST|PUT|DELETE)\s+(\/[\w/{}.-]*\w[}]?)/g)) note(docRoutes, `${m[1]} ${m[2]}`, f);
  // Commands and flags count only on `common …` lines inside code, so cargo/pnpm examples and prose are ignored.
  const code = [...t.matchAll(/<code>([\s\S]*?)<\/code>/g)].map(m => m[1].replace(/<[^>]+>/g, ''));
  // A code span that is itself a flag (option tables: <code>--ctx</code>) documents that flag.
  for (const c of code) for (const fl of c.matchAll(/^(--[a-z][a-z0-9-]*)(?:[ ,/=].*)?$/gm)) if (!/(^|\s)(cargo|pnpm|npm|git)\s/.test(c)) note(docFlags, fl[1], f);
  for (const line of code.flatMap(c => c.split('\n'))) {
    const m = line.match(/(?:^|[\s(`])common ([a-z][a-z-]*)(?: ([a-z][a-z-]*))?(.*)$/);
    if (!m) continue;
    note(docCommands, m[1], f);
    if (m[2] && commands.has(m[2])) note(docCommands, m[2], f);
    for (const fl of (m[3] || '').replace(/#.*$/, '').matchAll(/(?<![\w-])(--[a-z][a-z0-9-]*)/g)) note(docFlags, fl[1], f);
  }
}
const api = text(join(ROOT, 'src/pages/docs/api/index.html'));
const errors = api.slice(api.indexOf('id="errors"'), api.indexOf('id="compat"'));
for (const row of errors.matchAll(/<tr><td>([\s\S]*?)<\/td>/g)) for (const m of row[1].matchAll(/<code>([a-z_]+)<\/code>/g)) note(docCodes, m[1], join(ROOT, 'src/pages/docs/api/index.html'));

// ---- Compare
let stale = 0;
const report = (title, documented, actual, ignore = () => false) => {
  const extra = [...documented.keys()].filter(k => !actual.has(k) && !ignore(k)).sort();
  const missing = [...actual].filter(k => !documented.has(k)).sort();
  console.log(`\n${title}: ${actual.size} in code, ${documented.size} documented`);
  for (const k of extra) { stale++; console.log(`  STALE   ${k}   (${[...documented.get(k)].join(', ')})`); }
  for (const k of missing) console.log(`  MISSING ${k}`);
};
// Query strings and request bodies are not part of a route; strip them before comparing.
report('API routes', new Map([...docRoutes].map(([k, v]) => [k.replace(/\?.*$/, ''), v])), routes);
report('Error codes', docCodes, errorCodes);
report('CLI subcommands', docCommands, commands);
// ponytail: flags are matched by name across all subcommands; a flag documented under the wrong subcommand is not caught.
report('CLI flags', docFlags, flags);
console.log(`\n${stale ? `${stale} stale item(s): the docs mention interfaces this commit does not have.` : 'No stale items.'} Commit: ${commit}`);
process.exit(stale ? 1 : 0);
