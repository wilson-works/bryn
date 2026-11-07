'use strict';

/*
 * tools/art/valley.js: Bryn's valley, the one place every scene happens, drawn as a soft diorama in the vinyl recipe:
 * a sky that warms toward the hills, three far hills of soft tones with a lit rim, rolling bands of meadow, round pines
 * with a shaded side, puffy clouds with a shaded underside, the dirt trail with her red blazes, and the stream.
 * Every id starts with the scene's prefix (kit.reset). The top right corner (x 500 to 640, y 0 to 64) is kept clear:
 * the page's Pause button sits there.
 */

const K = require('./kit');
const { C, n, uid, shadow, gloss } = K;
const P = require('./people');

/** The scene frame: an <svg> with a title. */
function svg(id, title, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" id="${id}" role="img">\n<title>${title}</title>\n${body}\n</svg>\n`;
}

/** The sky: day (cool to warm) or dusk (deep blue to ember). */
function sky(dusk) {
  const id = uid('sky');
  const [a, b] = dusk ? ['#3E4E6E', '#D99A6A'] : [C.sky1, C.sky2];
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".75" stop-color="${b}"/></linearGradient>`
    + `<rect width="640" height="360" fill="url(#${id})"/>`;
}

/** A puffy cloud: three lumps on a flat base, a shaded underside. */
function cloud(x, y, s = 1, dusk = false) {
  const top = dusk ? '#C9B6B0' : '#FFFFFF';
  const under = dusk ? '#9E8C92' : '#DCE6EA';
  const shape = `<ellipse cx="0" cy="0" rx="22" ry="12"/><ellipse cx="-16" cy="3" rx="14" ry="9"/><ellipse cx="16" cy="4" rx="15" ry="8"/>`;
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})"><g fill="${under}" transform="translate(1 3)">${shape}</g><g fill="${top}">${shape}</g>${gloss(-8, -6, 8, 3, 0.7)}</g>`;
}

/** A round pine: three stacked rounded tiers, the right side shaded, a short trunk and a contact shadow. */
function pine(x, y, s = 1, dusk = false) {
  const [lit, base, shade] = dusk ? ['#4E6A45', '#3F5839', '#32462E'] : [C.pineLit, C.pine, C.pineShade];
  const tier = (ty, w) => `<path d="M${-w} ${ty}Q0 ${ty - w * 1.6} ${w} ${ty}Q0 ${ty + 5} ${-w} ${ty}Z"/>`;
  const tiers = tier(-10, 13) + tier(-22, 11) + tier(-33, 8.5);
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})">${shadow(0, 0, 12, 3, 0.18)}<rect x="-2.5" y="-10" width="5" height="10" fill="${C.trunk}"/>`
    + `<g fill="${shade}">${tiers}</g><g fill="${base}" transform="translate(-1.5 -1)">${tiers}</g>`
    + `<g fill="${lit}" opacity=".7"><path d="M-9 -14Q-6 -24 -1 -27Q-4 -20 -5 -13Z"/></g></g>`;
}

/** A round bush (the middle ground). */
function bush(x, y, s = 1) {
  const shape = '<ellipse cx="0" cy="-7" rx="13" ry="9"/><ellipse cx="-10" cy="-4" rx="8" ry="6"/><ellipse cx="10" cy="-4" rx="9" ry="6"/>';
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${n(s)})"><g fill="${C.pineShade}">${shape}</g><g fill="${C.pineLit}" transform="translate(-1.5 -1.5)">${shape}</g>${gloss(-5, -11, 4, 1.8, 0.35)}</g>`;
}

/** A grass tuft and a small flower. */
const tuft = (x, y, s = 1, col = C.g3) => `<path transform="translate(${n(x)} ${n(y)}) scale(${n(s)})" d="M-6 0Q-5 -8 -2 -10Q-2 -4 0 0Q1 -9 4 -12Q3 -4 3 0Q5 -6 8 -7Q6 -3 6 0Z" fill="${col}"/>`;
const flower = (x, y, col = C.cream) => `<g transform="translate(${n(x)} ${n(y)})"><path d="M0 0V-7" stroke="${C.g3}" stroke-width="1.4"/><circle cy="-8" r="2.6" fill="${col}"/><circle cy="-8" r="1" fill="${C.ochre}"/></g>`;

