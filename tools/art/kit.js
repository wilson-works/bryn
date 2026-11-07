'use strict';

/*
 * tools/art/kit.js: the shared drawing kit for Bryn's pictures. Plain SVG strings, no dependencies.
 *
 * The house style is the WilsonWorks vinyl toy (Kody and Louise): flat fills, one shadow shape per part with the light
 * from the upper left, soft white highlight bands and glossy dots, a soft contact shadow, and no ink outlines inside a
 * figure (only the head carries a soft 1.6 edge at 35 percent). This file holds the numbers formatter, the id counter,
 * the palette, limbs, mitt hands, the soft shadow and a few small helpers the figures and the valley share.
 */

/** Bryn's palette: her trail colours, kept from her brand, plus the rangers' uniform and the valley. */
const C = {
  // her shell, the trail, the signpost's red board
  red: '#C8432F', redLit: '#DA5A43', redShade: '#9E3221', redDeep: '#76241A', redSoft: '#E0705A',
  // hat felt, boots, signpost wood
  felt: '#6B5236', feltLit: '#8A6A45', feltShade: '#4E3B26', band: '#5E6B4E', bandLit: '#76845F',
  // skin and hair
  skin: '#E2AD84', skinLit: '#EDC09B', skinShade: '#C98F68', blush: '#E58C78', freckle: '#B9784F',
  hair: '#8A5230', hairLit: '#A7683F', hairShade: '#6A3E22', ochre: '#E0A643', ochreShade: '#B9832B',
  // trousers
  sage: '#9FA27A', sageShade: '#7F8260', sageLit: '#B3B48C',
  // eyes and lines
  white: '#FFFDF7', iris: '#5E4228', irisLit: '#8A6440', pupil: '#1E130C', ink: '#2A1D14', mouth: '#7A3A2C', tongue: '#C4574A',
  cream: '#F5ECD7', creamShade: '#DCCDAA', paper: '#FBF6EA',
  // ranger uniform
  tan: '#CDB98A', tanLit: '#DCCB9F', tanShade: '#A8936A', forest: '#4E6646', forestShade: '#3B4F35',
  hatTan: '#B08A55', hatTanLit: '#C6A06A', hatTanShade: '#8A6A3E', gold: '#D9A441', goldLit: '#EECB78', goldShade: '#A87B26',
  boot: '#4A3424', bootLit: '#664A34',
  // the review: everyone in the same grey-blue
  grey: '#8296A8', greyLit: '#97AABB', greyShade: '#677A8C',
  // the valley
  sky1: '#CFE4EC', sky2: '#F6EEDC', h1: '#B9C8B2', h1s: '#A3B59C', h2: '#9DB58A', h2s: '#86A074', h3: '#B4C58C', h3s: '#9AAE76',
  g1: '#C9D49A', g2: '#B4C482', g3: '#A2B571', dirt: '#E2CFA8', dirtShade: '#C9B286',
  w1: '#A9C7D8', w2: '#7FA7BF', w3: '#4F8FB8', w4: '#E8F2F6',
  s1: '#E4E0D4', s2: '#C9C4B5', s3: '#A9A496', s4: '#7E7A6E',
  pine: '#5F7F4A', pineLit: '#769A5C', pineShade: '#4A6639', trunk: '#7A5A3C',
  flame: '#F1DDA6', fire: '#E0A643',
};

/** The rangers' own colours (a neckerchief and a hat cord tip each), so they never look alike. */
const ROLE = {
  plum: ['#6B5B95', '#54477A'], ochre: ['#E0A643', '#B9832B'], glacier: ['#4F8FB8', '#3B7096'],
  sand: ['#D9C49A', '#B9A477'], moss: ['#5F7F4A', '#4A6639'],
};

/** A number for an attribute: at most one decimal, no trailing zero. */
const n = (v) => String(Math.round(v * 10) / 10);
const pt = ([x, y]) => `${n(x)} ${n(y)}`;

let counter = 0;
/** A fresh id inside the current picture. reset(prefix) starts a picture; every id begins with its prefix. */
let PREFIX = 'art';
function reset(prefix) { PREFIX = prefix; counter = 0; }
const uid = (what) => `${PREFIX}-${what}${++counter}`;

/** A two- or three-joint limb: a dark stroke with the lit colour over it, nudged to the upper left (Kody's sleeves). */
function limb(points, dark, lit, w) {
  const d = `M${points.map(pt).join('L')}`;
  return `<path d="${d}" fill="none" stroke="${dark}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `<path d="${d}" transform="translate(-1.2 -1)" fill="none" stroke="${lit}" stroke-width="${n(w - 3.5)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** The angle (degrees) of the line from a to b. */
const angle = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;

/** The house mitt: a palm, three fingers and a thumb, a shadow copy under a lit one. At (x, y), fingers along rot. */
function mitt(at, rot, skin, shade, o = {}) {
  const s = o.scale || 1;
  const fx = o.flip ? -s : s;
  const parts = '<ellipse cy="1.5" rx="8.4" ry="7.6"/><ellipse cx="-4.9" cy="-7.2" rx="2.9" ry="5.1" transform="rotate(-10 -4.9 -7.2)"/>'
    + '<ellipse cy="-8.6" rx="2.9" ry="5.4"/><ellipse cx="4.9" cy="-7.2" rx="2.9" ry="5.1" transform="rotate(10 4.9 -7.2)"/>'
    + '<ellipse cx="-9" cy="2.5" rx="3.5" ry="5" transform="rotate(-30 -9 2.5)"/>';
  // a fist (holding something) is the palm and the thumb only, the fingers curled out of sight
  const fist = '<ellipse cy="0" rx="8.6" ry="7.8"/><ellipse cx="-7.5" cy="-2" rx="3.4" ry="4.6" transform="rotate(-30 -7.5 -2)"/>';
  const body = o.fist ? fist : parts;
  return `<g transform="translate(${pt(at)}) rotate(${n(rot)}) scale(${n(fx)} ${n(s)})"><g fill="${shade}">${body}</g><g fill="${skin}" transform="translate(-1.1 -1.1)">${body}</g></g>`;
}

/** A hand at the end of an arm: the mitt turned so the fingers carry on along the forearm. */
function handAt(arm, skin, shade, o = {}) {
  const [e, h] = arm.slice(-2);
  const a = angle(e, h) + 90 + (o.turn || 0);
  const ext = 6;
  const r = ((a - 90) * Math.PI) / 180;
  return mitt([h[0] + Math.cos(r) * ext, h[1] + Math.sin(r) * ext], a, skin, shade, o);
}

/** The soft contact shadow under a figure or a prop. */
const shadow = (cx, cy, rx, ry, op = 0.22) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="${C.ink}" opacity="${op}"/>`;

/** A glossy dot (specular highlight). */
const gloss = (cx, cy, rx, ry, op = 0.6) => `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" fill="#FFF" opacity="${op}"/>`;

/** Place a drawing: translate, scale, and mirror for a figure facing the other way. */
const place = (x, y, s = 1, flip = false) => `translate(${n(x)} ${n(y)}) scale(${n(flip ? -s : s)} ${n(s)})`;

module.exports = { C, ROLE, n, pt, reset, uid, limb, angle, mitt, handAt, shadow, gloss, place };
