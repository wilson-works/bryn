'use strict';

/* tools/stitch/scenes-b.js: the kayak, and the working stages (framing, brainstorm, consulting, filing, waiting, premortem). */

const { Grid, rim, outline, limb } = require('./lib');
const V = require('./valley');
const P = require('./props');
const B = require('./bryn');
const A = require('./scenes');

const R = Math.round;
const { frames, base, drift } = A;

/* ------------------------------------------------------------------ kayak */

/** A double paddle through two hands: shaft of thread with a blade at each end. */
function paddle(g, up, low, back, fwd) {
  const dx = low[0] - up[0];
  const dy = low[1] - up[1];
  const n = Math.hypot(dx, dy);
  const ux = dx / n;
  const uy = dy / n;
  const a = [up[0] - ux * back, up[1] - uy * back];
  const b = [low[0] + ux * fwd, low[1] + uy * fwd];
  g.trace(a[0], a[1], b[0], b[1], 'woodD');
  const blade = (p) => {
    const cells = g.line(p[0] - ux * 2, p[1] - uy * 2, p[0] + ux * 2, p[1] + uy * 2, 1.35, 'sand');
    rim(g, cells, 'wood', [[1, 0], [-1, 0], [0, 1], [0, -1]]);
  };
  blade(a);
  blade(b);
  return { a, b };
}

/** One paddling frame (0..5): catch one side, pull, level, catch the other, pull, level. */
function paddling(i) {
  const hip = [20, 31];
  const set = [
    { lean: 0.8, near: [26.0, 25.8], far: [27.4, 29.6], back: 17, fwd: 7.5, splash: true },       // catch, left blade ahead
    { lean: -0.6, near: [22.4, 24.6], far: [23.6, 28.6], back: 17, fwd: 7.5, splash: false },     // pull to the hip
    { lean: 0.2, near: [21.5, 26.0], far: [26.5, 26.6], back: 12, fwd: 12, splash: false },       // level
    { lean: 0.8, near: [27.4, 29.8], far: [26.0, 25.6], back: 17, fwd: 7.5, splash: true },       // catch, other side
    { lean: -0.6, near: [23.6, 28.8], far: [22.4, 24.4], back: 17, fwd: 7.5, splash: false },     // pull
    { lean: 0.2, near: [26.5, 26.6], far: [21.5, 26.0], back: 12, fwd: 12, splash: false },       // level
  ][i];
  const sh = [hip[0] + 0.4 + set.lean, hip[1] - 7.2];
  const hd = [sh[0] + 1.3, sh[1] - 4.8];
  let ends;
  const g = B.side({
    hip, sh, head: hd, nearHandAbs: set.near, farHandAbs: set.far, nearBend: 1, farBend: 1, braid: set.lean * 0.5,
    after: (q) => {
      // the shaft runs through both hands; draw it under the near hand by painting it, then the hand again
      const up = set.near[1] < set.far[1] ? set.near : set.far;
      const low = set.near[1] < set.far[1] ? set.far : set.near;
      const pad = new Grid(q.w, q.h);
      ends = paddle(pad, up, low, set.back, set.fwd);
      q.blit(pad, 0, 0);
      q.ellipse(set.near[0], set.near[1], 1.15, 1.15, 'skin');
      q.ellipse(set.far[0], set.far[1], 1.1, 1.1, 'skin');
    },
  });
  if (set.splash) {
    const b = ends.b;
    const x = R(b[0]);
    const y = R(b[1]);
    for (const [dx, dy] of [[-2, 1], [-1, 0], [2, 0], [3, 1], [0, 2], [1, 1]]) g.set(x + dx, Math.min(37, y + dy), 'white');
  }
  return g;
}

function water(g, y0, y1) {
  for (let y = y0; y < y1; y++) for (let x = 1; x < g.w - 1; x++) g.set(x, y, y < y0 + 2 ? 'w2' : 'w1');
  for (let x = 1; x < g.w - 1; x++) g.set(x, y1, 'w4');
}

function reeds(g, x, y, h) {
  for (let j = 0; j < h; j++) g.set(x, y - j, 'mossD');
  g.set(x, y - h, 'woodD'); g.set(x, y - h - 1, 'woodD');
  g.set(x + 1, y - 2, 'moss');
}

