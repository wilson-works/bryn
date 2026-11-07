'use strict';

/*
 * tools/art/props.js: the things Bryn and the rangers hold and the trail furniture, in the vinyl recipe (a shade shape
 * under a lit one, a glossy dot, a soft shadow). Coordinates are the caller's: each function draws at the points given.
 * Anything held shows us its back (the owner, 2026-10-22): a notebook is its cover, a sheet or map is the blank back.
 */

const { C, n, pt, angle, shadow, gloss } = require('./kit');

/** Her walking pole, from top to foot: ash wood, an ochre grip, a dark rubber foot. */
function pole(top, foot) {
  const dx = foot[0] - top[0];
  const dy = foot[1] - top[1];
  const at = (t) => [top[0] + dx * t, top[1] + dy * t];
  const grip = [at(0.12), at(0.3)];
  return `<path d="M${pt(top)}L${pt(foot)}" stroke="${C.feltShade}" stroke-width="6" stroke-linecap="round"/>`
    + `<path d="M${pt(top)}L${pt(foot)}" transform="translate(-1 -.5)" stroke="${C.feltLit}" stroke-width="3.4" stroke-linecap="round"/>`
    + `<path d="M${pt(grip[0])}L${pt(grip[1])}" stroke="${C.ochreShade}" stroke-width="7.5" stroke-linecap="round"/>`
    + `<path d="M${pt(grip[0])}L${pt(grip[1])}" transform="translate(-1 -.6)" stroke="${C.ochre}" stroke-width="4.6" stroke-linecap="round"/>`
    + `<path d="M${pt(at(0.95))}L${pt(foot)}" stroke="${C.feltShade}" stroke-width="6.5" stroke-linecap="round"/>`;
}

/** Her notebook held up to write in: the leather cover toward us, an elastic band, a red ribbon. */
function notebook(x, y, r = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)})"><rect x="-13" y="-16" width="26" height="32" rx="3" fill="${C.feltShade}"/>`
    + `<rect x="-14.5" y="-17.5" width="26" height="32" rx="3" fill="${C.felt}"/><rect x="-14.5" y="-17.5" width="4" height="32" rx="2" fill="${C.feltShade}"/>`
    + `<rect x="5" y="-17.5" width="2.4" height="32" fill="${C.feltShade}"/><path d="M-4 14.5L-4 22L-1.5 19L1 22V14.5Z" fill="${C.red}"/>`
    + `<path d="M-8 -13H6" stroke="#FFF" stroke-width="2" stroke-linecap="round" opacity=".25"/></g>`;
}

/** A pencil, point at (x, y), lying at angle r. */
function pencil(x, y, r = 0, len = 22) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)})"><path d="M0 0L5 -2.2H${len}V2.2H5Z" fill="${C.ochre}"/>`
    + `<path d="M0 0L5 -2.2V2.2Z" fill="${C.skinLit}"/><path d="M0 0L2 -.9V.9Z" fill="${C.ink}"/><rect x="${len}" y="-2.2" width="4" height="4.4" rx="1.4" fill="${C.redSoft}"/></g>`;
}

/** Her tin cup: enamel cream with a dark rim and a handle. */
function cup(x, y) {
  return `<g transform="translate(${n(x)} ${n(y)})"><path d="M8 -6Q15 -6 15 0Q15 6 8 6" fill="none" stroke="${C.s3}" stroke-width="2.6"/>`
    + `<path d="M-9 -9H9L8 8Q0 11 -8 8Z" fill="${C.s2}"/><path d="M-9 -9H2L1 9Q-4 9.5 -8 8Z" fill="${C.cream}"/>`
    + `<ellipse cy="-9" rx="9" ry="2.6" fill="${C.s4}"/><ellipse cy="-9" rx="7" ry="1.6" fill="${C.trunk}"/></g>`;
}

/** A sheet of paper held up: its blank back toward us. */
function sheet(x, y, w = 26, h = 32, r = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)})"><rect x="${n(-w / 2 + 1.5)}" y="${n(-h / 2 + 1.5)}" width="${w}" height="${h}" rx="2" fill="${C.creamShade}"/>`
    + `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${w}" height="${h}" rx="2" fill="${C.paper}"/><path d="M${n(w / 2 - 8)} ${n(-h / 2)}L${n(w / 2)} ${n(-h / 2 + 8)}V${n(-h / 2)}Z" fill="${C.creamShade}"/></g>`;
}

/** A folded trail map held wide: its back, cream with the fold lines. */
function mapBack(x, y, w = 70, h = 34) {
  const out = [`<g transform="translate(${n(x)} ${n(y)})"><rect x="${n(-w / 2 + 2)}" y="${n(-h / 2 + 2)}" width="${w}" height="${h}" rx="3" fill="${C.creamShade}"/>`,
    `<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${w}" height="${h}" rx="3" fill="${C.cream}"/>`];
  for (let i = 1; i < 4; i++) out.push(`<path d="M${n(-w / 2 + (w * i) / 4)} ${n(-h / 2)}V${n(h / 2)}" stroke="${C.creamShade}" stroke-width="1.6"/>`);
  out.push(`<path d="M${n(-w / 2)} 0H${n(w / 2)}" stroke="${C.creamShade}" stroke-width="1.6"/></g>`);
  return out.join('');
}

