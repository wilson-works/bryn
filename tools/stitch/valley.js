'use strict';

/*
 * tools/stitch/valley.js: the one valley every scene is stitched on (art/README.md section 8, in thread).
 *
 * Aida sky with two outlined clouds and the compass at top left; three far hills of nested contour tones; a land of
 * four bands whose edges roll like contour lines; a red dashed trail with cream waypoint stones; a signpost; a stream.
 * The top right corner (about 28 x 12 cells) stays empty: the page's Pause button sits on it.
 */

const { Grid, rim } = require('./lib');

const R = Math.round;

/** A tiny seeded random, so a rebuild draws the same grass. */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** The land's bands: the y of each band's top edge at column x. Same in every scene. */
const BANDS = [
  { c: 'g1', y: (x) => 38 + 0.7 * Math.sin(x / 11) },
  { c: 'g2', y: (x) => 45.5 + 1.6 * Math.sin(x / 9 + 1.2) + 0.8 * Math.sin(x / 4.3) },
  { c: 'g3', y: (x) => 54 + 1.9 * Math.sin(x / 12 + 2.4) + 0.7 * Math.sin(x / 5) },
  { c: 't1', y: (x) => 63.4 + 1.3 * Math.sin(x / 10 + 0.4) },
];
const landTop = (x) => R(BANDS[0].y(x));

function outlineCells(g, cells, c) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of cells) if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !set.has(`${x + a},${y + b}`))) g.set(x, y, c);
}

function cloud(g, x, y, w) {
  const cells = [];
  const bumps = [[0.22, 0.55, 0.2, 0.42], [0.45, 0.4, 0.27, 0.6], [0.72, 0.58, 0.2, 0.42]];
  for (const [bx, by, rx, ry] of bumps) cells.push(...g.ellipse(x + bx * w, y + by * 6, rx * w, ry * 6 + 0.6, 'white'));
  for (let i = R(x + 0.1 * w); i < R(x + 0.9 * w); i++) { cells.push([i, R(y + 4.4)]); g.set(i, R(y + 4.4), 'white'); }
  outlineCells(g, cells, 'inkSoft');
  for (let i = R(x + 0.14 * w); i < R(x + 0.86 * w); i++) g.set(i, R(y + 4.4), 'paper');
}

function compass(g, cx, cy) {
  const cells = g.ellipse(cx, cy, 4.3, 4.3, 'paper');
  outlineCells(g, cells, 'inkFar');
  g.line(cx, cy - 3, cx, cy, 0.5, 'red');
  g.set(cx, cy - 3, 'red');
  g.set(cx, cy + 3, 'inkFar'); g.set(cx, cy + 2, 'inkFar');
  g.set(cx - 3, cy, 'inkFar'); g.set(cx + 3, cy, 'inkFar'); g.set(cx - 2, cy, 'inkFar'); g.set(cx + 2, cy, 'inkFar');
  g.set(cx, cy, 'ink');
}

function hill(g, cx, base, rx, ry) {
  const dome = g.fillWhere((x, y) => y <= base && ((x - cx) / rx) ** 2 + ((y - base) / ry) ** 2 <= 1, 'g3');
  const m1 = g.fillWhere((x, y) => y <= base - ry * 0.28 && ((x - cx) / (rx * 0.66)) ** 2 + ((y - (base - ry * 0.28)) / (ry * 0.6)) ** 2 <= 1, 'g2');
  const m2 = g.fillWhere((x, y) => y <= base - ry * 0.52 && ((x - cx) / (rx * 0.34)) ** 2 + ((y - (base - ry * 0.52)) / (ry * 0.34)) ** 2 <= 1, 't1');
  outlineCells(g, dome, 'inkFar');
  outlineCells(g, m1, 'inkSoft');
  outlineCells(g, m2, 'inkSoft');
}

function tree(g, x, y, big) {
  // a map-symbol fir: a triangle of moss on a stub
  g.art(big ? ['..M..', '.MMM.', 'MMMMM', '..t..'] : ['.M.', 'MMM', '.t.'], { M: 'mossD', t: 'woodD' }, x, y);
}

