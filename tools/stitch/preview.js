'use strict';

/* tools/stitch/preview.js: lays poses side by side on aida so a drawing can be looked at before it goes in a scene.
 *   node tools/stitch/preview.js <out.svg> <module> [export]
 * The module exports an object whose values are grids (or functions returning grids). */

const fs = require('fs');
const path = require('path');
const { Scene } = require('./scene');

const [, , out, mod, only] = process.argv;
const m = require(path.resolve(mod));
const sprites = Object.entries(m).filter(([k]) => !only || only.split(',').includes(k)).map(([k, v]) => [k, typeof v === 'function' ? v() : v]);
const cols = Math.min(sprites.length, 5) * 42;
const rows = Math.ceil(sprites.length / 5) * 42;
const s = new Scene('prev', 'preview of stitched poses for review', { cols, rows });
sprites.forEach(([, g], i) => s.add(g, (i % 5) * 42 + 1, Math.floor(i / 5) * 42 + 1, ''));
fs.writeFileSync(out, s.svg());
console.log(sprites.map(([k]) => k).join(' '));
