'use strict';

/** tests/take.test.js — engine/take.js: the headless run from her dashboard ("Bryn, take up the next question."). */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const take = require('../engine/take');
const asks = require('../engine/asks');
const { tempCfg } = require('./helpers');

test('the fixed arguments: headless, her data folder only, no bypass, no web, no bare Bash or Edit', () => {
  const a = take.ARGS('/data/bryn');
  assert.equal(a[a.indexOf('-p') + 1], 'Bryn, take up the next question.');
  assert.equal(a[a.indexOf('--add-dir') + 1], '/data/bryn');
  assert.equal(a[a.indexOf('--permission-mode') + 1], 'acceptEdits');
  assert.equal(a[a.indexOf('--permission-prompts') + 1], 'none');
  const joined = a.join(' ');
  assert.ok(!/bypass|dangerously|WebSearch|WebFetch/.test(joined));
  assert.ok(!a.includes('Bash') && !a.includes('Edit') && !a.includes('Write'));
  const allowed = a.slice(a.indexOf('--allowedTools') + 1, a.indexOf('--disallowedTools'));
  assert.ok(allowed.every((x) => ['Agent', 'Skill'].includes(x) || /^Bash\(node engine\/[a-z-]+\.js( \*)?\)$/.test(x)), allowed.join(', '));
  for (const p of ['engine/**', 'dashboard/**', 'CLAUDE.md', 'agent.json', '.claude/**']) assert.ok(a.includes(`Edit(${p})`), p);
  assert.ok(a.includes('AskUserQuestion') && a.includes('CronCreate'));
});

test('start refuses with nothing waiting, and never launches', async (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  let launched = false;
  const node = process.execPath;
  await assert.rejects(take.start(h.cfg, { claude: path.join(path.dirname(node), path.basename(node)), launch: () => { launched = true; } }), (e) => e.reason === 'empty');
  assert.equal(launched, false);
});

test('start with a question writes a job with the fixed arguments; the run file decides "running"', async (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  asks.add(h.cfg.asksFile, { question: 'Paint the shed green or grey?' });
  const skillsHome = fs.mkdtempSync(path.join(h.root, 'home-'));
  for (const n of ['brainstorm', 'llm-council', 'premortem', 'decision-policy']) {
    fs.mkdirSync(path.join(skillsHome, '.claude', 'skills', n), { recursive: true });
    fs.writeFileSync(path.join(skillsHome, '.claude', 'skills', n, 'SKILL.md'), `# ${n}\n`);
  }
  const cfg = Object.assign({}, h.cfg, { home: fs.mkdtempSync(path.join(h.root, 'bryn-')) });
  fs.copyFileSync(path.join(__dirname, '..', 'agent.json'), path.join(cfg.home, 'agent.json'));
  let job = null;
  const r = await take.start(cfg, {
    claude: process.execPath, hub: null, homeDir: skillsHome, waitMs: 2000,
    launch: (j) => { job = j; fs.writeFileSync(j.runFile, JSON.stringify({ token: j.token, pid: process.pid, image: 'node', started: new Date().toISOString(), beat: new Date().toISOString() })); },
  });
  assert.equal(r.pid, process.pid);
  assert.equal(job.cwd, cfg.home);
  assert.deepEqual(job.args.slice(-take.ARGS(cfg.data).length), take.ARGS(cfg.data));
  assert.equal(take.status(cfg, { claudeFound: true }).running, true);
  assert.ok(fs.existsSync(path.join(cfg.home, '.claude', 'skills', 'llm-council', 'SKILL.md')));
});

test('stop refuses when nothing is going', () => {
  const h = tempCfg();
  try { assert.throws(() => take.stop(h.cfg), (e) => e.reason === 'not-running'); } finally { h.cleanup(); }
});
