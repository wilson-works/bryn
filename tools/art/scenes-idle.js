'use strict';

/*
 * tools/art/scenes-idle.js: the three idle vignettes the page rotates between: idle (Bryn on her rock with a tin cup),
 * idle-trail (walking her trail, the ground passing under her) and idle-kayak (paddling down the stream).
 */

const K = require('./kit');
const P = require('./people');
const R = require('./props');
const V = require('./valley');

const { C, n, gloss, shadow } = K;
const { at, frames } = V;
const B = P.BRYN;

/** A small songbird, perched (side on, facing right): ochre breast, blue-grey back, a dark eye. */
function songbird(x, y, o = {}) {
  const f = o.flip ? -1 : 1;
  const wing = o.up ? `<path d="M-2 -5Q-10 -18 -16 -14Q-10 -8 -4 -2Z" fill="${C.w3}"/>` : `<path d="M-6 -4Q-2 -9 5 -4Q0 1 -6 0Z" fill="${C.w3}"/>`;
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${f} 1)"><path d="M-8 -3L-16 -6L-14 0Z" fill="${C.w2}"/><ellipse cx="0" cy="-3" rx="9" ry="6.5" fill="${C.w2}"/>`
    + `<ellipse cx="2" cy="-1" rx="6" ry="4.4" fill="${C.ochre}"/>${wing}<circle cx="7" cy="-9" r="5" fill="${C.w2}"/><circle cx="8.6" cy="-10" r="1.3" fill="${C.ink}"/>`
    + `<path d="M11.5 -9L15 -8L11.5 -7Z" fill="${C.ochre}"/>${gloss(5, -12, 1.6, 1, 0.5)}</g>`;
}

/** A far bird crossing the sky: two wing drawings inside a flying group (the group carries no transform). */
const flyer = (x, y, phase) => `<g class="anim-fly phase-${phase}">${frames('flap', [V.bird(x, y, true), V.bird(x, y, false)], { phase })}</g>`;

/** A grass clump in two drawings, swaying. */
function grass(spots) {
  const draw = (lean) => spots.map(([x, y, s]) => `<g transform="translate(${x} ${y}) scale(${s}) skewX(${lean})">${V.tuft(0, 0, 1.4, C.g3)}${V.tuft(6, 1, 1.1, C.pineLit)}</g>`).join('');
  return frames('sway', [draw(-6), draw(6)]);
}

/* ------------------------------------------------------------------ idle: on her rock */

function idleRock() {
  K.reset('idle');
  const out = [V.backdrop({ stream: true })];
  out.push(V.trail(300, 470, 236, { bend: 30 }));
  out.push(R.signpost(470, 300, { h: 104 }));
  out.push(R.stone(380, 300, 0.7), R.stone(424, 270, 0.55), R.stone(330, 336, 0.9));
  out.push(V.boulder(170, 334, 170, 62));
  const sit = { legL: [[89, 166], [84, 182], [84, 198]], legR: [[111, 166], [116, 182], [116, 198]], noShadow: true };
  const lap = { armL: [[76, 128], [74, 148], [92, 160]], armR: [[124, 128], [134, 148], [124, 162]], handL: { fist: true }, handR: { fist: true }, front: R.cup(118, 156) };
  const steam = frames('steam', [0, 1].map((i) => `<g fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".7"><path d="M${116 + i * 4} 142Q${112 + i * 4} 134 ${118 + i * 4} 128Q${124 + i * 4} 122 ${120 + i * 4} 116"/></g>`));
  const rest = P.front(B, Object.assign({}, sit, lap, { glance: [-2, 0] }));
  const breath = P.front(B, Object.assign({}, sit, lap, { closed: true }));
  const sip = P.front(B, Object.assign({}, sit, {
    armL: [[76, 128], [72, 148], [90, 160]], armR: [[124, 128], [134, 136], [116, 112]], handL: { fist: true }, handR: { fist: true },
    mouth: 'sip', glance: [-2, -1], front: R.cup(104, 104),
  }));
  const y = 280 + 41 * 0.66;
  out.push(frames('rock', [at(170, y, 0.66, rest + steam), at(170, y, 0.66, breath + steam), at(170, y, 0.66, sip)]));
  // a small bird comes to the signpost, turns, and goes (hidden at rest)
  out.push(frames('perch', [songbird(472, 194), songbird(472, 194, { flip: true }), songbird(484, 184, { up: true })], { hidden: true }));
  out.push(grass([[262, 352, 1], [430, 342, 0.9], [560, 350, 1.1], [40, 352, 1]]));
  out.push(flyer(220, 120, 2), flyer(300, 100, 4));
  return V.svg('idle', 'Bryn sits on her boulder at the trailhead with a tin cup of tea, a small bird coming and going from the signpost', out.join('\n'));
}

/* ------------------------------------------------------------------ idle-trail: walking */

