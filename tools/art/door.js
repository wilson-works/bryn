'use strict';

/*
 * tools/art/door.js: art.svg, Bryn in her office door (the fleet office shows it beside Kody and Louise), and mark.svg,
 * her sign. The door figure uses the same box, proportions and wave as Kody's and Louise's door figures.
 */

const K = require('./kit');
const P = require('./people');
const R = require('./props');

const { C } = K;

function door() {
  K.reset('bryn-door');
  const p = 'bryn-door';
  const look = P.BRYN;
  const elbow = [152, 138];
  const fig = P.front(look, {
    armL: [[76, 128], [66, 146], [64, 160]],
    armR: [[124, 128], elbow],
    handR: { hide: true },
    held: { L: R.pole([63, 122], [58, 206]) },
    handL: { fist: true },
    mouth: 'open',
  });
  const wave = K.limb([elbow, [166, 112]], look.top.shade, look.top.base, 13.5)
    + `<path d="M163.6 116L166 112" stroke="${C.redShade}" stroke-width="14" stroke-linecap="butt"/>`
    + K.mitt([170, 102], 20, look.skin.lit, look.skin.shade, { scale: 1.15 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" id="${p}" class="${p}" role="img" aria-labelledby="${p}-title">
<title id="${p}-title">Bryn the Trail Guide waving hello in her red trail shell and felt hat, her walking pole in her other hand</title>
<!--
  ${p}: Bryn as a collectible vinyl-toy figure on the WilsonWorks character model (Kody's and Louise's door figures), standing
  square to you. Transparent background, a soft shadow under her boots. Drawn by tools/art/door.js; edit that file.
  The head (x 48 to 152, y 22 to 118) is bigger than the small body. Felt hat with a moss band, chestnut fringe and a braid
  over her shoulder with an ochre tie, freckles, big cartoon eyes with catch-lights, an open smile. Red trail shell, sage
  trousers, brown boots. One hand holds her pole; the other waves.
  Motion: .${p}-wave turns the raised forearm about the elbow (2.4 s). Only with prefers-reduced-motion: no-preference;
  the still pose is the wave.
-->
<style>@media (prefers-reduced-motion: no-preference){#${p} .${p}-wave{transform-box:view-box;transform-origin:152px 138px;animation:${p}-wave 2.4s ease-in-out infinite}
@keyframes ${p}-wave{0%,100%{transform:rotate(0deg)}20%{transform:rotate(-10deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-9deg)}80%{transform:rotate(3deg)}}}</style>
${fig}
<g class="${p}-wave">${wave}</g>
</svg>
`;
}

/** Her sign: a round trail badge, a hill with her red dashed trail climbing it and three cream stones. */
function mark() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" aria-labelledby="bryn-mark-title">
<title id="bryn-mark-title">Bryn</title>
<circle cx="24" cy="24" r="23.5" fill="${C.ink}"/><circle cx="24" cy="24" r="20.6" fill="none" stroke="${C.red}" stroke-width="2.2"/>
<circle cx="24" cy="24" r="19.2" fill="${C.sky2}"/>
<path d="M5 34C10 22 16 15 24 15C32 15 38 22 43 34V36H5Z" fill="${C.h2s}"/><path d="M5 34C10 22 16 15 24 15C28 15 31 17 33 19C27 19 18 24 12 36H5Z" fill="${C.h2}"/>
<path d="M5 33H43V40Q24 46 5 40Z" fill="${C.g2}"/>
<path d="M12 39C18 35 20 30 24 26C27 23 30 21 33 19" fill="none" stroke="${C.red}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="3 3"/>
<g fill="${C.cream}" stroke="${C.ink}" stroke-width=".7"><ellipse cx="15" cy="37" rx="2.6" ry="1.7"/><ellipse cx="22" cy="29.5" rx="2.4" ry="1.6"/><ellipse cx="29" cy="22.5" rx="2.2" ry="1.4"/></g>
</svg>
`;
}

module.exports = { door, mark };
