# Bryn's art: needlepoint, stitched on aida

This note is the standard every scene, the door figure and the mark are held to. The owner's word (2026-10-22):
"a more stitch art style (like needlepoint art) ... make her scouts less creepy and clean up her animations." A new look
means a new art style, not new clothes, so the contour-map drawings are gone: everything is now thread on cloth.
The test for any picture is one question: **could you count the stitches?** Every colour is a patch of whole X stitches
on an even grid, and nothing is drawn between the cells.

## 1. How a picture is made

- **The cloth.** Aida: a cream ground with a faint woven grid and a hole at every cell corner. Cells are 5 by 5 units,
  so a 640 by 360 scene is 128 by 72 cells. The door figure (`art.svg`) uses 4-unit cells, the mark (`mark.svg`) 3-unit.
- **The stitch.** Each colour area is a path of rectangles (whole cells) filled with a pattern: a wash of the thread
  colour, a darker under stitch and a lighter top stitch crossing it. That is the whole trick; there is no other
  texture. Every number in a stitched path is a multiple of the cell, and `tests/vignettes.test.js` checks that.
- **The thread box.** About 70 colours, all from Bryn's palette and its tints (table below). No black anywhere: outlines
  are a warm brown (`line` `#6E5A40`, `ink` `#4A3A2A` for eyes only).
- **A frame of stitched sampler border** runs round every scene: trail red outside, sand and ochre stitches inside.
  The top right corner (about 28 by 12 cells) stays empty because the page's Pause button covers it.
- **The source is code.** `tools/stitch/` draws every picture from joints, shapes and a few text sprites, and
  `node tools/stitch/build.js` writes `art/*.svg`, `art.svg` and `mark.svg`. The SVGs are what the page serves; edit the
  drawing code, then rebuild. `node tools/stitch/css.js --write` rewrites the motion block in `dashboard/public/app.css`
  from the table of frames in `tools/stitch/css.js`.

## 2. The thread box

| Use | Threads |
|---|---|
| Her shell, the trail, the signpost's red board (one red) | `red` `#C8432F`, `redD` `#9E3221`, `redDD` `#76241A`, `redL` `#E0705A` |
| Hat felt, boots, signpost wood | `felt` `#6B5236`, `feltL` `#8A6A45`, `band` `#5E6B4E` |
| Skin, cheek | `skin` `#E2AD84`, `skinD` `#C98F68`, `blush` `#E58C78` |
| Hair (chestnut braid) | `hair` `#8A5230`, `hairD` `#6A3E22` |
| Trousers (sage) | `sage` `#B3B48C`, `sageD` `#939469` |
| Land, low to high | `g1` `#E4E8CE`, `g2` `#D5DBB6`, `g3` `#C4CC9C`, `g4` `#AFB985`, then `t1` `#E8DAB9`, `t2` `#E2CFA8` |
| Water | `w1` `#A9C7D8`, `w2` `#7FA7BF`, `w3` `#4F8FB8`, `w4` `#6C98B0` |
| Stone | `s1` `#D8D4C8` to `s4` `#7E7A6E` |
| Fire | `ochre` `#E0A643`, `flame` `#F1DDA6`, and the red |
| The five scouts | plum `#6B5B95`, ochre `#E0A643`, glacier `#4F8FB8`, sand `#D9C49A`, moss `#5F7F4A`, each with a dark and a light |
| The anonymous review | grey-blue `#8296A8` with a dark and a light |

## 3. Bryn

- **Drawn as poses.** Her trunk is set by a hip and a shoulder; her arms and legs are two-bone limbs solved from
  shoulder to hand and hip to foot, so an elbow bends like an elbow and a knee like a knee. A pose is never a shape
  turned about its centre: a new pose is a new drawing.
- **Her outline** is one cell of warm brown. Her shell has a darker hem and a darker rim round each sleeve; the hat has a
  moss band; the braid hangs from the nape with an ochre tie.
- **Props she holds show their back.** The notebook she writes in is its leather cover; sheets the scouts read are the
  blank back of the paper; the Expansionist's wide map is its back. Nothing is held with its printed side toward us.
- **Grounded.** She stands, sits or kneels on something, with a soft contact shadow of a darker tone of the ground.
- Her face: a kind, calm one. Two dark eyes, a blush, a small smile.

## 4. The scouts (friendly, not creepy)

The owner (2026-10-22): "make her scouts less creepy". The old scouts were hooded figures with no faces, staring from the
dark. The new ones are soft and round and a little shorter than Bryn, so they never loom.

- **A round face in full light** with big eyes (2 by 2 cells of ink with a white catch-light in one corner), rosy cheeks
  and a small red smile. Nothing is shadowed and nothing stares from a hood.
- **A knit cap with a pom-pom** in the scout's own colour, a cream scarf and a coat in the same colour. No red, no
  brim hat, no braid, so none of them is ever mistaken for Bryn.
