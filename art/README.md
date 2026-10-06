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
