'use strict';

/*
 * tools/stitch/lib.js: the needlepoint drawing kit.
 *
 * A picture is a grid of cells (CELL px each, 5 by default: 128 x 72 cells fill a 640 x 360 scene). Every cell is
 * either bare aida cloth or one thread colour. The kit draws shapes on that grid (ellipses, polygons, thick lines,
 * jointed limbs) and then turns the grid into SVG: one path of rectangles per thread colour, filled with a pattern
 * that paints an X stitch in that colour. No image, no style, no script: the scene contract holds.
 */

const CELL = 5;

/* The thread box: Bryn's brand colours first (art/README.md section 3 and brand/tokens.css), then the tints the
 * picture needs. Names are what the drawing code uses; nothing outside this table is ever stitched. */
const THREAD = {
  // outlines and inks (never black)
  ink: '#4A3A2A', line: '#6E5A40', inkFar: '#8A7A5C', inkSoft: '#A99A7A',
  // her shell, the trail, the signpost board: one red
  red: '#C8432F', redD: '#9E3221', redDD: '#76241A', redL: '#E0705A',
  // felt hat, boots, signpost wood
  felt: '#6B5236', feltL: '#8A6A45', band: '#5E6B4E',
  // skin
  skin: '#E2AD84', skinD: '#C98F68', blush: '#E58C78',
  // hair
  hair: '#8A5230', hairD: '#6A3E22',
  // trousers
  sage: '#B3B48C', sageD: '#939469',
  // cloth-friendly neutrals
  cream: '#F7F1E1', paper: '#EFE6CF', white: '#FFFDF6',
  // land
  g1: '#E4E8CE', g2: '#D5DBB6', g3: '#C4CC9C', g4: '#AFB985', moss: '#5F7F4A', mossD: '#4A6639', mossL: '#8FA66C',
  t1: '#E8DAB9', t2: '#E2CFA8', t3: '#D3BC8C', sand: '#D9C49A',
  // water
  w1: '#A9C7D8', w2: '#7FA7BF', w3: '#4F8FB8', w4: '#6C98B0',
  // stone
  s1: '#D8D4C8', s2: '#C0BCAE', s3: '#A09C8C', s4: '#7E7A6E',
  // fire and gold
  ochre: '#E0A643', ochreD: '#B9822A', flame: '#F1DDA6',
  // the five scouts
  plum: '#6B5B95', plumD: '#524575', plumL: '#8E80B5',
  glacier: '#4F8FB8', glacierD: '#3B7396', glacierL: '#7FB0D0',
  scoutMoss: '#5F7F4A', scoutMossD: '#486339', scoutMossL: '#86A36C',
  scoutSand: '#D9C49A', scoutSandD: '#B79F6C', scoutSandL: '#EAD9B2',
  scoutOchre: '#E0A643', scoutOchreD: '#B9822A', scoutOchreL: '#F0C779',
  // anonymous review grey-blue
  gb: '#8296A8', gbD: '#62768A', gbL: '#A6B7C6',
  // misc
  deer: '#A27B52', deerD: '#7F5D3A', antler: '#C4B898', wood: '#8A6A45', woodD: '#6B5236',
  night: '#3E3550', star: '#F1E9C8',
};
const NAMES = Object.keys(THREAD);
const ID = Object.fromEntries(NAMES.map((n, i) => [n, i + 1]));

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a, b, t) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)); };
const darker = (h, t) => mix(h, '#3A2A1C', t);
const lighter = (h, t) => mix(h, '#FFFDF6', t);

class Grid {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.d[y * this.w + x] : 0; }
  set(x, y, c) { if (this.inb(x, y)) this.d[y * this.w + x] = typeof c === 'string' ? ID[c] : c; }
  clear(x, y) { if (this.inb(x, y)) this.d[y * this.w + x] = 0; }
  nameAt(x, y) { const v = this.get(x, y); return v ? NAMES[v - 1] : null; }
  clone() { const g = new Grid(this.w, this.h); g.d.set(this.d); return g; }

  /** Fill every cell whose centre passes test(x + .5, y + .5). Returns the list of cells touched. */
  fillWhere(test, c, x0 = 0, y0 = 0, x1 = this.w, y1 = this.h) {
    const hit = [];
    for (let y = Math.max(0, y0); y < Math.min(this.h, y1); y++) {
      for (let x = Math.max(0, x0); x < Math.min(this.w, x1); x++) if (test(x + 0.5, y + 0.5)) { if (c != null) this.set(x, y, c); hit.push([x, y]); }
    }
    return hit;
  }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  ellipse(cx, cy, rx, ry, c) {
    return this.fillWhere((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, c, Math.floor(cx - rx), Math.floor(cy - ry), Math.ceil(cx + rx) + 1, Math.ceil(cy + ry) + 1);
  }
  poly(pts, c) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    return this.fillWhere((x, y) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    }, c, Math.floor(Math.min(...xs)), Math.floor(Math.min(...ys)), Math.ceil(Math.max(...xs)) + 1, Math.ceil(Math.max(...ys)) + 1);
  }
  /** A line of round-ended thickness r (radius in cells) between two points. */
  line(x0, y0, x1, y1, r, c) {
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1;
    return this.fillWhere((x, y) => {
      const t = Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / len2));
      return (x - (x0 + t * dx)) ** 2 + (y - (y0 + t * dy)) ** 2 <= r * r;
    }, c, Math.floor(Math.min(x0, x1) - r) - 1, Math.floor(Math.min(y0, y1) - r) - 1, Math.ceil(Math.max(x0, x1) + r) + 2, Math.ceil(Math.max(y0, y1) + r) + 2);
  }
  /** Backstitch line: single cells along the line (Bresenham), no thickness. */
  trace(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  /** Stamp another grid on this one at (ox, oy). Empty cells of the stamp leave this grid alone. */
  blit(src, ox, oy) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const v = src.d[y * src.w + x]; if (v) this.set(ox + x, oy + y, v); }
  }
  /** Draw a text sprite: rows of characters, legend maps a character to a thread name (space and . are bare). */
  art(rows, legend, ox, oy) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch !== ' ' && ch !== '.') { const n = legend[ch]; if (!n) throw new Error(`no legend for "${ch}"`); this.set(ox + i, oy + j, n); }
      }
    });
  }
  bounds() {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.d[y * this.w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }
  has(x, y) { return this.get(x, y) !== 0; }
}

