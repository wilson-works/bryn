'use strict';

/**
 * engine/take.js — start and stop one headless run from Bryn's dashboard: "Bryn, take up the next question." Node
 * built-ins only. (GO1006 lane O. Owner 2026-10-06: "All the agents can run headless from the HQ so long as HQ is
 * running and we wake them up in the office." Before this, a question left at the trailhead waited for a chat.)
 *
 * The pattern is Louise's (wilson-works/louise engine/research.js): Claude Code, headless, in her folder (so her
 * CLAUDE.md loads), with fixed arguments. Nothing from a request goes into the run: the program comes from
 * bryn.config.json ("claude") or the PATH, and the arguments are fixed here. Only her folder and her data folder change
 * from one computer to another.
 *
 * The headless flags (ARGS):
 *   -p "Bryn, take up the next question."   one session, no keyboard; it ends when the question is at your call
 *   --append-system-prompt <fixed>           tells the session her dashboard started it, so the CLAUDE.md section "A run
 *                                            started from her dashboard" applies (nobody to ask; the button was the yes
 *                                            to the cost it states)
 *   --setting-sources project,local          the person's own ~/.claude/settings.json does not widen this list; the
 *                                            skills her agent.json requires are copied into .claude/skills first
 *                                            (engine/skills.js), where they load as project skills
 *   --permission-mode acceptEdits            edits only inside the working folders: her folder (the cwd) and
 *   --add-dir <her data folder>              her data folder, where the decision's folder and brief are written
 *   --permission-prompts none                anything not allowed is refused at once, never waits for a person
 *   --allowedTools                           Agent and Skill (the council's scouts and the premortem's investigators
 *                                            are subagents), and Bash only for her own shipped scripts (SCRIPTS)
 *   --disallowedTools                        AskUserQuestion, CronCreate, PowerShell (its calls need a prompt nobody can
 *                                            answer: the first proof run lost a step to it; her scripts go through
 *                                            Bash), and Edit on every file in her folder that is
 *                                            code, character or configuration (DENY_EDIT), so a run writes only her
 *                                            memory/ notes and her data folder
 * Not given: --dangerously-skip-permissions, bypassPermissions, any web tool, any bare Bash, Edit or Write rule.
 *
 * Starting (start): refused when Claude Code is not found (409 no-claude), no question is waiting (409 empty), a run is
 * going (409 running) or a skill is installed nowhere (409 no-skill). Otherwise it writes a job file and starts
 * engine/take-run.js detached (on Windows through engine/detach.vbs and WScript.Shell.Run, so the run holds none of
 * the dashboard's handles). The runner keeps <data>/take-run.json (pid, image, a heartbeat every 10 s) and its output
 * goes to <data>/take.log.
 * Stopping (stop): only the recorded pid and its children, and only while it is still the program that was started.
 *
 *   findClaude({ claude, env, platform })      { program, args, image, via } or null
 *   ARGS(data)  SCRIPTS  DENY_EDIT  PROMPT
 *   status(cfg, opts)  start(cfg, opts)  stop(cfg)    cfg from engine/config.js; opts { claude, launch, hub, homeDir, waitMs, now }
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const asks = require('./asks');
const stage = require('./stage');
const skills = require('./skills');

const PROMPT = 'Bryn, take up the next question.';
const SYSTEM_NOTE = "Bryn's dashboard started this session. Nobody is at the keyboard and nobody can answer a question. " +
  'Follow the section of her CLAUDE.md headed: A run started from her dashboard.';
const STALE_BEAT_MS = 60 * 1000;
const STARTING_MS = 30 * 1000;
// Set by a Claude Code session in the programs it starts; a run from her dashboard is its own session.
const SESSION_ENV = ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION',
  'CLAUDE_CODE_SESSION_ATTENDED', 'CLAUDE_CODE_MESSAGING_SOCKET', 'CLAUDE_CODE_MESSAGING_TOKEN', 'CLAUDE_CODE_EXECPATH',
  'CLAUDE_CODE_SSE_PORT', 'CLAUDE_PID', 'CLAUDE_AGENT_SDK_VERSION'];

// The only commands a run may execute: her own shipped scripts, run from her folder.
const SCRIPTS = ['stage', 'asks', 'record', 'decisions'];
// Paths in her folder a run may never write (relative to her folder). Left writable: memory/ and data/.
const DENY_EDIT = ['engine/**', 'dashboard/**', 'brains/**', 'rules/**', 'brand/**', 'art/**', 'examples/**', 'tests/**',
  '.claude/**', '.git/**', 'CLAUDE.md', 'CLAUDE.local.md', 'subagent.md', 'agent.json', 'package.json', 'DESIGN.md',
  'README.md', 'LICENSE', '.gitignore', 'bryn.config.json', '.mcp.json', 'mark.svg', 'art.svg'];

const runFile = (cfg) => path.join(cfg.data, 'take-run.json');
const logFile = (cfg) => path.join(cfg.data, 'take.log');
const jobFile = (cfg) => path.join(cfg.data, 'take-job.json');
const refuse = (status, reason, message) => Object.assign(new Error(message), { status, reason });

const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch (_) { return false; } };
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); } catch (_) { return null; } }
function writeJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
  try { fs.renameSync(tmp, file); } catch (_) { fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, 'utf8'); fs.rmSync(tmp, { force: true }); }
}

/** The fixed arguments for a run. Only her data folder varies, and it comes from her own config. */
function ARGS(data) {
  return [
    '-p', PROMPT,
    '--append-system-prompt', SYSTEM_NOTE,
    '--setting-sources', 'project,local',
    '--permission-mode', 'acceptEdits',
    '--permission-prompts', 'none',
    '--add-dir', data,
    '--allowedTools', 'Agent', 'Skill', 'Bash(node engine/config.js)',
    ...SCRIPTS.map((n) => `Bash(node engine/${n}.js *)`),
    '--disallowedTools', 'AskUserQuestion', 'CronCreate', 'PowerShell',
    ...DENY_EDIT.map((d) => `Edit(${d})`),
  ];
}

