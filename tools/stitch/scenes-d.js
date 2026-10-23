'use strict';

/* tools/stitch/scenes-d.js: the scouts' scenes: council, review and the verdict by the fire. */

const { Grid, rim, outline, limb, mix } = require('./lib');
const V = require('./valley');
const P = require('./props');
const B = require('./bryn');
const S = require('./scouts');
const A = require('./scenes');
const C = require('./scenes-c');

const R = Math.round;
const { frames, base } = A;

const SEAT = ['contrarian', 'fpt', 'expansionist', 'outsider', 'executor'];

/* ------------------------------------------------------------------ scout poses */

/** A scout holding a sheet up in front, seen from behind the sheet: the back of the paper faces us. f: 0 rest, 1 breath, 2 blink. */
function holder(kind, f, o) {
  const opt = o || {};
  const hip = [S.AX, S.G - 7.5];
  const up = f === 1 ? 0.8 : 0;
  return S.front(kind, {
    hip, blink: f === 2,
    leftHand: [2.2, 5.6 - up], rightHand: [-2.2, 5.6 - up],
    after: (g, c) => {
      const y = R(c.sh[1]) + 1 - R(up);
      P.paperBack(g, R(c.sh[0]) - 5, y, 11, opt.tall || 8, 'paper');
      // hands on the lower corners
      g.ellipse(c.sh[0] - 5, y + (opt.tall || 8) - 1, 1.3, 1.3, 'skin');
      g.ellipse(c.sh[0] + 5, y + (opt.tall || 8) - 1, 1.3, 1.3, 'skin');
    },
  });
}

/** The Expansionist: a map wider than their shoulders, held up, back toward us. */
function mapper(f) {
  const hip = [S.AX, S.G - 7.5];
  const up = f === 1 ? 0.8 : 0;
  return S.front('expansionist', {
    hip, blink: f === 2,
    leftHand: [3, 4.4 - up], rightHand: [-3, 4.4 - up],
    after: (g, c) => {
      const y = R(c.sh[1]) + 1 - R(up);
      P.paperBack(g, R(c.sh[0]) - 8, y, 17, 9, 'sand');
      for (let i = 0; i < 17; i += 4) g.set(R(c.sh[0]) - 8 + i, y + 4, 't3');
      g.ellipse(c.sh[0] - 8, y + 6, 1.3, 1.3, 'skin');
      g.ellipse(c.sh[0] + 8, y + 6, 1.3, 1.3, 'skin');
    },
  });
}

/** The Executor in profile with the pack on. */
function packer(f) {
  const bob = f ? 1 : 0;
  return S.side('executor', {
    hip: [S.AX, S.G - 7.5 + (bob ? 0.6 : 0)], nearFoot: [1.5, 0], farFoot: [-1.5, 0], nearHand: [0.5, 5.6], farHand: [-0.5, 5.6], blink: f === 2,
    after0: (g, c) => {
      const x = R(c.sh[0]) - 8;
      const y = R(c.sh[1]) - 1;
      g.rect(x, y, 6, 10, 'felt');
      for (let j = 0; j < 10; j++) g.set(x, y + j, 'woodD');
      g.rect(x + 1, y + 1, 4, 2, 'feltL');
      g.rect(x + 1, y + 6, 4, 1, 'ochre');
      g.rect(x - 1, y + 2, 1, 5, 'sand'); // a rolled mat on the side
      rim(g, [[x + 5, y + 4]], 'ochre');
    },
  });
}

/** The Outsider in profile, a straw sun hat on the back. */
function wanderer(f) {
  return S.side('outsider', {
    hip: [S.AX, S.G - 7.5], nearFoot: [1.5, 0], farFoot: [-1.5, 0], nearHand: [0.5, 5.6], farHand: [-0.5, 5.6], blink: f === 1,
    headDx: f === 2 ? 0.8 : 0,
    after0: (g, c) => {
      const x = R(c.sh[0]) - 8;
      const y = R(c.sh[1]) + 1;
      g.ellipse(x + 3, y + 3, 4.2, 4.6, 'ochre');
      g.ellipse(x + 3, y + 3, 2.2, 2.4, 'ochreD');
      for (let j = 0; j < 7; j++) g.set(x + 3, y + 3 - 2 + j, 'ochreD');
    },
  });
}