/** A far deer grazing: head up (a) or down (b). */
function deer(x, y, down) {
  const head = down ? `<path d="M14 -16L24 -4" stroke="${C.trunk}" stroke-width="6" stroke-linecap="round"/><ellipse cx="25" cy="-2" rx="5" ry="3.5" fill="${C.trunk}"/>`
    : `<path d="M14 -16L20 -30" stroke="${C.trunk}" stroke-width="6" stroke-linecap="round"/><ellipse cx="23" cy="-32" rx="5.5" ry="3.8" fill="${C.trunk}"/><path d="M18 -36L16 -42M21 -36L22 -42" stroke="${C.trunk}" stroke-width="2.4" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y})">${shadow(0, 0, 18, 2.5, 0.15)}<g stroke="${C.feltShade}" stroke-width="3.4" stroke-linecap="round"><path d="M-10 -10V0M-5 -10V0M8 -10V0M12 -10V0"/></g>`
    + `<ellipse cx="1" cy="-15" rx="16" ry="8" fill="${C.trunk}"/><ellipse cx="-1" cy="-17" rx="12" ry="5" fill="${C.feltLit}"/>${head}<path d="M-15 -18L-19 -14" stroke="${C.cream}" stroke-width="3" stroke-linecap="round"/></g>`;
}

/** One 675 px tile of the near ground: the trail with blazes every 27 px, stones, tufts and flowers. */
function nearTile(x0) {
  const out = [V.flatTrail(318, x0, x0 + 675, 27)];
  for (const dx of [60, 250, 470, 610]) out.push(R.stone(x0 + dx, 340, 0.8));
  for (const dx of [20, 130, 200, 330, 400, 540, 650]) out.push(V.tuft(x0 + dx, 300, 1.2, C.g3));
  for (const dx of [96, 290, 420, 580]) out.push(V.flower(x0 + dx, 352, dx % 2 ? C.cream : C.redSoft));
  return out.join('');
}

function midTile(x0) {
  const out = [];
  for (const [dx, s] of [[40, 0.9], [210, 1.1], [380, 0.8], [560, 1]]) out.push(V.bush(x0 + dx, 268, s));
  for (const [dx, s] of [[120, 0.8], [300, 0.7], [480, 0.9]]) out.push(V.pine(x0 + dx, 262, s));
  out.push(frames('graze', [deer(x0 + 440, 262, false), deer(x0 + 440, 262, true)]));
  return out.join('');
}

function idleTrail() {
  K.reset('idle-trail');
  const out = [V.backdrop({ pines: [[60, 212, 0.7], [470, 206, 0.7]] })];
  out.push(`<g class="anim-drift-mid">${midTile(0)}${midTile(675)}</g>`);
  out.push(`<g class="anim-drift-near">${nearTile(0)}${nearTile(675)}</g>`);
  // her walk: contact, passing, contact, passing; the pole in her far hand, the free arm against the near leg
  const walk = [
    { legF: [[98, 164], [88, 182], [80, 197]], legN: [[104, 164], [114, 182], [122, 197]], armN: [[104, 128], [96, 146], [90, 158]], armF: [[98, 126], [112, 140], [124, 146]], held: { F: R.pole([126, 120], [140, 206]) } },
    { legF: [[98, 164], [98, 182], [98, 197]], legN: [[104, 164], [110, 178], [104, 190]], armN: [[104, 128], [102, 146], [104, 160]], armF: [[98, 126], [106, 142], [116, 150]], held: { F: R.pole([118, 124], [116, 206]) } },
    { legF: [[98, 164], [108, 182], [116, 197]], legN: [[104, 164], [94, 182], [84, 197]], armN: [[104, 128], [114, 144], [126, 150]], armF: [[98, 126], [100, 144], [106, 154]], held: { F: R.pole([108, 128], [96, 206]) } },
    { legF: [[98, 164], [104, 178], [98, 190]], legN: [[104, 164], [104, 182], [104, 197]], armN: [[104, 128], [106, 146], [110, 160]], armF: [[98, 126], [106, 142], [116, 150]], held: { F: R.pole([118, 124], [116, 206]) } },
  ].map((pose) => at(300, 336, 0.7, P.side(B, Object.assign({ pack: true, handF: { fist: true }, glance: [2, 0] }, pose))));
  out.push(frames('walk', walk));
  out.push(flyer(180, 110, 1));
  return V.svg('idle-trail', 'Bryn walks her red trail with her pole and daypack as the ground passes under her and a deer grazes far off', out.join('\n'));
}

/* ------------------------------------------------------------------ idle-kayak: paddling */

function heron(x, y, down) {
  const neck = down ? `<path d="M10 -40Q20 -30 26 -20" stroke="${C.s2}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="28" cy="-18" rx="5" ry="4" fill="${C.s2}"/><path d="M31 -17L40 -10" stroke="${C.ochre}" stroke-width="2.4" stroke-linecap="round"/>`
    : `<path d="M10 -40Q6 -52 12 -60" stroke="${C.s2}" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="15" cy="-62" rx="6" ry="4.4" fill="${C.s2}"/><path d="M20 -62L32 -60" stroke="${C.ochre}" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="-63.5" r="1.2" fill="${C.ink}"/>`;
  return `<g transform="translate(${x} ${y})"><path d="M-2 -20V0M4 -20V0" stroke="${C.s4}" stroke-width="2"/><ellipse cx="2" cy="-30" rx="14" ry="10" fill="${C.s3}"/><path d="M-12 -30Q0 -40 12 -28Q2 -24 -12 -30Z" fill="${C.s2}"/>${neck}</g>`;
}

