'use strict';

/* tools/stitch/scenes-e.js: the door figure (art.svg) and the mark (mark.svg). */

const { Grid } = require('./lib');
const { Scene } = require('./scene');
const V = require('./valley');
const B = require('./bryn');
const P = require('./props');

const R = Math.round;

/** The greeting pose, facing us: w 1 hand high, 2 hand out at the shoulder, 0 hand down. */
function greeting(w) {
  const hip = [20, B.G - 12.2];
  const sh = [hip[0], hip[1] - 7.2];
  const hand = [[1.2, 8.4], [6.6, -0.6], [4.8, -5.0]][w === 0 ? 0 : w === 2 ? 1 : 2];
  return B.front({
    hip, sh, head: [sh[0], sh[1] - 4.8], braid: 0.4, leftFoot: [-3.4, 0], rightFoot: [3.4, 0],
    leftHand: [-1.2, 8.2], rightHand: hand, rightArmBend: w === 0 ? -1 : 1,
  });
}

/** art.svg: 120 x 150, transparent, three drawings of one wave swapped in steps (reduced motion keeps the raised hand). */
function door() {
  const style = '<style>@media (prefers-reduced-motion: no-preference){.bryn-w1{animation:bryn-w1 2.4s step-end infinite}.bryn-w2{animation:bryn-w2 2.4s step-end infinite}.bryn-w0{animation:bryn-w0 2.4s step-end infinite}'
    + '@keyframes bryn-w1{0%{opacity:1}20%{opacity:0}40%{opacity:1}60%{opacity:0}}'
    + '@keyframes bryn-w2{0%{opacity:0}20%{opacity:1}40%{opacity:0}60%{opacity:1}80%{opacity:0}}'
    + '@keyframes bryn-w0{0%{opacity:0}80%{opacity:1}}}</style>';
  const s = new Scene('bryn', 'Bryn the Trail Guide, standing and waving hello, in cross-stitch', {
    cell: 4, cols: 30, rows: 37, cloth: null, view: [120, 150], extra: style, attrs: ' role="img"',
  });
  // a small stitched patch of grass under her boots
  const g = s.bg;
  g.ellipse(15, 35.5, 12, 2.3, 'g3');
  g.ellipse(15, 35.2, 8.5, 1.4, 'g2');
  for (const [x, y] of [[5, 35], [24, 35], [9, 36], [20, 36]]) { g.set(x, y, 'mossD'); g.set(x + 1, y - 1, 'mossL'); }
  const ox = -5;
  const oy = -3;
  s.add(greeting(1), ox, oy, 'class="bryn-w1"');
  s.add(greeting(2), ox, oy, 'class="bryn-w2" opacity="0"');
  s.add(greeting(0), ox, oy, 'class="bryn-w0" opacity="0"');
  return s;
}

/** mark.svg: the old sign (a hilltop, a red dashed trail, three stones on a rounded plate) stitched on 3 px cells. */
function mark() {
  const s = new Scene('bryn-mark', 'Bryn', { cell: 3, cols: 12, rows: 12, cloth: null, view: [36, 36], attrs: ' width="36" height="36" role="img"',
    under: '<rect x=".7" y=".7" width="34.6" height="34.6" rx="7" fill="#E9EBD8" stroke="#6B5A41" stroke-width="1.4"/>' });
  const g = s.bg;
  // the hill: three nested contour tones, top right
  g.ellipse(8, 4, 3.6, 2.8, 'g3');
  g.ellipse(8, 4, 2.4, 1.8, 'g2');
  g.ellipse(8.2, 3.6, 1.2, 0.9, 't1');
  for (const [x, y] of g.fillWhere((x, y) => Math.hypot((x - 8) / 3.8, (y - 4) / 3) > 0.92 && Math.hypot((x - 8) / 3.8, (y - 4) / 3) < 1.25 && g.has(Math.floor(x), Math.floor(y)), null)) g.set(x, y, 'inkFar');
  // the trail climbing, dashed, and three stones in its gaps
  const pts = [[1, 10], [3, 9], [4, 7], [6, 6], [7, 5]];
  pts.forEach(([x, y], i) => { g.set(x, y, 'red'); if (i % 2 === 0) g.set(x + 1, y, 'red'); });
  for (const [x, y] of [[2, 10], [4, 8], [6, 5]]) g.set(x, y, 'cream');
  return s;
}

module.exports = { door, mark, greeting };
