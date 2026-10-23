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
    idle: ['anim-rock-a', 'anim-rock-b', 'anim-rock-c', 'anim-steam-a', 'anim-perch-a', 'anim-sway-a', 'anim-fly', 'anim-flap-a'],
    'idle-trail': ['anim-walk-a', 'anim-walk-b', 'anim-walk-c', 'anim-walk-d', 'anim-drift-near', 'anim-drift-mid', 'anim-fly'],
    'idle-kayak': ['anim-row-a', 'anim-row-b', 'anim-row-c', 'anim-row-d', 'anim-row-e', 'anim-row-f', 'anim-drift-water', 'anim-heron-a', 'anim-leap-a'],
  };
  for (const v of V.VIGNETTES) {
    const svg = read(`art/${v}.svg`);
    SCENE_RULES(svg, v);
    for (const h of hooks[v]) assert.match(svg, new RegExp(`class="[^"]*\\b${h}\\b`), `${v} has ${h}`);
  }
});

test('the verdict is a campfire at the fork: fire, six figures, her hand giving the call, the signpost still there', () => {
  const svg = read('art/verdict.svg');
  SCENE_RULES(svg, 'verdict');
  assert.match(svg, /<title>[^<]*fire[^<]*<\/title>/i);
  for (const h of ['anim-flame-a', 'anim-flame-c', 'anim-spark-a', 'anim-smoke-a', 'anim-glow-a', 'anim-call-a', 'anim-call-b']) assert.match(svg, new RegExp(`class="[^"]*\\b${h}\\b`), h);
  assert.equal((svg.match(/class="[^"]*\banim-lean-a\b/g) || []).length, 5, 'five scouts lean in');
  assert.match(svg, /#C8432F/i, 'the red board and her red trail');
});

/* ------------------------------------------------------------------ the new art style (the owner, 2026-10-22: a needlepoint look, scouts that are not creepy, cleaner animation) */

const cellsOf = (svg) => [...svg.matchAll(/<path fill="url\(#[^"]+\)" d="([^"]+)"/g)].flatMap((m) => m[1].match(/-?\d+(\.\d+)?/g).map(Number));

