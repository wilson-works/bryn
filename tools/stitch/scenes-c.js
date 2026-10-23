'use strict';

/* tools/stitch/scenes-c.js: the working stages (framing, brainstorm, consulting, filing, waiting, premortem). */

const { Grid, rim, outline, limb } = require('./lib');
const V = require('./valley');
const P = require('./props');
const B = require('./bryn');
const A = require('./scenes');

const R = Math.round;
const { frames, base } = A;

const pencilAt = (g, x, y) => { g.set(R(x), R(y), 'ink'); g.set(R(x) - 1, R(y) - 1, 'ochre'); g.set(R(x) - 2, R(y) - 2, 'ochre'); g.set(R(x) - 3, R(y) - 3, 'redD'); };

/** Standing at the signpost with a notebook, writing: f 0 pencil up, 1 pencil down and head bowed, 2 pencil mid. */
function writing(f) {
  const hip = [20, B.G - 12.2];
  const sh = [hip[0] + 0.5, hip[1] - 7.2];
  const dip = f === 1 ? 0.8 : 0;
  const hd = [sh[0] + 1.6, sh[1] - 4.8 + dip];
  const near = [sh[0] + 5.2, sh[1] + 3.6];
  const far = [sh[0] + 6.2 + (f === 1 ? 1 : f === 2 ? 0.5 : -0.5), sh[1] + (f === 1 ? 6.2 : f === 2 ? 5.4 : 4.3)];
  return B.side({
    hip, sh, head: hd, lean: 0.5, nearFoot: [2.5, 0], farFoot: [-2, 0], nearHandAbs: near, farHandAbs: far, nearBend: 1, farBend: 1, braid: 0.4,
    after: (q) => {
      P.notebookBack(q, R(near[0]) - 1, R(near[1]) - 4);
      q.ellipse(near[0], near[1], 1.1, 1.1, 'skin');
      pencilAt(q, far[0] + 1.6, far[1] + 1.2);
      q.ellipse(far[0], far[1], 1.1, 1.1, 'skin');
    },
  });
}

function stageBase(name, title, o) {
  return base(name, { title, valley: Object.assign({ stream: true, trees: 5, tufts: 12, seed: 50 }, o || {}) });
}

function framing() {
  const s = stageBase('framing', 'Bryn stands at the signpost with a notebook and writes the question down, in cross-stitch', { seed: 41 });
  const g = s.bg;
  V.trail(g, [[40, 71], [50, 66], [58, 63], [66, 60], [74, 56], [70, 50], [66, 44], [66, 40]]);
  V.signpost(g, 76, 60, [{ dir: 1 }, { dir: -1 }]);
  // the notice pinned on the post: a sheet with lines of writing
  g.rect(78, 44, 9, 9, 'paper');
  for (let i = 0; i < 9; i++) { g.set(78 + i, 44, 'line'); g.set(78 + i, 52, 'line'); }
  for (let j = 0; j < 9; j++) { g.set(78, 44 + j, 'line'); g.set(86, 44 + j, 'line'); }
  for (const y of [46, 48, 50]) for (let i = 80; i < 85; i++) g.set(i, y, 'inkSoft');
  g.set(82, 44, 'red'); g.set(82, 45, 'red');
  P.pebble(g, 30, 66);
  V.shadow(g, 50, 62, 7);
  V.border(g);
  frames(s, [writing(0), writing(1), writing(2)], 50 - 20, 62 - 38 + 1, ['anim-write-a', 'anim-write-b', 'anim-write-c']);
  return s;
}

/** Kneeling: on the near knee, the far foot planted. */
function kneel(o) {
  const hip = [16, B.G - 8];
  const sh = [hip[0] + (o.lean === undefined ? 4.5 : o.lean), hip[1] - 6.6];
  const hd = [sh[0] + 1.6, sh[1] - 4.6 + (o.dip || 0)];
  return B.side(Object.assign({ hip, sh, head: hd, nearFoot: [-7, 0], farFoot: [5, 0], braid: 1.2, nearBend: 1, farBend: 1 }, { after: o.after }));
}