/** Darken the rim of a drawn part: cells in `cells` that touch a cell outside it get the edge colour. */
function rim(g, cells, edge, dirs) {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const d4 = dirs || [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [x, y] of cells) if (d4.some(([a, b]) => !set.has(`${x + a},${y + b}`))) g.set(x, y, edge);
}

/** Put a one-cell ink outline round everything drawn in the grid (cells touching the figure on four sides). */
function outline(g, c) {
  const add = [];
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    if (g.has(x, y)) continue;
    if (g.has(x + 1, y) || g.has(x - 1, y) || g.has(x, y + 1) || g.has(x, y - 1)) add.push([x, y]);
  }
  add.forEach(([x, y]) => g.set(x, y, c));
}

/** Two-bone limb: the elbow (or knee) for a joint at a, an end at b and segment lengths l1, l2. bend = +1 or -1 picks the side. */
function solve(a, b, l1, l2, bend) {
  let dx = b[0] - a[0], dy = b[1] - a[1];
  let d = Math.hypot(dx, dy) || 1e-9;
  const reach = l1 + l2 - 0.01;
  if (d > reach) { dx *= reach / d; dy *= reach / d; d = reach; }
  const lo = Math.abs(l1 - l2) + 0.01;
  if (d < lo) { dx *= lo / d; dy *= lo / d; d = lo; }
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  const ux = dx / d, uy = dy / d;
  const k = [a[0] + ux * along - uy * h * bend, a[1] + uy * along + ux * h * bend];
  return { joint: k, end: [a[0] + dx, a[1] + dy] };
}

/** Draw a limb from a to b bending at an elbow/knee. Returns the three points. */
function limb(g, a, b, l1, l2, bend, r1, r2, c, edge) {
  const s = solve(a, b, l1, l2, bend);
  const cells = [];
  cells.push(...g.line(a[0], a[1], s.joint[0], s.joint[1], r1, c));
  cells.push(...g.line(s.joint[0], s.joint[1], s.end[0], s.end[1], r2, c));
  if (edge) rim(g, cells, edge);
  return { shoulder: a, joint: s.joint, end: s.end };
}

/* ------------------------------------------------------------------ SVG output */

/** Group the cells of a grid into rectangles by thread: horizontal runs, merged down when the same run repeats. */
function rects(g) {
  const out = {};
  let open = {};
  for (let y = 0; y <= g.h; y++) {
    const now = {};
    if (y < g.h) {
      let x = 0;
      while (x < g.w) {
        const v = g.d[y * g.w + x];
        if (!v) { x++; continue; }
        let e = x;
        while (e < g.w && g.d[y * g.w + e] === v) e++;
        now[`${v},${x},${e - x}`] = { v, x, w: e - x, y, h: 1 };
        x = e;
      }
    }
    const next = {};
    for (const k of Object.keys(now)) next[k] = open[k] ? Object.assign(open[k], { h: open[k].h + 1 }) : now[k];
    for (const k of Object.keys(open)) if (!now[k]) { const r = open[k]; (out[r.v] = out[r.v] || []).push(r); }
    open = next;
  }
  return out;
}

/** The SVG path elements for a grid, using pattern ids `${prefix}-${thread}`; records the threads used. */
function toPaths(g, prefix, used, cell) {
  const C = cell || CELL;
  const by = rects(g);
  let s = '';
  for (const v of Object.keys(by).map(Number).sort((a, b) => a - b)) {
    const name = NAMES[v - 1];
    used.add(name);
    const d = by[v].sort((a, b) => a.y - b.y || a.x - b.x).map((r) => `M${r.x * C} ${r.y * C}h${r.w * C}v${r.h * C}h-${r.w * C}z`).join('');
    s += `<path fill="url(#${prefix}-${name})" d="${d}"/>`;
  }
  return s;
}

/** The pattern that paints one X stitch in a thread colour: a wash of the thread, the under stitch, then the top stitch. */
function patternFor(prefix, name, hexColour, cell) {
  const C = cell || CELL;
  const k = C / CELL;
  const dark = darker(hexColour, 0.24), light = lighter(hexColour, 0.22);
  const p = (n) => +(n * k).toFixed(2);
  return `<pattern id="${prefix}-${name}" width="${C}" height="${C}" patternUnits="userSpaceOnUse">`
    + `<rect width="${C}" height="${C}" fill="${hexColour}"/>`
    + `<path d="M${p(0.9)} ${p(0.9)}L${p(4.1)} ${p(4.1)}" stroke="${dark}" stroke-width="${p(1.5)}" stroke-linecap="round"/>`
    + `<path d="M${p(4.1)} ${p(0.9)}L${p(0.9)} ${p(4.1)}" stroke="${light}" stroke-width="${p(1.5)}" stroke-linecap="round"/></pattern>`;
}

module.exports = { CELL, THREAD, NAMES, ID, Grid, rim, outline, solve, limb, rects, toPaths, patternFor, mix, darker, lighter, hex };
