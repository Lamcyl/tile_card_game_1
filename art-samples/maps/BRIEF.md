# Overworld map brief

The game: a mobile tile-placement RPG. Between fights the player moves around an **overworld map**, incremental-RPG style: early runs are short and only reach a little of the map; meta-progression lets later runs go further. The world starts in **grassland/forest** (where the Camp is) and opens out into other regions — **ocean/coast, desert, ice, volcano** — each split into sub-areas whose **boss** unlocks the next part. Units are black-and-white ink chibi characters with a vermilion or gold accent; the location battle boards the user liked are bright, top-down, polished mobile-game terrain.

## What to make

One SVG mockup per style, `viewBox="0 0 390 700"` (phone, portrait), showing a slice of the overworld the player would see while panning:

- **Terrain:** at least three regions visible and clearly different — the grassland/forest start at the bottom, and two others (e.g. coast and desert, or ice and volcano) further up, with natural transitions between them.
- **Camp:** the start point near the bottom (a tent, campfire or small village).
- **Encounter nodes** (8–12) joined by **paths**, in these states, each easy to tell apart:
  - *cleared* (already won — dimmed or ticked),
  - *available* (can be fought now — the most inviting),
  - *locked* (out of reach this run).
  Include a couple of **elite** nodes (tougher) and one **boss** node (big and unmistakable, guarding the way into the next region).
- **Fog / unexplored:** the area beyond the boss is hidden by fog, clouds, darkness or blank map, fitting the style.
- **The player marker** on the current node.
- Optional: a few small enemy icons on nodes, using unit art via the helper below, if it suits the style.

No text, no HUD, no buttons. Hand-written SVG, no external images or fonts, no SVG filters (flat shapes and gradients only, so it pans at 60 fps on a phone). Fill the whole 390×700 frame.

To show a unit on a node:

    node /home/user/tile_card_game_1/art-samples/boards/unit-image.mjs <set>/<file>.svg <x> <y> <size>

prints an `<image …/>` tag (units: `greek/cerberus-fierce.svg`, `egypt/anubis-fierce.svg`, `slavic/chernobog-fierce.svg`, `maya/ah-puch-fierce.svg`, `norse/jotunn-fierce-v2.svg`, `korean/samjok-o-fierce.svg`).

## What matters most

- It should look like a polished, inviting mobile game map — something a player wants to explore.
- Regions, node states, the boss and the fog must all be readable at a glance on a phone.
