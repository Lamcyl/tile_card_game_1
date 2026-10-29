# Yokai art brief (shared by all artists)

Goal: chibi Japanese yokai for a mobile tile-placement game. Each yokai gets TWO variants of the SAME character:
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