function heron(pose) {
  const g = new Grid(14, 20);
  const stand = [
    '.......gG....',
    '.......ggss..',
    '.......g.....',
    '.......g.....',
    '.......g.....',
    '....gggg.....',
    '..ggggggg....',
    '.gggggggg....',
    '..gggggg.....',
    '....l.l......',
    '....l.l......',
    '....l.l......',
    '...ll.ll.....',
  ];
  const peck = [
    '.............',
    '.............',
    '.............',
    '.............',
    '.............',
    '....gggg.....',
    '..gggggggg...',
    '.ggggggggggG.',
    '..gggggg..gss',
    '....l.l......',
    '....l.l......',
    '....l.l......',
    '...ll.ll.....',
  ];
  g.art(pose === 'peck' ? peck : stand, { g: 'gb', G: 'gbD', s: 'sand', l: 'ink' }, 0, 4);
  outline(g, 'line');
  return g;
}

function leapFish(stage) {
  const g = new Grid(12, 10);
  const pos = [[2, 7], [5, 3], [8, 6]][stage];
  g.ellipse(pos[0] + 1, pos[1], 2, 1.2, 'w3');
  g.set(pos[0] + 3, pos[1], 'w2'); g.set(pos[0] + 4, pos[1] - 1, 'w2'); g.set(pos[0] + 4, pos[1] + 1, 'w2');
  g.set(pos[0], pos[1], 'white');
  return g;
}

function idleKayak() {
  const s = base('idle-kayak', {
    title: 'Bryn paddles her wooden kayak down the stream, in cross-stitch, with a heron on the far bank and the stitched water passing',
    valley: { trees: 4, tufts: 6, seed: 33 },
  });
  const g = s.bg;
  water(g, 47, 65);
  for (let x = 1; x < g.w - 1; x++) for (let y = 65; y < 71; y++) g.set(x, y, y === 65 ? 't3' : (y < 68 ? 't1' : 't2'));
  for (const x of [8, 22, 31, 72, 88, 100, 116]) reeds(g, x, 49, 4 + (x % 3));
  for (const x of [14, 40, 64, 94, 108, 122]) reeds(g, x, 69, 5 + (x % 4));
  // the kayak hull
  const hull = g.poly([[18, 58], [66, 58], [71, 54], [68, 59], [60, 63], [27, 63], [17, 60]], 'wood');
  rim(g, hull, 'woodD', [[0, 1], [0, -1]]);
  for (let x = 22; x < 64; x++) g.set(x, 58, 'sand');
  for (let x = 24; x < 60; x++) g.set(x, 62, 'woodD');
  for (let x = 20; x < 66; x++) g.set(x, 64, 'w3');
  V.border(g);
  drift(s, rippleTile(), 'anim-drift-water', 160, true);

  const fr = [0, 1, 2, 3, 4, 5].map(paddling);
  frames(s, fr, 22, 25, ['anim-row-a', 'anim-row-b', 'anim-row-c', 'anim-row-d', 'anim-row-e', 'anim-row-f']);
  // the cockpit rim in front of her hips
  const rimg = s.grid();
  rimg.rect(35, 56, 14, 2, 'felt');
  for (let x = 35; x < 49; x++) rimg.set(x, 56, 'feltL');
  s.add(rimg, 0, 0, '');
  // the heron on the far bank, two drawings
  const h = [heron('stand'), heron('peck')];
  frames(s, h, 98, 29, ['anim-heron-a', 'anim-heron-b']);
  const fish = [leapFish(0), leapFish(1), leapFish(2)];
  frames(s, fish, 84, 52, ['anim-leap-a', 'anim-leap-b', 'anim-leap-c'], true);
  A.birds(s, 78, 22, 0);
  A.birds(s, 86, 25, 2);
  return s;
}

/** Ripples that pass: 32 cells repeat five times; the page shifts them 32 cells and starts again. */
function rippleTile() {
  const g = new Grid(160, 72);
  for (let r = 0; r < 5; r++) {
    const x = r * 32;
    for (const [dx, y, len] of [[3, 51, 5], [19, 53, 4], [9, 56, 6], [26, 58, 4], [14, 61, 5], [1, 63, 4]]) for (let i = 0; i < len; i++) g.set(x + dx + i, y, y % 2 ? 'w2' : 'w3');
    g.set(x + 12, 49, 'white'); g.set(x + 13, 49, 'white');
    g.set(x + 28, 55, 'white'); g.set(x + 29, 55, 'white');
  }
  return g;
}

module.exports = { paddling, idleKayak };
