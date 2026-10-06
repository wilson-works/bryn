# Bryn's art: one drawing, not a figure pasted on a map

This note is the standard every scene, the door figure and the mark are held to. It applies to the Contour Map World
style. The test for any picture is a single question: **would a stranger say the guide and the land were drawn by the
same hand, on the same afternoon?**

## 1. One ink, one line

- **No black anywhere.** All line work is one warm brown hue. Its value darkens with nearness, the way pencil on a
  survey map does:
  - far ink `#8A7A5C` for distant contours, clouds, trees and the compass;
  - near ink `#6B5A41` for the near ground, the boulder, the signpost and Bryn's outer outline.
- **Weights stay in one family.** At scene scale, world contours run 1.0 to 1.2 px. Her outer outline runs 1.3 to 1.5 px,
  and her interior folds 0.8 to 0.9 px in far ink. No limb is a tube (a dark stroke under a light stroke). Every shape is
  a filled path with a single stroke.
- **Lines flow.** Her outline is long, curved strokes that taper into joins, not straight segments meeting at corners.

## 2. The figure speaks contour

- Her red shell carries two or three fold lines that run parallel to the body's curve, like contour lines on a slope.
- The hat brim carries one inner ring, the same way a hilltop carries its last contour.
- The boulder she sits on is a small hill: nested rings on its top face, tinted with the same elevation ramp as the hills.

## 3. A shared palette

| Use | Colour |
|---|---|
| Paper, grid | `#F3EEDF`, `#D8CFB8` |
| Elevation tints, low to high | `#E9EBD8` `#DFE3C9` `#D6D9BB` `#E8DAB9` `#E2CFA8` |
| Trail and her shell (the same red) | `#C8432F`; shell fold shadow `#A63A28` |
| Hat felt, boots, signpost wood | `#6B5236`; brim top `#7D6343`; band `#5E6B4E` |
| Skin, brow shadow, cheek | `#D49A72`, `#B97E5C`, `#C0705A` at 35% |
| Hair (chestnut braid) | `#8A5230` |
| Trousers (sage, from the tints) | `#B3B48C`; folds in far ink |
| Tin cup | `#C9CCC4` |
| Rope coil | `#D9C49A` |
| Map symbols (trees), stream | `#5E6B4E`, `#7FA7BF` |

Bryn's shell and the trail share one red, so the eye reads her as the trail's owner, not as a sticker.

## 4. The hat sits on her head

- The crown's base is as wide as her skull, never wider than her head plus a hair's breadth.
- The brim's centre line crosses her forehead about a third of the way down from the top of the head. No hair shows
  above the brim.
- Draw the brim in two halves: the back half before the head and hair, the front half after. The head is then inside
  the hat, not under it.
- A soft brow-shadow band (`#B97E5C`) sits under the front brim. The hat tilts with her head.
- The braid comes out from under the brim at the nape and falls over one shoulder or down her back.

## 5. Grounded, at rest

- She sits **on** a boulder that belongs to a hillside. Its base sinks behind a ground line with a few grass ticks, a
  soft contact shadow (near ink at about 12%) spreads under it, and a small shadow sits under her thigh where she
  meets the stone. It is never a disc or a slab.
- **Gesture:** one line of action, a gentle C from the hat through a relaxed, slightly rounded back to the hip. Elbows
  in, both hands round the cup at her chin, one knee up with the foot on a ledge of the rock, the other leg hanging
  easy. Shoulders soft, never square.
- Her pole leans against the boulder and the rope coil rests beside her: props set down, because she is resting.

## 6. Calm composition

- Sky gets the top 40% or so of the frame, with two dotted clouds, and nothing crowds it.
- No hill floats. Every far hill rises from a continuous land band. There is no paper under a hill.
- She sits in the left third, facing right, looking out over the hills. The trail enters at the bottom, curves past
  her boulder and climbs away into the central hill. It leads the eye from her to the distance and never cuts the
  picture in half.
- The signpost, the stream and the compass are supporting cast, small and to the right.

## 7. The scouts

The five advisors share Bryn's ink, line weights and cross-contour folds, and are never mistaken for her:

- Their hoods are up, round a face in soft shadow (`#5A4C3E`, a lit rim, a hint of chin) with no features.
- They wear no brim hat, no braid and no red.
- Each wears a longer anorak in its own colour, and one prop tells the roles apart: the Contrarian walks back down
  the trail, the First Principles Thinker kneels at bedrock with a rock hammer, the Expansionist holds a map wider
  than their shoulders, the Outsider has a straw sun hat on their back, and the Executor has the pack on.
- In the anonymous review all five wear the same grey-blue (`#8296A8`), and their props lie on the grass.

## 8. Every scene is the same valley

- Every scene uses the same three far hills rising out of the land.
- The compass sits top-left. The top-right corner (about 130 by 60) holds nothing important, because the page's
  "Pause the scene" button covers it.
- The signpost stands at the same fork in framing, verdict and waiting: before, during and after the call.
- Wherever stones appear, they are laid in a line along her red trail, never in a pile.

## 9. Scene contract (unchanged)

`viewBox="0 0 640 360"`, a `<title>`, ids prefixed with the scene name, no `<style>`, `style=`, `<script>`, `<use>`,
`<image>` or `href`. Motion is by class only. Each scene keeps exactly the `anim-*` hooks the page animates for it,
for example:
- `anim-breathe` on Bryn's whole figure, hat included, so the hat moves with her head;
- `anim-steam` on the cup's steam;
- `anim-cloud` on the clouds.

The page stops all motion for people who ask for reduced motion, and when the Pause button is pressed. The door figure (`art.svg`, 112 by 124) keeps its one `<style>`: the wave, guarded by
`prefers-reduced-motion: no-preference`.

