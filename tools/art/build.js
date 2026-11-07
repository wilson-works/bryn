'use strict';

/*
 * node tools/art/build.js [out-dir] [scene,scene]
 *
 * Draws every scene in the WilsonWorks vinyl-toy style and writes the SVGs into art/ (or the folder given), plus the
 * door figure art.svg and the mark mark.svg at the repo root ("door" in the list builds those two). No dependencies.
 * The drawing code in this folder is the source; the SVGs are what the page serves.
 */

const fs = require('fs');
const path = require('path');
const idle = require('./scenes-idle');
const trail = require('./scenes-trail');
const council = require('./scenes-council');
const door = require('./door');

const out = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '..', '..', 'art');
const only = process.argv[3] ? process.argv[3].split(',') : null;
fs.mkdirSync(out, { recursive: true });

const builders = {
  idle: idle.idleRock, 'idle-trail': idle.idleTrail, 'idle-kayak': idle.idleKayak,
  framing: trail.framing, brainstorm: trail.brainstorm, waiting: trail.waiting, premortem: trail.premortem, filing: trail.filing, consulting: trail.consulting,
  council: council.council, review: council.review, verdict: council.verdict,
};
for (const [name, build] of Object.entries(builders)) {
  if (only && !only.includes(name)) continue;
  const svg = build();
  fs.writeFileSync(path.join(out, `${name}.svg`), svg);
  console.log(`${name}.svg ${svg.length} bytes`);
}

if (!only || only.includes('door')) {
  const dest = process.argv[2] ? out : path.join(__dirname, '..', '..');
  for (const [file, svg] of [['art.svg', door.door()], ['mark.svg', door.mark()]]) {
    fs.writeFileSync(path.join(dest, file), svg);
    console.log(`${file} ${svg.length} bytes`);
  }
}
