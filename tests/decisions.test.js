'use strict';

/** tests/decisions.test.js — engine/decisions.js: the examples, a real data folder taking over, pages, the log, containment. */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const decisions = require('../engine/decisions');
const record = require('../engine/record');
const { tempCfg } = require('./helpers');

test('an empty data folder shows the invented examples, marked as examples', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  decisions.clearCache();
  const r = decisions.list(h.cfg, {});
  assert.equal(r.examples, true);
  assert.ok(r.total >= 5);
  for (const s of decisions.STATUSES) assert.ok(r.counts[s] >= 1, `the examples show a ${s} stone`);
});

test('the first real decision replaces the examples', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  decisions.clearCache();
  const { id } = record.create(h.cfg, 'Take the evening class or the weekend one?', { door: 'two-way', stakes: 'low' });
  decisions.clearCache();
  const r = decisions.list(h.cfg, {});
  assert.equal(r.examples, false);
  assert.deepEqual(r.decisions.map((d) => d.id), [id]);
  assert.equal(decisions.policies(h.cfg).examples, false);
});

test('filter by status and search by words', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  decisions.clearCache();
  const decided = decisions.list(h.cfg, { status: 'decided' });
  assert.ok(decided.decisions.length >= 1);
  assert.ok(decided.decisions.every((d) => d.status === 'decided'));
  const laptop = decisions.list(h.cfg, { q: 'laptop' });
  assert.equal(laptop.decisions[0].id, '2026-09-12-repair-or-replace-laptop');
  assert.equal(decisions.list(h.cfg, { status: 'nonsense' }).decisions.length, decisions.list(h.cfg, {}).decisions.length);
});

test('a decision lists its pages in reading order, and a page reads back', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const d = decisions.get(h.cfg, '2026-09-26-adopt-a-second-dog');
  assert.deepEqual(d.pages.map((p) => p.name), ['The question', 'The council', 'The premortem']);
  assert.equal(d.seats.length, 5);
  assert.ok(d.premortem.assumption);
  const p = decisions.page(h.cfg, d.id, 3);
  assert.equal(p.name, 'The premortem');
  assert.match(p.markdown, /six months/);
  assert.equal(decisions.page(h.cfg, d.id, 9), null);
});

test('ids that are not decision folders are refused: no traversal', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  for (const bad of ['..', '../..', '2026-10-05-../x', 'log', '2026-10-05-UPPER', '']) {
    assert.equal(decisions.get(h.cfg, bad), null, bad);
    assert.equal(decisions.page(h.cfg, bad, 1), null, bad);
  }
  assert.equal(decisions.report(h.cfg, '2026-09-12-repair-or-replace-laptop', '../meta.json'), null);
  assert.equal(decisions.report(h.cfg, '2026-09-12-repair-or-replace-laptop', 'brief.md'), null);
  assert.ok(decisions.report(h.cfg, '2026-09-12-repair-or-replace-laptop', 'council-report-20260912-1930.html'));
});

test('a page over 512 KB is refused with a reason', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const { id, dir } = record.create(h.cfg, 'A very long brief?', {});
  fs.writeFileSync(path.join(dir, 'brief.md'), 'x'.repeat(513 * 1024));
  decisions.clearCache();
  const p = decisions.page(h.cfg, id, 1);
  assert.equal(p.code, 413);
});

test('unknown meta fields are dropped and bad values fall back', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const { id, dir } = record.create(h.cfg, 'Odd meta?', {});
  const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  Object.assign(meta, { status: 'exploded', seats: [{ seat: 'judge', lean: 'for' }, { seat: 'outsider', lean: 'maybe', line: 'hm' }], secret: 'x' });
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta));
  decisions.clearCache();
  const d = decisions.get(h.cfg, id);
  assert.equal(d.status, 'in-progress');
  assert.deepEqual(d.seats, [{ seat: 'outsider', lean: 'split', line: 'hm' }]);
  assert.equal(d.secret, undefined);
});

test('the log: policies sorted by id, the record, and consult finds the marker first', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const p = decisions.policies(h.cfg);
  assert.deepEqual(p.policies.map((x) => x.id), ['POL-001', 'POL-002', 'POL-003']);
  assert.ok(p.policies.every((x) => x.trigger && x.rule && x.escalate_if));
  assert.equal(p.records.length, 1);
  const c = decisions.consult(h.cfg, 'the washing machine broke, repair or replace?');
  assert.equal(c.policy.id, 'POL-001');
  const none = decisions.consult(h.cfg, 'zzzz qqqq');
  assert.equal(none.policy, null);
  assert.equal(none.decision, null);
});