function tuft(g, x, y, lean) {
  g.set(x, y, 'mossD'); g.set(x + (lean || 0), y - 1, 'mossL'); g.set(x + 2, y, 'mossD'); g.set(x + 2 - (lean || 0), y - 1, 'mossL'); g.set(x + 1, y - 1, 'moss');
}

/** Sample a smooth path through points (Catmull-Rom) into evenly spaced cells. */
function samplePath(pts, step) {
  const out = [];
  const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const n = Math.max(8, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 2));
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1]);
  // resample by arc length
  const res = [out[0]];
  let acc = 0;
  for (let i = 1; i < out.length; i++) {
    const d = Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]);
    acc += d;
    if (acc >= step) { res.push(out[i]); acc = 0; }
  }
  return res;
}

/** The red trail: dashes of 3 cells with 2 bare, thicker the nearer it is, and cream waypoint stones. */
function trail(g, pts, o) {
  const opt = o || {};
  const path = samplePath(pts, 0.5);
  let run = 0;
  const stones = [];
  let sinceStone = 0;
  path.forEach(([x, y], i) => {
    const near = Math.max(0, Math.min(1, (y - 36) / 30));
    const on = run % 5 < 3;
    run++;
    if (on) {
      g.set(R(x), R(y), 'red');
      if (near > 0.5) g.set(R(x), R(y) + 1, 'red');
      if (near > 0.85) g.set(R(x) + 1, R(y), 'red');
    }
    sinceStone += 0.5;
    if (sinceStone >= (opt.every || 16) && i > 4 && i < path.length - 3) { stones.push([x, y]); sinceStone = 0; }
  });
  for (const [x, y] of stones) {
    g.art(['.llll.', 'lccccl', 'lcggcl', '.llll.'], { l: 'line', c: 'cream', g: 's1' }, R(x) - 2, R(y));
  }
  return stones;
}

function signpost(g, x, y, boards) {
  // y is the ground. The post is 2 cells wide and 19 tall.
  g.rect(x, y - 19, 2, 19, 'wood');
  for (let j = 0; j < 19; j++) g.set(x + 1, y - 19 + j, 'woodD');
  g.rect(x - 1, y - 20, 4, 1, 'woodD');
  g.rect(x - 1, y - 1, 4, 2, 'inkSoft');
  boards.forEach((b, i) => {
    const by = y - 18 + i * 5;
    const dir = b.dir || 1;
    const fill = b.color || 'paper';
    const edge = fill === 'red' ? 'redD' : 'line';
    const x0 = dir > 0 ? x + 2 : x - 10;
    g.rect(x0, by, 10, 4, fill);
    for (let i2 = 0; i2 < 10; i2++) { g.set(x0 + i2, by, edge); g.set(x0 + i2, by + 3, edge); }
    // the arrow point
    const tip = dir > 0 ? x0 + 10 : x0 - 1;
    g.set(tip, by + 1, fill); g.set(tip, by + 2, fill); g.set(tip, by, edge); g.set(tip, by + 3, edge);
    g.set(tip + dir, by + 1, edge); g.set(tip + dir, by + 2, edge);
    g.set(dir > 0 ? x0 + 9 : x0, by + 1, edge); g.set(dir > 0 ? x0 + 9 : x0, by + 2, edge);
  });
}

function stream(g, o) {
  // a stream down the right edge: a band whose centre meanders, with ripples
  const opt = o || {};
  const x0 = opt.x || 120;
  for (let y = landTop(x0) + 1; y < 72; y++) {
    const cx = x0 + R(2.2 * Math.sin(y / 5.5) + (y - 40) * 0.12);
    const w = 3 + Math.floor((y - 38) / 12);
    for (let i = 0; i < w; i++) g.set(cx + i, y, i === 0 || i === w - 1 ? 'w2' : 'w1');
    if (y % 6 === 2) g.set(cx + 1, y, 'w3');
  }
}

