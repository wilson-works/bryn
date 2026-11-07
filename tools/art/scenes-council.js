'use strict';

/*
 * tools/art/scenes-council.js: the three scenes with her council of five senior trail rangers: council (out on five
 * roads from the fork), review (all five in the same grey-blue, reading each other's notes blind) and verdict (round
 * the campfire at dusk). The rangers are older, friendly and ranked by the gold on their hats, shoulders and chests.
 */

const K = require('./kit');
const P = require('./people');
const R = require('./props');
const V = require('./valley');

const { C, ROLE, n } = K;
const { at, frames, kneelAt, calm } = V;
const RG = P.RANGERS;

/** One road from the fork: dirt with dashed blazes in the ranger's colour, narrowing as it goes. */
function road(from, to, col, w0 = 20) {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const mx = (x0 + x1) / 2;
  const my = Math.min(y0, y1) + (Math.abs(y0 - y1) * 0.15);
  const d = `M${x0 - w0 / 2} ${y0}Q${n(mx)} ${n(my)} ${x1} ${y1 - 2}L${x1} ${y1 + 2}Q${n(mx)} ${n(my + w0 * 0.6)} ${x0 + w0 / 2} ${y0}Z`;
  return `<path d="${d}" fill="${C.dirt}"/><path d="M${x0} ${y0}Q${n(mx)} ${n(my + w0 * 0.25)} ${x1} ${y1}" fill="none" stroke="${col}" stroke-width="3" stroke-dasharray="9 8" stroke-linecap="round"/>`;
}

/* ------------------------------------------------------------------ council */

function council() {
  K.reset('council');
  const fork = [300, 340];
  const out = [V.backdrop({ pines: [[40, 214, 0.8], [440, 204, 0.7], [600, 222, 0.9]] })];
  const ends = [[20, 300, ROLE.plum[0]], [196, 262, ROLE.ochre[0]], [420, 246, ROLE.glacier[0]], [530, 262, ROLE.sand[0]], [636, 318, ROLE.moss[0]]];
  for (const [x, y, col] of ends) out.push(road(fork, [x, y], col, 30));
  out.push(R.stone(236, 350, 0.8), R.stone(372, 352, 0.8));

  // the Expansionist, farthest up the middle road: a wide trail map held open, its back toward us
  const gl = { armL: [[76, 128], [56, 136], [44, 130]], armR: [[124, 128], [144, 136], [156, 130]], held: { L: R.mapBack(100, 128, 124, 46) }, handL: { fist: true }, handR: { fist: true }, glance: [0, -2] };
  out.push(calm('calm', RG.glacier, P.front(RG.glacier, gl), (d) => at(420, 256, 0.44, d), { phase: 3 }));
  // the First Principles Thinker, kneeling at bedrock with a rock hammer
  const kneel = { ...P.KNEEL, armN: [[104, 128], [118, 140], [136, 128]], armF: [[98, 126], [110, 146], [126, 156]],
    held: { N: R.hammer(140, 116, 20) }, handN: { fist: true }, glance: [2, 4] };
  out.push(V.boulder(226, 276, 44, 18));
  out.push(calm('calm', RG.ochre, P.side(RG.ochre, kneel), (d) => kneelAt(180, 280, 0.46, d), { phase: 2, side: true }));
  // the Outsider, up the right road: binoculars on their chest, waving back to us
  const out1 = { armR: [[124, 128], [146, 120], [152, 96]], armL: [[76, 128], [72, 146], [84, 152]], front: R.binoculars(100, 150), handR: { flip: true } };
  out.push(calm('calm', RG.sand, P.front(RG.sand, out1), (d) => at(504, 272, 0.48, d), { phase: 4 }));
  // the Contrarian, on the near left road, turned back toward the fork with a thumb over the shoulder
  const contra = { armN: [[104, 128], [124, 136], [136, 124]], armF: [[98, 126], [80, 140], [68, 128]], handF: { fist: true }, glance: [3, 0] };
  out.push(calm('calm', RG.plum, P.side(RG.plum, contra), (d) => at(100, 330, 0.6, d), { phase: 1, side: true }));
  // the Executor, already striding up the far right road with the pack on
  const exec = { pack: true, legF: [[98, 164], [88, 182], [80, 197]], legN: [[104, 164], [114, 182], [120, 197]], armN: [[104, 128], [114, 146], [124, 156]], armF: [[98, 126], [86, 144], [80, 156]] };
  out.push(calm('calm', RG.moss, P.side(RG.moss, exec), (d) => at(596, 346, 0.6, d), { phase: 5, side: true }));
  // Bryn at the fork with her pole, watching them go
  const bryn = { armL: [[76, 128], [66, 146], [64, 160]], held: { L: R.pole([63, 122], [58, 206]) }, handL: { fist: true }, glance: [4, -1] };
  out.push(calm('calm', P.BRYN, P.front(P.BRYN, bryn), (d) => at(fork[0], 354, 0.78, d)));
  return V.svg('council', 'Five senior trail rangers set out on five roads from the fork while Bryn stands at the fork with her pole and watches them go', out.join('\n'));
}

/* ------------------------------------------------------------------ review */

