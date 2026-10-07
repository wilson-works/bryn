'use strict';

/**
 * tests/package.test.js — the package as a whole: agent.json against the Workspace contract (the checks of
 * agents/lib/agents.js validateManifest, restated here so this repo stands alone), the scenes the page can show
 * under its strict policy, every copy key the page reads, and the public-repo fence.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { REPO } = require('./helpers');

const read = (p) => fs.readFileSync(path.join(REPO, p), 'utf8');
const manifest = JSON.parse(read('agent.json'));
const copy = JSON.parse(read('brand/copy.json'));
const STAGES = require('../engine/stage').STAGES;

test('agent.json keeps the Workspace agent contract', () => {
  const m = manifest;
  assert.match(m.key, /^[a-z][a-z0-9-]{0,30}$/);
  assert.equal(m.key, 'bryn');
  assert.ok(m.name.length <= 40 && m.title.length <= 60 && m.line.length <= 200);
  assert.ok(['live', 'building', 'planned'].includes(m.status));
  assert.match(m.door.local, /^http:\/\/127\.0\.0\.1:(\d+)\/$/);
  assert.equal(Number(/:(\d+)\//.exec(m.door.local)[1]), m.probe.port);
  assert.equal(m.probe.path, '/health');
  assert.equal(m.start, 'node dashboard/server.js');
  assert.equal(m.autostart, true);
  for (const c of ['bg', 'panel', 'ink', 'accent', 'accent2']) assert.match(m.brand[c], /^#[0-9a-fA-F]{6}$/);
  for (const f of [m.brand.mark, m.art]) assert.ok(fs.existsSync(path.join(REPO, f)), f);
  assert.ok(m.jokes.length <= 12 && m.jokes.every((j) => j.length <= 160));
  assert.deepEqual(m.requires.skills, ['brainstorm', 'llm-council', 'premortem', 'decision-policy']);
  assert.ok(m.requires.skills.every((s) => /^[a-z][a-z0-9-]{0,29}$/.test(s)));
});

test('agent.json says what copy.json says', () => {
  assert.equal(manifest.title, copy.title);
  assert.equal(manifest.line, copy.line);
  assert.deepEqual(manifest.jokes, copy.jokes);
});

test('every stage has a scene with no styles, scripts or outside references, and some motion', () => {
  for (const s of STAGES) {
    const svg = read(`art/${s}.svg`);
    assert.match(svg, /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/, s);
    assert.match(svg, /viewBox="0 0 640 360"/, s);
    assert.ok(!/<style|style=|<script|<image|<use|href=|<foreignObject|\son[a-z]+=/i.test(svg), `${s} carries something the page's policy blocks`);
    assert.match(svg, /class="[^"]*anim-/, `${s} has a moving part`);
  }
});

test('every copy key the page reads exists, and every stage has a label and a caption', () => {
  const js = read('dashboard/public/app.js');
  const html = read('dashboard/public/index.html');
  const keys = new Set([...js.matchAll(/t\('((?:ui|status|leans|seats|stages)\.[a-z_.-]+|name|title|line|stalled|parked|examples_idle)'/g)].map((m) => m[1])
    .concat([...html.matchAll(/data-copy="([a-z_.]+)"/g)].map((m) => m[1])));
  const get = (k) => k.split('.').reduce((o, x) => (o ? o[x] : undefined), copy);
  for (const k of keys) assert.equal(typeof get(k), 'string', `copy.json has ${k}`);
  for (const s of STAGES) assert.ok(copy.stages[s].label && copy.stages[s].caption, s);
});

test('the public-repo fence: no real drive paths and not the refused phrase, in any committed text', () => {
  const files = [];
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(REPO, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { if (!['.git', 'node_modules', 'data', '.claude'].includes(e.name)) walk(r); } else if (/\.(md|json|js|css|html|svg)$/.test(e.name) && e.name !== 'bryn.config.json') files.push(r);
    }
  };
  walk('');
  // Any drive path except the invented person's home, and the phrase the release scan refuses (built from its
  // character codes so this file does not carry it, even with the spaces taken out).
  const banned = [/\b[A-Z]:[\\/](?!Users[\\/]alex\b)/, new RegExp('\\bup[\\s-]to[\\s-]' + String.fromCharCode(100, 97, 116, 101) + '\\b', 'i')];
  for (const f of files) {
    const text = read(f);
    for (const re of banned) assert.ok(!re.test(text), `${f} matches ${re}`);
  }
});
