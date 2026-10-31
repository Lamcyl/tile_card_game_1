# Board design brief

The game: a mobile tile-placement RPG. Each fight is played on a **5×5 grid**: the **top 2 rows are the enemy side**, the **bottom 3 rows are the player side**. The player places their units (fixed army, no card draw) on their 3 rows and presses play; fights last 1–2 turns.

The units are black-and-white ink chibi drawings with one accent colour (vermilion `#c8352b` or gold `#c9a23a`), transparent background, drawn in a 256×256 box. They come from many mythologies (Japanese, Egyptian, Chinese, Greek, Norse, Slavic, Maya, Korean), so the board must work for all of them, not only its own theme.

## What to make

One SVG board mockup per design, `viewBox="0 0 390 700"` (a phone screen, portrait). It shows:
- the 5×5 grid, filling most of the width (tiles roughly 62–70 px), with a visible split between the 2 enemy rows and the 3 player rows;
- the board's surroundings: background, frame or border, and whatever atmosphere fits the style;
- 2 enemy units placed in the enemy rows and 3–4 player units in the player rows, so the reviewer can judge how units read on the board. Leave the other tiles empty so empty tiles can be judged too;
- one empty player tile shown as **highlighted** (where a dragged unit would drop), to show a selection state.

No text, no HUD, no buttons. Hand-written SVG; no external images or fonts.

## Hard rules

- **Units must stay readable.** They're mostly ink-black and paper-white, so tiles under units must give contrast (a light plate, a paper square, a lit circle…). Test this at the real size.
- **The board must not compete with the units.** It's a stage, not the star.
- Keep it renderable at 60 fps on a phone: no filters or blur heavier than you need; flat shapes are best.

## Placing units

Embed each unit as a data-URI `<image>`, so its styles can't clash with yours:

    node /home/user/tile_card_game_1/art-samples/boards/unit-image.mjs <set>/<file>.svg <x> <y> <size>

prints the `<image …/>` tag. Use units from this list (all chosen by the user):
`yokai/raijin-fierce-v2.svg`, `yokai/kitsune-fierce-v4.svg`, `egypt/anubis-fierce.svg`, `chinese/wukong-fierce.svg`, `greek/cerberus-fierce.svg`, `greek/siren-cute.svg`, `norse/jotunn-fierce-v2.svg`, `slavic/chernobog-fierce.svg`, `slavic/alkonost-cute.svg`, `maya/ah-puch-fierce.svg`, `korean/samjok-o-cute.svg`, `korean/sansin-fierce.svg`.