/** The First Principles Thinker kneeling at bedrock with a rock hammer: f 0 raised, 1 striking, 2 resting. */
function hammerer(f) {
  const pal = S.SCOUTS.fpt;
  const g = new Grid(S.W, S.H);
  const hip = [15, S.G - 5];
  const sh = [hip[0] + 3, hip[1] - 5.2];
  const hd = [sh[0] + 1.8, sh[1] - 4.4];
  limb(g, [hip[0], hip[1]], [hip[0] - 5.5, S.G - 2], 3.4, 3.4, 1, 1.5, 1.4, pal.d, null);
  S.boot(g, hip[0] - 5.5, S.G - 2, 1);
  limb(g, [hip[0], hip[1]], [hip[0] + 4.5, S.G - 2], 3.4, 3.4, -1, 1.5, 1.4, pal.c, pal.d);
  S.boot(g, hip[0] + 4.5, S.G - 2, 1);
  S.body(g, pal, sh, hip);
  S.head(g, pal, hd, 'r', { blink: f === 2 });
  const hand = f === 0 ? [sh[0] + 4.4, sh[1] - 1.4] : f === 1 ? [sh[0] + 6.2, sh[1] + 6.4] : [sh[0] + 5.2, sh[1] + 3.8];
  limb(g, [sh[0] + 0.3, sh[1] + 0.8], hand, 3.4, 3.4, 1, 1.1, 1.05, pal.c, pal.d);
  g.ellipse(hand[0], hand[1], 1.2, 1.2, 'skin');
  // the hammer: a short haft and a grey head
  const tip = f === 0 ? [hand[0] + 2.5, hand[1] - 4.2] : f === 1 ? [hand[0] + 1.8, hand[1] + 3.6] : [hand[0] + 3.2, hand[1] + 1.6];
  g.trace(hand[0], hand[1], tip[0], tip[1], 'woodD');
  g.rect(R(tip[0]) - 1, R(tip[1]) - 1, 4, 2, 's3');
  if (f === 1) { g.set(R(tip[0]) + 3, R(tip[1]) + 1, 'white'); g.set(R(tip[0]) + 4, R(tip[1]), 'flame'); g.set(R(tip[0]) + 2, R(tip[1]) + 2, 'flame'); }
  outline(g, 'line');
  return g;
}

/** The Contrarian turning back: a stride in profile, facing left (mirrored), looking over their shoulder. */
function turner(f) {
  const a = S.side('contrarian', {
    hip: [S.AX, S.G - 7.5 + (f ? -0.6 : 0)],
    nearFoot: f ? [0.5, 2] : [3, 0], farFoot: f ? [0, 0] : [-3, 1], nearHand: f ? [0.5, 5.6] : [3, 4.4], farHand: f ? [0.5, 5.6] : [-3, 5], blink: f === 2,
  });
  return S.mirror(a);
}

/* ------------------------------------------------------------------ Bryn in front view */

function frontBryn(f) {
  const hip = [20, B.G - 12.2];
  const up = f === 1 ? 0.8 : 0;
  const sh = [hip[0], hip[1] - 7.2 - up];
  const polex = sh[0] + 7.5;
  return B.front({
    hip, sh, head: [sh[0], sh[1] - 4.8], blink: f === 2, braid: 0.4,
    leftFoot: [-3.4, 0], rightFoot: [3.4, 0],
    leftHand: [-0.8, 8.2], rightHand: [polex - (sh[0] + 3.6), 4.2],
    after: (q, c) => {
      P.pole(q, R(polex), R(c.sh[1]) - 4, R(polex) + 1, B.G - 1);
      q.ellipse(polex, c.sh[1] + 5, 1.2, 1.2, 'skin');
    },
  });
}

