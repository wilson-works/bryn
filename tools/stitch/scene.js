'use strict';

/*
 * tools/stitch/scene.js: assembles a stitched scene into one SVG string.
 *
 * A scene has a background grid (everything that never moves) and any number of named groups on top: animated frames,
 * drifting layers, steam. Each group is a plain <g> that may carry an anim-* class and an opacity of 0 until the page
 * brings it in. Patterns are prefixed with the scene name so two scenes in one page never share an id.
 */

const { CELL, THREAD, Grid, toPaths, patternFor, mix } = require('./lib');

const COLS = 128;
const ROWS = 72;

class Scene {
  /**
   * @param {string} name   id prefix and file name
   * @param {string} title  the <title>: what a screen reader says
   * @param {object} o      { cols, rows, tint: (hex) => hex, cloth }
   */
  constructor(name, title, o) {
    const opt = o || {};
    this.name = name;
    this.title = title;
    this.cell = opt.cell || CELL;
    this.view = opt.view || null; // [w, h] when the drawing does not fill whole cells
    this.extra = opt.extra || ''; // markup placed after the title: a guarded style for the door figure
    this.attrs = opt.attrs || '';
    this.under = opt.under || ''; // markup under the stitching (the mark's plate)
    this.cols = opt.cols || COLS;
    this.rows = opt.rows || ROWS;
    this.tint = opt.tint || ((h) => h);
    this.bgTint = opt.bgTint || null; // a wash over the background threads only (dusk): figures and fire stay lit
    this.cloth = opt.cloth === undefined ? '#F3EEDF' : opt.cloth; // null: transparent
    this.bg = new Grid(this.cols, this.rows);
    this.parts = [];
    this.used = new Set();
    this.desc = opt.desc || '';
  }
  grid() { return new Grid(this.cols, this.rows); }
  clothTone(h) { const t = this.tint(h); return this.bgTint ? this.bgTint(t) : t; }

  /** Add a group: a grid placed at (ox, oy) cells. attrs is the raw attribute string, for example class="anim-f2-a". */
  add(grid, ox, oy, attrs, inner) {
    const b = grid.bounds();
    if (!b) return this;
    const g = new Grid(this.cols, this.rows);
    g.blit(grid, ox, oy);
    this.parts.push(`<g${attrs ? ' ' + attrs : ''}>${toPaths(g, this.name, this.used, this.cell)}${inner || ''}</g>`);
    return this;
  }
  /** Add raw markup (a group of groups, for example a drifting pair). */
  raw(markup) { this.parts.push(markup); return this; }
  /** Stitch a grid, then wrap the paths: used for layers sharing one group. */
  paths(grid) { return toPaths(grid, this.name, this.used, this.cell); }

  svg() {
    const px = (n) => n * this.cell;
    const w = this.view ? this.view[0] : px(this.cols);
    const h = this.view ? this.view[1] : px(this.rows);
    const usedBg = new Set();
    const bgPaths = this.bgTint ? toPaths(this.bg, this.name + 'b', usedBg, this.cell) : toPaths(this.bg, this.name, this.used, this.cell);
    const body = this.parts.join('');
    const defs = [...this.used].sort().map((n) => patternFor(this.name, n, this.tint(THREAD[n]), this.cell)).join('')
      + [...usedBg].sort().map((n) => patternFor(this.name + 'b', n, this.bgTint(this.tint(THREAD[n])), this.cell)).join('');
    const hole = mix('#F3EEDF', '#8A7A5C', 0.22);
    const aida = this.cloth
      ? `<pattern id="${this.name}-aida" width="${this.cell}" height="${this.cell}" patternUnits="userSpaceOnUse"><path d="M0 .4H${this.cell}M.4 0V${this.cell}" stroke="${this.clothTone(mix(this.cloth, '#8A7A5C', 0.16))}" stroke-width=".8"/><rect x="-.5" y="-.5" width="1.4" height="1.4" fill="${this.clothTone(hole)}"/></pattern>`
      : '';
    const cloth = this.cloth ? `<rect width="${w}" height="${h}" fill="${this.clothTone(this.cloth)}"/><rect width="${w}" height="${h}" fill="url(#${this.name}-aida)"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${this.attrs}><title>${this.title}</title>${this.extra}<defs>${aida}${defs}</defs>${cloth}${this.under}${bgPaths}${body}</svg>\n`;
  }
}

module.exports = { Scene, COLS, ROWS };
