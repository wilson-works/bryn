'use strict';

/*
 * tools/stitch/bryn.js: Bryn drawn as stitch poses.
 *
 * Every pose is a small grid (40 x 40 cells) with the ground at row G. A pose is made from joints: the hip and shoulder
 * set the trunk, two-bone limbs are solved from shoulder to hand and hip to foot, so an arm bends at the elbow and a
 * leg at the knee. Nothing is rotated about a centre: a new pose is a new drawing, and the page swaps them like the
 * frames of a stitched flip book.
 *
 * Offsets in a pose are in cells: hands are relative to their shoulder, feet relative to the hip column.
 */

const { Grid, rim, outline, limb } = require('./lib');

const W = 40;
const H = 40;
const G = 38; // the ground row: boot soles end here
const AX = 20; // the anchor column: where her weight sits

const new_ = () => new Grid(W, H);
const R = Math.round;

/** A boot at an ankle: 4 cells long, toe forward (dir +1 faces right). */
function boot(g, ax, ay, dir) {
  const x0 = dir > 0 ? R(ax - 1.5) : R(ax - 2.5);
  const y0 = R(ay);
  const cells = [];
  for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { cells.push([x0 + i, y0 + j]); g.set(x0 + i, y0 + j, 'felt'); }
  for (let i = 0; i < 4; i++) { g.set(x0 + i, y0, 'feltL'); g.set(x0 + i, y0 + 1, 'line'); }
}

/** Head, face and hat. facing: 'r' (side, looking right), 'f' (front). */
function head(g, c, facing, o) {
  const [cx, cy] = c;
  const opt = o || {};
  const tilt = opt.tilt || 0; // hat tilt in cells (+ right)
  const blink = !!opt.blink;
  if (facing === 'r') g.ellipse(cx - 1.4, cy + 0.4, 3.4, 3.8, 'hair');
  else g.ellipse(cx, cy + 0.4, 4.0, 3.9, 'hair');
  const face = g.ellipse(cx + (facing === 'r' ? 0.8 : 0), cy + 0.6, facing === 'r' ? 3.2 : 3.4, 3.4, 'skin');
  rim(g, face.filter(([, y]) => y > cy + 2), 'skinD', [[0, 1]]);
  if (facing === 'r') {
    g.set(R(cx + 4), R(cy + 0.6), 'skin'); // nose
    g.set(R(cx + 2.4), R(cy - 0.2), blink ? 'skinD' : 'ink'); // eye
    g.set(R(cx + 1.4), R(cy + 1.4), 'blush'); // cheek
    g.set(R(cx + 3.2), R(cy + 2.2), 'redD'); // smile
    g.set(R(cx + 2.2), R(cy + 2.2), 'skinD');
  } else {
    g.set(R(cx - 1.6), R(cy - 0.2), blink ? 'skinD' : 'ink');
    g.set(R(cx + 1.4), R(cy - 0.2), blink ? 'skinD' : 'ink');
    g.set(R(cx - 2.6), R(cy + 1.4), 'blush');
    g.set(R(cx + 2.4), R(cy + 1.4), 'blush');
    g.set(R(cx - 1.6), R(cy + 1.9), 'skinD');
    g.set(R(cx - 0.6), R(cy + 2.6), 'redD');
    g.set(R(cx + 0.4), R(cy + 2.6), 'redD');
    g.set(R(cx + 1.4), R(cy + 1.9), 'skinD');
  }
  // hat: brim, crown, band
  const hx = R(cx + tilt + (facing === 'r' ? 0.8 : 0));
  const by = R(cy - 2.4);
  const brim = g.ellipse(hx, by + 0.5, 5.8, 1.5, 'felt');
  rim(g, brim, 'line', [[0, 1], [1, 0], [-1, 0]]);
  for (let j = 0; j < 3; j++) for (let i = -3; i <= 3; i++) {
    if (j === 0 && Math.abs(i) === 3) continue;
    g.set(hx + i, by - 3 + j, j === 2 ? 'band' : (j === 0 ? 'feltL' : 'felt'));
  }
}

/** The red shell on the trunk. Returns the trunk cells. */
function trunk(g, sh, hip, opts) {
  const o = opts || {};
  const sw = o.sw || 4.0; // half shoulder width
  const hw = o.hw || 4.2; // half hem width
  const pts = [[sh[0] - sw, sh[1] - 0.8], [sh[0] + sw, sh[1] - 0.8], [hip[0] + hw, hip[1] + 1.4], [hip[0] - hw, hip[1] + 1.4]];
  const cells = g.poly(pts, 'red');
  rim(g, cells, 'redD', [[0, 1]]);
  const f1x = (sh[0] + hip[0]) / 2 + (o.fold || 0);
  for (let y = R(sh[1] + 2); y < R(hip[1] - 0.5); y++) g.set(R(f1x - 1 + (y - sh[1]) * 0.05), y, 'redD');
  g.rect(R(sh[0] - sw + 1), R(sh[1] - 0.8), R(sw * 2 - 2), 1, 'redL');
  g.rect(R(hip[0] - hw), R(hip[1] - 0.6), R(hw * 2), 1, 'felt');
  return cells;
}