/** A rock hammer: steel head, ash handle; the head at (x, y), the handle along angle r. */
function hammer(x, y, r = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(r)})"><rect x="-2.4" y="0" width="4.8" height="30" rx="2.4" fill="${C.feltLit}"/>`
    + `<path d="M-12 -4H10L13 0L10 4H-12Q-14 0 -12 -4Z" fill="${C.s4}"/><path d="M-12 -4H10L11 -1H-13Z" fill="${C.s2}"/></g>`;
}

/** A waypoint stone: cream, rounded, a shade underneath and a glossy top. */
function stone(x, y, s = 1, tint = C.cream) {
  return shadow(x, y + 4 * s, 12 * s, 3 * s, 0.18)
    + `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(12 * s)}" ry="${n(7 * s)}" fill="${C.creamShade}"/>`
    + `<ellipse cx="${n(x - 1.2 * s)}" cy="${n(y - 1.5 * s)}" rx="${n(10.5 * s)}" ry="${n(5.8 * s)}" fill="${tint}"/>`
    + gloss(x - 4 * s, y - 3.4 * s, 3.4 * s, 1.5 * s, 0.6);
}

/** Binoculars on a strap, held up to the eyes or hanging. */
function binoculars(x, y) {
  return `<g transform="translate(${n(x)} ${n(y)})"><rect x="-11" y="-6" width="9" height="13" rx="3" fill="${C.ink}"/><rect x="2" y="-6" width="9" height="13" rx="3" fill="${C.ink}"/>`
    + `<rect x="-3" y="-3" width="6" height="5" fill="${C.s4}"/>${gloss(-8, -3, 2, 1.2, 0.4)}${gloss(5, -3, 2, 1.2, 0.4)}</g>`;
}

/** The signpost: a round ash post, the red board pointing up her trail (to the right), a cream board under it. */
function signpost(x, y, o = {}) {
  const h = o.h || 96;
  const out = [shadow(x, y + 2, 18, 4)];
  out.push(`<rect x="${n(x - 5)}" y="${n(y - h)}" width="10" height="${h}" rx="4" fill="${C.feltShade}"/><rect x="${n(x - 5)}" y="${n(y - h)}" width="6" height="${h}" rx="3" fill="${C.felt}"/>`);
  const board = (by, col, sh, dir, len) => {
    const x0 = x + (dir > 0 ? -4 : 4);
    const x1 = x0 + dir * len;
    const tip = x1 + dir * 10;
    return `<path d="M${n(x0)} ${n(by)}H${n(x1)}L${n(tip)} ${n(by + 9)}L${n(x1)} ${n(by + 18)}H${n(x0)}Z" fill="${sh}"/>`
      + `<path d="M${n(x0)} ${n(by - 1.5)}H${n(x1)}L${n(tip - dir)} ${n(by + 7.5)}L${n(x1)} ${n(by + 15)}H${n(x0)}Z" fill="${col}"/>`
      + `<circle cx="${n(x)}" cy="${n(by + 7)}" r="1.8" fill="${C.ink}" opacity=".5"/>`;
  };
  out.push(board(y - h + 8, C.red, C.redShade, o.left ? -1 : 1, 42));
  if (!o.one) out.push(board(y - h + 32, C.cream, C.creamShade, o.left ? 1 : -1, 34));
  out.push(`<ellipse cx="${n(x)}" cy="${n(y - h)}" rx="5" ry="2.4" fill="${C.feltLit}"/>`);
  return out.join('');
}

/** A kayak paddle from blade to blade (two points), held across. */
function paddle(a, b) {
  const blade = ([x, y], r) => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="8" ry="17" transform="rotate(${n(r)} ${n(x)} ${n(y)})" fill="${C.redShade}"/>`
    + `<ellipse cx="${n(x - 1)}" cy="${n(y - 1)}" rx="6" ry="14.5" transform="rotate(${n(r)} ${n(x - 1)} ${n(y - 1)})" fill="${C.red}"/>`;
  const r = angle(a, b) + 90;
  return `<path d="M${pt(a)}L${pt(b)}" stroke="${C.feltShade}" stroke-width="4.5" stroke-linecap="round"/><path d="M${pt(a)}L${pt(b)}" transform="translate(-.6 -.6)" stroke="${C.feltLit}" stroke-width="2.4" stroke-linecap="round"/>`
    + blade(a, r) + blade(b, r);
}

module.exports = { pole, notebook, pencil, cup, sheet, mapBack, hammer, stone, binoculars, signpost, paddle };