/* ------------------------------------------------------------------ council */

function road(g, pts, colour) {
  const path = V.samplePath(pts, 0.5);
  let k = 0;
  for (const [x, y] of path) {
    if (k++ % 8 < 5) { g.set(R(x), R(y), colour); g.set(R(x), R(y) + 1, colour); }
  }
}

function council() {
  const s = base('council', {
    title: 'Five friendly scouts in knit caps set out on five roads from the fork while Bryn stands at the signpost with her pole, in cross-stitch',
    valley: { trees: 3, tufts: 8, seed: 111 },
  });
  const g = s.bg;
  const fork = [58, 68];
  road(g, [fork, [44, 66], [30, 65], [14, 64]], 'plum');
  road(g, [fork, [50, 60], [40, 57], [30, 55]], 'scoutOchre');
  road(g, [fork, [62, 58], [72, 52], [82, 48]], 'glacier');
  road(g, [fork, [72, 62], [88, 59], [100, 58]], 'scoutSand');
  road(g, [fork, [74, 68], [92, 69], [114, 70]], 'scoutMoss');
  V.border(g);
  const f3 = (n, ph) => [`anim-calm-a phase-${ph}`, `anim-calm-b phase-${ph}`, `anim-calm-c phase-${ph}`].slice(0, n);
  // the scouts: each is a few drawings shown in turn (feet row 34 of their drawing)
  for (const [x, y, r] of [[14, 66, 6], [31, 57, 7], [82, 52, 6], [100, 62, 6], [114, 71, 6], [58, 70, 7]]) V.shadow(g, x, y, r);
  frames(s, [turner(0), turner(1), turner(2)], 14 - 18, 66 - 34, f3(3, 1));
  frames(s, [hammerer(0), hammerer(1), hammerer(2)], 31 - 15, 57 - 34, ['anim-tap-a', 'anim-tap-b', 'anim-tap-c']);
  frames(s, [mapper(0), mapper(1), mapper(2)], 82 - 17, 52 - 34, f3(3, 3));
  frames(s, [wanderer(0), wanderer(1), wanderer(2)], 100 - 17, 62 - 34, f3(3, 4));
  frames(s, [packer(0), packer(1), packer(2)], 114 - 17, 71 - 34, f3(3, 5));
  frames(s, [frontBryn(0), frontBryn(1), frontBryn(2)], 58 - 20, 70 - 38, ['anim-calm-a', 'anim-calm-b', 'anim-calm-c']);
  return s;
}

/* ------------------------------------------------------------------ review */

function review() {
  const s = base('review', {
    title: 'Five friendly scouts in matching grey-blue coats each hold up a sheet to read the other answers blind, in cross-stitch',
    valley: { trees: 3, tufts: 8, seed: 121 },
  });
  const g = s.bg;
  V.trail(g, [[64, 71], [62, 64], [66, 56], [72, 50], [70, 44], [66, 40]], { every: 13 });
  V.signpost(g, 70, 58, [{ dir: 1 }, { dir: -1 }]);
  // props lie on the grass: a sun hat, a pack, a rock hammer, a rolled map
  g.ellipse(12, 56, 4.5, 1.4, 'ochre'); g.ellipse(12, 55, 2.2, 1.2, 'ochreD');
  g.art(['.pbbp.', 'pbbbbp', 'pbffbp', 'pbbbbp'], { p: 'line', b: 'felt', f: 'ochre' }, 100, 62);
  g.trace(112, 68, 118, 66, 'woodD'); g.rect(117, 65, 3, 2, 's3');
  g.rect(40, 67, 8, 2, 'sand'); g.set(40, 66, 'line'); g.set(48, 67, 'line');
  V.border(g);
  const at = [[22, 62], [44, 54], [70, 66], [92, 54], [112, 64]];
  SEAT.forEach((k, i) => {
    const sets = [0, 1, 2].map((f) => (i === 2 ? holder('anon', f, { tall: 7 }) : holder('anon', f)));
    frames(s, sets, at[i][0] - S.AX, at[i][1] - 34, [`anim-calm-a phase-${i + 1}`, `anim-calm-b phase-${i + 1}`, `anim-calm-c phase-${i + 1}`]);
  });
  return s;
}