function hand(g, p, r) {
  g.ellipse(p[0], p[1], r || 1.1, r || 1.1, 'skin');
}

const rel = (o, d) => [o[0] + d[0], o[1] + d[1]];

/** Side view, facing right. */
function side(p) {
  const g = new_();
  const hip = p.hip || [AX, G - 12.2];
  const sh = p.sh || [hip[0] + (p.lean || 0), hip[1] - 7.2];
  const hd = p.head || [sh[0] + 1.2 + (p.headDx || 0), sh[1] - 4.8 + (p.headDy || 0)];
  const thigh = 6;
  const shin = 6;
  const arm = 4.3;
  const ankleY = (f) => G - 2 - (f[1] || 0);

  if (p.farHand || p.farHandAbs) {
    const t = p.farHandAbs || rel([sh[0] - 0.5, sh[1] + 0.5], p.farHand);
    limb(g, [sh[0] - 0.5, sh[1] + 0.5], t, arm, arm, p.farBend || 1, 1.05, 1, 'redD', 'inkFar');
    hand(g, t, 1.1);
  }
  if (p.farFoot) {
    const a = [hip[0] + p.farFoot[0], ankleY(p.farFoot)];
    limb(g, [hip[0] - 0.3, hip[1]], a, thigh, shin, -1, 1.6, 1.4, 'sageD', 'inkFar');
    boot(g, a[0], a[1], 1);
  }
  const nape = [hd[0] - 3.2, hd[1] + 2.6];
  g.line(nape[0], nape[1], nape[0] - 1.4 + (p.braid || 0), nape[1] + 7, 1.2, 'hair');
  g.set(R(nape[0] - 1.4 + (p.braid || 0)), R(nape[1] + 7.6), 'ochre');
  if (p.nearFoot) {
    const a = [hip[0] + p.nearFoot[0], ankleY(p.nearFoot)];
    limb(g, [hip[0] + 0.3, hip[1]], a, thigh, shin, -1, 1.65, 1.45, 'sage', 'sageD');
    boot(g, a[0], a[1], 1);
  }
  trunk(g, sh, hip, { fold: 0.5 });
  head(g, hd, 'r', { tilt: p.tilt, blink: p.blink });
  if (p.nearHand || p.nearHandAbs) {
    const t = p.nearHandAbs || rel([sh[0] + 0.3, sh[1] + 0.5], p.nearHand);
    limb(g, [sh[0] + 0.3, sh[1] + 0.5], t, arm, arm, p.nearBend || 1, 1.1, 1.05, 'red', 'redDD');
    hand(g, t, 1.15);
  }
  if (p.after) p.after(g, { hip, sh, hd });
  outline(g, 'line');
  return g;
}

/** Front view: standing, both arms free. Left and right are the viewer's. */
function front(p) {
  const g = new_();
  const hip = p.hip || [AX, G - 12.2];
  const sh = p.sh || [hip[0], hip[1] - 7.2];
  const hd = p.head || [sh[0], sh[1] - 4.8];
  const thigh = 6;
  const shin = 6;
  const arm = 4.3;
  const lS = [sh[0] - 3.6, sh[1] + 0.8];
  const rS = [sh[0] + 3.6, sh[1] + 0.8];
  const lf = [hip[0] + (p.leftFoot ? p.leftFoot[0] : -3.8), G - 2 - (p.leftFoot ? p.leftFoot[1] || 0 : 0)];
  const rf = [hip[0] + (p.rightFoot ? p.rightFoot[0] : 3.8), G - 2 - (p.rightFoot ? p.rightFoot[1] || 0 : 0)];
  limb(g, [hip[0] - 2.4, hip[1]], lf, thigh, shin, p.leftBend || -1, 1.3, 1.2, 'sage', 'sageD');
  boot(g, lf[0], lf[1], -1);
  limb(g, [hip[0] + 2.4, hip[1]], rf, thigh, shin, p.rightBend || 1, 1.3, 1.2, 'sage', 'sageD');
  boot(g, rf[0], rf[1], 1);
  trunk(g, sh, hip, { sw: 4.4, hw: 4.6 });
  head(g, hd, 'f', { tilt: p.tilt, blink: p.blink });
  const bx = hd[0] - 4.4;
  g.line(bx, hd[1] + 2.5, bx - 0.2 + (p.braid || 0), hd[1] + 9.5, 1.1, 'hair');
  g.set(R(bx - 0.2 + (p.braid || 0)), R(hd[1] + 10.2), 'ochre');
  if (p.leftHand) { const t = rel(lS, p.leftHand); limb(g, lS, t, arm, arm, p.leftArmBend || 1, 1.15, 1.1, 'red', 'redDD'); hand(g, t, 1.2); }
  if (p.rightHand) { const t = rel(rS, p.rightHand); limb(g, rS, t, arm, arm, p.rightArmBend || -1, 1.15, 1.1, 'red', 'redDD'); hand(g, t, 1.2); }
  if (p.after) p.after(g, { hip, sh, hd });
  outline(g, 'line');
  return g;
}

module.exports = { W, H, G, AX, side, front, boot, head, trunk, hand };
