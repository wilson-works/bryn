# Bryn's art: the WilsonWorks vinyl-toy style

This note is the standard every scene, the door figure and the mark are held to. The owner's word (2026-11-06): "Make
Brynn match the rest of the wilson works character ... We are submitting the art style as the clear winner for our
branding and cohesion and her council being higher ranking trail park rangers." That replaced the needlepoint look of
2026-10-22. A new look means a new art style, not new clothes: every picture was redrawn from nothing on the model of
Kody (fleet office) and Louise (her own repo). The test for any picture is one question: **could it stand on a shelf
next to Kody and Louise?**

## 1. How a picture is made

- **The source is code.** `tools/art/` draws every picture; `node tools/art/build.js` writes `art/*.svg`, `art.svg` and
  `mark.svg` (`node tools/art/build.js <dir> council,door` builds only those, into a folder you name). The SVGs are what
  the page serves: edit the drawing code, then rebuild. `node tools/art/css.js --write` rewrites the motion block in
  `dashboard/public/app.css` from the table of frames in `tools/art/css.js`.
- **The files.** `kit.js` (palette, limbs, mitt hands, shadow, the vinyl "lump"), `people.js` (Bryn and the rangers,
  front on and in profile), `props.js` (pole, notebook, cup, sheet, map, hammer, stones, signpost, paddle), `valley.js`
  (sky, hills, meadow, pines, trail, stream, and the `frames` and `at` helpers), `scenes-idle.js`, `scenes-trail.js`,
  `scenes-council.js`, `door.js`, `build.js`, `css.js`.
- **The vinyl recipe** (Kody's and Louise's):
  - Flat fills, one shadow shape per part, the light from the upper left: a part is its shade colour with the lit
    colour drawn over it, nudged up and left (`kit.lump`, `kit.limb`).
  - Soft white highlight bands and glossy dots on the hat, the boots, the stones.
  - A soft contact shadow (`#2A1D14` at about .2) under every figure and prop that stands on the ground.
  - No ink outlines inside a figure. Only the head and the eyes carry a soft edge (`#2A1D14`, width 1.4 to 1.6, at .35),
    and closed eyes are a 2.6 arch. No black anywhere, no patterns, no blurs.
- **The valley is a soft diorama** in the same recipe: a sky that warms toward the hills, three far hills with a lit rim,
  rolling meadow bands, round pines with a shaded side, puffy clouds with a shaded underside. Clouds, hills and pines are
  scenery; only the figures are toys.

## 2. The palette

| Use | Colours |
|---|---|
| Her shell, the trail blazes, the signpost's red board (one red) | `red` `#C8432F`, lit `#DA5A43`, shade `#9E3221`, deep `#76241A` |
| Hat felt, boots, signpost wood | `felt` `#6B5236`, lit `#8A6A45`, shade `#4E3B26`; hat band `#5E6B4E` |
| Her skin, cheeks, freckles | `#E2AD84`, lit `#EDC09B`, shade `#C98F68`; blush `#E58C78` at .4; freckles `#B9784F` |
| Her hair (chestnut braid, ochre tie) | `#8A5230`, lit `#A7683F`, shade `#6A3E22`; tie `#E0A643` |
| Her trousers | sage `#9FA27A`, shade `#7F8260` |
| Eyes | white `#FFFDF7`, iris `#5E4228` with a lower crescent `#8A6440`, pupil `#1E130C`, two white catch-lights |
| Ranger uniform | shirt tan `#CDB98A` (lit `#DCCB9F`, shade `#A8936A`), trousers forest `#4E6646`, campaign hat `#B08A55`, boots `#4A3424` |
| Rank | gold `#D9A441`, lit `#EECB78`, shade `#A87B26` |
| The five rangers' own colours | plum `#6B5B95`, ochre `#E0A643`, glacier `#4F8FB8`, sand `#D9C49A`, moss `#5F7F4A` |
| The anonymous review | grey-blue `#8296A8`, lit `#97AABB`, shade `#677A8C` |
| Valley | sky `#CFE4EC` to `#F6EEDC` (dusk `#3E4E6E` to `#D99A6A`), hills, meadow, pines, stream and stones as in `kit.js` |

## 3. Bryn

- **Proportions** (the door box, 200 by 220, the same as Kody's and Louise's): the head is the house rounded square,
  x 48 to 152 and y 22 to 118, as big as the small body that runs to her boots at about y 203. The contact shadow is at
  y 207. Simple chunky shapes; no realistic anatomy, wrinkles or strand lines.
- **Her face:** big cartoon eyes (an eye white 25 by 27, the iris r 9.5, two catch-lights, a relaxed skin lid over the
  top), freckles across both cheeks, a blush, a small nose, a kind smile or an open grin.
- **What makes her Bryn:** the dark felt hat with a wide brim, a moss band and a pinched crown; her chestnut hair with a
  side-swept fringe and the braid (over her shoulder front on, down her back in profile) with an ochre tie; the red trail
  shell with a stand-up collar, an ochre zip pull, a chest pocket and a darker hem; sage trousers; brown boots. Her pole
  has an ochre grip. In profile on the trail she carries an olive daypack.
- **Poses are joints.** Each arm is shoulder, elbow, hand and each leg hip, knee, foot (`people.front` and `people.side`),
  so an elbow bends like an elbow. Hands are the house mitt: a palm, three fingers and a thumb, or a fist round what
  she holds. Kneeling in profile: the near knee down, the far knee up (`people.KNEEL`, placed by `valley.kneelAt`).