/** How to start a program file: a .js with this Node, a .cmd shim through the program it names, else directly. */
function launcher(file) {
  const ext = path.extname(file).toLowerCase();
  if (['.js', '.cjs', '.mjs'].includes(ext)) return { program: process.execPath, args: [file], image: path.basename(process.execPath), via: file };
  if (ext === '.cmd' || ext === '.bat') {
    let text = '';
    try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return null; }
    const named = [...text.matchAll(/"%dp0%\\([^"%]+\.(?:exe|js|cjs|mjs))"/gi)].map((m) => path.join(path.dirname(file), m[1]));
    const target = named.reverse().find(isFile);
    if (target) { const l = launcher(target); if (l) return Object.assign(l, { via: file }); }
    return null; // a shim that names no program is never run through cmd.exe: name the program in bryn.config.json
  }
  return { program: file, args: [], image: path.basename(file), via: file };
}

/** The newest Claude Code the VS Code extension carries (~/.vscode/extensions/anthropic.claude-code-<version>-…), or null. */
function extensionClaude(platform, home) {
  const base = path.join(home || os.homedir(), '.vscode', 'extensions');
  let dirs = [];
  try { dirs = fs.readdirSync(base).filter((d) => /^anthropic\.claude-code-\d/.test(d)); } catch (_) { return null; }
  const ver = (d) => (/-(\d+(?:\.\d+)*)/.exec(d) || [0, '0'])[1].split('.').map(Number);
  dirs.sort((a, b) => { const x = ver(a); const y = ver(b); for (let i = 0; i < Math.max(x.length, y.length); i += 1) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); return 0; });
  for (const d of dirs) {
    const f = path.join(base, d, 'resources', 'native-binary', platform === 'win32' ? 'claude.exe' : 'claude');
    if (isFile(f)) return launcher(f);
  }
  return null;
}

