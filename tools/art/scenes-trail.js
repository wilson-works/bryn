'use strict';

/*
 * tools/art/scenes-trail.js: the six working scenes on her trail: framing (writing the question at the signpost),
 * brainstorm (kneeling at a flat rock, sketching routes), waiting (leaning on her pole), premortem (on the hilltop,
 * a hand over her eyes, a broken bridge across the river), filing (laying a stone) and consulting (checking one).
 */

const K = require('./kit');
const P = require('./people');
const R = require('./props');
const V = require('./valley');

const { C } = K;
const { at, frames, kneelAt, calm } = V;
const B = P.BRYN;
const { KNEEL } = P;

/** The stones along a trail: points in order, near to far, getting smaller. */
const stones = (pts) => pts.map(([x, y, s]) => R.stone(x, y, s)).join('');

/* ------------------------------------------------------------------ framing */

function framing() {
  K.reset('framing');
  const out = [V.backdrop({ stream: true })];
  out.push(V.trail(380, 480, 232, { bend: 40 }));
  out.push(R.signpost(450, 312, { h: 116 }));
  out.push(stones([[300, 340, 0.9], [426, 300, 0.6], [470, 262, 0.45]]));
  // her notebook up in one hand, the pencil working down the page in three drawings
  const pose = (hand) => ({
    armL: [[76, 128], [80, 150], [96, 146]], armR: [[124, 128], [126, 150], hand], handL: { fist: true }, handR: { fist: true }, glance: [-3, 5],
    front: R.notebook(98, 146, -8) + R.pencil(hand[0] - 6, hand[1] - 6, -60, 18),
  });
  out.push(frames('write', [[110, 140], [114, 146], [108, 152]].map((h) => at(300, 346, 0.82, P.front(B, pose(h))))));
  return V.svg('framing', 'Bryn stands at the signpost with her notebook and writes the question down', out.join('\n'));
}

/* ------------------------------------------------------------------ brainstorm */

function brainstorm() {
  K.reset('brainstorm');
  const out = [V.backdrop({ stream: true })];
  out.push(V.trail(520, 470, 236, { bend: -30 }));
  // the flat rock, and the map lying open on it: three routes in red, ochre and blue
  out.push(V.boulder(380, 332, 210, 40));
  out.push(`<path d="M302 300L456 300L470 314L314 314Z" fill="${C.creamShade}"/><path d="M300 296L452 296L466 310L312 310Z" fill="${C.cream}"/>`);
  out.push(`<g fill="none" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="6 4"><path d="M318 306Q360 298 400 304T458 300" stroke="${C.red}"/><path d="M318 306Q350 308 384 306" stroke="${C.ochre}"/><path d="M318 306Q340 300 356 298" stroke="${C.w3}"/></g>`);
  const pose = (hand) => Object.assign({}, KNEEL, {
    armN: [[104, 128], [128, 146], hand], armF: [[98, 126], [118, 150], [140, 158]], handN: { fist: true }, glance: [4, 6],
    front: R.pencil(hand[0] + 8, hand[1] + 10, -120, 18),
  });
  out.push(frames('sketch', [[150, 154], [158, 156], [154, 160]].map((h) => kneelAt(262, 334, 0.82, P.side(B, pose(h))))));
  out.push(R.notebook(486, 322, 80));
  return V.svg('brainstorm', 'Bryn kneels at a flat rock and sketches three routes on a trail map with a pencil', out.join('\n'));
}

/* ------------------------------------------------------------------ waiting */

function waiting() {
  K.reset('waiting');
  const out = [V.backdrop({ stream: true })];
  out.push(V.trail(320, 480, 232, { bend: 60 }));
  out.push(stones([[230, 344, 0.9], [420, 290, 0.6], [462, 258, 0.45]]));
  out.push(R.signpost(380, 316, { h: 120 }));
  // leaning on her pole with both hands on the grip, her weight on it, looking out at you
  const pose = { armL: [[76, 128], [96, 146], [122, 136]], armR: [[124, 128], [140, 146], [134, 132]], handL: { fist: true }, handR: { fist: true }, back: R.pole([130, 118], [150, 206]) };
  out.push(calm('calm', B, P.front(B, pose), (d) => at(270, 348, 0.84, d)));
  return V.svg('waiting', 'Bryn leans on her pole beside the signpost, its red board pointing up the trail, and waits for you to decide', out.join('\n'));
}

/* ------------------------------------------------------------------ premortem */

function warnSign() {
  const sign = (lit) => `<rect x="512" y="216" width="4" height="34" fill="${C.felt}"/><path d="M514 190L534 224H494Z" fill="${lit ? C.ochre : C.redShade}"/><path d="M514 196L529 221H499Z" fill="${lit ? C.flame : C.ochre}"/><rect x="512.5" y="204" width="3" height="10" rx="1.5" fill="${C.ink}"/><circle cx="514" cy="217" r="1.8" fill="${C.ink}"/>`;
  return frames('warn', [sign(false), sign(true)]);
}

