# Themed set brief

The game's world art comes as a **themed set** of three screens that must clearly belong together:

1. **Overview** (`overview.svg`) — the zoomed-out world map used for fast travel: the Camp and grassland at the bottom, two more regions above (e.g. desert and coast), a network of encounter nodes in cleared / available / locked states, a couple of elites, a boss, the player marker, and fog beyond the boss.
2. **Exploration** (`explore.svg`) — the zoomed-in map the player walks around in, **free-roam** style (the user's pick): open terrain with no fixed paths, the hero in the middle, footprints behind them back to the camp, natural obstacles shaping routes (a river with a ford or log crossing, cliffs, dense trees), 4–6 monsters standing in the world on **danger rings** with skull pips showing difficulty (1–5), an elite, the **boss** guarding a gate into the next region at the top, a chest or two, and fog at the edges.
3. **Battle** (`battle.svg`) — the 5×5 battle board in the grassland region: top 2 rows enemy, bottom 3 rows player, a split between them that comes from the place (e.g. a stream), 2 enemy units and 3–4 player units placed, one highlighted empty drop tile. Units drawn at ~85–90% of the tile.

The existing set, **Bright diorama** (`themes/diorama/`), shows the content of all three screens — render it and use it as the reference for *what* each screen contains. Its *look* (bright saturated cartoon terrain) is what the user now finds overused and boring: your theme must look completely different.

## Units

The units are black-and-white ink chibi drawings with one accent (vermilion `#c8352b` or gold `#c9a23a`). They must read clearly in every screen. Place them with:

    node /home/user/tile_card_game_1/art-samples/boards/unit-image.mjs <set>/<file>.svg <x> <y> <size>

Units: `yokai/raijin-fierce-v2.svg`, `yokai/kitsune-fierce-v4.svg`, `egypt/anubis-fierce.svg`, `chinese/wukong-fierce.svg`, `greek/cerberus-fierce.svg`, `greek/siren-cute.svg`, `norse/jotunn-fierce-v2.svg`, `slavic/chernobog-fierce.svg`, `slavic/alkonost-cute.svg`, `maya/ah-puch-fierce.svg`, `korean/samjok-o-cute.svg`, `korean/sansin-fierce.svg`.

## Rules

- Each file: `viewBox="0 0 390 700"` (phone, portrait), fills the frame, hand-written SVG, no text, no HUD, no external images or fonts.
- Keep it light enough to run at 60 fps on a phone: flat shapes and gradients; a texture is fine if it's cheap (patterns, a few shapes), but no heavy SVG filters.
- The three screens share one palette, one way of drawing terrain, one way of drawing nodes/rings/highlights.
- Everything the player must act on (node states, boss, danger rings, the drop tile) must read at a glance on a phone.