/** Three far hills of soft tones, a lit rim on each; the meadow bands in front. */
function hills(dusk) {
  const t = dusk ? [['#5E6A7A', '#525D6C'], ['#6E7A6A', '#5F6A5B'], ['#7E8A62', '#6E7955']] : [[C.h1, C.h1s], [C.h2, C.h2s], [C.h3, C.h3s]];
  const ridge = [
    'M0 196C60 160 120 150 190 176C250 140 320 132 400 168C460 146 540 140 640 178V260H0Z',
    'M0 214C70 186 150 190 230 206C300 182 380 180 460 200C530 186 590 190 640 204V270H0Z',
    'M0 232C80 214 170 218 260 228C350 214 450 212 540 226C590 220 620 222 640 226V280H0Z',
  ];
  return ridge.map((d, i) => `<path d="${d}" fill="${t[i][1]}"/><path d="${d}" transform="translate(0 4)" fill="${t[i][0]}"/>`
    + `<path d="${d.split('V')[0]}" fill="none" stroke="#FFF" stroke-width="2" opacity="${dusk ? 0.08 : 0.35}"/>`).join('');
}

function meadow(dusk) {
  const [a, b, c] = dusk ? ['#7F8A5E', '#727D53', '#66704A'] : [C.g1, C.g2, C.g3];
  return `<path d="M0 252C120 240 250 246 380 244C480 242 560 240 640 246V360H0Z" fill="${a}"/>`
    + `<path d="M0 290C140 280 280 288 420 284C520 282 580 280 640 286V360H0Z" fill="${b}"/>`
    + `<path d="M0 330C160 322 330 328 480 326C560 325 610 324 640 328V360H0Z" fill="${c}"/>`;
}

/** The dirt trail, from (x0, 360) up to (x1, y1), with her red blazes down the middle, wider as it nears. */
function trail(x0, x1, y1, o = {}) {
  const w0 = o.w0 || 46;
  const w1 = o.w1 || 8;
  const mx = (x0 + x1) / 2 + (o.bend || 60);
  const my = (360 + y1) / 2;
  const d = `M${n(x0 - w0)} 360Q${n(mx - (w0 + w1) / 2)} ${n(my)} ${n(x1 - w1)} ${n(y1)}H${n(x1 + w1)}Q${n(mx + (w0 + w1) / 2)} ${n(my)} ${n(x0 + w0)} 360Z`;
  const out = [`<path d="${d}" fill="${C.dirt}"/>`, `<path d="${d}" transform="translate(3 0)" fill="${C.dirtShade}" opacity=".45"/>`];
  // the blazes: short red dashes, longer and thicker near us
  const N = 9;
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const t2 = t + 0.5 / N;
    const q = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) * (1 - u) * 360 + 2 * (1 - u) * u * my + u * u * y1];
    const [ax, ay] = q(t);
    const [bx, by] = q(t2);
    out.push(`<path d="M${n(ax)} ${n(ay)}L${n(bx)} ${n(by)}" stroke="${C.red}" stroke-width="${n(5 - 3.6 * t)}" stroke-linecap="round"/>`);
  }
  return out.join('');
}

/** A flat trail across the scene (the walking vignette), with a blaze every step px, at height y. */
function flatTrail(y, x0 = 0, x1 = 640, step = 30) {
  const out = [`<path d="M${x0} ${y - 9}H${x1}V${y + 9}H${x0}Z" fill="${C.dirt}"/><path d="M${x0} ${y + 4}H${x1}V${y + 9}H${x0}Z" fill="${C.dirtShade}" opacity=".5"/>`];
  for (let x = x0 + 8; x < x1; x += step) out.push(`<path d="M${x} ${y}H${x + 14}" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>`);
  return out.join('');
}

/** The stream down the right edge of the valley: soft blue with a lighter ripple. */
function stream(dusk) {
  const [a, b] = dusk ? ['#4F6A80', '#6E879A'] : [C.w2, C.w1];
  return `<path d="M598 246C590 270 604 300 592 330C588 342 590 352 588 360H640V246Z" fill="${a}"/>`
    + `<path d="M606 252C600 274 612 300 602 326" fill="none" stroke="${b}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M620 262C616 280 626 296 620 316" fill="none" stroke="${C.w4}" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`;
}