/* ------------------------------------------------------------------ verdict */

function dusk(hex) { return mix(hex, '#6B5A41', 0.24); }

function log(g, x, y, w) {
  g.rect(x, y, w, 4, 'wood');
  for (let i = 0; i < w; i++) { g.set(x + i, y, 'feltL'); g.set(x + i, y + 3, 'woodD'); }
  g.ellipse(x + w, y + 2, 1.2, 2, 'sand'); g.set(x + w, y + 2, 'woodD');
  g.ellipse(x, y + 2, 1.2, 2, 'sand'); g.set(x, y + 2, 'woodD');
}

function flames(f) {
  const g = new Grid(14, 16);
  const shapes = [
    ['......r.......', '.....rr.r.....', '....rrro.r....', '....rooor.r...', '...rroooor....', '...rooffoor...', '..rrooffoor...', '..rooffffoor..', '..rooffffoor..', '..rrofffor....', '...rrooorr....'],
    ['.......r......', '......rr......', '.....rroor....', '..r..rrooor...', '..rr.rooor....', '..rrooffoor...', '...rooffoorr..', '..rooffffoor..', '..rooffffoor..', '..rrofffor....', '...rrooorr....'],
    ['....r.........', '....rr..r.....', '...rroorr.....', '...rooorrr....', '..rrooooor....', '..rrooffoor...', '..rooffffoor..', '..rooffffoor..', '..rooffffoor..', '..rrofffor....', '...rrooorr....'],
  ];
  g.art(shapes[f].map((r) => r.padEnd(14, '.')), { r: 'red', o: 'ochre', f: 'flame' }, 0, 5);
  return g;
}

function glow(phase) {
  const g = new Grid(34, 24);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 34; x++) {
    const d = Math.hypot((x - 17) / 1.3, (y - 14) * 1.3);
    if (d > 6.5 && d < 11.5 && (x + y + phase) % 2 === 0) g.set(x, y, d < 9 ? 'flame' : 'ochre');
  }
  return g;
}

function sparks(i) {
  const g = new Grid(16, 22);
  const pts = [[[7, 14], [10, 9], [5, 5]], [[8, 11], [11, 6], [4, 2]], [[9, 8], [12, 3], [5, 0]]][i];
  pts.forEach(([x, y], k) => { g.set(x, y, k === 1 ? 'flame' : 'ochre'); });
  return g;
}

function smoke(i) {
  const g = new Grid(14, 16);
  const pts = [[[5, 14], [6, 11], [5, 8], [6, 5], [5, 2]], [[6, 14], [5, 11], [6, 8], [5, 5], [6, 2]]][i];
  pts.forEach(([x, y]) => { g.set(x, y, 's3'); g.set(x + 1, y, 's2'); });
  return g;
}

/** A scout seated on a log, warming their hands at the fire. face +1 looks right, -1 left; f 0/1 leans toward it. */
function sitter(kind, face, f) {
  const lean = f ? 1 : 0;
  const a = S.side(kind, {
    hip: [S.AX, S.G - 6.2], lean, nearFoot: [5.5, 0], farFoot: [4, 0], nearHand: [4.8 + lean * 0.6, 3.2 - lean * 0.4], farHand: [4.2 + lean * 0.6, 3.8], blink: f === 2,
  });
  return face > 0 ? a : S.mirror(a);
}

