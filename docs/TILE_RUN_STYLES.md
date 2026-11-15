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

## Round four: sandwich highlight (A2 chosen)

Feedback: A2 (navy slab with the bar-pill) is the base. File: `prototype/samples/tile-run-styles4.html` (one file, about 29 KB, light and dark, tabs S1 to S6). Changes common to all tabs:

- The colour shape (circle, triangle...) is gone; colour alone says the unit. The goal-chip row is gone.
- The big number is always the current value; when it differs from the base, the base shows small in the top-right corner (a quiet chip, "+2" for boosts). No strikethrough, no cause text.
- The reach glyph is now (w+2) x (h+2) cells: the tile's bounding box plus one cell of margin, so 3x3 for one cell, 4x3 for a two-wide tile, 5x3 for three-wide, 4x4 for the L. Own cells are outlined, reached cells lit, the rest faint; attack lights the cells above the top cells (and the side lanes), boost / multiplier light the neighbours along each acting side, copy lights the cell it copies.
- The scene has a x4 tile (row and column), a sandwiched two-wide tile (row, x2), a sandwiched boost (column, x2), boosted and multiplied tiles with a base in the corner, a copy, and a hand with an L, a two-wide and a three-wide piece. Enemy bars add up (7 on the Guard, 19 on the plain one, 8 + 17 on the wide one, 2 on the last).

Highlight options (x2 vs x4 told apart in each):
- **S1 Ring:** gold ring around the tile, a second inner ring and a ×4 chip for x4; chip replaces the name.
- **S2 Clamps:** gold clamps in the gap on the outer tiles' facing edges, two for x2 and four for x4; shows the axis.
- **S3 Band:** a gold band behind the three tiles of the sandwich; a crossing pair of bands means x4. Heaviest, shows the whole line.
- **S4 Gold edge + chip:** the soft bottom edge turns gold with a ×2 chip; x4 adds a gold inner frame and a bigger chip. Quietest.
- **S5 Gold number:** number turns gold with a navy outline and a small ×2 / ×4, soft inner glow, strong glow and frame for x4. No extra objects.
- **S6 Pinch arrows:** gold navy-outlined triangles pointing inward from the squeezed sides (two for x2, a cross of four for x4), the only one that shows the direction.
Gold on the yellow unit colour is handled with navy outlines, navy chips and by putting the marks in the gap (clamps, rings).

## Round five: chosen design and five siblings

File: `prototype/samples/tile-run-styles5.html` (one file, about 40 KB, no network, light and dark, tabs 0 to 5, same arrangement in all).

### Chosen design (tab 0), for implementation in `tile-run.html`

Base is round four's A2 look; sandwich = S2 clamps plus S1 chip without the ring.