function premortem() {
  K.reset('premortem');
  const out = [V.backdrop({ clouds: [[220, 70, 1], [420, 110, 0.8]] })];
  // the river across the valley and the bridge over it, broken in the middle
  out.push(`<path d="M0 252Q200 244 360 250T640 248V266Q480 270 320 266T0 270Z" fill="${C.w2}"/><path d="M0 256Q200 250 360 255T640 253" fill="none" stroke="${C.w4}" stroke-width="2" opacity=".7"/>`);
  out.push(`<g fill="${C.felt}"><rect x="392" y="240" width="56" height="7" rx="2" transform="rotate(8 392 240)"/><rect x="470" y="240" width="56" height="7" rx="2" transform="rotate(-10 526 240)"/></g>`);
  out.push(`<g fill="${C.feltShade}"><rect x="396" y="244" width="5" height="22"/><rect x="516" y="244" width="5" height="22"/></g>`);
  out.push(warnSign());
  // the hilltop she stands on, near and wide
  out.push(`<path d="M-20 360Q40 290 170 282Q300 290 360 360Z" fill="${C.g3}"/><path d="M10 316Q80 288 170 284" fill="none" stroke="#FFF" stroke-width="3" opacity=".35"/>`);
  out.push(V.trail(240, 172, 290, { bend: 40, w0: 34, w1: 6 }));
  // a hand over her eyes, looking right across the river, then back
  const pose = (g) => ({ armR: [[124, 128], [150, 104], [132, 66]], armL: [[76, 128], [70, 146], [76, 162]], handR: { flip: true, turn: 60 }, handL: { fist: true }, glance: g });
  out.push(frames('scan', [[6, 0], [2, 1]].map((g) => at(170, 300, 0.8, P.front(B, pose(g))))));
  return V.svg('premortem', 'Bryn stands on the hilltop with a hand over her eyes and looks for where the plan could wash out, a broken bridge and a warning sign across the river', out.join('\n'));
}

/* ------------------------------------------------------------------ filing */

function filing() {
  K.reset('filing');
  const out = [V.backdrop({ stream: true })];
  out.push(V.trail(170, 470, 236, { bend: 90, w0: 52 }));
  out.push(stones([[330, 300, 0.7], [400, 268, 0.55], [452, 246, 0.42]]));
  // the stone in both hands, lowered, then laid on the trail
  const held = (y) => R.stone(150, y, 0.8);
  const pose = (hy, stone) => Object.assign({}, KNEEL, {
    armN: [[104, 128], [128, 140], [148, hy]], armF: [[98, 126], [122, 142], [140, hy + 2]], handN: { fist: true }, handF: { fist: true }, glance: [4, 6],
    front: stone,
  });
  const laid = R.stone(276, 340, 0.8);
  out.push(frames('lay', [
    kneelAt(200, 340, 0.84, P.side(B, pose(150, held(146)))),
    kneelAt(200, 340, 0.84, P.side(B, pose(170, held(168)))),
    laid + kneelAt(200, 340, 0.84, P.side(B, Object.assign({}, KNEEL, { armN: [[104, 128], [118, 146], [132, 160]], armF: [[98, 126], [110, 148], [124, 160]], mouth: 'open', glance: [4, 4] }))),
  ]));
  return V.svg('filing', 'Bryn kneels on the trail and lays a stone for the call', out.join('\n'));
}

/* ------------------------------------------------------------------ consulting */

function consulting() {
  K.reset('consulting');
  const out = [V.backdrop({ stream: true })];
  out.push(V.trail(200, 470, 236, { bend: 80, w0: 52 }));
  out.push(stones([[290, 344, 0.9], [356, 300, 0.7], [410, 270, 0.55], [452, 248, 0.42]]));
  // reaching to a stone on the trail, then lifting it to look at it closely
  const reach = Object.assign({}, KNEEL, { armN: [[104, 128], [126, 150], [148, 174]], armF: [[98, 126], [114, 148], [130, 160]], handN: { fist: true }, glance: [4, 8] });
  const look = Object.assign({}, KNEEL, { armN: [[104, 128], [130, 136], [146, 112]], armF: [[98, 126], [116, 146], [132, 156]], handN: { fist: true }, glance: [5, 2], mouth: 'o', front: R.stone(150, 106, 0.8) });
  out.push(frames('check', [
    R.stone(232, 342, 0.7) + kneelAt(170, 340, 0.84, P.side(B, reach)),
    kneelAt(170, 340, 0.84, P.side(B, look)),
  ]));
  return V.svg('consulting', 'Bryn crouches by the stones along her trail and lifts one to check it against the stone path', out.join('\n'));
}

module.exports = { framing, brainstorm, waiting, premortem, filing, consulting };