/** Bryn on her rock giving the call: f 0 hands on her knee, 1 one hand open toward the fire. */
function caller(f) {
  const hip = [18, 31];
  const sh = [hip[0] + 0.6, hip[1] - 7.2];
  const hd = [sh[0] + 1.4 + (f ? 0.3 : 0), sh[1] - 4.8];
  const nh = f ? [sh[0] + 8.4, sh[1] + 2.4] : [hip[0] + 7.5, hip[1] - 1];
  return B.side({
    hip, sh, head: hd, nearFoot: [8, 0], farFoot: [6, 0], lean: 0.6, braid: 0, nearHandAbs: nh, farHandAbs: [hip[0] + 6.5, hip[1] - 1.4], nearBend: 1, farBend: 1,
    after: (q) => { q.ellipse(nh[0], nh[1], 1.2, 1.2, 'skin'); },
  });
}

function verdict() {
  const s = base('verdict', {
    title: 'Bryn and the five scouts sit round a campfire at the fork at dusk, the signpost\'s red board pointing up her trail, in cross-stitch',
    scene: { bgTint: dusk, cloth: '#EBDDBF' },
    valley: { trees: 3, tufts: 8, seed: 131, clouds: [[22, 14, 18], [58, 20, 14]] },
  });
  const g = s.bg;
  // dusk: a warm band behind the hills, in steps, and a few stars
  for (let y = 22; y < 38; y++) for (let x = 1; x < g.w - 1; x++) {
    if (g.has(x, y)) continue;
    const band = y >= 33 ? 't2' : y >= 29 ? 't1' : y >= 25 ? ((x + y) % 2 ? 't1' : null) : y >= 22 ? ((x % 2 === 0 && y % 2 === 0) ? 't1' : null) : null;
    if (band) g.set(x, y, band);
  }
  for (const [x, y] of [[12, 6], [30, 14], [48, 4], [76, 10], [94, 18], [118, 22], [64, 9], [20, 20], [100, 6]]) { g.set(x, y, 'white'); g.set(x + 1, y, 'white'); }
  V.trail(g, [[72, 71], [80, 66], [90, 60], [98, 54], [100, 48], [94, 43], [88, 40]], { every: 14 });
  V.signpost(g, 118, 60, [{ dir: -1, color: 'red' }]);
  P.boulder(g, 14, 66, 11, 6);
  log(g, 28, 64, 22); log(g, 78, 64, 30);
  // a ring of stones round the fire
  for (const [x, y] of [[52, 67], [58, 69], [66, 69], [72, 67], [56, 65], [74, 65]]) g.art(['.ll.', 'lccl', '.ll.'], { l: 'line', c: 's1' }, x - 2, y - 1);
  V.border(g);
  frames(s, [glow(0), glow(1)], 46, 42, ['anim-glow-a', 'anim-glow-b']);
  frames(s, [flames(0), flames(1), flames(2)], 56, 51, ['anim-flame-a', 'anim-flame-b', 'anim-flame-c']);
  frames(s, [sparks(0), sparks(1), sparks(2)], 55, 41, ['anim-spark-a', 'anim-spark-b', 'anim-spark-c'], true);
  frames(s, [smoke(0), smoke(1)], 57, 29, ['anim-smoke-a', 'anim-smoke-b']);
  // the scouts, seated on the logs
  const sit = (k, face, x, y, ph) => frames(s, [0, 1, 2].map((f) => sitter(k, face, f)), x - S.AX, y - 34, [`anim-lean-a phase-${ph}`, `anim-lean-b phase-${ph}`, `anim-lean-c phase-${ph}`]);
  sit('contrarian', 1, 34, 66, 1);
  sit('fpt', 1, 44, 66, 2);
  sit('expansionist', -1, 84, 66, 3);
  sit('outsider', -1, 94, 66, 4);
  sit('executor', -1, 104, 66, 5);
  frames(s, [caller(0), caller(1)], -4, 66 - 38 + 4 - 6, ['anim-call-a', 'anim-call-b']);
  return s;
}

module.exports = { council, review, verdict };