Two more rules came with the living scenes (v4):
- Never put a `transform` attribute on an element that carries an `anim-*` class. The animation replaces it. Wrap the
  transformed drawing inside the class group instead.
- A part that turns about a joint (a thigh, a shin, an arm, a deer's neck, a paddle) is drawn as
  `translate(joint) > g.anim-j-NAME > translate(-joint) > the part`. Every `anim-j-*` class turns about its own origin,
  which is then the joint exactly. The thigh is drawn after the shin inside its joint, so its rounded foot covers the
  knee.

## 10. Alive, not busy (v4)

The owner asked for more life (2026-10-05): Bryn on her rock, walking the trail with deer, a moose and birds far off,
paddling down the stream, and round a campfire with the scouts for the call. The art direction above does not change.
The motion is held to these rules:

- **The drawing is the still.** Someone who asks for reduced motion sees every scene with no animation at all, so the
  drawn picture is complete on its own. Anything that appears only mid-motion (a spark, a leaping fish, a bird in
  flight) is drawn with `opacity="0"`.
- **One or two motions per figure, slow life around it.** Breathing, a walk, a paddle stroke, a lean toward the fire.
  Around them: grass that sways, birds wheeling far off, glints on the water, clouds.
- **Never in step.** Loops are long and offset. A `phase-1` to `phase-5` class on a figure carries a different start to
  its limbs, so two walkers or five scouts never move together.
- **Nothing flashes.** Every loop is at least 0.4 s. The fire's glow and flames ease in and out about once a second, far
  under three flashes a second (WCAG 2.3.1).
- **The land passes, the hills stay.** In the walk and the kayak, the near ground, the middle ground and the far
  animals drift at three speeds. Each drifting layer is drawn twice, 640 px apart, so the loop has no seam. The near
  layer moves at the speed of her feet. The three far hills never move.
- **Arms move like arms** (the owner, 2026-10-05: "arms are weird", "rowing action animation needs some work"). Every
  moving arm is two joints, shoulder and elbow, and its angles are solved from a model, not guessed:
  - A free arm swings against the legs: forward while the leg on its own side is back, the elbow softening as it
    comes forward. Never a straight plank.
  - Depth (the owner, 23:40: "left hand and arm still swinging on right side of body"). Facing right, her left arm
    is the far arm. It is painted after the far leg and before the near leg and the coat, in a darker, softer tone,
    so at most its hand peeks past the back of the coat on the back-swing. It never crosses her front. The same holds
    for every side-view figure: a far hand resting on a knee sits behind the near leg.
  - Her pole hand grips near the top of the pole at waist height with the elbow bent. The pole is planted beside the
    front foot, stays on the ground while she pushes past it, then swings forward for the next step.
  - Paddling, both hands hold the shaft about a shoulder apart. One blade catches the water ahead of her hip and pulls
    back to the hip while the other blade stands high above her hat; then the paddle turns through level and the
    other side does the same. She leans into each catch, the elbows bend, a splash marks each catch, and the kayak
    surges a little with every stroke. Every frame reads as paddling.
  - A hand that is not working rests on something (a knee, a thigh, a strap). It never floats palm-out. A reach never
    asks for more than the arm's length, so the arm is never pulled dead straight.
- **Pause and reduced motion stop everything.** The page's Pause button stops every scene motion and the vignette
  change. Reduced motion shows the rock and never changes it.

## 11. The idle vignettes

While nothing is on the table, the trailhead shows one of three scenes, a random one on load and a slow crossfade to
another every two and a half minutes:

| Scene | What you see | What moves |
|---|---|---|
| `idle.svg` (the rock) | The approved idle: Bryn on her boulder with her tin cup | Her breathing, the steam, a small bird that lands on the signpost and leaves, her glance up at it, grass, birds wheeling far off, glints on the stream |
| `idle-trail.svg` | Bryn walking her red trail | Her walk (thigh, shin, a step bob), her free arm swinging against her legs, her pole planted and swung forward, the ground passing, two deer grazing and a moose far off, birds |
| `idle-kayak.svg` | Bryn paddling her wooden kayak down the stream | Her stroke on both sides (catch ahead of the hip, pull to the hip, the other blade high), a splash at each catch, the kayak surging and rocking, the water and banks passing, a wake, a heron on the far bank, a fish that jumps once a loop |

## 12. Dusk and the campfire (the verdict)

The verdict is the five scouts and Bryn round a campfire at the fork at dusk, the signpost's red board pointing up her
trail. Dusk is the same palette under a warm wash of near ink (never black, never grey), with a warm band behind the
hills and a few stars. The figures and the fire sit above the wash, so they glow. The scouts' hoods catch the fire on
the side that faces it.

## 13. New colours, all from the same family

| Use | Colour |
|---|---|
| Fire: outer flame, ember and sparks, the core | trail red `#C8432F`, `#D9A441`, `#F1DDA6` |
| Fire glow | soft stacked rings of `#D9A441` and `#F1DDA6` at 4 to 7% each, never a hard disc |
| Dusk wash | near ink `#6B5A41` at about 20% |
| Deer | `#A27B52`, belly `#E2CFA8`, a paper tail |
| Moose | hat felt `#6B5236`, antlers stone `#C4B898`, legs far ink |
| Heron | the review's grey-blue `#8296A8`, bill rope `#D9C49A` |
| Songbird | rope `#D9C49A`, cap hat felt `#6B5236` |
| Kayak | wood `#8A6A45`, deck rope `#D9C49A`, coaming hat felt `#6B5236`, paddle blades rope |