- One thing tells the roles apart: the Contrarian turns back down the trail; the First Principles Thinker kneels at
  bedrock with a rock hammer; the Expansionist holds a map wider than their shoulders; the Outsider has a straw sun hat
  on their back; the Executor has the pack on.
- In the anonymous review all five wear the same grey-blue and each holds up a sheet, back toward us.
- They blink now and then, never together.

## 5. One valley

Every scene is the same valley: three far hills of nested tones (outer, middle, top), a land of four bands with rolling
edges, the compass top left, a sampler border. Trail: dashed red, stitched thicker the nearer it is, with cream waypoint
stones. Signpost, stream and clouds are supporting cast. Wherever stones are laid they go in a line along the red trail.

| Scene | What you see |
|---|---|
| `idle.svg` (the rock) | Bryn on her boulder with a tin cup. Rest, a breath, a sip; steam; grass; far birds; a small bird on the signpost |
| `idle-trail.svg` | Bryn walking with her pole; the stitched ground passes under her, a cell of ground for every frame of her walk |
| `idle-kayak.svg` | Bryn paddling: catch, pull, level, then the other side; water passing; a heron on the bank; a fish that jumps once |
| `framing.svg` | At the signpost, writing the question in her notebook |
| `brainstorm.svg` | Kneeling at a flat rock, sketching three routes on a map |
| `council.svg` | Five scouts on five roads from the fork, Bryn at the fork with her pole |
| `review.svg` | The five in matching grey-blue, each with a sheet |
| `verdict.svg` | The six round a campfire at dusk, the signpost's red board pointing up her trail |
| `waiting.svg` | Leaning on her pole beside the signpost, its red board up |
| `premortem.svg` | On the hilltop, hand over her eyes, a broken bridge and a warning sign across the river |
| `filing.svg` | Kneeling on the trail, laying a stone |
| `consulting.svg` | Stooped over the stones, lifting one to check it |

`art.svg` is the standing greeting figure for the fleet office door (see section 8) and `mark.svg` is her sign: a hilltop,
a red dashed trail climbing it, three cream stones, on the same rounded plate as before.

## 6. Scene contract

`viewBox="0 0 640 360"`, a `<title>`, ids prefixed with the scene name, no `<style>`, `style=`, `<script>`, `<use>`,
`<image>`, `href` or `<text>`. Motion is by class only. A group that carries an `anim-*` class never carries a
`transform` attribute (the animation would replace it). The one exception to "no transform" is a plain wrapper inside a
drifting group, which the animation never touches.

## 7. Motion: whole drawings, swapped in steps

The owner (2026-10-22): "clean up her animations". Before, figures were built from parts that rotated about a joint and
tiles that slid, and they could jitter and shear. Now:

- **A pose is a whole drawing (a frame).** A figure is a set of frames, `anim-<set>-a`, `-b`, `-c`..., and the page shows one
  at a time, swapping with `step-end` timing. Nothing turns about a centre, scales, skews or fades.
- **A drawing is held a beat (0.4 s) or longer**, so nothing flickers; the quickest thing on the page changes a frame
  2.5 times a second, far under three flashes a second (SC 2.3.1).
- **Frames are on the grid too.** A frame is drawn on the same cells as every other, so a changed pose moves a few
  whole cells, like moving to the next row of a chart.
- **The still is the first frame.** Every frame after the first starts at `opacity="0"` in the SVG itself, and things that
  only appear mid-motion (a spark, a leaping fish, a bird on the signpost) are hidden from the start. Reduced motion, a
  stylesheet that fails to load and the Pause button all leave a complete drawing.
- **The only things that travel** are the ground under a walker (three cells per step of her feet, 45 steps a loop, a
  tile drawn twice so there is no seam), the middle ground at a third of that, the water in the kayak scene (two cells
  a beat), and a far bird crossing the sky a cell a flap. The hills never move.
- **Never in step.** `phase-1` to `phase-5` give the five scouts and the two far birds different starts.
- **Walking.** Four frames: contact, passing, contact, passing. A planted foot and the planted end of her pole stay put
  on the ground because the ground moves exactly as far as they would. The free arm swings against the leg on its side.
- **Paddling.** Six frames at a beat each: the near blade catches ahead of her hip, the pull brings it to the hip with her
  leaning back, the paddle comes level, then the other side. A splash marks each catch.
- **The table of frames** (which drawing shows for which part of each loop) is `tools/stitch/css.js`; the generated block
  in `dashboard/public/app.css` is checked against it by the tests.

## 8. The door figure and the mark

- `art.svg`: Bryn standing and greeting you, front on, 120 by 150, with a transparent ground (only a small stitched
  patch of grass under her boots). One `<style>` holds the wave: three drawings (hand high, hand out at the shoulder,
  hand down) swapped in steps over 2.4 s, guarded by `prefers-reduced-motion: no-preference`. Without it, you see the raised
  hand. The fleet office door can reuse it as it is.
- `mark.svg`: 36 by 36, her sign, static.
