'use strict';

/*
 * tools/stitch/scenes.js: every scene, composed from the valley, Bryn's poses, the scouts and the props.
 *
 * Motion is by class only (the page's app.css owns the timing). A group that carries an anim-* class is one stitched
 * frame of a pose; the page shows one frame at a time, so the picture is always a whole drawing. Every group after the
 * first frame of a set starts at opacity 0, so the still (reduced motion, or no CSS at all) is the first frame.
 */

const { Grid, outline } = require('./lib');
const { Scene } = require('./scene');
const V = require('./valley');
const P = require('./props');
const B = require('./bryn');
const S = require('./scouts');

const R = Math.round;

const TITLES = {
  idle: 'Bryn sits on her boulder at the trailhead with a tin cup of tea, in cross-stitch, a small bird coming and going from the signpost',
};

/** Put a frame set on a scene: grids drawn at (ox, oy), classes[i] on frame i; frames after the first start hidden. */
function frames(s, grids, ox, oy, classes, hidden) {
  grids.forEach((g, i) => s.add(g, ox, oy, `class="${classes[i]}"${i || hidden ? ' opacity="0"' : ''}`));
}

/** Frames whose drawing is only a few cells wide (steam, a bird): same call, kept for reading. */
const fx = frames;

function base(name, o) {
  const s = new Scene(name, o.title, o.scene || {});
  V.valley(s, o.valley || {});
  return s;
}

/* ------------------------------------------------------------------ Bryn poses used in more than one scene */

/** Seated side view on the rock: rest, breath (a cell taller) or sip (cup raised). */
function seated(f) {
  const up = f === 'breath' ? 1 : 0;
  const sip = f === 'sip';
  const hip = [18, 31];
  const sh = [hip[0] + 0.6, hip[1] - 7.2 - up];
  const hd = [sh[0] + 1.4, sh[1] - 4.8 + (sip ? 0.4 : 0)];
  const lift = sip ? 1.6 : 0;
  const near = [hd[0] + 4.4, hd[1] + 3.8 - lift];
  const far = [hd[0] + 3.4, hd[1] + 4.3 - lift];
  const g = B.side({
    hip, sh, head: hd, nearFoot: [8, 0], farFoot: [6, 0], lean: 0.6, braid: 0, blink: f === 'breath',
    nearHandAbs: near, farHandAbs: far, nearBend: 1, farBend: 1,
    after: (q) => { P.cup(q, R(near[0]) - 1, R(near[1]) - 2); },
  });
  g.meta = { cup: [R(near[0]), R(near[1]) - 3] };
  return g;
}

/* ------------------------------------------------------------------ the scenes */

function idleRock() {
  const s = base('idle', { title: TITLES.idle, valley: { stream: true, seed: 11, tufts: 14 } });
  const g = s.bg;
  const trailPts = [[50, 71], [58, 65], [68, 59], [78, 54], [85, 50], [81, 45], [73, 42], [68, 40]];
  V.trail(g, trailPts);
  V.signpost(g, 94, 58, [{ dir: 1 }, { dir: -1 }]);
  P.boulder(g, 27, 65, 18, 10);
  P.ropeCoil(g, 48, 62);
  P.pole(g, 47, 49, 45, 62);
  P.pebble(g, 56, 68);
  P.pebble(g, 104, 62);
  V.border(g);

  // Bryn: rest, breath and sip are three drawings, shown in turn
  const ox = 9;
  const oy = 23;
  const fr = [seated('rest'), seated('breath'), seated('sip')];
  frames(s, fr, ox, oy, ['anim-rock-a', 'anim-rock-b', 'anim-rock-c']);
  const cupAt = fr[0].meta.cup;
  const st = [s.grid(), s.grid()];
  P.steam(st[0], 0, 4, 0);
  P.steam(st[1], 0, 4, 1);
  frames(s, st, ox + cupAt[0], oy + cupAt[1] - 5, ['anim-steam-a', 'anim-steam-b']);
  sway(s, [[52, 60], [62, 66], [100, 66], [72, 62], [40, 70]]);
  // a small bird lands on the signpost, looks about, and leaves
  const perch = [['sit', 0], ['peck', 0], ['up', -2]].map(([m, dy]) => { const q = s.grid(); P.bird(q, 91, 36 + dy, m, -1); return q; });
  frames(s, perch, 0, 0, ['anim-perch-a', 'anim-perch-b', 'anim-perch-c'], true);
  birds(s, 78, 22, 0);
  birds(s, 86, 25, 2);
  return s;
}