/** A far bird, two wing drawings: up (a) or down (b). */
const bird = (x, y, up) => `<path d="M${x - 7} ${y + (up ? -3 : 3)}Q${x - 3} ${y - (up ? 1 : -1)} ${x} ${y + 1}Q${x + 3} ${y - (up ? 1 : -1)} ${x + 7} ${y + (up ? -3 : 3)}" fill="none" stroke="${C.feltShade}" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`;

/** A boulder (her rock, or the flat rock she sketches on): rounded grey stone, shaded right, lit rim. */
function boulder(x, y, w, h) {
  const d = `M${n(x - w / 2)} ${n(y)}Q${n(x - w / 2)} ${n(y - h)} ${n(x - w / 6)} ${n(y - h)}H${n(x + w / 6)}Q${n(x + w / 2)} ${n(y - h)} ${n(x + w / 2)} ${n(y)}Z`;
  return shadow(x, y + 2, w / 2 + 6, 6, 0.2) + `<path d="${d}" fill="${C.s3}"/><path d="${d}" transform="translate(-3 -2)" fill="${C.s2}" opacity=".9"/>`
    + `<path d="M${n(x - w / 2 + 8)} ${n(y - h + 10)}Q${n(x - w / 4)} ${n(y - h + 2)} ${n(x)} ${n(y - h + 3)}" fill="none" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".4"/>`;
}

/** The common backdrop: sky, sun, clouds, far hills with pines, the meadow. o: { dusk, stream, pines, clouds }. */
function backdrop(o = {}) {
  const dusk = !!o.dusk;
  const out = [sky(dusk)];
  out.push(dusk ? `<circle cx="120" cy="190" r="34" fill="#F1C48A" opacity=".55"/>` : `<circle cx="96" cy="70" r="26" fill="#FFF6DC" opacity=".9"/><circle cx="96" cy="70" r="40" fill="#FFF6DC" opacity=".3"/>`);
  for (const [x, y, s] of o.clouds || [[200, 64, 1], [380, 92, 0.8]]) out.push(cloud(x, y, s, dusk));
  out.push(hills(dusk));
  for (const [x, y, s] of o.pines || [[60, 214, 0.8], [78, 220, 0.9], [440, 202, 0.7], [462, 206, 0.8], [560, 220, 0.9]]) out.push(pine(x, y, s, dusk));
  out.push(meadow(dusk));
  if (o.stream) out.push(stream(dusk));
  return out.join('');
}

/** A frame set: the drawings of one figure or thing, anim-<set>-a, -b... The first shows at rest; the rest start hidden. */
function frames(set, drawings, o = {}) {
  const phase = o.phase ? ` phase-${o.phase}` : '';
  return drawings.map((d, i) => `<g class="anim-${set}-${'abcdefgh'[i]}${phase}"${o.hidden || i > 0 ? ' opacity="0"' : ''}>${d}</g>`).join('\n');
}

/** A figure placed in the scene: a plain wrapper carries the transform (an anim-* group never does). */
const at = (x, y, s, drawing, flip = false) => `<g transform="${K.place(x, y, s, flip)}"><g transform="translate(-100 -207)">${drawing}</g></g>`;

/** A kneeling figure placed in the scene: its own shadow on the ground, the figure 11 units lower (people.KNEEL). */
const kneelAt = (x, y, s, drawing) => shadow(x + 4 * s, y, 44 * s, 6 * s) + at(x, y + 11 * s, s, drawing);

/**
 * A figure at rest with a little life: the figure drawn once by place(), then a frame set of face changes over it,
 * nothing (a), a grin (b), a blink (c). set is 'calm' for standing figures and 'lean' for the rangers at the fire.
 */
function calm(set, look, figure, place, o = {}) {
  return `${place(figure)}\n${frames(set, ['', place(P.face(look, 'open', o.side)), place(P.face(look, 'blink', o.side))], o)}`;
}

module.exports = { calm, kneelAt, svg, sky, cloud, pine, bush, tuft, flower, hills, meadow, trail, flatTrail, stream, bird, boulder, backdrop, frames, at };