function brainstorm() {
  const s = stageBase('brainstorm', 'Bryn kneels at a flat rock and sketches the routes on a map with a pencil, in cross-stitch', { seed: 61 });
  const g = s.bg;
  V.trail(g, [[104, 71], [100, 64], [96, 58], [100, 52], [94, 46], [84, 42], [76, 40]], { every: 14 });
  P.boulder(g, 58, 66, 26, 5);
  // the map, flat on the rock: a parallelogram seen from above with three routes and a compass mark
  g.poly([[42, 62], [76, 62], [80, 66], [38, 66]], 'cream');
  for (let x = 38; x <= 80; x++) g.set(x, 66, 'line');
  for (let x = 42; x <= 76; x++) g.set(x, 62, 'line');
  g.trace(42, 62, 38, 66, 'line'); g.trace(76, 62, 80, 66, 'line');
  g.trace(44, 65, 52, 63, 'red'); g.trace(52, 63, 60, 64, 'red'); g.trace(60, 64, 70, 62, 'red');
  g.trace(46, 63, 56, 65, 'glacier'); g.trace(56, 65, 66, 63, 'glacier');
  g.trace(48, 65, 58, 62, 'ochre'); g.trace(58, 62, 72, 64, 'ochre');
  g.set(74, 63, 'ink'); g.set(74, 64, 'red');
  V.shadow(g, 28, 66, 9);
  V.border(g);
  const f = [0, 1, 2].map((i) => kneel({
    lean: 5,
    after: (q, c) => {
      const near = [c.sh[0] + 5.0, c.sh[1] + 7.6];
      const far = [c.sh[0] + 6.4 + i * 2.2, c.sh[1] + 8.2 - (i === 1 ? 0.5 : 0)];
      limb(q, [c.sh[0] + 0.3, c.sh[1] + 0.5], near, 4.3, 4.3, 1, 1.1, 1.05, 'red', 'redDD');
      q.ellipse(near[0], near[1], 1.15, 1.15, 'skin');
      limb(q, [c.sh[0] - 0.5, c.sh[1] + 0.5], far, 4.3, 4.3, 1, 1.05, 1, 'redD', 'inkFar');
      pencilAt(q, far[0] + 1, far[1] + 0.2);
      q.ellipse(far[0], far[1], 1.1, 1.1, 'skin');
    },
  }));
  frames(s, f, 18, 66 - 38 + 1, ['anim-sketch-a', 'anim-sketch-b', 'anim-sketch-c']);
  return s;
}

/** Stooped over the stones on the trail: f 0 hand on a stone, 1 holding it up for a look. */
function stoop(f) {
  const hip = [19, B.G - 11.6];
  const sh = [hip[0] + 4, hip[1] - 6.2];
  const hd = [sh[0] + 2.6, sh[1] - 4.2];
  const hand = f ? [sh[0] + 6.0, sh[1] + 3.2] : [sh[0] + 6.4, sh[1] + 9.2];
  return B.side({
    hip, sh, head: hd, nearFoot: [2.5, 0], farFoot: [-2.5, 0], nearHandAbs: hand, farHandAbs: [hip[0] + 3.8, hip[1] + 1.4], nearBend: 1, farBend: 1, braid: 1.4,
    after: (q) => {
      q.ellipse(hand[0], hand[1], 1.15, 1.15, 'skin');
      if (f) P.stone(q, R(hand[0]) - 1, R(hand[1]) - 3);
      else P.stone(q, R(hand[0]), R(hand[1]) + 1);
    },
  });
}

function consulting() {
  const s = stageBase('consulting', 'Bryn bends over the stones along her trail and lifts one to check it against the stone path, in cross-stitch', { seed: 71 });
  const g = s.bg;
  V.trail(g, [[22, 71], [34, 66], [48, 62], [62, 62], [78, 60], [90, 54], [86, 47], [74, 42], [68, 40]], { every: 12 });
  P.boulder(g, 104, 63, 9, 5);
  g.art(['.pbbp.', 'pbRRbp', 'pbbbbp'], { p: 'line', b: 'sand', R: 'redD' }, 100, 60); // her pack on the rock
  V.shadow(g, 56, 64, 8);
  V.border(g);
  frames(s, [stoop(0), stoop(1)], 38, 64 - 38 + 1, ['anim-check-a', 'anim-check-b']);
  return s;
}

