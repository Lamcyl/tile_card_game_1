# Exploration map brief

Read `BRIEF.md` in this folder first (the game, regions, phone size, the unit helper). The user picked **style 2, Bright diorama** (`map-diorama.svg`) — polished, bright, top-down mobile-game terrain matching the location battle boards (`../boards/loc-*.svg`). But they see that zoomed-out map as the **fast-travel / teleport overview**. What's needed now is the **actual exploration map**: the zoomed-in view the player is in most of the time.

## What the exploration view must show

- **A close camera.** A small part of one region (plus the edge of the next) at roughly 3–4× the zoom of the overview: trees, rocks, rivers and paths are big and detailed, like a mobile RPG world screen.
- **The player character** clearly placed in the scene (a small hero figure or token — use a simple original shape, or a unit via the helper).
- **Choice of direction.** At least three ways to go from where the player stands (forks in a path, open ground, a bridge vs a ford, a cave entrance…), with some sense of what lies down each.
- **Monsters on the map.** 4–6 enemies standing in the world, drawn with real unit art via `unit-image.mjs` at a readable size (~44–64 px), each on a small ground marker or clearing that shows it's fightable. Show difficulty at a glance (e.g. ring colour, small skull pips, a bigger glow for elites) and make one a **boss** guarding the way into the next region. Some could be off the path, rewarding exploration.
- **Unexplored / out-of-reach** areas fade into fog or cloud at the screen edges.
- Optional small rewards or points of interest (chest, shrine, camp) to make it feel worth exploring.
- No text, no HUD, no buttons. `viewBox="0 0 390 700"`, flat shapes and gradients only, no SVG filters, fill the whole frame.

Keep the **Bright diorama** look: lush saturated terrain, soft shadows, chunky readable shapes, like the location boards.