/** A soft contact shadow under a figure: two rows of a darker tone of whatever she stands on. */
function shadow(g, x, y, rx) {
  for (let i = -rx; i <= rx; i++) {
    for (const [row, k] of [[0, 1], [1, 0.6]]) {
      if (Math.abs(i) > rx * k) continue;
      const here = g.nameAt(R(x + i), y + row);
      const tone = { g1: 'g3', g2: 'g4', g3: 'g4', t1: 't3', t2: 't3' }[here];
      if (tone) g.set(R(x + i), y + row, tone);
    }
  }
}

function border(g) {
  const w = g.w, h = g.h;
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) g.set(x, y, 'redD');
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) g.set(x, y, 'redD');
  for (let x = 1; x < w - 1; x++) for (const y of [1, h - 2]) g.set(x, y, x % 2 ? 'sand' : 'ochre');
  for (let y = 1; y < h - 1; y++) for (const x of [1, w - 2]) g.set(x, y, y % 2 ? 'sand' : 'ochre');
}

/**
 * Stitch the valley onto a scene's background.
 * @param {Scene} s
 * @param {object} o { clouds: [[x,y,w]...], trail: [[x,y]...] | null, trailEvery, stream: bool, trees: n, seed, hills: bool }
 */
function valley(s, o) {
  const g = s.bg;
  const opt = Object.assign({ clouds: [[20, 10, 20], [52, 18, 15]], stream: false, trees: 6, seed: 7, tufts: 22 }, o || {});
  const rand = rng(opt.seed);
  for (const [x, y, w] of opt.clouds) cloud(g, x, y, w);
  compass(g, 9, 8);
  hill(g, 22, 40, 24, 11);
  hill(g, 64, 40, 32, 14);
  hill(g, 109, 40, 20, 9);
  // land bands: each fills below its edge; the edge is a line of far ink
  BANDS.forEach((b, i) => {
    for (let x = 0; x < g.w; x++) {
      const top = R(b.y(x));
      for (let y = top; y < g.h; y++) g.set(x, y, b.c);
    }
    for (let x = 0; x < g.w; x++) { const top = R(b.y(x)); g.set(x, top, i === 3 ? 't3' : 'inkSoft'); if (x > 0 && Math.abs(R(b.y(x - 1)) - top) > 0) { for (let y = Math.min(top, R(b.y(x - 1))); y <= Math.max(top, R(b.y(x - 1))); y++) g.set(x, y, i === 3 ? 't3' : 'inkSoft'); } }
  });
  // texture: short contour dashes inside the bands
  for (let k = 0; k < 18; k++) {
    const x = R(4 + rand() * 116);
    const y = R(42 + rand() * 22);
    const here = g.nameAt(x, y);
    if (['g1', 'g2', 'g3'].includes(here) && [1, 2, 3, 4].every((i) => g.nameAt(x + i, y) === here)) for (let i = 0; i < 4; i++) g.set(x + i, y, 'g4');
  }
  if (opt.stream) stream(g, opt.stream === true ? {} : opt.stream);
  const placed = [];
  for (let k = 0; k < opt.trees; k++) {
    const x = R(6 + rand() * 112);
    const y = R(42 + rand() * 18);
    if (!['g1', 'g2', 'g3'].includes(g.nameAt(x, y))) continue;
    if (placed.some(([a, b]) => Math.abs(a - x) < 10 && Math.abs(b - y) < 5)) continue;
    placed.push([x, y]);
    tree(g, x, y, k % 3 === 0);
  }
  for (let k = 0; k < opt.tufts; k++) {
    const x = R(5 + rand() * 118);
    const y = R(46 + rand() * 24);
    if (['g1', 'g2', 'g3', 't1'].includes(g.nameAt(x, y)) && g.nameAt(x + 2, y) === g.nameAt(x, y)) tuft(g, x, y, k % 2);
  }
  return g;
}

module.exports = { shadow, valley, trail, signpost, border, tree, tuft, cloud, compass, hill, outlineCells, samplePath, rng, landTop, BANDS, stream };
