'use strict';

/*
 * tools/art/people.js: Bryn and her council of senior trail rangers as vinyl-toy figures on the Kody and Louise model.
 *
 * Every figure is drawn in the door figure's own box (the head x 48 to 152, y 22 to 118, bigger than the small body
 * that runs to the boots at about y 203, the contact shadow at y 207), front on (front) or in profile facing right
 * (side; mirror it with kit.place to face left). A scene places a figure with a transform on a plain wrapper.
 *
 * A pose is a set of joints: each arm is [shoulder, elbow, hand] and each leg [hip, knee, foot], so an elbow bends like
 * an elbow and a knee like a knee. What a hand holds goes in o.held.L / o.held.R (drawn between the sleeve and the mitt,
 * so the mitt closes over it), o.back (behind the figure) or o.front (over everything).
 */

const K = require('./kit');
const { C, ROLE, n, uid, limb, handAt, shadow, gloss } = K;

const HEAD = 'M82 22H118A34 34 0 0 1 152 56V88A30 30 0 0 1 122 118H78A30 30 0 0 1 48 88V56A34 34 0 0 1 82 22Z';

/* ------------------------------------------------------------------ who wears what */

const tone = (base, lit, shade) => ({ base, lit, shade });

/** Bryn: red shell, felt hat with a moss band, chestnut braid with an ochre tie, sage trousers, brown boots, freckles. */
const BRYN = {
  name: 'bryn', skin: tone(C.skin, C.skinLit, C.skinShade), hair: tone(C.hair, C.hairLit, C.hairShade), braid: true,
  freckles: true, hat: 'felt', top: tone(C.red, C.redLit, C.redShade), kind: 'shell',
  legs: tone(C.sage, C.sageLit, C.sageShade), boots: tone(C.felt, C.feltLit, C.feltShade), iris: [C.iris, C.irisLit],
};

/** The council: five senior trail rangers, older, ranked by the gold on their hats, shoulders and chests. */
function ranger(role, look) {
  const [rc, rcs] = ROLE[role];
  return Object.assign({
    name: role, role: [rc, rcs], hat: 'campaign', kind: 'uniform', top: tone(C.tan, C.tanLit, C.tanShade),
    legs: tone(C.forest, C.forest, C.forestShade), boots: tone(C.boot, C.bootLit, '#33241A'), iris: [C.iris, C.irisLit],
  }, look);
}
const silver = tone('#D8D4CC', '#ECE9E2', '#B4AEA4');
const RANGERS = {
  // the Contrarian: silver hair, a full silver moustache, light skin
  plum: ranger('plum', { skin: tone('#EDC3A4', '#F5D2B8', '#D3A182'), hair: silver, moustache: '#CFCAC0' }),
  // the First Principles Thinker: round glasses, deep brown skin, a white beard trimmed close
  ochre: ranger('ochre', { skin: tone('#8C5A3C', '#A06C4A', '#704530'), hair: tone('#E6E2DA', '#F4F1EB', '#C2BCB0'), glasses: true, beard: '#E6E2DA' }),
  // the Expansionist: steel-grey bob, warm medium skin
  glacier: ranger('glacier', { skin: tone('#D9A27A', '#E6B48E', '#BC855E'), hair: tone('#9A9893', '#B2B0AA', '#7C7A75'), bob: true }),
  // the Outsider: white hair in a low bun, tan skin, glasses on a cord
  sand: ranger('sand', { skin: tone('#C88E64', '#D8A078', '#AA7350'), hair: tone('#EFECE6', '#FFFFFF', '#CBC6BC'), bun: true, glasses: true }),
  // the Executor: salt-and-pepper hair and a short grey beard, ruddy fair skin
  moss: ranger('moss', { skin: tone('#E7B394', '#F1C4A8', '#CC9576'), hair: tone('#8E8A84', '#A8A49E', '#6E6A65'), beard: '#A8A49E' }),
};

/** Everyone in the anonymous review wears the same grey-blue, hat to boots, with no colour of their own. */
function anonymous(look) {
  const g = tone(C.grey, C.greyLit, C.greyShade);
  return Object.assign({}, look, { top: g, role: [C.greyShade, C.greyShade], hatTone: g, cord: C.greyShade, anon: true });
}

/* ------------------------------------------------------------------ the head */

