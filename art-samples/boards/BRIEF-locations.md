# Board brief, round 2: locations

Round 1 (styles: ink scroll, stained glass, star chart…) was rejected — all of them. The user wants each board to **be a place in the game world**: the battle happens *on location*, the way the world map goes from grassland and forest to desert, ice, volcano and so on.

Read `BRIEF.md` in this folder for the game, the grid, the phone size (`viewBox="0 0 390 700"`), the unit list and the `unit-image.mjs` helper. Everything there still applies except the style direction. What changes:

- **The board is the terrain.** Show the ground of the location seen from above (top-down or a slight bird's-eye tilt), filling the whole screen, like the battlefield of a polished modern mobile game. No picture frames, scrolls, borders, panels or decorative surrounds.
- **The 5×5 grid lives in the ground.** Make the tiles part of the place: worn stone pavers set in grass, packed sand slabs, ice plates, cooled basalt slabs over lava, wooden rafts on water… They need to be light and even enough that black-and-white ink units read clearly on them.
- **The enemy/player split comes from the place** too: a stream, a crack, a ridge, a change of ground, a line of rocks.
- **Life around the edges:** plants, rocks, props, small details of the location outside the grid, so it feels like somewhere. Keep the area right around and under the tiles calm.
- **Readable at a glance:** someone should be able to name the location in one second from the colours and shapes.
- Units are drawn at about 85–90% of the tile, so they feel like they stand on it, not float small inside it.
- Flat shapes and gradients only; no SVG filters.
