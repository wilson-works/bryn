'use strict';

/* tools/stitch/props.js: the small things the scenes are dressed with, each a few cells of thread. */

const { Grid, rim, outline, limb } = require('./lib');

const R = Math.round;

/** A boulder: a stone dome with contour rings on its top, sunk into the ground. x, y is the centre of the base. */
function boulder(g, x, y, rx, ry) {
  const body = g.fillWhere((cx, cy) => cy <= y + 1.5 && ((cx - x) / rx) ** 2 + ((cy - y) / ry) ** 2 <= 1, 's2');
  rim(g, body, 'line', [[1, 0], [-1, 0], [0, -1]]);
  const top = g.fillWhere((cx, cy) => ((cx - x + 1) / (rx * 0.62)) ** 2 + ((cy - (y - ry * 0.55)) / (ry * 0.3)) ** 2 <= 1, 's1');
  rim(g, top, 's3', [[1, 0], [-1, 0], [0, 1], [0, -1]]);
  g.fillWhere((cx, cy) => ((cx - x + 2) / (rx * 0.3)) ** 2 + ((cy - (y - ry * 0.55)) / (ry * 0.12)) ** 2 <= 1, 's2');
  // shade low on the right
  g.fillWhere((cx, cy) => cy > y - ry * 0.1 && cx > x + rx * 0.2 && ((cx - x) / (rx - 0.5)) ** 2 + ((cy - y) / (ry - 0.5)) <= 1, 's3');
  // soft shadow on the ground
  for (let i = -rx; i <= rx; i += 1) g.set(R(x + i), R(y + 2), 'g4');
  for (let i = -rx + 2; i <= rx - 2; i += 1) g.set(R(x + i), R(y + 3), 'g3');
}

function pebble(g, x, y) {
  g.art(['.ll.', 'lssl', '.ll.'], { l: 'inkSoft', s: 's1' }, x, y);
}

/** A walking pole: a line of wood with a grip and a spike, from (x0, y0) top to (x1, y1) tip. */
function pole(g, x0, y0, x1, y1) {
  g.trace(x0, y0, x1, y1, 'woodD');
  g.trace(x0 + 1, y0, x1 + 1, y1, 'wood');
  g.rect(R(x0), R(y0) - 1, 2, 2, 'ochre'); // grip
}

function ropeCoil(g, x, y) {
  g.art(['.ssss.', 'sttttss', 'sttttss', '.ssss.'], { s: 'sand', t: 't2' }, x, y);
  g.set(x + 3, y + 1, 'sand');
}

/** A tin cup, 3 x 3, with a lighter rim. */
function cup(g, x, y) {
  g.art(['wcw', 'sss', '.s.'], { w: 'white', c: 's1', s: 's2' }, x, y);
  g.set(x + 2, y + 1, 's3');
}

/** The paper held up: seen from behind, so it is a plain sheet with one fold, never the printed side. */
function paperBack(g, x, y, w, h, tone) {
  g.rect(x, y, w, h, tone || 'paper');
  for (let i = 0; i < w; i++) { g.set(x + i, y, 'line'); g.set(x + i, y + h - 1, 'line'); }
  for (let j = 0; j < h; j++) { g.set(x, y + j, 'line'); g.set(x + w - 1, y + j, 'line'); }
  g.set(R(x + w / 2), y + 1, 't3'); g.set(R(x + w / 2), y + 2, 't3');
}

/** A notebook seen from its back cover. */
function notebookBack(g, x, y) {
  g.rect(x, y, 5, 6, 'felt');
  for (let j = 0; j < 6; j++) g.set(x, y + j, 'woodD');
  g.set(x + 3, y + 1, 'ochre'); g.set(x + 3, y + 2, 'ochre');
  for (let i = 0; i < 5; i++) { g.set(x + i, y, 'line'); g.set(x + i, y + 5, 'line'); }
  g.set(x + 4, y + 2, 'line'); g.set(x + 4, y + 3, 'line');
}

/** A songbird, 4 x 3: rope body, felt cap, a beak. face: +1 right. */
function bird(g, x, y, mode, face) {
  const f = face || 1;
  const px = (dx) => (f > 0 ? x + dx : x + 3 - dx);
  if (mode === 'up') { // wings raised
    g.set(px(1), y + 2, 'sand'); g.set(px(2), y + 2, 'sand'); g.set(px(0), y + 1, 'inkFar'); g.set(px(3), y + 1, 'inkFar'); g.set(px(1), y + 1, 'felt');
    g.set(px(0), y, 'inkFar'); g.set(px(3), y, 'inkFar');
    return;
  }
  g.set(px(0), y + 1, 'sand'); g.set(px(1), y + 1, 'sand'); g.set(px(2), y + 1, 'sand'); g.set(px(1), y, 'felt'); g.set(px(2), y, 'felt');
  g.set(px(3), y + 1, 'ochre'); g.set(px(1), y + 2, 'sand'); g.set(px(2), y + 2, 'sand');
  if (mode === 'peck') { g.clear(px(2), y); g.set(px(2), y + 1, 'felt'); g.set(px(3), y + 2, 'ochre'); g.clear(px(3), y + 1); }
}

/** A far bird: a little v of ink; wings up or down. */
function farBird(g, x, y, up) {
  if (up) { g.set(x, y, 'inkFar'); g.set(x + 1, y + 1, 'inkFar'); g.set(x + 2, y, 'inkFar'); } else { g.set(x, y + 1, 'inkFar'); g.set(x + 1, y, 'inkFar'); g.set(x + 2, y + 1, 'inkFar'); }
}

/** A grass tuft in two leans, for the sway. */
function tuftLean(g, x, y, lean) {
  g.set(x + 1, y, 'mossD'); g.set(x + 1, y - 1, 'moss');
  g.set(x, y, 'mossD'); g.set(x + 2, y, 'mossD');
  g.set(x + (lean < 0 ? -1 : 0), y - 1, 'mossL'); g.set(x + (lean > 0 ? 3 : 2), y - 1, 'mossL'); g.set(x + 1 + lean, y - 2, 'moss');
}

/** Steam from a cup: three wisps, in two phases. */
function steam(g, x, y, phase) {
  const p = phase ? 1 : 0;
  g.set(x + p, y, 'white'); g.set(x + 1 - p, y - 1, 'cream'); g.set(x + p, y - 2, 'white'); g.set(x + 1 - p, y - 3, 'paper');
}

function glint(g, x, y) { g.set(x, y, 'white'); g.set(x + 1, y, 'white'); }

/** A stone to lay on the trail: 5 x 3 cream. */
function stone(g, x, y) {
  g.art(['.lll.', 'lcccl', '.lll.'], { l: 'line', c: 'cream' }, x, y);
}

module.exports = { boulder, pebble, pole, ropeCoil, cup, paperBack, notebookBack, bird, farBird, tuftLean, steam, glint, stone };
