# Greek art brief (shared by all artists)

Goal: chibi Greek monsters, beasts and gods for a mobile tile-placement game, in the same ink style as the yokai set in ../yokai/ (look at a few of those SVGs first, e.g. ../yokai/nurikabe-fierce.svg, ../yokai/komainu-fierce.svg, ../yokai/orochi-fierce.svg, which the owner loved). Each character gets TWO variants of the SAME character:
- `<slug>-cute.svg`: round, friendly, big eyes with white highlights, small mouth, soft grey blush dots.
- `<slug>-fierce.svg`: same character, sharper angles, narrowed/glowing eyes, fangs or snarl, dynamic pose. Still chibi, not realistic.

## Style: black-and-white sumi-e ink, chibi
- Palette ONLY: ink `#1b1a1a`, paper white `#f6f2e9`, light wash `#d4cec3`, mid wash `#9a948b`, dark wash `#55514c`.
  One optional tiny accent of vermilion `#c8352b` (e.g. a tongue, a seal mark, an eye glint). No other colours.
- Chibi proportions: head roughly half the total height, stubby limbs, big simple silhouette.
- Brush feel: build outlines from FILLED tapered shapes (thick-thin strokes), not uniform hairline strokes.
  Outer contour weight about 6-9 px at 256 size. Interior lines thinner (2-4 px).
- Use grey washes for shading and depth (a darker wash on the underside, light wash on fills), not gradients.
- Silhouette must be recognisable at 64x64 px (it will sit on a 62 px board tile).

## Technical rules
- Hand-authored SVG, `viewBox="0 0 256 256"`, no width/height attributes, transparent background.
- Character centred, standing on an implied ground around y=230; leave ~12 px margin.
- No `<text>`, no external images, no fonts, no filters, no scripts. Gradients not allowed (flat washes only).
- Keep each file under 25 KB.

## Self-check (required)
Render each SVG with Playwright (`require('playwright')`, `chromium.launch()` needs no options) at 256 px and 64 px,
on a white and on a dark (#222) background, save PNGs to your scratch folder, and LOOK at them with the Read tool.
Fix anatomy errors, stray shapes, clipped parts, or anything unreadable at 64 px. Up to 3 revision passes.

## Greek flavour
- Same ink palette. The single accent colour may be vermilion `#c8352b` OR gold/bronze `#c9a23a` (one per character, sparingly: a laurel, a thunderbolt, a bronze shield, an eye glint).
- Use Greek design language: meander (key) pattern bands, laurel wreaths, chitons and himations, crested Corinthian helmets, round hoplite shields, columns. The bold flat silhouettes of black-figure pottery are a good reference. Keep it readable, not busy.
- Gods are portrayed respectfully (heroic or imposing).

## Pose
- PREFER FRONT-FACING or near-front poses: the head looks at the viewer, roughly symmetrical, like a statue or a card portrait. Most of the owner's approved picks are front-facing. Use a side view only when the creature is unreadable from the front.

## Lessons from the owner's feedback on the yokai (follow these)
- Every body needs a clear, continuous ink outline; shapes must not dissolve into the background.
- Anatomy must make sense: legs connect to a body (no straight pillar legs directly under a head), feet/paws are attached and planted, animal heads look like the real animal (a jackal must read as a jackal, a falcon as a falcon).
- Fierce versions must not look cute: use body shape (broad shoulders, angular torso, lower stance), not only the face.
- Avoid clutter: few, big, clean shapes. If a detail turns into noise at 64 px, remove it.
- ARMS AND LIMBS (the most common failure so far): never draw an arm as a separate closed shape stuck onto the body. Draw the torso and its limbs as ONE silhouette so the body outline flows straight into the limb outline, with no ink line closing across a shoulder or hip. Raised arms must show the shoulder and upper arm coming out of the body. Check every limb join at 512 px.