- **Tile:** solid unit colour fill (red #d2473f, blue #2e6bd3, green #23874f, yellow #b9800f, purple #7a55c2, colourless #566377), white number, 12 px radius, 2 px soft bottom edge. No colour shape. Number 29 px / weight 800, centred, 4 px above middle; name 9 px at the bottom. Boost: white face, 3 px solid coloured outline, coloured number; multiplier: same with a dashed outline.
- **Reach glyph (top-left, 5 px inset):** grid is the tile bounding box plus one cell on every side, (w+2) x (h+2) cells, 6.6 px per cell (3x3 = 20 px). Own cells outlined, reached cells solid, the rest 25 percent. Attack: the cell above each top cell (forward) and above-left / above-right for side lanes. Boost / multiplier: the neighbour cells on each acting side along its full length. Copy: its own lane lit (cell above) and the copied cell as a ring.
- **Base number:** only when it differs from the current value: small chip (15 px high, 10 px bold, white 26 percent on solid tiles, tinted on outlined ones) top-right; "+2" style for boosts.
- **Sandwich:** gold clamps (#e0a100, f0b429 in dark) 8 px thick, 64 percent of the edge long, centred in the 6 px gap on the facing edges of the two squeezing tiles, with a 1.5 px navy outline (they overlap the tiles by 1 px); x2 has one pair (row or column), x4 two pairs. A multi-cell tile is clamped by the neighbour at the end of the bracketed line only (the clamp covers that cell's share of the edge). The squeezed tile gets a navy chip (#151a24, gold 1.5 px outline and gold text, 16 px high, 11 px bold) saying "x2" or "x4" bottom-centre, replacing its name.
- **Enemy:** navy slab (#33405a, 3 px border, 12 px radius, 48 px high) with a label line (8.5 px caps) and the HP number (25 px). Below it a bar-pill: 22 px high, 11 px radius, 2 px line border, a pale track, the predicted damage as a tinted fill (grey-blue for "not enough", green for a kill), text always one colour (ink) on the tint so no digit is cut: "19 / 25", "8 + 17 / 25" for a wide enemy (one shared pill, one number per column). Kill = slab and pill borders turn green plus a green check badge on the slab corner. Guard label "GUARD 2/2".
- **Hero:** heart, a bar-pill of the same construction (red tint), "18 / 24" inside, one ability button (white, 2 px border).
- **Board:** dashed 2 px cells, blocked cells with diagonal stripes, 6 px gaps; hand 5 x 2 slots, multi-cell pieces shown at real size across slots. Buttons: Clear (white, small) and Attack (dark, big, damage total in small text).
- Dark palette: bg #151a24, panel #212838, ink #eef2f8, colours #e0584f #4f86e6 #2f9d5f #d19a22 #9a78e0 #7a879c, gold #f0b429.

### Research used for the five siblings

A short web pass (and general knowledge) gave these principles, each sibling applies a stated subset:
- Dieter Rams, ten principles ("as little design as possible", understandable, unobtrusive, thorough to the last detail): https://www.vitsoe.com/gb/about/good-design , https://principles.design/examples/ten-principles-of-good-design
- Gestalt (proximity, similarity, common region, closure, continuity): https://www.nngroup.com/articles/gestalt-proximity/ , https://www.toptal.com/designers/ux/gestalt-principles-of-design
- 60-30-10 colour proportion and a single accent; WCAG contrast 4.5:1 text, 3:1 large text and UI parts; never colour alone: https://www.uxpin.com/studio/blog/choose-color-pallete/ , https://visionaustralia.org/business-consulting/digital-access/Creating-accessible-digital-colour-palettes-60-30-10-design-rule
- Minimalist puzzle games (flat colour, clean shapes, minimal UI, one mechanic, e.g. Monument Valley): https://www.killscreen.com/box-art-review-how-monument-valley-taps-existential-wondering/
- Apple HIG 44 pt and Material 48 dp touch targets, 8 pt spacing rhythm (from knowledge, not fetched).

### Siblings

1. **Frame:** white face inside a 4 px colour frame (boost dashed, multiplier dotted), warm paper white, ink accent with round ink pins in the gaps, ink slabs. Applies common region, similarity, 60-30-10 (warm white / ink / ink accent) and WCAG on white faces.
2. **Night:** deep navy, luminous flat tiles with dark navy numbers, soft wells for cells, warm-white accent for clamps, chip and Attack, slab and bar-pill fused into one card. Applies strict 60-30-10, contrast and common region. Dark in both schemes.
3. **Band:** pale tinted face with an 8 px colour band on top, dot glyph, dot-lattice board, sharper 9 px corners, ink bracket clamps, no names. Applies similarity, hierarchy (number first), "as little design as possible".
4. **Disc:** discs for single cells, capsules for wide pieces, a bent capsule for the L, round wells, lilac neutral, one teal accent. Applies closure and continuity, restraint, one accent at about 10 percent.
5. **Grid:** tinted face with a 2 px outline, sharp 6 px corners, mono numbers always bottom-left, glyph top-left, base top-right, chip bottom-right, line-grid board, enemy as an outlined card with the pill inside, orange stitched clamps. Applies alignment on a fixed anchor grid, a type scale, common region.
