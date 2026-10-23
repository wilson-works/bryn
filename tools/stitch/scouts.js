'use strict';

/*
 * tools/stitch/scouts.js: the five scouts as friendly stitched figures.
 *
 * Soft round faces, big kind eyes with a catch-light, rosy cheeks, a small smile, a knit cap with a pom-pom. They are a
 * little shorter than Bryn (26 cells to her 31) so they never loom. Each scout has one colour; the review draws them all
 * in the same grey-blue. Poses are drawn like Bryn's: joints, solved limbs, a new drawing for every frame.
 */

const { Grid, rim, outline, limb } = require('./lib');

const W = 36;
const H = 36;
const G = 34;
const AX = 17;
const R = Math.round;

const SCOUTS = {
  contrarian: { c: 'plum', d: 'plumD', l: 'plumL' },
  fpt: { c: 'scoutOchre', d: 'scoutOchreD', l: 'scoutOchreL' },
  expansionist: { c: 'glacier', d: 'glacierD', l: 'glacierL' },
  outsider: { c: 'scoutSand', d: 'scoutSandD', l: 'scoutSandL' },
  executor: { c: 'scoutMoss', d: 'scoutMossD', l: 'scoutMossL' },
  anon: { c: 'gb', d: 'gbD', l: 'gbL' },
};

const grid = () => new Grid(W, H);

/** A big kind eye: 2 x 2 cells of ink with a white catch-light in the top corner. */
function eye(g, x, y, open, lightRight) {
  if (!open) { g.set(x, y + 1, 'ink'); g.set(x + 1, y + 1, 'ink'); return; }
  g.rect(x, y, 2, 2, 'ink');
  g.set(lightRight ? x + 1 : x, y, 'white');
}

/** Head. facing 'f' front, 'r' looking right. Returns nothing; draws the cap too. */
function head(g, pal, c, facing, o) {
  const [cx, cy] = c;
  const opt = o || {};
  const open = !opt.blink;
  const cells = g.ellipse(cx, cy, 5.1, 4.7, 'skin');
  rim(g, cells.filter(([, y]) => y > cy + 3), 'skinD', [[0, 1]]);
  if (facing === 'f') {
    eye(g, R(cx - 3.2), R(cy - 0.6), open, false);
    eye(g, R(cx + 1.2), R(cy - 0.6), open, false);
    g.set(R(cx - 4.2), R(cy + 2), 'blush'); g.set(R(cx - 3.2), R(cy + 2), 'blush');
    g.set(R(cx + 3.2), R(cy + 2), 'blush'); g.set(R(cx + 4.2), R(cy + 2), 'blush');
    g.set(R(cx - 1.5), R(cy + 2.8), 'redD'); g.set(R(cx - 0.5), R(cy + 3.5), 'redD'); g.set(R(cx + 0.5), R(cy + 3.5), 'redD'); g.set(R(cx + 1.5), R(cy + 2.8), 'redD');
  } else {
    eye(g, R(cx + 1.4), R(cy - 0.6), open, true);
    g.set(R(cx + 5), R(cy + 1), 'skin');
    g.set(R(cx + 0.2), R(cy + 2), 'blush'); g.set(R(cx + 1.2), R(cy + 2), 'blush');
    g.set(R(cx + 2.2), R(cy + 3.2), 'redD'); g.set(R(cx + 3.2), R(cy + 2.8), 'redD');
    // hair at the back of the head, under the cap
    g.set(R(cx - 4.5), R(cy - 0.5), 'hair'); g.set(R(cx - 4.5), R(cy + 0.5), 'hair'); g.set(R(cx - 4), R(cy + 1.5), 'hair');
  }
  // knit cap: a dome, a cuff, a pom-pom
  const dome = g.fillWhere((x, y) => y < cy - 2.4 && ((x - cx) / 5.4) ** 2 + ((y - (cy - 2.4)) / 3.4) ** 2 <= 1, pal.l);
  rim(g, dome, pal.c, [[0, -1], [1, 0], [-1, 0]]);
  g.rect(R(cx - 5), R(cy - 3), 10, 2, pal.c);
  for (let i = 0; i < 10; i += 2) g.set(R(cx - 5) + i, R(cy - 3), pal.d);
  g.ellipse(cx + (opt.pom || 0), cy - 6.6, 2.2, 1.7, 'cream');
  g.set(R(cx + (opt.pom || 0)), R(cy - 6.4), 'paper');
}

function body(g, pal, sh, hip, o) {
  const opt = o || {};
  const cells = g.poly([[sh[0] - 4.2, sh[1] - 0.6], [sh[0] + 4.2, sh[1] - 0.6], [hip[0] + 5.2, hip[1] + 2], [hip[0] - 5.2, hip[1] + 2]], pal.c);
  rim(g, cells, pal.d, [[0, 1]]);
  g.rect(R(sh[0] - 3), R(sh[1] - 0.6), 6, 1, 'cream'); // scarf
  g.rect(R(hip[0] - 5), R(hip[1] + 0.2), 10, 1, pal.d); // hem fold
  void opt;
}

