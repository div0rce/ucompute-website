// Run the first-run guide on this Mac, on the exact approved build, and time each step.
//   node tools/verify-first-run.mjs <dmg> [--work <empty dir>] [--port 18510]
// The commands are read from the built page (dist/docs/first-run/index.html, blocks marked data-run), so a step that
// passes here is the step readers copy. Only the address, the port and the install location are rewritten.
//
// It checks the disk image against reference/releases.json, copies the app out of it, and runs the bundled `ucompute`
// with its own HOME and data folder. It never opens the app window, never binds a reserved port, and never reads or
// writes the default data folder. The window steps of the guide need a person; they are not covered here.
// Needs the internet: the engine (GitHub), the model (Hugging Face), the openai packages (PyPI, npm).
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const RESERVED = [8192, 8193, 5353, 18302, 19222]; // the project's own services and test tools use these
const MODEL = 'qwen2.5-0.5b-instruct-q4_k_m';
// The Python block runs with each python3 a Mac may have first on PATH: Apple's, python.org's and Homebrew's.
const PYTHONS = ['/usr/bin', '/Library/Frameworks/Python.framework/Versions/3.13/bin', '/opt/homebrew/bin'].filter(d => existsSync(join(d, 'python3')));
const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : fallback; };
const dmg = resolve(process.argv[2] || '');
const port = +arg('--port', 18510), work = resolve(arg('--work', join(process.env.TMPDIR || '/tmp', `first-run-${process.pid}`)));
if (!existsSync(dmg) || !statSync(dmg).isFile()) { console.error('usage: node tools/verify-first-run.mjs <dmg> [--work <empty dir>] [--port 18510]'); process.exit(2); }
if (RESERVED.includes(port)) { console.error(`port ${port} is reserved`); process.exit(2); }
if (existsSync(work) && readdirSync(work).length) { console.error(`${work} is not empty`); process.exit(2); }

const ROOT = new URL('..', import.meta.url).pathname;
const release = JSON.parse(readFileSync(join(ROOT, 'reference/releases.json'), 'utf8')).releases.find(r => !r.withdrawn && r.approval?.owner && r.approval?.cohort);
const artifact = release.artifacts[0];
const page = readFileSync(join(ROOT, 'dist/docs/first-run/index.html'), 'utf8');
const unescape = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const blocks = Object.fromEntries([...page.matchAll(/<pre class="code-block" data-run="([\w-]+)"><code>([\s\S]*?)<\/code><\/pre>/g)].map(m => [m[1], unescape(m[2])]));

const app = join(work, 'Applications/UCompute.app'), bin = join(app, 'Contents/MacOS/ucompute');
const home = join(work, 'home'), data = join(home, 'Library/Application Support/UCompute');
mkdirSync(data, { recursive: true }); mkdirSync(dirname(app), { recursive: true });
if (data.startsWith(join(homedir(), 'Library'))) throw new Error('refusing the default data folder');
const toolPath = [...new Set(['/usr/bin', '/bin', '/usr/sbin', '/sbin', dirname(process.execPath)])].join(':'); // never the developer's own PATH, so a stray pip can't be reached
const env = { HOME: home, UCOMPUTE_HOME: data, PATH: toolPath, LANG: 'en_US.UTF-8' };
const rewrite = s => s.replaceAll('127.0.0.1:8192', `127.0.0.1:${port}`).replaceAll('~/Downloads/', `${dirname(dmg)}/`).replaceAll('/Applications/UCompute.app', app);