- **Props she holds show their back** (the owner, 2026-10-22): the notebook is its leather cover, the sheets the rangers
  read are the blank back, the Expansionist's map is its folded back. A map lying flat on a rock is fine.

## 4. Her council: five senior trail rangers

The owner (2026-11-06): her council are "higher ranking trail park rangers". They are older, friendly and plainly senior,
never creepy, and every one is an original character who looks like no real person.

- **Senior rank is the uniform:** the campaign hat (flat brim, peaked crown pinched in four) with a gold cord, gold bars on
  dark shoulder tabs, a gold shield on the chest, a gold name bar and buckle, an arrowhead patch on the sleeve in profile.
- **Older:** silver, white or salt-and-pepper hair under the hat; one has a silver moustache, two wear round glasses, two
  have short white or grey beards, one has a bob and one a bun. Skin tones vary. The same big kind eyes, cheeks and smile
  as Bryn: nothing is shadowed, nothing stares.
- **Their own colour** is the neckerchief at the collar and the bead on the hat cord, so they never look alike and none is
  mistaken for Bryn (no red shell, no felt hat, no braid).
- **Roles in the council scene:** the Contrarian (plum) turns back toward the fork with a thumb over the shoulder; the
  First Principles Thinker (ochre) kneels at bedrock with a rock hammer; the Expansionist (glacier) holds a map wider than
  their shoulders; the Outsider (sand) waves back from up the road with binoculars on their chest; the Executor (moss)
  strides off with the pack on.
- **In the anonymous review** all five wear the same grey-blue from hat to boots, with no gold and no colour of their own,
  and each holds up a sheet, its back toward us.

## 5. One valley

| Scene | What you see |
|---|---|
| `idle.svg` (the rock) | Bryn on her boulder with a tin cup: rest, a contented breath, a sip; steam; swaying grass; far birds; a songbird on the signpost now and then |
| `idle-trail.svg` | Bryn walking in profile with her pole and daypack; the trail, stones and flowers pass under her, the bushes and a grazing deer behind at a third of the speed |
| `idle-kayak.svg` | Bryn paddling her wooden kayak: catch, pull, level, then the other side, a splash at each catch; the water passing; a heron fishing; a fish that jumps once |
| `framing.svg` | At the signpost, writing the question in her notebook |
| `brainstorm.svg` | Kneeling at a flat rock, sketching three routes on a map |
| `council.svg` | The five rangers on five roads from the fork, each road blazed in its ranger's colour; Bryn at the fork with her pole |
| `review.svg` | The five in matching grey-blue, each with a sheet |
| `verdict.svg` | Round a campfire at dusk on two logs, the five turned to the fire; Bryn gives the call, pointing to the signpost's red board |
| `waiting.svg` | Leaning on her pole beside the signpost, its red board up the trail |
| `premortem.svg` | On the hilltop, a hand over her eyes, a broken bridge and a warning sign across the river |
| `filing.svg` | Kneeling on the trail, laying a stone |
| `consulting.svg` | Crouched by the stones, lifting one to check it |

The top right corner (x 500 to 640, y 0 to 64) stays clear: the page's Pause button covers it.

## 6. Scene contract

`viewBox="0 0 640 360"`, a `<title>`, every id prefixed with the scene name (`kit.reset`), no `<style>`, `style=`,
`<script>`, `<use>`, `<image>`, `href` or `<text>`. Motion is by class only. A group that carries an `anim-*` class never
carries a `transform` attribute (the animation would replace it): `valley.at` puts the transform on a plain wrapper
inside the frame group.

## 7. Motion: whole drawings, swapped in steps

The owner (2026-10-22): "clean up her animations". The vinyl figures keep that rule:

- **A pose is a whole drawing (a frame).** A figure is a set of frames, `anim-<set>-a`, `-b`, `-c`..., and the page shows
  one at a time, swapping with `step-end` timing. Nothing in a scene turns about a joint, scales, skews or fades.
- **A drawing is held a beat (0.4 s) or longer**, so nothing flickers (SC 2.3.1).
- **The still is the first frame.** Every frame after the first starts at `opacity="0"` in the SVG, and things that only
  appear mid-motion (sparks, the leaping fish, the songbird) are hidden from the start. Reduced motion, a stylesheet that
  fails to load and the Pause button all leave a complete drawing.
- **Life:** standing figures rest, smile and blink (`calm`); the rangers at the fire grin and blink (`lean`). The figure is drawn once and the grin and the blink are small drawings over its face (`valley.calm`).
- **The only things that travel** are the ground under her walk (15 px a step, 45 steps a loop, each tile drawn twice so
  there is no seam), the middle ground at a third of that, the water (10 px a beat) and a far bird. The hills never move.
- **Never in step.** `phase-1` to `phase-5` give the five rangers and the far birds different starts.
- **The table of frames** (which drawing shows for which part of each loop) is `tools/art/css.js`; the generated block
  in `dashboard/public/app.css` is checked against it by the tests.

## 8. The door figure and the mark

- `art.svg`: Bryn standing and waving, front on, in the 200 by 220 door box Kody and Louise use, on a transparent ground
  with a soft shadow. Her pole is in her other hand. One `<style>` holds the wave (the forearm turns about the elbow,
  2.4 s, the same keyframes as Kody's), guarded by `prefers-reduced-motion: no-preference`; without it you see her
  mid-wave. The fleet office door can use it as it is.
- `mark.svg`: 48 by 48 (Louise's mark box), a round trail badge: dark rim, red ring, a hill with her red dashed trail
  climbing it and three cream stones. Static. Holds at 16 px.
