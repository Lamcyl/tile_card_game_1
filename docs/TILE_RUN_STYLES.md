# Tile Run: visual directions

File: `prototype/samples/tile-run-styles.html` (one file, about 90 KB, no network). Five looks for the same battle moment (identical arrangement: a 2-cell red attack, a yellow booster, a sandwiched green, a 2-cell yellow, a x2 multiplier, a copy, per-column damage, hand, hero, Attack). Tap a board tile to see its reach. Each style also shows a unit card and what it costs. Light and dark both work; style 5 keeps its own dark palette in both.

1. **Elegant (refined current look).** Flat colour tiles, white marks, soft shadows, clean cards. Art: none. Best readability, cheapest, easy to localise; units feel interchangeable and there is little personality.
2. **Tactile.** Wood table, lacquered bevelled tiles like mahjong pieces, stone-slab enemies, brass hero and ability. Art: none, but material CSS/textures (and ideally sound). Very pleasant to touch and still abstract; bevels eat a little contrast on pale tiles and it needs more CSS upkeep.
3. **Banners and portraits.** Tiles stay clean (ink outline, woodblock offset shadow); units are crests on colour banners, enemies are illustrated cards, hero portrait. Art: about 15 unit crests plus about 20 enemy portraits (existing ink art covers most). Best personality per drawing and tiles remain fully readable; this reuses the repo's ink yokai style directly.
4. **Fully illustrated.** Beast art on every tile, number in a medallion, framed enemy portraits, scenic background, gold-framed board. Art: unit illustrations (ideally evolutions), 25+ enemies, hero, per-world board and background. Most collectible and rich; busiest, numbers need medallions to stay legible, and by far the most production.
5. **Neon arcade.** Dark glow tiles, pixel-invader enemies generated in code, segmented HP, scanlines. Art: none (about 15 tiny glyphs, 10 bitmaps in code). Strong identity, very readable numbers; it moves away from the beast-guardian world.

## Recommendation

Go with 3 as the target, built on 1 as the base: keep the tiles clean and elegant (the puzzle must read at a glance), and put illustration where it is collectible and cheap to extend: unit crests on banners, enemy portraits, hero, unit cards. It gives most of the "graphics like before" feeling for a fraction of 4's cost, and can be shipped incrementally (start with style 1, add crests and enemies as art is ready). Style 4 is the long-term option if the game gets a full art budget; 2 and 5 are good themes or unlockable skins rather than the main look.

Art reused (all from `art-samples/yokai/`, inlined as SVG symbols): oni, kappa, kodama, komainu, tengu, kitsune-fierce-v4 (hero), gashadokuro, kasa-obake, nurikabe-cute, baku, kamaitachi.

## Round two: variations of the original sample look

The five directions above were rejected by the owner ("they all look terrible"). The reference is the first sample, `prototype/samples/tile-puzzle.html`: pale grey-blue page, system sans, dark navy enemy slabs with a small label and a big number plus a progress pill, dashed board cells, solid muted tiles with a soft bottom edge, 3x3 reach glyph top-left, one shape per colour top-right, small uppercase name at the bottom, white outlined boosts, big dark primary button. No illustration, texture, serif, gold frame or neon.

File: `prototype/samples/tile-run-styles2.html` (one file, about 32 KB, no network, light and dark). Tabs A to E show the same content of the current game (5 colours plus colourless, 5x3 board, plain / Guard / wide enemies with per-column damage, 2-cell and L tiles, lanes, boosts, multipliers, copy, a sandwich, base vs current value, hero bar with one ability, Attack and Clear). Tap a board tile to see its reach.

- **A. Baseline.** The puzzle look applied unchanged to the current content. Yellow = diamond, purple = pentagon, colourless = slate tile with a ring. Base values shown as struck-through number plus cause ("3 +2"); sandwich = gold bars between the outer tiles and a "x2" chip.
- **B. Edge marks.** No glyph, no name: lane chevrons on the top edge, "+" / "x" / "=" dots on the edges a tile acts on, 36 px number, shape bottom-right. Tests whether marks where the effect goes beat a corner glyph.
- **C. Soft.** Pastel flat tiles with coloured numbers, light enemy cards with a thin damage bar instead of the pill, slightly larger shapes. Tests calm and friendliness against number contrast.
- **D. Compact 6x4.** Same pieces on the largest board (6x4), 4 px gaps, 44 px slabs, no names, hand of 6 per row. Tests density on a 390 px phone.
- **E. Raised.** More saturated colours, 3 to 4 px raised edge, shape in a white disc, glyph and edge marks together, damage inside the navy slab with a bar. Tests how much depth and double reach cues the tile can take before it gets busy.

## Round three: A's tiles, different enemy bars

Feedback on round two: keep tab A's tiles, board, hand, buttons and palette; prefer the damage / HP bars of C, D and E over the "x of y" pill. File: `prototype/samples/tile-run-styles3.html` (one file, about 33 KB, light and dark). Tiles are identical in all seven tabs; only the enemy area and the hero HP bar change. The scene covers a Guard that was just broken (with 2 damage over), a plain enemy not yet dead, the wide enemy killed by two columns (3 + 9) and a plain enemy with 0 damage. Kill = green slab outline plus check badge; not enough = grey fill and the number short.

- **A1** thin 7 px bar under the navy slab, "22 / 25" inside; gold tab = overkill.
- **A2** the original pill becomes the bar (number over the fill), slimmer slab.
- **A3** damage text and a bar along the bottom of the slab (E's idea, flat).
- **A4** bar cut into chunks of 5 HP (hero: 4 HP) to count rather than read.
- **A5** two tones, "-22" at the left end and "3 left" / "KILL +2" at the right.
- **A6** bar inside the slab above the number; Guard shown as two pips.
- **A7** light slab (white, navy number); the wide enemy's one bar has a shade per column.