const evidence = { label: 'SINGLE-HOST (one Mac); packaged binary, no app window', date: new Date().toISOString(), version: release.version, sha256: artifact.sha256, steps: [] };
let failed = 0;
const step = async (name, fn) => {
  const t0 = performance.now();
  let ok = false, detail = '';
  try { detail = String(await fn()).trim().slice(0, 400); ok = true; } catch (e) { detail = String(e.message || e).trim().slice(0, 600); failed++; }
  const seconds = +((performance.now() - t0) / 1000).toFixed(1);
  evidence.steps.push({ name, ok, seconds, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} (${seconds} s): ${detail.split('\n')[0].slice(0, 150)}`);
  return ok;
};
// Blocks run the way a pasted block runs in Terminal: one line at a time in one shell. Only stdout comes back.
const sh = (script, cwd = home, path = env.PATH) => {
  const r = spawnSync('/bin/zsh', ['-f', '-s'], { input: `${script}\n`, env: { ...env, PATH: path }, cwd, encoding: 'utf8', timeout: 900000 });
  if (r.status !== 0) throw new Error(`exit ${r.status}: ${(r.stderr || r.stdout || '').trim()}`);
  return r.stdout;
};
const run = (...a) => { const r = spawnSync(bin, a, { env, cwd: home, encoding: 'utf8', timeout: 900000 }); if (r.status !== 0) throw new Error(`exit ${r.status}: ${(r.stderr || r.stdout).trim()}`); return r.stdout + r.stderr; };

await step('the disk image matches its release record', () => {
  const b = readFileSync(dmg), sha = createHash('sha256').update(b).digest('hex');
  if (b.length !== artifact.bytes || sha !== artifact.sha256) throw new Error(`${b.length} bytes, ${sha}`);
  return `${b.length} bytes, ${sha}`;
});
await step('every guide block is present', () => { for (const k of ['checksum', 'health', 'chat', 'python-setup', 'python', 'python-run', 'javascript-setup', 'javascript', 'javascript-run', 'alias', 'serve']) if (!blocks[k]) throw new Error(`no block ${k}`); return Object.keys(blocks).join(' '); });
await step('guide: checksum command', () => { const o = sh(rewrite(blocks.checksum)); if (!o.includes(artifact.sha256)) throw new Error(o); return o; });
await step('app copied out of the disk image', () => {
  const mnt = join(work, 'mnt'); mkdirSync(mnt);
  execFileSync('hdiutil', ['attach', '-readonly', '-nobrowse', '-mountpoint', mnt, dmg], { stdio: 'ignore' });
  try { execFileSync('/usr/bin/ditto', [join(mnt, 'UCompute.app'), app]); } finally { execFileSync('hdiutil', ['detach', '-quiet', mnt]); }
  rmSync(mnt, { recursive: true });
  return run('--version');
});
await step('guide: command line alias and doctor', () => { const o = sh(rewrite(blocks.alias)); if (!/data folder|engine|version/i.test(o)) throw new Error(o); return o; });
await step('engine: setup downloads and verifies it', () => run('setup'));
await step(`model: pull ${MODEL}`, () => run('models', 'pull', MODEL, '-y'));
await step('first answer with no service running: ucompute run', () => run('run', MODEL, '--chat', '-p', 'Say hello in five words.', '-n', '32'));

const out = [];
const daemon = spawn(bin, [...blocks.serve.trim().split(/\s+/).slice(1), '--port', String(port)], { env, cwd: home, stdio: ['ignore', 'pipe', 'pipe'] }); // the guide's command, off the reserved port
daemon.stdout.on('data', d => out.push(String(d))); daemon.stderr.on('data', d => out.push(String(d)));
const up = await step('daemon: listening on the test port', async () => {
  for (let i = 0; i < 300 && !out.join('').includes('listening on'); i++) await sleep(100);
  if (!out.join('').includes('listening on')) throw new Error(out.join('').slice(-400));
  return out.join('').split('\n').find(l => l.includes('listening on'));
});
if (up) {
  await step('guide: health', () => { const o = sh(rewrite(blocks.health)); if (!o.includes('"ok"') || !o.includes(release.version)) throw new Error(o); return o; });
  await step('guide: first answer through curl (loads the model)', () => JSON.parse(sh(rewrite(blocks.chat))).choices[0].message.content);
  await step('a model that is not downloaded gets a stable code', () => {
    const o = sh(rewrite(blocks.chat).replaceAll(MODEL, 'smollm2-360m-instruct-q8_0'));
    if (!o.includes('model_not_downloaded')) throw new Error(o);
    return JSON.parse(o).error.message;
  });
  await step('ports: only the test port and loopback', () => {
    const o = spawnSync('/usr/sbin/lsof', ['-nP', '-p', String(daemon.pid), '-a', '-i'], { encoding: 'utf8' }).stdout;
    for (const p of RESERVED) if (new RegExp(`:${p}\\b`).test(o)) throw new Error(`reserved port ${p} in use: ${o}`);
    if (/\*:\d+ \(LISTEN\)/.test(o)) throw new Error(`listening beyond loopback: ${o}`);
    return o.split('\n').filter(l => /LISTEN|UDP/.test(l)).map(l => l.split(/\s+/).slice(7).join(' ')).join(', ');
  });
  if (/^\s*pip\b/m.test(blocks['python-setup'])) throw new Error('a bare pip installs wherever PATH points; call the folder\'s own pip');
  for (const dir of PYTHONS) await step(`guide: Python, official openai client, with ${dir}/python3`, () => {
    const cwd = join(home, `py-${dir.replace(/\W+/g, '-')}`); mkdirSync(cwd);
    const path = `${dir}:${env.PATH}`, version = sh('python3 -V', cwd, path).trim();
    let setup = '';
    try { setup = sh(blocks['python-setup'], cwd, path); } catch (e) {
      // The guide's documented failure: nothing may have been installed, and it must say what to do.
      if (!/pyexpat/.test(page) || existsSync(join(cwd, 'ucompute-demo/bin/pip'))) throw e;
      return `${version}: venv fails, as the guide says; nothing installed, the next line stops`;
    }
    writeFileSync(join(cwd, 'first.py'), rewrite(blocks.python));
    return `${version}: ${sh(blocks['python-run'], cwd, path).trim()} (${sh('ucompute-demo/bin/pip list 2>/dev/null | grep -E "^openai "', cwd, path).trim().replace(/\s+/g, ' ')})`;
  });
  await step('guide: JavaScript, official openai client', () => {
    sh(blocks['javascript-setup']);
    writeFileSync(join(home, 'first.mjs'), rewrite(blocks.javascript));
    return sh(blocks['javascript-run']) + sh('npm ls openai --depth=0 | tail -2 | head -1');
  });
}
await step('daemon: stops cleanly and leaves nothing running', async () => {
  daemon.kill('SIGTERM');
  for (let i = 0; i < 150 && daemon.exitCode === null && daemon.signalCode === null; i++) await sleep(100);
  if (daemon.exitCode === null && daemon.signalCode === null) { daemon.kill('SIGKILL'); throw new Error('still running after 15 s'); }
  const left = spawnSync('/usr/bin/pgrep', ['-fl', `${work}/(Applications|home)`], { encoding: 'utf8' }).stdout.trim();
  if (left) throw new Error(`left running: ${left}`);
  return `exit ${daemon.exitCode ?? daemon.signalCode}`;
});
await step('disk: what the first run used', () => `data folder ${execFileSync('/usr/bin/du', ['-sh', data], { encoding: 'utf8' }).split('\t')[0]}, app ${execFileSync('/usr/bin/du', ['-sh', app], { encoding: 'utf8' }).split('\t')[0]}`);
writeFileSync(join(work, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(`\n${failed ? `${failed} step(s) failed` : 'all steps passed'}; evidence: ${join(work, 'evidence.json')}`);
process.exit(failed ? 1 : 0);