/** Kneeling and laying a stone: f 0 holding it up, 1 lowering it, 2 laid, her hand on her knee. */
function laying(f) {
  return kneel({
    lean: 4.8,
    after: (q, c) => {
      const hand = [[c.sh[0] + 5.6, c.sh[1] + 2.4], [c.sh[0] + 6.2, c.sh[1] + 6.4], [c.sh[0] + 3.2, c.sh[1] + 8]][f];
      limb(q, [c.sh[0] + 0.3, c.sh[1] + 0.5], hand, 4.3, 4.3, 1, 1.1, 1.05, 'red', 'redDD');
      q.ellipse(hand[0], hand[1], 1.15, 1.15, 'skin');
      if (f < 2) P.stone(q, R(hand[0]) - 1, R(hand[1]) - 3);
      else P.stone(q, R(c.sh[0] + 7), 35);
    },
  });
}

function filing() {
  const s = stageBase('filing', 'Bryn kneels on the trail and lays a stone for the call, in cross-stitch', { seed: 81 });
  const g = s.bg;
  V.trail(g, [[26, 71], [38, 67], [52, 63], [66, 62], [80, 58], [90, 52], [84, 46], [74, 42], [68, 40]], { every: 13 });
  g.art(['.pbbp.', 'pbRRbp', 'pbbbbp'], { p: 'line', b: 'sand', R: 'redD' }, 100, 62);
  V.shadow(g, 40, 66, 9);
  V.border(g);
  frames(s, [laying(0), laying(1), laying(2)], 26, 66 - 38 + 1, ['anim-lay-a', 'anim-lay-b', 'anim-lay-c']);
  return s;
}

/** Standing leaning on her pole, both hands on it. f 0 rest, 1 breath, 2 blink. */
function leaning(f) {
  const hip = [20, B.G - 12.2];
  const sh = [hip[0] + 0.8, hip[1] - 7.2 - (f === 1 ? 0.8 : 0)];
  const hd = [sh[0] + 1.4, sh[1] - 4.8];
  const hands = [[sh[0] + 4.6, sh[1] + 5.4], [sh[0] + 4.0, sh[1] + 6.0]];
  return B.side({
    hip, sh, head: hd, lean: 0.8, nearFoot: [2, 0], farFoot: [-2.5, 0], nearHandAbs: hands[0], farHandAbs: hands[1], nearBend: 1, farBend: 1, blink: f === 2, braid: 0.6,
    after: (q) => {
      P.pole(q, R(hands[0][0]) + 1, R(hands[0][1]) - 2, R(hands[0][0]) + 2, B.G - 1);
      q.ellipse(hands[0][0], hands[0][1], 1.15, 1.15, 'skin');
      q.ellipse(hands[1][0], hands[1][1], 1.1, 1.1, 'skin');
    },
  });
}

function deer(headUp) {
  const g = new Grid(15, 10);
  g.art([
    '..........',
    '..dddddddd',
    '.dddddddddd',
    '.dddddddddd',
    '..tttttt.d',
    '..l.l..l.l',
    '..l.l..l.l',
  ], { d: 'deer', t: 'antler', l: 'deerD' }, 0, 3);
  if (headUp) { g.line(10, 4, 12, 1.5, 0.8, 'deer'); g.set(12, 1, 'deerD'); g.set(13, 1, 'deerD'); g.set(12, 0, 'antler'); } else { g.line(10, 4, 12, 7, 0.8, 'deer'); g.set(12, 8, 'deerD'); g.set(13, 8, 'deerD'); }
  g.set(0, 4, 'white'); g.set(0, 3, 'white');
  outline(g, 'line');
  return g;
}

function waiting() {
  const s = stageBase('waiting', 'Bryn leans on her pole beside the signpost, its red board pointing up the trail, and waits for you to decide, in cross-stitch', { seed: 91 });
  const g = s.bg;
  V.trail(g, [[40, 71], [52, 66], [62, 62], [72, 58], [80, 53], [76, 47], [68, 42], [66, 40]], { every: 13 });
  V.signpost(g, 84, 60, [{ dir: 1, color: 'red' }, { dir: 1, color: 'red' }]);
  V.shadow(g, 56, 62, 7);
  V.border(g);
  frames(s, [leaning(0), leaning(1), leaning(2)], 56 - 20, 62 - 38 + 1, ['anim-calm-a', 'anim-calm-b', 'anim-calm-c']);
  frames(s, [deer(0), deer(1)], 22, 41, ['anim-graze-a', 'anim-graze-b']);
  return s;
}