function eye(cx, cy, look, o, skin) {
  const id = uid('eye');
  const [dx, dy] = o.glance || [0, 0];
  const rx = o.side ? 11 : 12.5;
  const ry = o.side ? 13 : 13.5;
  const lidY = cy - ry + (o.sleepy ? 9 : 5);
  return `<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.white}"/>`
    + `<g clip-path="url(#${id})"><g transform="translate(${n(cx + dx)} ${n(cy + 2.5 + dy)})"><circle r="9.5" fill="${look.iris[0]}"/>`
    + `<path d="M-7.8 5.4A9.5 9.5 0 0 0 7.8 5.4A25 25 0 0 1 -7.8 5.4Z" fill="${look.iris[1]}"/><circle r="5.2" fill="${C.pupil}"/>`
    + `<circle cx="-3.4" cy="-3.2" r="2.9" fill="#FFF"/><circle cx="3.1" cy="3" r="1.3" fill="#FFF"/></g>`
    + `<path d="M${cx - 15} ${cy - ry - 2}H${cx + 15}V${n(lidY)}Q${cx} ${n(lidY + 4.5)} ${cx - 15} ${n(lidY)}Z" fill="${skin.base}"/></g>`
    + `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ink}" stroke-width="1.4" opacity=".35"/>`;
}

/** Closed, happy eyes: a skin lid over each eye with an arch. A blink frame is this group alone, drawn over the eyes. */
function lids(look, side) {
  const s = look.skin;
  const eyes = side ? [[124, 80, 11, 13]] : [[78, 80, 12.5, 13.5], [122, 80, 12.5, 13.5]];
  return eyes.map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 1.2}" ry="${ry + 1.2}" fill="${s.base}"/>`
    + `<path d="M${cx - 9} ${cy + 2}Q${cx} ${cy - 7} ${cx + 9} ${cy + 2}" fill="none" stroke="${C.ink}" stroke-width="2.6" stroke-linecap="round"/>`).join('');
}

function mouth(kind, x, y) {
  if (kind === 'open') {
    return `<path d="M${x - 13} ${y - 3}Q${x} ${y + 15} ${x + 13} ${y - 3}Q${x} ${y}  ${x - 13} ${y - 3}Z" fill="${C.mouth}"/>`
      + `<path d="M${x - 6} ${y + 4}Q${x} ${y + 1} ${x + 6} ${y + 4}Q${x} ${y + 7} ${x - 6} ${y + 4}Z" fill="${C.tongue}"/>`
      + `<path d="M${x - 10.5} ${y - 2}Q${x} ${y + 1} ${x + 10.5} ${y - 2}Q${x + 9.5} ${y + 2} ${x} ${y + 2.6}Q${x - 9.5} ${y + 2} ${x - 10.5} ${y - 2}Z" fill="#FFF"/>`;
  }
  if (kind === 'o') return `<ellipse cx="${x}" cy="${y + 1}" rx="4.6" ry="4" fill="${C.mouth}"/>`;
  if (kind === 'sip') return `<path d="M${x - 4} ${y}H${x + 4}" stroke="${C.mouth}" stroke-width="2.4" stroke-linecap="round"/>`;
  const w = kind === 'small' ? 6 : 9.5;
  return `<path d="M${x - w} ${y - 1.5}Q${x} ${y + 6.5} ${x + w} ${y - 1.5}" fill="none" stroke="${C.mouth}" stroke-width="2.4" stroke-linecap="round"/>`;
}