function waterTile(x0) {
  const out = [];
  for (let x = x0; x < x0 + 800; x += 40) out.push(`<path d="M${x} ${286 + (x % 80 ? 18 : 0)}Q${x + 10} ${282 + (x % 80 ? 18 : 0)} ${x + 20} ${286 + (x % 80 ? 18 : 0)}" fill="none" stroke="${C.w4}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`);
  for (let x = x0 + 20; x < x0 + 800; x += 80) out.push(`<path d="M${x} 336H${x + 26}" stroke="${C.w1}" stroke-width="3" stroke-linecap="round"/>`);
  return out.join('');
}

function idleKayak() {
  K.reset('idle-kayak');
  const out = [V.backdrop({ pines: [[40, 214, 0.8], [420, 206, 0.7], [560, 218, 0.8]] })];
  // the far bank, the stream filling the lower half, reeds
  out.push(`<path d="M0 256H640V270H0Z" fill="${C.g2}"/><path d="M0 268H640V360H0Z" fill="${C.w2}"/><path d="M0 268H640V284Q320 292 0 284Z" fill="${C.w3}" opacity=".5"/>`);
  for (const x of [30, 46, 100, 520, 536, 600]) out.push(`<path d="M${x} 270V${248 - (x % 3) * 6}" stroke="${C.pine}" stroke-width="3" stroke-linecap="round"/><ellipse cx="${x}" cy="${250 - (x % 3) * 6}" rx="2.6" ry="7" fill="${C.trunk}"/>`);
  out.push(frames('heron', [heron(460, 264, false), heron(460, 264, true)]));
  out.push(`<g class="anim-drift-water">${waterTile(0)}</g>`);
  out.push(frames('leap', [[200, 300, -30], [220, 284, 0], [240, 300, 30]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="10" ry="4.6" fill="${C.s3}"/><path d="M-9 0L-16 -5V5Z" fill="${C.s3}"/><circle cx="6" cy="-1" r="1" fill="${C.ink}"/></g>`), { hidden: true }));
  // the hull: a wooden kayak side on, her in the cockpit
  const hull = `${shadow(330, 318, 150, 7, 0.2)}<path d="M180 300Q330 330 486 296Q470 318 330 322Q200 320 180 300Z" fill="${C.feltShade}"/><path d="M180 300Q330 312 486 296Q420 306 330 308Q230 308 180 300Z" fill="${C.feltLit}"/><path d="M200 302Q330 314 466 300" fill="none" stroke="${C.ochre}" stroke-width="2"/>`;
  out.push(hull);
  // six drawings: catch, pull, level on the near side, then the far side; a splash at each catch
  const S = 0.62;
  const X = 320;
  const Y = 300 + (207 - 168) * S;
  const strokes = [[[206, 214], [60, 70]], [[128, 214], [150, 60]], [[30, 136], [196, 136]], [[60, 80], [210, 206]], [[150, 66], [124, 212]], [[30, 136], [196, 136]]];
  const draws = strokes.map(([a, b], i) => {
    const lerp = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const hn = lerp(0.36);
    const hf = lerp(0.64);
    const elbow = (s, h) => [(s[0] + h[0]) / 2, (s[1] + h[1]) / 2 + 9];
    const splash = i === 0 || i === 3 ? `<g fill="#FFF" opacity=".8"><ellipse cx="${(i ? b : a)[0]}" cy="200" rx="12" ry="3"/><circle cx="${(i ? b : a)[0] - 8}" cy="192" r="2.4"/><circle cx="${(i ? b : a)[0] + 6}" cy="190" r="2"/></g>` : '';
    return at(X, Y, S, P.side(B, {
      noLegs: true, noShadow: true, armN: [[104, 128], elbow([104, 128], hn), hn], armF: [[98, 126], elbow([98, 126], hf), hf],
      handN: { fist: true }, handF: { fist: true }, front: R.paddle(a, b) + splash, glance: [2, 1],
    }));
  });
  out.push(frames('row', draws));
  out.push(`<path d="M290 ${n(Y - 40 * S)}Q${X} ${n(Y - 34 * S)} 352 ${n(Y - 40 * S)}" fill="none" stroke="${C.feltShade}" stroke-width="5" stroke-linecap="round"/>`);
  out.push(flyer(160, 100, 3));
  return V.svg('idle-kayak', 'Bryn paddles her wooden kayak down the stream, a heron fishing on the far bank and the water passing', out.join('\n'));
}

module.exports = { idleRock, idleTrail, idleKayak };