/** Hand over her eyes, looking out from the hill, her pole in the other hand. f 0 looking, 1 scanning. */
function lookout(f) {
  const hip = [20, B.G - 12.2];
  const sh = [hip[0] + 0.3, hip[1] - 7.2];
  const hd = [sh[0] + 1.6 + (f ? 0.8 : 0), sh[1] - 4.8 - (f ? 0.4 : 0)];
  const brow = [hd[0] + 3.6, hd[1] - 1.2];
  const pole = [sh[0] + 3.0, sh[1] + 6.8];
  return B.side({
    hip, sh, head: hd, lean: 0.3, nearFoot: [2, 0], farFoot: [-2.5, 0], nearHandAbs: brow, farHandAbs: pole, nearBend: -1, farBend: 1, braid: 0.4,
    after: (q) => {
      P.pole(q, R(pole[0]) + 1, R(pole[1]) - 2, R(pole[0]) + 3, B.G - 1);
      q.ellipse(pole[0], pole[1], 1.1, 1.1, 'skin');
      q.ellipse(brow[0], brow[1], 1.2, 1.2, 'skin');
    },
  });
}

function warn(solid) {
  const g = new Grid(9, 9);
  const tri = g.poly([[4.5, 0], [9, 8.5], [0, 8.5]], solid ? 'red' : 'cream');
  V.outlineCells(g, tri, 'redD');
  const mark = solid ? 'ink' : 'red';
  g.set(4, 4, mark); g.set(4, 5, mark); g.set(4, 7, mark);
  return g;
}

function premortem() {
  const s = stageBase('premortem', 'Bryn stands on the hilltop with a hand over her eyes and looks for where the plan could wash out, a broken bridge and a warning sign across the river, in cross-stitch', { seed: 101, stream: false });
  const g = s.bg;
  // the river across the middle land, and a bridge with a gap
  for (let x = 1; x < g.w - 1; x++) {
    const y0 = 46 + R(1.3 * Math.sin(x / 7));
    for (let y = y0; y < y0 + 5; y++) g.set(x, y, y === y0 || y === y0 + 4 ? 'w2' : 'w1');
    if (x % 7 === 2) g.set(x, y0 + 2, 'w3');
  }
  g.rect(64, 44, 9, 2, 'wood'); g.rect(64, 44, 9, 1, 'sand');
  g.rect(84, 44, 9, 2, 'wood'); g.rect(84, 44, 9, 1, 'sand');
  for (const x of [64, 72, 84, 92]) g.rect(x, 46, 1, 6, 'woodD');
  g.rect(75, 49, 4, 1, 'woodD'); // a plank drifting
  // the hill she stands on: contour rings
  const hill = g.fillWhere((x, y) => y >= 52 && ((x - 30) / 26) ** 2 + ((y - 69) / 17) ** 2 <= 1, 'g3');
  const ring1 = g.fillWhere((x, y) => y >= 55 && ((x - 30) / 18) ** 2 + ((y - 68) / 11) ** 2 <= 1, 't1');
  const ring2 = g.fillWhere((x, y) => y >= 58 && ((x - 30) / 9) ** 2 + ((y - 66) / 6) ** 2 <= 1, 't2');
  V.outlineCells(g, hill.filter(([, y]) => y < 70), 'inkFar'); V.outlineCells(g, ring1, 'inkSoft'); V.outlineCells(g, ring2, 'inkSoft');
  V.trail(g, [[56, 69], [62, 64], [70, 60], [78, 58]], { every: 12 });
  V.border(g);
  frames(s, [lookout(0), lookout(1)], 30 - 20, 61 - 38 + 1, ['anim-scan-a', 'anim-scan-b']);
  frames(s, [warn(true), warn(false)], 76, 36, ['anim-warn-a', 'anim-warn-b']);
  return s;
}

module.exports = { framing, brainstorm, consulting, filing, waiting, premortem, writing, kneel, stoop, leaning, lookout, deer };