/** The hair that shows below the hat: Bryn's chestnut fringe, or a ranger's silver at the temples. Clipped to the head. */
function hairCap(look, side) {
  const h = look.hair;
  if (side) {
    // profile facing right: the hair covers the back of the head and a fringe the top of the brow
    const d = 'M36 6H150V44C140 40 128 44 118 42C108 46 100 52 92 56C90 70 92 88 96 104C88 116 70 120 36 120Z';
    return `<path d="${d}" fill="${h.shade}"/><path transform="translate(-2 -3)" d="${d}" fill="${h.base}"/>`
      + `<path d="M58 44C60 36 70 30 84 30" fill="none" stroke="#FFF" stroke-width="5" stroke-linecap="round" opacity=".25"/>`;
  }
  if (look.braid) {
    // Bryn: a soft side-swept fringe and the hair down the sides of her face
    const d = 'M36 6H164V92C160 98 152 98 150 92C150 76 148 62 140 54C132 60 116 56 108 48C100 58 82 62 66 54C58 62 52 78 52 92C48 98 40 98 36 92Z';
    return `<path d="${d}" fill="${h.shade}"/><path transform="translate(-2.5 -3)" d="${d}" fill="${h.base}"/>`
      + `<path d="M70 46C78 42 90 42 100 44" fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" opacity=".22"/>`;
  }
  // a ranger: short hair at the temples under the hat (a bob hangs lower)
  const low = look.bob ? 100 : 76;
  const d = `M36 6H164V${low}C158 ${low + 6} 152 ${low + 2} 150 ${low - 6}C150 66 150 56 146 50C120 46 80 46 54 50C50 56 50 66 50 ${low - 6}C48 ${low + 2} 42 ${low + 6} 36 ${low}Z`;
  return `<path d="${d}" fill="${h.shade}"/><path transform="translate(-2 -2.5)" d="${d}" fill="${h.base}"/>`;
}

function hat(look, side) {
  const t = look.hatTone || (look.hat === 'felt' ? { base: C.felt, lit: C.feltLit, shade: C.feltShade } : { base: C.hatTan, lit: C.hatTanLit, shade: C.hatTanShade });
  const band = look.hat === 'felt' ? C.band : (look.cord || C.gold);
  if (look.hat === 'felt') {
    const crown = side ? 'M66 38C66 18 74 5 100 5C124 5 134 18 134 38Z' : 'M66 36C66 16 74 4 100 4C126 4 134 16 134 36Z';
    return `<ellipse cx="100" cy="${side ? 39 : 37}" rx="${side ? 72 : 74}" ry="${side ? 9 : 14}" fill="${t.shade}"/>`
      + `<ellipse cx="99" cy="${side ? 37 : 35}" rx="${side ? 70 : 72}" ry="${side ? 7.5 : 12.5}" fill="${t.base}"/>`
      + `<path d="${crown}" fill="${t.base}"/><path d="M110 6C126 8 134 18 134 ${side ? 38 : 36}H116C118 26 116 14 110 6Z" fill="${t.shade}"/>`
      + `<path d="M66.5 ${side ? 28 : 26}H133.5V${side ? 36 : 34}H66.5Z" fill="${band}"/><path d="M66.5 ${side ? 28 : 26}H133.5V${side ? 30 : 28}H66.5Z" fill="${C.bandLit}"/>`
      + `<path d="M${side ? 104 : 100} 6Q${side ? 102 : 100} 12 ${side ? 104 : 100} 16" fill="none" stroke="${t.shade}" stroke-width="3" stroke-linecap="round"/>`
      + `<path d="M74 22C74 14 80 9 90 8" fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" opacity=".22"/>`
      + (side ? '' : `<path d="M44 40Q100 54 156 40" fill="none" stroke="${t.lit}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`);
  }
  // the campaign hat: a flat brim and a peaked crown pinched in four, the senior's gold cord round it
  const crown = 'M70 36C70 22 80 11 90 7L100 1L110 7C120 11 130 22 130 36Z';
  return `<ellipse cx="100" cy="${side ? 38 : 37}" rx="78" ry="${side ? 7 : 11}" fill="${t.shade}"/>`
    + `<ellipse cx="99" cy="${side ? 36.5 : 35}" rx="76" ry="${side ? 6 : 9.5}" fill="${t.base}"/>`
    + `<path d="${crown}" fill="${t.base}"/><path d="M106 6L110 7C120 11 130 22 130 36H114C116 24 112 14 106 6Z" fill="${t.shade}"/>`
    + `<path d="M100 2L92 22M100 2L108 22" fill="none" stroke="${t.shade}" stroke-width="2.4" stroke-linecap="round"/>`
    + `<path d="M70.5 29H129.5V35H70.5Z" fill="${band}"/>`
    + (look.anon ? '' : `<path d="M70.5 29H129.5V30.6H70.5Z" fill="${C.goldLit}"/><circle cx="${side ? 74 : 126}" cy="36" r="3" fill="${C.gold}"/><circle cx="${side ? 74 : 126}" cy="36" r="1.6" fill="${look.role[0]}"/>`)
    + `<path d="M78 24C80 16 86 11 93 9" fill="none" stroke="#FFF" stroke-width="3.4" stroke-linecap="round" opacity=".25"/>`
    + (side ? '' : `<path d="M40 40Q100 50 160 40" fill="none" stroke="${t.lit}" stroke-width="2" stroke-linecap="round" opacity=".8"/>`);
}