test('every picture is stitched: whole cells on a grid, each thread painted by an X-stitch pattern', () => {
  for (const n of ART) {
    const svg = read(`art/${n}`);
    const nums = cellsOf(svg);
    assert.ok(nums.length > 200, `${n} has stitches`);
    for (const v of nums) assert.equal(Math.abs(v) % 5, 0, `${n}: ${v} is off the 5 px cell grid`);
    assert.ok((svg.match(/<pattern id="[a-z-]+-[A-Za-z0-9]+" width="5" height="5"/g) || []).length >= 8, `${n} has its threads`);
    assert.ok(!/<(circle|ellipse|polygon|polyline|line)\b/.test(svg), `${n}: stitched shapes are paths of cells only`);
    for (const m of svg.matchAll(/<rect\b[^>]*fill="url\(#([^)]+)\)/g)) assert.ok(m[1].endsWith('-aida'), `${n}: only the cloth is a rectangle`);
    assert.match(svg, /<pattern id="[a-z-]+-aida"/, `${n} is worked on aida cloth`);
  }
});

test('the scouts have faces: kind eyes with a catch-light, cheeks, a smile, no hood hiding them', () => {
  const S = require('../tools/stitch/scouts');
  const g = S.front('contrarian', { leftHand: [-0.5, 6], rightHand: [0.5, 6] });
  const { NAMES } = require('../tools/stitch/lib');
  const count = (name) => g.d.reduce((n, v) => n + (NAMES[v - 1] === name ? 1 : 0), 0);
  assert.ok(count('white') >= 2, 'a white catch-light in each eye');
  assert.ok(count('ink') >= 6, 'two big eyes of ink cells');
  assert.ok(count('blush') >= 4, 'rosy cheeks');
  assert.ok(count('redD') >= 4, 'a smile');
  for (const n of ['council', 'review', 'verdict']) assert.ok(!/hood|faceless/i.test(read(`art/${n}.svg`).match(/<title>[^<]*/)[0]), `${n}: the title does not call them hooded`);
});

test('the door figure is a 120 x 150 standing greeting on a transparent ground, one guarded style, the raised hand as its still', () => {
  const svg = read('art.svg');
  assert.match(svg, /viewBox="0 0 120 150"/);
  assert.match(svg, /<title>Bryn the Trail Guide[^<]*<\/title>/);
  assert.equal((svg.match(/<style>/g) || []).length, 1);
  assert.match(svg, /<style>@media \(prefers-reduced-motion: no-preference\)\{/);
  assert.ok(!/<rect\b[^>]*width="120"/.test(svg), 'no background rectangle: the ground is transparent');
  assert.match(svg, /class="bryn-w1"(?! opacity)/, 'the first drawing is the visible still');
  assert.match(svg, /class="bryn-w2" opacity="0"/);
  assert.match(svg, /class="bryn-w0" opacity="0"/);
  for (const v of cellsOf(svg)) assert.equal(Math.abs(v) % 4, 0, `${v} is off the 4 px cell grid`);
  const mark = read('mark.svg');
  assert.match(mark, /viewBox="0 0 36 36"/);
  assert.match(mark, /<title>Bryn<\/title>/);
});

/* ------------------------------------------------------------------ motion: whole drawings, swapped in steps */

const CSSGEN = require('../tools/stitch/css');
const tokenSeconds = (name) => { const m = new RegExp(`--${name}:\\s*([\\d.]+)(m?s)`).exec(tokens); assert.ok(m, name); return Number(m[1]) / (m[2] === 'ms' ? 1000 : 1); };
const BEAT = 0.4;

test('a pose is a whole drawing: every frame set in the table covers its loop once and holds each drawing a beat or longer', () => {
  assert.ok(CSSGEN.SETS.length >= 20);
  for (const s of CSSGEN.SETS) {
    const loop = tokenSeconds(s.loop.slice(2));
    const spans = Object.values(s.slots).flat().sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) assert.ok(spans[i][0] >= spans[i - 1][1], `${s.name}: two drawings at once`);
    for (const [a, b] of spans) assert.ok(((b - a) / 100) * loop >= BEAT - 1e-9, `${s.name}: a drawing held for ${(((b - a) / 100) * loop).toFixed(2)} s`);
    if (!s.hidden) {
      const covered = spans.reduce((n, [a, b]) => n + (b - a), 0);
      assert.ok(Math.abs(covered - 100) < 0.01 || s.name === 'calm' || s.name === 'perch', `${s.name}: a gap where no drawing shows (${covered}%)`);
    }
  }
});

test('the frames in each scene match the table: the first is the still, the rest start hidden, and hidden sets start all hidden', () => {
  const sets = Object.fromEntries(CSSGEN.SETS.map((s) => [s.name, s]));
  for (const n of ART) {
    const svg = read(`art/${n}`);
    for (const m of svg.matchAll(/<g class="([^"]*\banim-([a-z]+)-([a-h])\b[^"]*)"([^>]*)>/g)) {
      const [, , set, frame, rest] = m;
      if (set === 'drift') continue;
      assert.ok(sets[set], `${n}: ${set} is not in the table`);
      assert.ok(sets[set].slots[frame], `${n}: ${set}-${frame} is not in the table`);
      const first = frame === 'a';
      const hidden = /opacity="0"/.test(rest);
      assert.equal(hidden, sets[set].hidden ? true : !first, `${n}: ${set}-${frame} ${hidden ? 'hidden' : 'visible'} at rest`);
    }
  }
});

test('the ground moves in step with her feet: a cell of ground per frame of the walk, and the water a beat a step', () => {
  const walk = tokenSeconds('loop-walk') / 4;
  assert.ok(Math.abs(walk - BEAT) < 1e-9);
  assert.ok(Math.abs(tokenSeconds('drift-near') / 45 - walk) < 1e-9, '45 steps of 3 cells at one step per frame');
  assert.ok(Math.abs(tokenSeconds('drift-mid') / 135 - walk) < 1e-9);
  assert.ok(Math.abs(tokenSeconds('drift-water') / 16 - BEAT) < 1e-9);
  assert.match(css, /anim-drift-near \{ animation: drift-near var\(--drift-near\) steps\(45\) infinite; \}/);
  assert.match(css, /@keyframes drift-near \{ to \{ transform: translateX\(-675px\); \} \}/, '45 steps of 15 px: three cells a step');
  assert.ok(Math.abs(tokenSeconds('loop-row') / 6 - BEAT) < 1e-9, 'six frames of paddling at a beat each');
});

test('the generated block in app.css is the table: nothing hand-edited', () => {
  const a = css.indexOf('/* BEGIN stitched frames');
  const b = css.indexOf('/* END stitched frames */') + '/* END stitched frames */'.length;
  assert.equal(css.slice(a, b).replace(/\r/g, ''), CSSGEN.block());
});

test('nothing slides or spins: no scene rule turns, scales or fades a figure, only swaps frames, steps the ground or steps a bird', () => {
  const motion = css.slice(css.indexOf('scene motion (anim-*'), css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.ok(!/rotate\(|scale\(|skew|translateY|ease-in-out|linear infinite/.test(motion.replace(/fly-fade[^\n]*/g, '')), 'a figure is swapped, not tweened');
  for (const m of motion.matchAll(/^\.scene \.anim-[a-z-]+ \{ animation: [^;]+;/gm)) assert.match(m[0], /step-end|steps\(\d+\)/, m[0]);
});

// every anim-* hook in every scene has a rule and keyframes in app.css
test('every anim-* hook in every scene has a rule and keyframes in app.css', () => {
  const used = new Set();
  for (const n of ART) for (const m of read(`art/${n}`).matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) if (c.startsWith('anim-')) used.add(c);
  assert.ok(used.size > 20, `only ${used.size} hooks`);
  const frames = new Set([...css.matchAll(/@keyframes\s+([a-z0-9-]+)/g)].map((m) => m[1]));
  for (const c of used) {
    const rule = new RegExp(`\\.scene \\.${c}\\s*\\{([^}]*)\\}`).exec(css);
    assert.ok(rule, `app.css has a rule for .${c}`);
    const anim = /animation:\s*([a-z0-9-]+)/.exec(rule[1]);
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

test('Pause and reduced motion stop every scene motion, and the still is a complete drawing', () => {
  assert.match(css, /\.scene-card\.is-paused \[class\*="anim-"\]\s*\{\s*animation-play-state: paused !important;/);
  const reduced = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(reduced, 'a reduced-motion block');
  assert.match(reduced[1], /\.scene \[class\*="anim-"\]\s*\{\s*animation: none !important;/);
  assert.match(reduced[1], /\.scene-pause\s*\{\s*display: none;/);
  assert.match(reduced[1], /\.scene-layer, \.scene-layer\.is-slow\s*\{\s*transition-duration: 160ms;/, 'the slow vignette crossfade is short too');
  assert.match(css, /\.scene-layer\.is-slow\s*\{\s*transition-duration: var\(--dur-vignette\);/);
  // with the animation gone, only first frames show (the rest carry opacity="0" in the art itself)
  for (const n of ART) assert.ok(/\banim-[a-z]+-a\b/.test(read(`art/${n}`)), `${n} has a first drawing`);
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