function review() {
  K.reset('review');
  const out = [V.backdrop({ stream: true })];
  out.push(V.trail(250, 470, 236, { bend: -40, w0: 40 }));
  const spots = [[84, 330, 0.6], [204, 296, 0.52], [320, 334, 0.62], [440, 296, 0.52], [558, 330, 0.6]];
  const who = ['plum', 'ochre', 'glacier', 'sand', 'moss'];
  spots.forEach(([x, y, s], i) => {
    const look = P.anonymous(RG[who[i]]);
    const pose = { armL: [[76, 128], [70, 146], [84, 150]], armR: [[124, 128], [130, 146], [116, 150]], held: { L: R.sheet(100, 140, 40, 46, i % 2 ? 4 : -4) }, handL: { fist: true }, handR: { fist: true }, glance: [i % 2 ? 2 : -2, 4] };
    out.push(calm('calm', look, P.front(look, pose), (d) => at(x, y, s, d), { phase: i + 1 }));
  });
  return V.svg('review', 'Five senior trail rangers in matching grey-blue, hats to boots, each hold up a sheet and read the other answers without knowing whose they are', out.join('\n'));
}

/* ------------------------------------------------------------------ verdict */

function fire(x, y) {
  const flame = (h, w, k) => `<path d="M${x - w} ${y}Q${x - w} ${y - h * 0.5} ${x - k} ${y - h}Q${x + w * 0.2} ${y - h * 0.6} ${x + w} ${y}Z" fill="${C.fire}"/>`
    + `<path d="M${x - w * 0.5} ${y}Q${x - w * 0.5} ${y - h * 0.35} ${x - k * 0.5} ${y - h * 0.62}Q${x + w * 0.1} ${y - h * 0.4} ${x + w * 0.5} ${y}Z" fill="${C.flame}"/>`;
  const logs = `<rect x="${x - 40}" y="${y - 6}" width="80" height="12" rx="6" fill="${C.feltShade}" transform="rotate(-10 ${x} ${y})"/><rect x="${x - 40}" y="${y - 6}" width="80" height="12" rx="6" fill="${C.felt}" transform="rotate(12 ${x} ${y})"/>`;
  const ring = [-48, -30, -10, 10, 30, 48].map((dx, i) => `<ellipse cx="${x + dx}" cy="${y + 8 + (Math.abs(dx) < 20 ? 4 : 0)}" rx="10" ry="6" fill="${i % 2 ? C.s3 : C.s2}"/>`).join('');
  return { logs: ring + logs, flames: [flame(74, 26, 6), flame(64, 24, -9), flame(80, 25, 12)] };
}

function verdict() {
  K.reset('verdict');
  const fx = 330;
  const fy = 306;
  const out = [V.backdrop({ dusk: true, stream: true, clouds: [[220, 70, 0.9], [400, 96, 0.7]] })];
  out.push(R.signpost(622, 300, { h: 116, left: true }));
  // the warm glow on the ground, two drawings that breathe
  out.push(frames('glow', [`<ellipse cx="${fx}" cy="${fy + 10}" rx="230" ry="60" fill="#F1C48A" opacity=".35"/>`, `<ellipse cx="${fx}" cy="${fy + 10}" rx="246" ry="64" fill="#F1C48A" opacity=".3"/>`]));
  // two logs to sit on; three rangers on the left, two and Bryn on the right, everyone turned to the fire
  const bench = (x, w) => `<rect x="${x}" y="318" width="${w}" height="22" rx="11" fill="${C.feltShade}"/><rect x="${x}" y="318" width="${w}" height="8" rx="4" fill="${C.felt}"/>`;
  out.push(bench(34, 236), bench(390, 210));
  const seat = { legL: [[89, 166], [84, 178], [84, 196]], legR: [[111, 166], [116, 178], [116, 196]], armL: [[76, 128], [74, 148], [90, 160]], armR: [[124, 128], [126, 148], [110, 160]], noShadow: true };
  const lean = (look, x, y, s, k) => calm('lean', look, P.front(look, Object.assign({}, seat, { glance: [x < fx ? 4 : -4, 2] })), (d) => at(x, y, s, d), { phase: k });
  out.push(lean(RG.plum, 74, 336, 0.52, 1), lean(RG.ochre, 152, 338, 0.52, 2), lean(RG.glacier, 230, 336, 0.52, 3));
  out.push(lean(RG.sand, 424, 336, 0.52, 4), lean(RG.moss, 498, 338, 0.52, 5));
  // Bryn at the right end: at rest, then her hand giving the call toward the red board
  const bryn = (call) => P.front(P.BRYN, Object.assign({}, seat, {
    armR: call ? [[124, 128], [146, 116], [164, 96]] : seat.armR, mouth: call ? 'open' : 'smile', glance: call ? [4, -3] : [-4, 2],
  }));
  out.push(frames('call', [at(566, 338, 0.56, bryn(false)), at(566, 338, 0.56, bryn(true))]));
  // the fire: logs and stones, three flame drawings, sparks that rise and go, and smoke
  const f = fire(fx, fy + 6);
  out.push(f.logs, frames('flame', f.flames));
  out.push(frames('spark', [0, 1, 2].map((i) => `<g fill="${C.flame}"><circle cx="${fx - 6 + i * 6}" cy="${fy - 86 - i * 14}" r="2"/><circle cx="${fx + 10 - i * 4}" cy="${fy - 96 - i * 12}" r="1.5"/></g>`), { hidden: true }));
  out.push(frames('smoke', [0, 1].map((i) => `<g fill="#D9D2D6" opacity=".18"><circle cx="${fx + 4 + i * 6}" cy="${fy - 112 - i * 8}" r="${8 + i}"/><circle cx="${fx + 14 + i * 4}" cy="${fy - 132 - i * 8}" r="${10 + i}"/></g>`)));
  return V.svg('verdict', 'Bryn and the five senior trail rangers sit round a campfire at the fork at dusk, and Bryn points to the signpost\'s red board up her trail', out.join('\n'));
}

module.exports = { council, review, verdict };