/** The whole head. o: { side, glance:[dx,dy], mouth, sleepy, closed }. */
function head(look, o = {}) {
  const s = look.skin;
  const hc = uid('hc');
  const sk = uid('sk');
  const side = !!o.side;
  const out = [];
  out.push(`<clipPath id="${hc}"><path d="${HEAD}"/></clipPath>`);
  out.push(`<radialGradient id="${sk}" cx="${side ? '.55' : '.38'}" cy=".42" r=".75"><stop offset="0" stop-color="${s.lit}"/><stop offset="1" stop-color="${s.base}"/></radialGradient>`);
  // Bryn's hair falls behind her face to the jaw; a ranger's bun sits at the back
  if (look.braid && !side) out.push(`<path d="M46 50Q38 96 50 116Q100 130 150 116Q162 96 154 50Z" fill="${look.hair.shade}"/>`);
  if (look.bun && side) out.push(`<circle cx="44" cy="96" r="13" fill="${look.hair.shade}"/><circle cx="42" cy="94" r="11" fill="${look.hair.base}"/>`);
  out.push(`<path d="${HEAD}" fill="${s.shade}"/><g clip-path="url(#${hc})"><path transform="translate(${side ? 2 : -3} -3.5)" d="${HEAD}" fill="url(#${sk})"/></g>`);
  if (side) out.push(`<ellipse cx="86" cy="86" rx="7" ry="9" fill="${s.shade}"/><ellipse cx="85" cy="85" rx="4" ry="5.6" fill="${s.base}"/>`);
  const cheeks = side ? [[126, 99]] : [[64, 97], [136, 97]];
  out.push(`<g fill="${C.blush}" opacity=".4">${cheeks.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="4.4"/>`).join('')}</g>`);
  if (look.freckles) out.push(`<g fill="${C.freckle}" opacity=".55">${cheeks.map(([x, y]) => `<circle cx="${x - 4}" cy="${y - 4}" r="1.2"/><circle cx="${x + 1}" cy="${y - 5.5}" r="1.1"/><circle cx="${x + 5}" cy="${y - 3.5}" r="1.2"/>`).join('')}</g>`);
  if (look.beard) {
    const d = side ? 'M152 96C146 112 132 120 110 120C100 120 94 114 92 106L96 130H160V96Z' : 'M40 88C46 92 50 100 56 106C64 114 80 116 100 116C120 116 136 114 144 106C150 100 154 92 160 88V130H40Z';
    out.push(`<g clip-path="url(#${hc})"><path d="${d}" fill="${look.beard}"/></g>`);
  }
  const mx = side ? 138 : 100;
  out.push(mouth(o.mouth || 'smile', mx, 106));
  if (look.moustache) out.push(side ? `<path d="M128 100Q138 94 148 99Q140 103 128 100Z" fill="${look.moustache}"/>` : `<path d="M82 101Q91 92 100 97Q109 92 118 101Q109 99 100 101Q91 99 82 101Z" fill="${look.moustache}"/>`);
  out.push(side ? `<ellipse cx="152" cy="92" rx="5.6" ry="5" fill="${s.shade}"/><ellipse cx="151" cy="91" rx="3.8" ry="3.4" fill="${s.base}"/>`
    : `<ellipse cx="100" cy="93" rx="3.6" ry="2.6" fill="${s.shade}"/><ellipse cx="98.8" cy="92" rx="1.4" ry=".9" fill="#FFF" opacity=".4"/>`);
  if (o.closed) out.push(lids(look, side));
  else out.push(side ? eye(124, 80, look, { side: true, glance: o.glance, sleepy: o.sleepy }, s) : eye(78, 80, look, o, s) + eye(122, 80, look, o, s));
  out.push(`<g fill="none" stroke="${look.hair.shade}" stroke-width="5" stroke-linecap="round">${side ? '<path d="M112 60Q124 55 135 59"/>' : '<path d="M66 59Q77 54 89 58"/><path d="M111 58Q123 54 134 59"/>'}</g>`);
  if (look.glasses) {
    const g = '#6B4A2E';
    out.push(side ? `<g fill="none" stroke="${g}" stroke-width="3"><circle cx="124" cy="81" r="14"/><path d="M110 78L88 76"/></g>`
      : `<g fill="none" stroke="${g}" stroke-width="3"><circle cx="78" cy="81" r="15"/><circle cx="122" cy="81" r="15"/><path d="M93 79Q100 75 107 79M63 77H50M137 77H150"/></g>`
        + `<g fill="#FFF" opacity=".3"><path d="M68 76L78 67H83L68 82Z"/><path d="M112 76L122 67H127L112 82Z"/></g>`);
  }
  out.push(`<g clip-path="url(#${hc})">${hairCap(look, side)}</g>`);
  out.push(`<path d="${HEAD}" fill="none" stroke="${C.ink}" stroke-width="1.6" opacity=".35"/>`);
  out.push(hat(look, side));
  return out.join('');
}

/* ------------------------------------------------------------------ the body */

function boot(look, f, side) {
  const b = look.boots;
  const x = side ? f[0] + 4 : f[0];
  return `<ellipse cx="${n(x)}" cy="${n(f[1] + 4)}" rx="${side ? 13 : 11.5}" ry="6.5" fill="${b.shade}"/>`
    + `<ellipse cx="${n(x - 0.8)}" cy="${n(f[1] + 2.8)}" rx="${side ? 12 : 10.5}" ry="5.2" fill="${b.base}"/>`
    + gloss(x - (side ? -4 : 4), f[1] + 1.5, 3, 1.5, 0.45);
}

function torso(look, side) {
  const t = look.top;
  const out = [];
  if (side) {
    out.push(`<path d="M84 114H118C126 114 130 120 130 128L132 162Q132 170 124 170H82Q74 170 74 162L76 128C76 120 78 114 84 114Z" fill="${t.base}"/>`);
    out.push(`<path d="M80 122C77 132 77 148 76 164Q76 168 80 168H86Q84 146 86 120Z" fill="${t.lit}"/>`);
    out.push(`<path d="M120 116Q130 120 130 130L132 162Q132 170 124 170H116Q122 146 120 116Z" fill="${t.shade}"/>`);
    if (look.kind === 'shell') out.push(`<path d="M125 120V166" stroke="${C.redDeep}" stroke-width="1.6"/><path d="M104 113Q118 108 128 118L124 122Q116 115 106 118Z" fill="${C.redShade}"/>`);
    else {
      out.push(`<path d="M112 114L124 116L120 128Z" fill="${look.role[0]}"/><path d="M116 124L122 140L114 136Z" fill="${look.role[1]}"/>`);
      if (!look.anon) out.push(`<path d="M118 130L124 130L124 136Q121 139 118 136Z" fill="${C.gold}"/>${gloss(119.5, 131.5, 1, 0.8, 0.7)}`);
      out.push(`<path d="M74 156H132" stroke="${look.legs.shade}" stroke-width="5"/><rect x="100" y="153" width="7" height="6" rx="1.5" fill="${look.anon ? C.greyShade : C.gold}"/>`);
    }
    return out.join('');
  }
  out.push(`<path d="M80 114H120C127 114 130 119 130 126L133 162Q133 170 125 170H75Q67 170 67 162L70 126C70 119 73 114 80 114Z" fill="${t.base}"/>`);
  out.push(`<path d="M75 122C71 132 71 146 70 162Q70 168 76 168H80Q78 144 82 120Z" fill="${t.lit}"/>`);
  out.push(`<path d="M118 116Q130 118 130 128L133 162Q133 170 125 170H114Q120 146 118 116Z" fill="${t.shade}"/>`);
  if (look.kind === 'shell') {
    // the trail shell: a stand-up collar, the zip, a chest pocket, a darker hem
    out.push(`<path d="M86 112Q100 120 114 112L116 120Q100 128 84 120Z" fill="${C.redShade}"/>`);
    out.push(`<path d="M100 122V168" stroke="${C.redDeep}" stroke-width="1.8"/><rect x="97.6" y="122" width="4.8" height="6" rx="1.5" fill="${C.ochre}"/>`);
    out.push(`<path d="M106 132H120V136H106Z" fill="${C.redShade}"/><path d="M68 164H132L133 168Q132 170 125 170H75Q68 170 68 166Z" fill="${C.redShade}"/>`);
  } else {
    // the senior uniform: open collar and the neckerchief in their colour, two pockets, the gold shield, a belt
    const [rc, rcs] = look.role;
    out.push(`<path d="M86 114L100 128L114 114Z" fill="${look.skin.shade}"/>`);
    out.push(`<path d="M84 113L100 132L116 113L112 112L100 124L88 112Z" fill="${rc}"/><path d="M95 128L100 146L105 128Z" fill="${rcs}"/><circle cx="100" cy="129" r="4" fill="${rcs}"/>`);
    out.push(`<path d="M80 114L92 116L86 124Z" fill="${look.top.shade}"/><path d="M120 114L108 116L114 124Z" fill="${look.top.shade}"/>`);
    out.push(`<g fill="${look.top.shade}"><rect x="76" y="134" width="16" height="4" rx="1"/><rect x="108" y="134" width="16" height="4" rx="1"/></g>`);
    if (!look.anon) {
      out.push(`<path d="M110 124H122V130Q122 136 116 139Q110 136 110 130Z" fill="${C.goldShade}"/><path d="M109 123H121V129Q121 135 115 138Q109 135 109 129Z" fill="${C.gold}"/>`);
      out.push(`<circle cx="115" cy="129" r="2.2" fill="${C.goldLit}"/>${gloss(112, 125.5, 1.6, 1, 0.7)}`);
      out.push(`<rect x="78" y="128" width="12" height="3.4" rx="1" fill="${C.gold}"/>`);
    }
    out.push(`<path d="M67 156H133V161H67Z" fill="${look.legs.shade}"/><rect x="96" y="155" width="8" height="7" rx="1.5" fill="${look.anon ? C.greyShade : C.gold}"/>`);
  }
  return out.join('');
}

/** Rank on the shoulders: dark tabs with gold bars, front on (two) or in profile (the near one). */
function epaulettes(look, side) {
  if (look.kind !== 'uniform' || look.anon) return '';
  const tab = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-7" y="-3" width="14" height="6" rx="2" fill="${C.forestShade}"/><rect x="-4.5" y="-1.5" width="2" height="3" fill="${C.gold}"/><rect x="-1" y="-1.5" width="2" height="3" fill="${C.gold}"/><rect x="2.5" y="-1.5" width="2" height="3" fill="${C.gold}"/></g>`;
  return side ? tab(102, 119, 0) : tab(78, 119, 12) + tab(122, 119, -12);
}

