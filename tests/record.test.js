'use strict';

/** tests/record.test.js — engine/record.js: opening a decision, updating it, refusing bad values. */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const record = require('../engine/record');
const { tempCfg } = require('./helpers');

const read = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));

test('new makes a dated folder with a slug, and a second one with the same question gets -2', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const a = record.create(h.cfg, 'Repair the old laptop, or replace it?', { door: 'two-way', stakes: 'low', planned: 'framing,council,review,verdict,filing', options: 'Repair|Replace' });
  assert.match(a.id, /^\d{4}-\d{2}-\d{2}-repair-the-old-laptop-or-replace-it$/);
  const m = read(a.dir);
  assert.equal(m.status, 'in-progress');
  assert.deepEqual(m.planned, ['framing', 'council', 'review', 'verdict', 'filing']);
  assert.deepEqual(m.options, ['Repair', 'Replace']);
  assert.equal(m.outcome, null);
  const b = record.create(h.cfg, 'Repair the old laptop, or replace it?', {});
  assert.equal(b.id, `${a.id}-2`);
});

test('set updates fields and "updated"; merge takes seats, premortem and models only', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const { id, dir } = record.create(h.cfg, 'Adopt a second dog?', {});
  const before = read(dir).updated;
  record.update(h.cfg, id, { status: 'waiting', verdict: 'Foster first.', revisit: '2027-01-15' },
    JSON.stringify({ seats: [{ seat: 'executor', lean: 'for', line: 'Foster is a trial run.' }], premortem: { likely: 'a', dangerous: 'b', assumption: 'c' } }));
  const m = read(dir);
  assert.equal(m.status, 'waiting');
  assert.equal(m.verdict, 'Foster first.');
  assert.equal(m.seats[0].seat, 'executor');
  assert.equal(m.premortem.assumption, 'c');
  assert.ok(m.updated >= before);
  assert.throws(() => record.update(h.cfg, id, {}, JSON.stringify({ outcome: 'sneaky' })), /only seats, premortem and models/);
});

test('bad values are refused before anything is written', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const { id, dir } = record.create(h.cfg, 'Q?', {});
  const was = fs.readFileSync(path.join(dir, 'meta.json'), 'utf8');
  assert.throws(() => record.update(h.cfg, id, { status: 'done' }), /status must be/);
  assert.throws(() => record.update(h.cfg, id, { door: 'revolving' }), /door must be/);
  assert.throws(() => record.update(h.cfg, id, { revisit: 'next spring' }), /YYYY-MM-DD/);
  assert.throws(() => record.update(h.cfg, id, { planned: 'framing,deciding' }), /planned/);
  assert.throws(() => record.update(h.cfg, id, {}, JSON.stringify({ seats: [{ seat: 'judge', lean: 'for', line: 'x' }] })), /each seat/);
  assert.equal(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'), was);
});

test('an id outside the decisions folder is refused', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  for (const bad of ['../x', '2026-10-05-missing', 'log']) assert.throws(() => record.update(h.cfg, bad, { status: 'parked' }));
});

test('the command line prints the id and folder, and refuses with exit 2', (t) => {
  const h = tempCfg();
  t.after(h.cleanup);
  const out = { s: '', write(x) { this.s += x; } };
  const err = { s: '', write(x) { this.s += x; } };
  assert.equal(record.main(['new', 'Take the bus?', '--door', 'two-way'], { cfg: h.cfg, out, err }), 0);
  const id = out.s.split('\n')[0];
  assert.ok(fs.existsSync(path.join(h.cfg.decisions, id, 'meta.json')));
  assert.equal(record.main(['set', id, '--status', 'nope'], { cfg: h.cfg, out, err }), 2);
  assert.equal(record.main(['new', 'Q?', '--colour', 'red'], { cfg: h.cfg, out, err }), 2);
});
