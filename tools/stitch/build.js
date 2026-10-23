'use strict';

/*
 * node tools/stitch/build.js [out-dir] [scene,scene]
 *
 * Draws every scene in thread and writes the SVGs into art/ (or the folder given). No dependencies. The drawing code
 * in this folder is the source; the SVGs are what the page serves.
 */

const fs = require('fs');
const path = require('path');
const a = require('./scenes');
const b = require('./scenes-b');
const c = require('./scenes-c');
const d = require('./scenes-d');
const e = require('./scenes-e');

const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', '..', 'art');
const only = process.argv[3] ? process.argv[3].split(',') : null;
fs.mkdirSync(out, { recursive: true });

const builders = { idle: a.idleRock, 'idle-trail': a.idleTrail, 'idle-kayak': b.idleKayak, framing: c.framing, brainstorm: c.brainstorm, consulting: c.consulting, filing: c.filing, waiting: c.waiting, premortem: c.premortem, council: d.council, review: d.review, verdict: d.verdict };
for (const [name, build] of Object.entries(builders)) {
  if (only && !only.includes(name)) continue;
  const svg = build().svg();
  fs.writeFileSync(path.join(out, `${name}.svg`), svg);
  console.log(`${name}.svg ${svg.length} bytes`);
}

if (!only || only.includes('door')) {
  const root = path.join(__dirname, '..', '..');
  const dest = process.argv[2] ? path.resolve(process.argv[2]) : root;
  const door = e.door().svg();
  fs.writeFileSync(path.join(dest, 'art.svg'), door);
  console.log(`art.svg ${door.length} bytes`);
  const mark = e.mark().svg();
  fs.writeFileSync(path.join(dest, 'mark.svg'), mark);
  console.log(`mark.svg ${mark.length} bytes`);
}