/** Bryn's braid: front on it hangs over her left shoulder; in profile, down her back. Ochre tie at the end. */
function braid(look, side) {
  if (!look.braid) return '';
  const h = look.hair;
  const pts = side ? [[64, 112], [62, 124], [60, 136], [58, 148]] : [[140, 112], [142, 124], [143, 136], [143, 148]];
  const end = pts[pts.length - 1];
  return pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="7" fill="${h.shade}"/><ellipse cx="${x - 1}" cy="${y - 1}" rx="6" ry="5.4" fill="${h.base}"/>`).join('')
    + `<rect x="${end[0] - 5}" y="${end[1] + 5}" width="10" height="5" rx="2" fill="${C.ochre}"/>`
    + `<path d="M${end[0] - 5} ${end[1] + 10}Q${end[0]} ${end[1] + 22} ${end[0] + 5} ${end[1] + 10}Z" fill="${h.base}"/>`;
}

/** Her daypack, seen in profile: olive canvas on her back, a strap over the shoulder. */
const pack = () => `<rect x="54" y="116" width="28" height="44" rx="9" fill="${C.feltShade}"/><rect x="52" y="114" width="27" height="42" rx="9" fill="${C.band}"/>`
  + `<rect x="54" y="132" width="22" height="14" rx="4" fill="${C.bandLit}"/>`;

/* ------------------------------------------------------------------ the figure */

const FRONT = {
  armL: [[76, 128], [70, 148], [74, 164]], armR: [[124, 128], [130, 148], [126, 164]],
  legL: [[89, 166], [89, 184], [88, 197]], legR: [[111, 166], [111, 184], [112, 197]],
};
const SIDE = {
  armF: [[98, 126], [94, 146], [98, 162]], armN: [[104, 128], [104, 148], [110, 162]],
  legF: [[98, 164], [97, 182], [96, 197]], legN: [[104, 164], [105, 182], [106, 197]],
};

/** Bryn or a ranger front on. o: pose joints (armL, armR, legL, legR), held {L, R}, back, front, head options, hand options. */
function front(look, o = {}) {
  const p = Object.assign({}, FRONT, o);
  const held = o.held || {};
  const sleeve = (arm) => limb(arm, look.top.shade, look.top.base, 14);
  const out = [];
  if (!o.noShadow) out.push(shadow(100, 207, 48, 6));
  if (o.back) out.push(o.back);
  for (const leg of [p.legL, p.legR]) out.push(limb(leg, look.legs.shade, look.legs.base, 14));
  for (const leg of [p.legL, p.legR]) out.push(boot(look, leg[2], false));
  out.push(torso(look, false), epaulettes(look, false));
  out.push(head(look, o));
  out.push(braid(look, false));
  for (const [arm, k, h] of [[p.armL, 'L', o.handL], [p.armR, 'R', o.handR]]) {
    out.push(sleeve(arm));
    if (held[k]) out.push(held[k]);
    if (!(h && h.hide)) out.push(handAt(arm, look.skin.lit, look.skin.shade, Object.assign({ flip: k === 'R' }, h)));
  }
  if (o.front) out.push(o.front);
  return `<g>${out.join('')}</g>`;
}

/** Bryn or a ranger in profile, facing right. o: armF / armN (far and near arm), legF / legN, held {F, N}, pack. */
function side(look, o = {}) {
  const p = Object.assign({}, SIDE, o);
  const held = o.held || {};
  const t = look.top;
  const out = [];
  if (!o.noShadow) out.push(shadow(102, 207, 40, 5.5));
  if (o.back) out.push(o.back);
  // far side first, a shade darker
  if (!o.noLegs) out.push(limb(p.legF, look.legs.shade, look.legs.shade, 14), boot(look, p.legF[2], true));
  out.push(limb(p.armF, t.shade, t.shade, 13.5));
  if (held.F) out.push(held.F);
  out.push(handAt(p.armF, look.skin.base, look.skin.shade, o.handF));
  if (!o.noLegs) out.push(limb(p.legN, look.legs.shade, look.legs.base, 14), boot(look, p.legN[2], true));
  if (o.pack) out.push(pack());
  out.push(torso(look, true), epaulettes(look, true));
  out.push(braid(look, true));
  out.push(head(look, Object.assign({}, o, { side: true })));
  if (o.pack) out.push(`<path d="M86 116Q96 124 96 150" fill="none" stroke="${C.feltShade}" stroke-width="4" stroke-linecap="round"/>`);
  out.push(limb(p.armN, t.shade, t.base, 14));
  if (look.kind === 'uniform' && !look.anon) {
    const [s, e] = p.armN;
    out.push(`<g transform="translate(${n((s[0] + e[0]) / 2)} ${n((s[1] + e[1]) / 2 - 2)})"><path d="M-4 -5H4V2L0 6L-4 2Z" fill="${C.trunk}"/><path d="M-2.4 -3.4H2.4V1.4L0 4L-2.4 1.4Z" fill="${look.role[0]}"/></g>`);
  }
  if (held.N) out.push(held.N);
  out.push(handAt(p.armN, look.skin.lit, look.skin.shade, o.handN));
  if (o.front) out.push(o.front);
  return `<g>${out.join('')}</g>`;
}

/** Kneeling in profile: the near knee down, the far knee up. The figure sits 11 units lower (valley.kneelAt). */
const KNEEL = { legF: [[100, 162], [128, 168], [128, 186]], legN: [[104, 164], [110, 186], [82, 188]], noShadow: true };

/** A face change drawn over a figure in the same place: 'open' (a grin over the smile) or 'blink' (closed eyes). */
const face = (look, kind, sideView) => (kind === 'blink' ? lids(look, sideView) : mouth('open', sideView ? 138 : 100, 106));

module.exports = { BRYN, RANGERS, anonymous, front, side, face, KNEEL, HEAD };