const boot = (g, x, y, dir) => {
  const x0 = dir > 0 ? R(x - 1.5) : R(x - 2.5);
  g.rect(x0, R(y), 4, 2, 'felt');
  for (let i = 0; i < 4; i++) { g.set(x0 + i, R(y), 'feltL'); g.set(x0 + i, R(y) + 1, 'line'); }
};

const rel = (o, d) => [o[0] + d[0], o[1] + d[1]];

/** Front, standing. Hand offsets are from each shoulder; left and right are the viewer's. */
function front(kind, p) {
  const pal = SCOUTS[kind];
  const g = grid();
  const q = p || {};
  const hip = q.hip || [AX, G - 7.5];
  const sh = [hip[0], hip[1] - 5.6];
  const hd = [sh[0], sh[1] - 4.4];
  limb(g, [hip[0] - 1.8, hip[1]], [hip[0] - 2.4, G - 2], 3.5, 3.5, -1, 1.5, 1.4, pal.d, null);
  boot(g, hip[0] - 2.4, G - 2, -1);
  limb(g, [hip[0] + 1.8, hip[1]], [hip[0] + 2.4, G - 2], 3.5, 3.5, 1, 1.5, 1.4, pal.d, null);
  boot(g, hip[0] + 2.4, G - 2, 1);
  body(g, pal, sh, hip);
  head(g, pal, hd, 'f', { blink: q.blink });
  const lS = [sh[0] - 3.8, sh[1] + 0.8];
  const rS = [sh[0] + 3.8, sh[1] + 0.8];
  if (q.leftHand) { const t = rel(lS, q.leftHand); limb(g, lS, t, 3.2, 3.2, -1, 1.1, 1.05, pal.c, pal.d); g.ellipse(t[0], t[1], 1.2, 1.2, 'skin'); }
  if (q.rightHand) { const t = rel(rS, q.rightHand); limb(g, rS, t, 3.2, 3.2, 1, 1.1, 1.05, pal.c, pal.d); g.ellipse(t[0], t[1], 1.2, 1.2, 'skin'); }
  if (q.after) q.after(g, { hip, sh, hd, pal });
  outline(g, 'line');
  return g;
}

/** Side view, facing right. Feet relative to the hip column (dx, lift). */
function side(kind, p) {
  const pal = SCOUTS[kind];
  const g = grid();
  const q = p || {};
  const hip = q.hip || [AX, G - 7.5];
  const sh = [hip[0] + (q.lean || 0), hip[1] - 5.6];
  const hd = [sh[0] + 1 + (q.headDx || 0), sh[1] - 4.4 + (q.headDy || 0)];
  const aY = (f) => G - 2 - (f[1] || 0);
  if (q.after0) q.after0(g, { hip, sh, hd, pal }); // things behind: a pack, a hat on the back
  if (q.farHand) { const t = rel([sh[0] - 0.5, sh[1] + 0.8], q.farHand); limb(g, [sh[0] - 0.5, sh[1] + 0.8], t, 3.2, 3.2, 1, 1, 1, pal.d, null); g.ellipse(t[0], t[1], 1.1, 1.1, 'skin'); }
  if (q.farFoot) { const a = [hip[0] + q.farFoot[0], aY(q.farFoot)]; limb(g, [hip[0] - 0.3, hip[1]], a, 3.5, 3.5, -1, 1.4, 1.3, pal.d, null); boot(g, a[0], a[1], 1); }
  if (q.nearFoot) { const a = [hip[0] + q.nearFoot[0], aY(q.nearFoot)]; limb(g, [hip[0] + 0.3, hip[1]], a, 3.5, 3.5, -1, 1.5, 1.4, pal.c, pal.d); boot(g, a[0], a[1], 1); }
  body(g, pal, sh, hip);
  head(g, pal, hd, 'r', { blink: q.blink });
  if (q.nearHand) { const t = rel([sh[0] + 0.3, sh[1] + 0.8], q.nearHand); limb(g, [sh[0] + 0.3, sh[1] + 0.8], t, 3.2, 3.2, 1, 1.1, 1.05, pal.c, pal.d); g.ellipse(t[0], t[1], 1.2, 1.2, 'skin'); }
  if (q.after) q.after(g, { hip, sh, hd, pal });
  outline(g, 'line');
  return g;
}

/** Mirror a grid left to right (a scout walking the other way, a log on the fire's far side). */
function mirror(src) {
  const g = new Grid(src.w, src.h);
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) g.d[y * src.w + (src.w - 1 - x)] = src.d[y * src.w + x];
  return g;
}

module.exports = { W, H, G, AX, SCOUTS, front, side, mirror, head, body, boot, eye };