/**
 * Claude Code on this computer: "claude" in bryn.config.json, else the newest one the VS Code extension carries (an npm
 * install on the PATH can lag far behind it: GO1006 measured 2.1.263 on the PATH, too old for the newest models, beside
 * 2.1.289 in the extension), else the PATH, else ~/.local/bin. Null when not found.
 */
function findClaude(opts) {
  const o = opts || {};
  if (o.claude) return isFile(o.claude) ? launcher(path.resolve(o.claude)) : null;
  const env = o.env || process.env;
  const platform = o.platform || process.platform;
  if (!o.noExtension) { const x = extensionClaude(platform, o.home); if (x) return x; }
  const dirs = String(env.PATH || env.Path || '').split(path.delimiter).filter(Boolean);
  dirs.push(path.join(os.homedir(), '.local', 'bin'));
  const names = platform === 'win32' ? ['claude.exe', 'claude.cmd'] : ['claude'];
  for (const name of names) {
    for (const d of dirs) {
      const f = path.join(d.replace(/^"|"$/g, ''), name);
      if (isFile(f)) { const l = launcher(f); if (l) return l; }
    }
  }
  return null;
}

function imageOf(pid) {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH'], { encoding: 'utf8', windowsHide: true, timeout: 5000 });
      const m = /^"([^"]+)","(\d+)"/m.exec(out);
      return m && Number(m[2]) === pid ? m[1] : null;
    }
    const out = execFileSync('ps', ['-o', 'comm=', '-p', String(pid)], { encoding: 'utf8', timeout: 5000 }).trim();
    return out ? path.basename(out) : null;
  } catch (_) { return null; }
}
function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
}
const sameImage = (a, b) => {
  const x = String(a || '').toLowerCase().replace(/\.exe$/, '');
  const y = String(b || '').toLowerCase().replace(/\.exe$/, '');
  return Boolean(x && y) && (x === y || (x.length >= 15 && y.startsWith(x)) || (y.length >= 15 && x.startsWith(y)));
};

/** The run that is going, or null. `strict` also checks the pid is still the program that was started. */
function current(cfg, strict, now) {
  const at = now || Date.now();
  const r = readJson(runFile(cfg));
  if (!r || typeof r !== 'object' || r.ended) return null;
  if (r.starting) return at - Date.parse(r.at) < STARTING_MS ? { starting: true, started: r.at, pid: null } : null;
  if (!(at - Date.parse(r.beat) < STALE_BEAT_MS)) return null;
  if (!alive(r.pid)) return null;
  if (strict && !sameImage(imageOf(r.pid), r.image)) return null;
  return { pid: r.pid, image: r.image, started: r.started, starting: false };
}

/** What her dashboard needs: is a run going, how many questions wait, can one start, how the last one ended. */
function status(cfg, opts) {
  const o = opts || {};
  const run = current(cfg, false, o.now);
  const last = readJson(runFile(cfg));
  return {
    running: Boolean(run), since: run ? run.started : null,
    waiting: asks.list(cfg.asksFile).length,
    claude: Boolean(o.claudeFound != null ? o.claudeFound : findClaude({ claude: o.claude })),
    last: !run && last && last.ended ? { ended: last.ended, ok: last.code === 0 && !last.error, stopped: Boolean(last.stopped) } : null,
  };
}

const runEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !SESSION_ENV.includes(k.toUpperCase())));

