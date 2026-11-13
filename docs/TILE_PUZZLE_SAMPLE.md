# Tile Puzzle sample (rules note)

Single-file sample: `prototype/samples/tile-puzzle.html` (inline CSS/JS, no network, no build step). A pure one-turn puzzle: place tiles, press Resolve once.

**Board.** 5 columns x 3 rows. An enemy tile above each live column shows a target. Columns without an enemy are dimmed and unusable; some levels have blocked cells. Win = every enemy beaten.

**Tiles.** Number = strength, glyph (3x3 mini-grid) = which cells it touches, colour (red circle, blue triangle, green square) = element.
- Strike: adds its number to its own column.
- Fork: adds its number to the left and right columns, not its own.
- Plus (booster): +N to each Strike/Fork directly above, below, left or right.
- Row (booster): +N to every Strike/Fork in its row.
- Double: x2 on the tile directly above it (after boosts and chain). Boosters add nothing by themselves.

**Chain.** 3+ orthogonally connected same-colour tiles: each gets +(size - 2). Drawn as link markers between the tiles. The bonus raises a Strike/Fork's value or a booster's power.

**Reactions** (once per column, icon under the column; tap or long-press for text):
- Steam (red + blue): +2 to both neighbouring columns.
- Blaze (red + green): +3 to this column.
- Bloom (blue + green): boosters in this column get +1.
All three colours in a column fires all three.

**Enemies.** Plain: total >= target. Exact: total must equal target. Guard: total >= target and at least 2 separate Strike/Fork sources feed it. Wide: spans 2 columns with one shared target (sum of both columns).

**Resolve order.** Boosters and Doubles pulse, then Strikes and Forks send numbers up, then reactions, then enemies crack or hold.

**Stars.** 1 for winning, plus two per-level goals (leave a tile unused, trigger N reactions, chain of N, one column of N+). Stars are stored in `localStorage` (optional; the page works without it).

**Endless.** A hidden solution is built first (random tiles on random cells), targets and enemy kinds are derived from what it scores, then 1-2 decoy tiles are added. Difficulty rises with the streak (more columns, tiles, shapes, blocked cells, Exact/Guard/Wide enemies).

**Levels.** 1 First Strike, 2 Fork Out, 3 Plus Power, 4 Row Call (Exact), 5 Chain Link (blocked cell), 6 Blaze (Guard), 7 Steam, 8 Bloom, 9 Wide Load, 10 Double Up, 11 Crossroads, 12 Grand Tangle.

**Known cuts.** No rotation (no directional shapes). The rules code sits between `/*RULES-START*/` and `/*RULES-END*/` markers in the HTML so a node brute-force solver can load it directly.
