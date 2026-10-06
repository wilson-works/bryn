'use strict';

/**
 * tests/vignettes.test.js — the living trailhead (v4): which idle vignette shows and when it changes
 * (dashboard/public/vignettes.js), the three vignette scenes and the campfire, and the motion rules every scene keeps:
 * each anim-* hook has a rule and keyframes in app.css, no animated element carries a transform attribute, Pause and
 * reduced motion stop all of it, and no loop runs fast enough to flash.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const V = require('../dashboard/public/vignettes');
const { start } = require('../dashboard/server');
const decisions = require('../engine/decisions');
const { REPO, tempCfg, request } = require('./helpers');

const read = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const copy = JSON.parse(read('brand/copy.json'));
const css = read('dashboard/public/app.css');
const tokens = read('brand/tokens.css');
const ART = fs.readdirSync(path.join(REPO, 'art')).filter((n) => n.endsWith('.svg'));
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

/* ------------------------------------------------------------------ which vignette, and when */

test('three vignettes, the rock among them, changing every few minutes', () => {
  assert.deepEqual(V.VIGNETTES, ['idle', 'idle-trail', 'idle-kayak']);
  assert.equal(V.STILL, 'idle');
  assert.ok(V.ROTATE_MS >= 60000 && V.ROTATE_MS <= 600000, `ROTATE_MS ${V.ROTATE_MS}`);
});

test('the first vignette is random, can be asked for by name, and is always the rock for reduced motion', () => {
  assert.equal(V.first({ rand: () => 0 }), 'idle');
  assert.equal(V.first({ rand: () => 0.5 }), 'idle-trail');
  assert.equal(V.first({ rand: () => 0.999 }), 'idle-kayak');
  assert.equal(V.first({ rand: () => 1 }), 'idle-kayak', 'a rand() of exactly 1 stays in range');
  assert.equal(V.first({ wanted: 'kayak', rand: () => 0 }), 'idle-kayak');
  assert.equal(V.first({ wanted: 'nonsense', rand: () => 0.5 }), 'idle-trail');
  for (const r of [0, 0.4, 0.99]) assert.equal(V.first({ reduced: true, wanted: 'trail', rand: () => r }), 'idle');
});

test('the next vignette is never the one showing, and both others come up', () => {
  for (const cur of V.VIGNETTES) {
    const seen = new Set();
    const rand = seq(0, 0.3, 0.6, 0.99);
    for (let i = 0; i < 8; i++) {
      const n = V.next(cur, rand);
      assert.notEqual(n, cur);
      assert.ok(V.VIGNETTES.includes(n));
      seen.add(n);
    }
    assert.equal(seen.size, 2, `from ${cur}`);
  }
});

test('the picture changes on its own only at idle, visible, playing, and without reduced motion', () => {
  assert.equal(V.rotates({ stage: 'idle' }), true);
  assert.equal(V.rotates({ stage: 'council' }), false);
  assert.equal(V.rotates({ stage: 'idle', paused: true }), false);
  assert.equal(V.rotates({ stage: 'idle', hidden: true }), false);
  assert.equal(V.rotates({ stage: 'idle', reduced: true }), false);
  assert.equal(V.rotates(), false);
});

test('each vignette has its copy key, a name for the picture and Bryn\'s line in her voice', () => {
  assert.deepEqual(V.VIGNETTES.map(V.key), ['rock', 'trail', 'kayak']);
  for (const v of V.VIGNETTES) {
    const c = copy.idle_vignettes[V.key(v)];
    assert.ok(c && c.scene && c.caption, v);
    for (const line of [c.scene, c.caption]) {
      assert.ok(!/—|!|\b(verdict|judge|ruling|predict|foresee)\b/i.test(line), `${v}: "${line}" breaks brand/VOICE.md`);
    }
  }
});