/** Start the runner detached, with nothing of ours. The job file holds paths and arguments only, never the environment. */
function launchDetached(job, cfg) {
  const runner = path.join(__dirname, 'take-run.js');
  const jf = jobFile(cfg);
  writeJson(jf, job);
  const env = runEnv();
  if (process.platform === 'win32') {
    const vbs = path.join(__dirname, 'detach.vbs');
    const w = spawn('wscript.exe', ['//B', '//Nologo', vbs, process.execPath, runner, jf], { cwd: cfg.home, env, detached: true, stdio: 'ignore', windowsHide: true });
    w.on('error', () => { /* seen below: the run file never gets a pid */ });
    w.unref();
    return;
  }
  const c = spawn(process.execPath, [runner, jf], { cwd: cfg.home, env, detached: true, stdio: 'ignore' });
  c.on('error', () => { /* seen below */ });
  c.unref();
}

/** Start one run. Resolves { running, pid } once the runner has started the program, or throws with .status and .reason. */
async function start(cfg, opts) {
  const o = opts || {};
  const found = findClaude({ claude: o.claude });
  if (!found) throw refuse(409, 'no-claude', 'I need Claude Code on this computer to take a question up by myself. Install it, or name its program in bryn.config.json as "claude".');
  if (!asks.list(cfg.asksFile).length) throw refuse(409, 'empty', 'No questions are waiting at the trailhead.');
  if (current(cfg, true)) throw refuse(409, 'running', "I'm already out on the trail with a question.");
  const have = skills.ensure({ home: cfg.home, hub: o.hub !== undefined ? o.hub : cfg.hub, homeDir: o.homeDir });
  if (have.missing.length) {
    throw refuse(409, 'no-skill', `I need the ${have.missing[0]} skill installed first. Put it in your Hub's .claude/skills or in ~/.claude/skills, then try again.`);
  }

  const token = `${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  const job = {
    token, cwd: cfg.home, log: logFile(cfg), runFile: runFile(cfg), stageFile: cfg.stageFile,
    program: found.program, args: found.args.concat(ARGS(cfg.data)), image: found.image,
  };
  fs.mkdirSync(cfg.data, { recursive: true }); // --add-dir names a working folder only when it is there
  writeJson(runFile(cfg), { starting: true, token, at: new Date().toISOString() });
  (o.launch || launchDetached)(job, cfg);

  const until = Date.now() + (o.waitMs || 15000);
  for (;;) {
    const r = readJson(runFile(cfg));
    if (r && r.token === token && r.pid) return { running: !r.ended, pid: r.pid };
    if (r && r.token === token && r.ended) break;
    if (Date.now() > until) break;
    await new Promise((res) => setTimeout(res, 150));
  }
  writeJson(runFile(cfg), { token, ended: new Date().toISOString(), error: 'did not start' });
  throw refuse(500, 'not-started', "I couldn't set off. The details are in take.log in my data folder.");
}

/** Stop the run she recorded, and only that one. Her stage goes back to idle with a plain note. */
function stop(cfg) {
  const run = current(cfg, true);
  if (!run) throw refuse(409, 'not-running', "I'm not out on the trail right now.");
  if (run.starting) throw refuse(409, 'starting', "I'm only just setting off. Try again in a moment.");
  try {
    if (process.platform === 'win32') execFileSync('taskkill', ['/PID', String(run.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore', timeout: 15000 });
    else { try { process.kill(-run.pid, 'SIGTERM'); } catch (_) { process.kill(run.pid, 'SIGTERM'); } }
  } catch (_) { /* gone already, or partly: checked below */ }
  const r = readJson(runFile(cfg)) || {};
  if (!r.ended) writeJson(runFile(cfg), Object.assign(r, { ended: new Date().toISOString(), stopped: true }));
  try {
    const own = stage.current(cfg.stageFile);
    if (own && own.stage !== 'idle' && own.stage !== 'waiting') stage.set(cfg.stageFile, 'idle', { note: 'Called back from the trail from her dashboard.' });
  } catch (_) { /* her stage is a nicety here */ }
  return { running: alive(run.pid) && sameImage(imageOf(run.pid), run.image) };
}

module.exports = { PROMPT, ARGS, SCRIPTS, DENY_EDIT, findClaude, launcher, current, status, start, stop, runFile, logFile, jobFile, SESSION_ENV };
