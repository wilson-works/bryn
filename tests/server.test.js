'use strict';

/**
 * tests/server.test.js — dashboard/server.js on a port the system picks, with a temporary data folder:
 * /health, every API route, the Host rule, path containment, the POST rules, and the security headers.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const { start } = require('../dashboard/server');
const decisions = require('../engine/decisions');
const { tempCfg, request } = require('./helpers');

async function up(t) {
  const h = tempCfg();
  decisions.clearCache();
  const server = start({ cfg: h.cfg, port: 0, pidFile: false, quiet: true });
  await new Promise((r) => server.once('listening', r));
  t.after(() => new Promise((r) => server.close(() => { h.cleanup(); r(); })));
  return { port: server.address().port, h };
}

test('/health answers {"ok":true} with no token', async (t) => {
  const { port } = await up(t);
  const r = await request(port, { path: '/health' });
  assert.equal(r.status, 200);
  assert.equal(r.body, '{"ok":true}');
});

test('a foreign Host is refused', async (t) => {
  const { port } = await up(t);
  const r = await request(port, { path: '/api/stage', host: 'evil.example' });
  assert.equal(r.status, 403);
  assert.equal((await request(port, { path: '/health', host: `localhost:${port}` })).status, 200);
});

test('the page, its script and a scene are served, with a strict policy on the page', async (t) => {
  const { port } = await up(t);
  const page = await request(port, { path: '/' });
  assert.equal(page.status, 200);
  assert.match(page.headers['content-security-policy'], /script-src 'self'/);
  assert.equal(page.headers['x-frame-options'], 'DENY');
  assert.equal((await request(port, { path: '/app.js' })).status, 200);
  assert.equal((await request(port, { path: '/art/council.svg' })).status, 200);
  assert.equal((await request(port, { path: '/brand/copy.json' })).status, 200);
  assert.equal((await request(port, { path: '/mark.svg' })).status, 200);
});

test('nothing outside the served folders can be reached', async (t) => {
  const { port } = await up(t);
  for (const p of ['/../agent.json', '/%2e%2e/agent.json', '/art/..%2fagent.json', '/brand/%2e%2e%2fCLAUDE.md', '/server.js', '/art/', '/.gitignore', '/engine/stage.js']) {
    const r = await request(port, { path: p });
    assert.ok(r.status === 404 || r.status === 400, `${p} gave ${r.status}`);
  }
});

test('the API over the examples', async (t) => {
  const { port } = await up(t);
  const st = await request(port, { path: '/api/stage' });
  assert.equal(st.json.stage, 'idle');
  const list = await request(port, { path: '/api/decisions' });
  assert.equal(list.json.examples, true);
  assert.ok(list.json.decisions.length >= 5);
  const one = await request(port, { path: '/api/decision/2026-09-12-repair-or-replace-laptop' });
  assert.equal(one.json.pages[0].name, 'The question');
  const pg = await request(port, { path: '/api/decision/2026-09-12-repair-or-replace-laptop/page/2' });
  assert.equal(pg.json.name, 'The council');
  const rep = await request(port, { path: '/api/decision/2026-09-12-repair-or-replace-laptop/report/council-report-20260912-1930.html' });
  assert.equal(rep.status, 200);
  assert.match(rep.headers['content-security-policy'], /^sandbox/);
  assert.equal((await request(port, { path: '/api/decision/2026-09-12-nope' })).status, 404);
  assert.equal((await request(port, { path: '/api/decision/..%2f..%2fagent/page/1' })).status, 404);
  const pol = await request(port, { path: '/api/policies' });
  assert.equal(pol.json.policies.length, 3);
});

test('consult sets the stage to consulting and answers with the marker', async (t) => {
  const { port } = await up(t);
  const r = await request(port, { method: 'POST', path: '/api/consult', body: { q: 'washing machine broke, repair?' } });
  assert.equal(r.status, 200);
  assert.equal(r.json.policy.id, 'POL-001');
  assert.equal((await request(port, { path: '/api/stage' })).json.stage, 'consulting');
});

test('ask keeps the question in the data folder only', async (t) => {
  const { port, h } = await up(t);
  const r = await request(port, { method: 'POST', path: '/api/ask', body: { question: 'Move book club to Thursday?', context: 'Two work late.' } });
  assert.deepEqual(r.json, { queued: 1 });
  assert.ok(fs.readFileSync(h.cfg.asksFile, 'utf8').includes('Move book club to Thursday?'));
  const l = await request(port, { path: '/api/asks' });
  assert.equal(l.json.asks.length, 1);
});

test('POST rules: JSON only, an object, at most 16 KB, and a real question', async (t) => {
  const { port } = await up(t);
  assert.equal((await request(port, { method: 'POST', path: '/api/ask', body: 'question=x', type: 'application/x-www-form-urlencoded' })).status, 415);
  assert.equal((await request(port, { method: 'POST', path: '/api/ask', body: '{nope' })).status, 400);
  assert.equal((await request(port, { method: 'POST', path: '/api/ask', body: '[1,2]' })).status, 400);
  assert.equal((await request(port, { method: 'POST', path: '/api/ask', body: { question: 'x'.repeat(20000) } })).status, 413);
  assert.equal((await request(port, { method: 'POST', path: '/api/ask', body: { question: 'hi' } })).status, 400);
  assert.equal((await request(port, { method: 'POST', path: '/api/consult', body: { q: '' } })).status, 400);
  assert.equal((await request(port, { method: 'DELETE', path: '/api/asks' })).status, 405);
});