test('the page loads vignettes.js before app.js, and app.js wires rotation to Pause, visibility and reduced motion', () => {
  const html = read('dashboard/public/index.html');
  const a = html.indexOf('src="/vignettes.js"');
  const b = html.indexOf('src="/app.js"');
  assert.ok(a > 0 && b > a, 'vignettes.js first');
  const js = read('dashboard/public/app.js');
  assert.match(js, /window\.BrynVignettes/);
  assert.match(js, /prefers-reduced-motion: reduce/);
  assert.match(js, /state\.paused = paused;[\s\S]{0,120}scheduleRotation\(\)/, 'Pause stops the rotation');
  assert.match(js, /visibilitychange[^\n]*scheduleRotation\(\)/, 'a hidden tab stops the rotation');
  assert.match(js, /setTimeout\(rotate, V\.ROTATE_MS\)/);
  // a change nobody asked for is not announced: the rotation writes the caption with the live region off
  const rot = /function rotate\(\) \{([\s\S]*?)\n  \}/.exec(js);
  assert.ok(rot, 'rotate()');
  assert.match(rot[1], /setCaptionQuietly\(/);
  assert.ok(!/\bsetCaption\(/.test(rot[1]), 'rotate() never writes the caption out loud');
  assert.match(js, /function setCaptionQuietly[\s\S]{0,200}setAttribute\('aria-live', 'off'\)/);
});

/* ------------------------------------------------------------------ the scenes */

const SCENE_RULES = (svg, name) => {
  assert.match(svg, /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/, name);
  assert.match(svg, /viewBox="0 0 640 360"/, name);
  assert.match(svg, /<title>[^<]{20,}<\/title>/, `${name} has a title a screen reader can read`);
  assert.ok(!/<style|style=|<script|<image|<use|href=|<foreignObject|<text|\son[a-z]+=/i.test(svg), `${name} carries something the page's policy blocks`);
  assert.ok(!/#000\b|#000000|"black"/i.test(svg), `${name} has no black`);
};

test('the three vignette scenes keep the scene contract and move', () => {
  const hooks = {
    idle: ['anim-breathe', 'anim-steam', 'anim-perch', 'anim-j-glance'],
    'idle-trail': ['anim-bob', 'anim-j-thigh-n', 'anim-j-shin-f', 'anim-j-polearm', 'anim-j-poleelbow', 'anim-j-polestaff', 'anim-j-swing-f', 'anim-j-swelbow-f', 'anim-drift-near', 'anim-drift-far', 'anim-j-graze', 'anim-j-browse'],
    'idle-kayak': ['anim-rock', 'anim-k-surge', 'anim-j-k-paddle', 'anim-j-k-torso', 'anim-j-k-up-n', 'anim-j-k-lo-n', 'anim-j-k-up-f', 'anim-j-k-lo-f', 'anim-k-splash-n', 'anim-k-splash-f', 'anim-drift-water', 'anim-leap', 'anim-j-heron'],
  };
  for (const v of V.VIGNETTES) {
    const svg = read(`art/${v}.svg`);
    SCENE_RULES(svg, v);
    for (const h of hooks[v]) assert.match(svg, new RegExp(`class="[^"]*\\b${h}\\b`), `${v} has ${h}`);
  }
});

test('the verdict is a campfire at the fork: fire, six figures leaning in, her hand giving the call, the signpost still there', () => {
  const svg = read('art/verdict.svg');
  SCENE_RULES(svg, 'verdict');
  assert.match(svg, /<title>[^<]*fire[^<]*<\/title>/i);
  for (const h of ['anim-flame', 'anim-spark', 'anim-smoke', 'anim-glow', 'anim-j-gesture']) assert.match(svg, new RegExp(`class="[^"]*\\b${h}\\b`), h);
  assert.ok((svg.match(/class="[^"]*\banim-lean\b/g) || []).length >= 5, 'five scouts lean in');
  assert.match(svg, /#C8432F/i, 'the red board and her red trail');
});

/* ------------------------------------------------------------------ arms (the owner, 2026-10-05: "arms are weird", "rowing action") */

// one @keyframes block (matching its braces, since a frame may carry its own timing function) as [{ at, t }]
const frames = (name) => {
  const start = css.indexOf(`@keyframes ${name} {`);
  assert.ok(start >= 0, `@keyframes ${name}`);
  let i = css.indexOf('{', start) + 1, depth = 1;
  for (; depth && i < css.length; i++) depth += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0;
  const body = css.slice(start, i);
  return [...body.matchAll(/([\d.]+)% \{ transform: ([^;]*);/g)].map((x) => ({ at: Number(x[1]), t: x[2] }));
};
const rotOf = (t) => Number(/rotate\((-?[\d.]+)deg\)/.exec(t)[1]);
const rule = (cls) => { const m = new RegExp(`\\.scene \\.${cls}\\s*\\{([^}]*)\\}`).exec(css); assert.ok(m, cls); return m[1]; };

test('walking arms swing against the legs: each free arm is forward while the leg on its own side is back', () => {
  const thigh = frames('thigh'), arm = frames('free-arm');
  assert.ok(rotOf(thigh[0].t) < 0, 'the near leg starts forward (negative is forward)');
  assert.ok(rotOf(arm[0].t) < 0 && rotOf(arm[0].t) === Math.min(...arm.map((k) => rotOf(k.t))), 'a free arm starts at its most forward');
  // the far arm runs on the near leg's clock (forward together = opposition); the near arm half a stride later
  const delay = (cls) => /animation-delay:\s*([^;]+);/.exec(rule(cls))[1].trim();
  assert.equal(delay('anim-j-swing-f'), delay('anim-j-thigh-n'));
  assert.match(delay('anim-j-swing-n'), /- var\(--loop-stride\) \/ 2/);
  // the elbow softens most as the arm comes forward, and never locks straight back past the drawn bend
  const elbow = frames('free-elbow').map((k) => rotOf(k.t));
  assert.ok(elbow[0] === Math.min(...elbow), 'the elbow is most bent at the forward swing');
});

test('a far arm is drawn behind: after the far leg, before the near leg and the torso, never across her front', () => {
  // the owner, 23:40: "left hand and arm still swinging on right side of body". In a side view facing right her left
  // arm is the far arm; it may only peek past the coat's edges, so it is painted before the near leg and the coat.
  // one walker at a time: Bryn on the trail, and the council's Contrarian (inside its own group)
  const trail = read('art/idle-trail.svg');
  const council = read('art/council.svg');
  const contrarian = council.slice(council.indexOf('id="council-contrarian"'));
  for (const [name, svg] of [['idle-trail', trail], ['council-contrarian', contrarian]]) {
    const at = (cls) => svg.search(new RegExp(`class="[^"]*\\b${cls}\\b`));
    assert.ok(at('anim-j-swing-f') > 0, `${name} has a swinging far arm`);
    assert.ok(at('anim-j-thigh-f') < at('anim-j-swing-f'), `${name}: far leg before far arm`);
    assert.ok(at('anim-j-swing-f') < at('anim-j-thigh-n'), `${name}: far arm before near leg`);
  }
  assert.ok(trail.search(/class="[^"]*\banim-j-swing-f\b/) < trail.search(/class="[^"]*\banim-j-polearm\b/), 'the far arm before the near (pole) arm');
});

test('the pole arm and the paddle stroke are solved loops, and every arm loop runs on its own clock', () => {
  for (const n of ['pole-arm', 'pole-elbow', 'pole-pole', 'k-up-n', 'k-lo-n', 'k-up-f', 'k-lo-f', 'k-torso', 'k-paddle']) {
    const k = frames(n);
    assert.ok(k.length >= 9, `${n} has at least nine samples a loop`);
    assert.equal(k[0].at, 0); assert.equal(k[k.length - 1].at, 100);
  }
  for (const c of ['anim-j-polearm', 'anim-j-poleelbow', 'anim-j-polestaff']) assert.match(rule(c), /var\(--loop-stride\)/);
  for (const c of ['anim-j-k-paddle', 'anim-j-k-torso', 'anim-j-k-up-n', 'anim-j-k-lo-f']) assert.match(rule(c), /var\(--loop-row\)/);
  // the paddle turns all the way through two strokes (one each side), never back and forth on one side
  const turn = frames('k-paddle').map((k) => rotOf(k.t));
  assert.ok(turn[turn.length - 1] - turn[0] >= 300, 'the paddle comes round to the other side and back');
  // a splash at each catch: one on each side, half a stroke apart
  assert.match(rule('anim-k-splash-f'), /animation-delay: calc\(var\(--loop-row\) \/ -2\)/);
});

test('every anim-* hook in every scene has a rule and keyframes in app.css', () => {
  const used = new Set();
  for (const n of ART) for (const m of read(`art/${n}`).matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) if (c.startsWith('anim-')) used.add(c);
  assert.ok(used.size > 20, `only ${used.size} hooks`);
  const frames = new Set([...css.matchAll(/@keyframes\s+([a-z-]+)/g)].map((m) => m[1]));
  for (const c of used) {
    const rule = new RegExp(`\\.scene \\.${c}\\s*\\{([^}]*)\\}`).exec(css);
    assert.ok(rule, `app.css has a rule for .${c}`);
    const anim = /animation:\s*([a-z-]+)/.exec(rule[1]);
    assert.ok(anim && frames.has(anim[1]), `.${c} names keyframes that exist`);
  }
});

test('no animated element carries a transform attribute (the animation would throw it away)', () => {
  for (const n of ART) {
    const svg = read(`art/${n}`);
    for (const m of svg.matchAll(/<[a-z]+\b[^>]*>/g)) {
      const tag = m[0];
      if (/class="[^"]*\banim-/.test(tag)) assert.ok(!/\stransform="/.test(tag), `${n}: ${tag.slice(0, 120)}`);
    }
  }
});

test('Pause and reduced motion stop every scene motion, and jointed parts turn about their joint', () => {
  assert.match(css, /\.scene-card\.is-paused \[class\*="anim-"\]\s*\{\s*animation-play-state: paused !important;/);
  const reduced = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(reduced, 'a reduced-motion block');
  assert.match(reduced[1], /\.scene \[class\*="anim-"\]\s*\{\s*animation: none !important;/);
  assert.match(reduced[1], /\.scene-pause\s*\{\s*display: none;/);
  assert.match(reduced[1], /\.scene-layer, \.scene-layer\.is-slow\s*\{\s*transition-duration: 160ms;/, 'the slow vignette crossfade is short too');
  assert.match(css, /\.scene \[class\*="anim-j-"\]\s*\{\s*transform-box: view-box; transform-origin: 0 0;/);
  assert.match(css, /\.scene-layer\.is-slow\s*\{\s*transition-duration: var\(--dur-vignette\);/);
});

test('no scene loop is fast enough to flash (SC 2.3.1): every loop and drift token is at least 0.4 s', () => {
  const loops = [...tokens.matchAll(/--(loop|drift)-[a-z-]+:\s*([\d.]+)(m?s)/g)];
  assert.ok(loops.length > 25);
  for (const m of loops) {
    const s = Number(m[2]) / (m[3] === 'ms' ? 1000 : 1);
    assert.ok(s >= 0.4, `${m[0]} is faster than the flash limit allows for comfort`);
  }
});

test('the server serves the vignette script and scenes', async (t) => {
  const h = tempCfg();
  decisions.clearCache();
  const server = start({ cfg: h.cfg, port: 0, pidFile: false, quiet: true });
  await new Promise((r) => server.once('listening', r));
  t.after(() => new Promise((r) => server.close(() => { h.cleanup(); r(); })));
  const port = server.address().port;
  for (const p of ['/vignettes.js', '/art/idle.svg', '/art/idle-trail.svg', '/art/idle-kayak.svg', '/art/verdict.svg']) {
    const r = await request(port, { path: p });
    assert.equal(r.status, 200, p);
  }
});
