'use strict';

/** tests/stage.test.js — engine/stage.js: the stages, the stall and park rules, consulting falling back. */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const stage = require('../engine/stage');
const { tempCfg } = require('./helpers');

const T0 = Date.parse('2026-10-05T12:00:00.000Z');

test('no file reads as idle', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  assert.equal(stage.current(h.cfg.stageFile).stage, 'idle');
});

test('set then get, with question, decision, step and note', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  stage.set(h.cfg.stageFile, 'council', { question: 'Q?', decision: '2026-10-05-q', step: '3/7', note: 'out', now: T0 });
  const s = stage.current(h.cfg.stageFile, T0 + 1000);
  assert.deepEqual(s, { stage: 'council', question: 'Q?', decision: '2026-10-05-q', step: { n: 3, of: 7 }, since: new Date(T0).toISOString(), note: 'out' });
});

test('an unknown stage and a bad step are refused, and nothing is written', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  assert.throws(() => stage.set(h.cfg.stageFile, 'deciding', {}), /not a stage/);
  assert.throws(() => stage.set(h.cfg.stageFile, 'council', { step: '9/7' }), /3\/7/);
  assert.throws(() => stage.set(h.cfg.stageFile, 'council', { step: 'three' }), /3\/7/);
  assert.equal(fs.existsSync(h.cfg.stageFile), false);
});

test('a working stage unchanged for over 30 minutes is stalled, and says where', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  stage.set(h.cfg.stageFile, 'review', { question: 'Q?', now: T0 });
  assert.equal(stage.current(h.cfg.stageFile, T0 + 29 * 60000).stage, 'review');
  const s = stage.current(h.cfg.stageFile, T0 + 31 * 60000);
  assert.equal(s.stage, 'idle');
  assert.deepEqual(s.stalled, { stage: 'review', since: new Date(T0).toISOString() });
  assert.equal(s.question, 'Q?');
});

test('waiting never stalls, and is parked after a day', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  stage.set(h.cfg.stageFile, 'waiting', { question: 'Q?', now: T0 });
  assert.equal(stage.current(h.cfg.stageFile, T0 + 5 * 3600000).stage, 'waiting');
  const s = stage.current(h.cfg.stageFile, T0 + 25 * 3600000);
  assert.equal(s.stage, 'idle');
  assert.ok(s.parked);
});

test('consulting lasts a few seconds, then falls back to the stage it interrupted', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  stage.set(h.cfg.stageFile, 'council', { question: 'Big one', step: '3/7', now: T0 });
  stage.set(h.cfg.stageFile, 'consulting', { question: 'Small one', now: T0 + 1000 });
  assert.equal(stage.current(h.cfg.stageFile, T0 + 2000).stage, 'consulting');
  const back = stage.current(h.cfg.stageFile, T0 + 1000 + stage.CONSULT_MS + 1);
  assert.equal(back.stage, 'council');
  assert.equal(back.question, 'Big one');
  assert.deepEqual(back.step, { n: 3, of: 7 });
});

test('consulting from idle falls back to idle', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  stage.set(h.cfg.stageFile, 'consulting', { question: 'Q?', now: T0 });
  assert.equal(stage.current(h.cfg.stageFile, T0 + stage.CONSULT_MS + 1).stage, 'idle');
});

test('idle clears the question; control characters are folded and long text clipped', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  stage.set(h.cfg.stageFile, 'framing', { question: `a\nb\u0007c${'x'.repeat(400)}`, now: T0 });
  const q = stage.current(h.cfg.stageFile, T0).question;
  assert.ok(!/[\n\u0007]/.test(q));
  assert.ok(q.length <= 300);
  stage.set(h.cfg.stageFile, 'idle', { question: 'ignored', now: T0 });
  assert.equal(stage.current(h.cfg.stageFile, T0).question, null);
});

test('a file that is not JSON reads as idle', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  fs.mkdirSync(path.dirname(h.cfg.stageFile), { recursive: true });
  fs.writeFileSync(h.cfg.stageFile, '{not json');
  assert.equal(stage.current(h.cfg.stageFile).stage, 'idle');
});

test('the command line sets and reports, and refuses with exit 2', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const out = { s: '', write(x) { this.s += x; } };
  const err = { s: '', write(x) { this.s += x; } };
  assert.equal(stage.main(['set', 'premortem', '--question', 'Q?', '--step', '6/7'], { file: h.cfg.stageFile, out, err }), 0);
  assert.match(out.s, /premortem \(step 6 of 7\)/);
  assert.equal(stage.main(['set', 'nope'], { file: h.cfg.stageFile, out, err }), 2);
  assert.match(err.s, /not a stage/);
});
