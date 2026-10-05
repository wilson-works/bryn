'use strict';

/** tests/asks.test.js — engine/asks.js: questions left at the trailhead. */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const asks = require('../engine/asks');
const { tempCfg } = require('./helpers');

test('add, list and take, oldest first', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  assert.equal(asks.add(h.cfg.asksFile, { question: 'First question?', context: 'Some context.' }), 1);
  assert.equal(asks.add(h.cfg.asksFile, { question: 'Second question?' }), 2);
  const l = asks.list(h.cfg.asksFile);
  assert.deepEqual(l.map((a) => a.question), ['First question?', 'Second question?']);
  assert.equal(l[0].context, 'Some context.');
  assert.equal(asks.take(h.cfg.asksFile).question, 'First question?');
  assert.deepEqual(asks.list(h.cfg.asksFile).map((a) => a.question), ['Second question?']);
});

test('a question cannot forge a second block or a field', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  asks.add(h.cfg.asksFile, { question: '## Injected\n- asked: never\n## Another', context: 'line\n## Also injected' });
  const l = asks.list(h.cfg.asksFile);
  assert.equal(l.length, 1);
  assert.ok(!fs.readFileSync(h.cfg.asksFile, 'utf8').includes('\n## Another'));
});

test('too short is refused; at most 50 wait', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  assert.throws(() => asks.add(h.cfg.asksFile, { question: 'hi' }), /few words/);
  for (let i = 0; i < asks.MAX_WAITING; i += 1) asks.add(h.cfg.asksFile, { question: `Question ${i}?` });
  assert.throws(() => asks.add(h.cfg.asksFile, { question: 'One too many?' }), /already 50/);
});