/** One walking frame (0..3). The world moves 3 cells under her each frame, so a planted foot and a planted pole stay put. */
function walk(i) {
  const bob = i % 2 ? -0.8 : 0;
  const foot = [
    { n: [3, 0], f: [-3, 1] },
    { n: [0, 0], f: [0.5, 2.2] },
    { n: [-3, 1], f: [3, 0] },
    { n: [0.5, 2.2], f: [0, 0] },
  ][i];
  const farHand = [[3.5, 7], [0.8, 8], [-3, 7], [0.8, 8]][i];
  const pole = [
    { hand: [4.6, 5.4], tip: [6.5, 0] },
    { hand: [3.6, 6.4], tip: [3.5, 0] },
    { hand: [2.6, 7.0], tip: [0.5, 0] },
    { hand: [3.8, 5.8], tip: [4.5, 2.5] },
  ][i];
  const hip = [20, B.G - 12.2 + bob];
  const sh = [hip[0] + 0.4, hip[1] - 7.2];
  const hd = [sh[0] + 1.2, sh[1] - 4.8];
  const g = B.side({
    hip, sh, head: hd, lean: 0.4, nearFoot: foot.n, farFoot: foot.f, farHand,
    nearHand: pole.hand, nearBend: 1, farBend: 1, braid: i % 2 ? 0.6 : -0.4,
    after: (q, c) => {
      const hx = c.sh[0] + 0.3 + pole.hand[0];
      const hy = c.sh[1] + 0.5 + pole.hand[1];
      const tx = hip[0] + pole.tip[0];
      const ty = B.G - pole.tip[1];
      const dx = tx - hx;
      const dy = ty - hy;
      const k = 2.2 / Math.hypot(dx, dy);
      P.pole(q, R(hx - dx * k), R(hy - dy * k), R(tx), R(ty));
    },
  });
  return g;
}

/** A tile of ground that passes under her: the trail's dashes and stones, tufts and pebbles. Width 135 cells, so
 * it repeats every 45 steps of 3 cells (dashes repeat every 5 and stones every 15, both divide 135). */
function groundTile(near, seed) {
  const w = 135;
  const g = new Grid(w, 72);
  const rand = V.rng(seed);
  if (near) {
    for (let x = 0; x < w; x++) if (x % 5 < 3) { g.set(x, 62, 'red'); g.set(x, 63, 'red'); }
    for (let x = 7; x < w; x += 15) g.art(['.llll.', 'lccccl', 'lcggcl', '.llll.'], { l: 'line', c: 'cream', g: 's1' }, x - 2, 60);
    for (let k = 0; k < 14; k++) { const x = 2 + Math.floor(rand() * 128); const y = 57 + Math.floor(rand() * 4) + (k % 3 ? 10 : 0); if (y < 70) V.tuft(g, x, y, k % 2); }
    for (let k = 0; k < 4; k++) P.pebble(g, 5 + Math.floor(rand() * 124), 62 + Math.floor(rand() * 3));
  } else {
    for (let k = 0; k < 10; k++) { const x = 4 + Math.floor(rand() * 124); V.tuft(g, x, 50 + Math.floor(rand() * 6), k % 2); }
    for (let k = 0; k < 5; k++) V.tree(g, 8 + k * 26, 44 + (k % 2) * 4, k % 2 === 0);
  }
  return g;
}

/** Two copies of a ground tile, 675 px apart, in one drifting group. */
function drift(s, tile, cls, w, single) {
  const one = s.paths(tile);
  s.raw(`<g class="${cls}">${one}${single ? '' : `<g transform="translate(${w * 5} 0)">${one}</g>`}</g>`);
}

function idleTrail() {
  const s = base('idle-trail', {
    title: 'Bryn walks her red trail with a pole, in cross-stitch, as the stitched ground passes under her and a deer and a moose graze far off',
    valley: { trees: 0, tufts: 0, seed: 21 },
  });
  V.shadow(s.bg, 40, 64, 7);
  V.border(s.bg);
  drift(s, groundTile(false, 5), 'anim-drift-mid', 135);
  drift(s, groundTile(true, 9), 'anim-drift-near', 135);
  const fr = [0, 1, 2, 3].map(walk);
  frames(s, fr, 24, 63 - 38 + 1, ['anim-walk-a', 'anim-walk-b', 'anim-walk-c', 'anim-walk-d']);
  birds(s, 30, 20, 0);
  birds(s, 38, 23, 3);
  return s;
}

/** A far bird crossing the sky: two wing frames inside a group the page steps across a cell a flap. */
function birds(s, x, y, ph) {
  const up = s.grid();
  const down = s.grid();
  P.farBird(up, x, y, true);
  P.farBird(down, x, y, false);
  s.raw(`<g class="anim-fly${ph ? ` phase-${ph}` : ''}">${[up, down].map((g, i) => `<g class="anim-flap-${'ab'[i]}"${i ? ' opacity="0"' : ''}>${s.paths(g)}</g>`).join('')}</g>`);
}

/** Grass that sways: the same tufts drawn leaning one way, then the other. */
function sway(s, spots) {
  const a = s.grid();
  const b = s.grid();
  for (const [x, y] of spots) { P.tuftLean(a, x, y, -1); P.tuftLean(b, x, y, 1); }
  frames(s, [a, b], 0, 0, ['anim-sway-a', 'anim-sway-b']);
}

module.exports = { idleRock, idleTrail, seated, walk, frames, base, fx, drift, birds, sway };

