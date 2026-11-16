# Tile Puzzle: design notes (brainstorm, nothing here is coded yet)

Status: brainstorm. The playable sample (`prototype/samples/tile-puzzle.html`, rules in
`docs/TILE_PUZZLE_SAMPLE.md`) is the starting point. This file records the owner's feedback,
the decisions taken, and the open ideas. The older battle is felt to be a bit boring; this
abstract puzzle may replace it.

## 1. Feedback on the sample

- The sample is fun. Late puzzles are complex although the rules are simple: this is the goal.
- The three named reactions (Steam, Blaze, Bloom) are hard to remember at the start.
- Exact-number enemies are not fun.

## 2. Decisions

| Topic | Decision |
|---|---|
| Look | Stay abstract for now (number, shape, colour). No beasts on tiles yet. |
| Design rule | Every new idea must add depth without adding a rule to memorise. Prefer new boards and new numbers over new mechanics. |
| Reactions | Colours have jobs, and a live preview shows the result while a tile is held (section 3). The named reactions go. |
| Resolve | Everything resolves at once. No order-dependent resolving. |
| Rejected | Tiles that move or swap other tiles; enemies that steal tiles; negative tiles; exact-number enemies. |

## 3. Reactions: colours have jobs

One rule: **when a column holds more than one colour, each colour in it does its job once.**

| Colour | Job |
|---|---|
| Red | +2 to this column |
| Blue | +1 to each neighbouring column |
| Green | boosters in this column get +1 |

The job is printed as a small mark on the tile, so nothing has to be remembered. While a tile is
held, every column shows the total it would reach. Numbers are placeholders.

## 4. Farming: how solved puzzles stay worth playing

A hand-made puzzle has a fixed answer, so it can only be a one-time reward. Farming needs the
puzzle to differ each time. Ideas, which combine:

1. **Your hand is drawn from your own tile deck.** The enemy board of a node is fixed, the hand is
   not, so the same node is a different puzzle on every visit. Building the deck is the long game.
2. **Raise the stakes.** Before placing, choose bronze, silver or gold: targets +0, +2 or +4 for
   better loot. A node you out-level stays interesting at gold.
3. **Margin pays.** Loot scales with how far the weakest column beats its target, so there is
   always a better answer to look for.
4. **Two node kinds.** Hand-made puzzles are story nodes with a one-time reward; farm nodes are
   generated (the sample's endless generator already builds solvable boards).

Recommended: 1 + 2, with 4 for the campaign.

## 5. Ideas for depth without new rules

- **Bonus cells.** Some board cells are marked +1, +2 or x2, like premium squares in a word game.
  Readable at a glance, and it makes every board different.
- **Weakest column counts.** Score is the smallest margin among the columns. One sentence, and it
  turns "reach the numbers" into "balance everything".
- **Scarcity.** Fewer tiles than you would like, or "place at most 4 of 6". Tension comes from the
  limit, not from a rule.
- **Unused tiles carry over.** In a run the hand is not refilled; you draw a few per fight. Spending
  a strong tile now or saving it for the boss is a real choice.
- **Shapes are the vocabulary.** New tiles are new reach patterns (diagonal, whole column, two
  cells ahead). The glyph on the tile shows the reach, so there is nothing to memorise.
- **Upgrades over new types.** A reward improves a tile you own (+1, a second colour, wider reach).
- **Enemy variety by layout only.** One tall target, many low ones, wide enemies, blocked cells.
- **Bosses as bigger boards.** More columns or a second row of targets, not new mechanics.

## 6. Open questions

- Does a missed column cost hero HP (keeps rations, retreat and healing relevant), or is it
  strict pass or fail as in the sample?
- Keep Guard enemies (need two sources) and the Double tile, or drop them with Exact?
- Run structure (deck, pick one of three rewards, relics) or a level list first?
- When, and whether, the guardian beasts become the faces of tiles.

## 7. Second round of feedback (supersedes sections 3 and 4 where they differ)

Owner feedback:
- Reaction jobs (spread, booster +1) are not liked. Reactions should be mostly damage.
- "Raise the stakes" (bronze/silver/gold) is rejected.
- Farming: a hand drawn from a deck is uncertain. Prefer all tiles available, or tiles used up over a run.
- Bonus cells are fine. "Weakest column counts" is a level-design goal for some levels, not a main rule.
- Wants fun that does not need much thinking.
- New idea from the owner: colours are the units. Bring 5 units per run; each unit gives its colour an effect.

### 7.1 Reactions: Mix and Chain, both pure damage

- **Mix:** a column gets bonus damage for the number of different colours in it
  (placeholder: 2 colours +2, 3 colours +5). Three rows, so three colours is the most.
- **Chain:** touching tiles of the same colour get a bonus (as in the sample).

The two pull against each other: same colour side by side, different colours stacked.
No named reactions, no status effects.

### 7.2 Colours are the units (recommended)

- A run uses a team of 5 units. Each unit is one colour for that run.
- A unit brings a small kit of tiles (its shapes and numbers) and one effect that applies to its colour.
- The only rules to know in a fight are the 5 effects of the team you picked. They are shown in a
  bar under the board.
- Effects are mostly damage. Examples (placeholders):
  - chain bonus counts double for this colour
  - damage above the target spills into the neighbouring columns
  - +2 when placed in the front row
  - +1 for each empty cell touching it
  - this colour counts as two colours for Mix
- Progression: a unit levels by gaining a tile, +1 on a tile, or a stronger effect. Collecting units
  and combining five of them is where the variety comes from.
- Open choice: fixed colour per unit (cannot bring two reds; colour hints at the style) or free
  (any five units, colours assigned by slot; more combinations). Lean: free.
- The guardian beasts can later be the faces of these units; abstract for now.

### 7.3 Farming: the bag is used up over the run (recommended)

- A run is a chain of generated boards from one area. The bag is all tiles of the 5 units
  (about 20). All unspent tiles are available in every fight; **a placed tile is spent for the run**.
- Each fight becomes "win with as little as possible", which needs no extra rule and stays
  different every run because the boards are generated and the bag shrinks.
- Loot scales with how far the run gets and with tiles left at the end.
- Optional: a camp node mid-run returns a few spent tiles.
- Hand-made puzzles stay as one-time story nodes.

### 7.4 Fun without much thinking

- **Overkill spills** to neighbouring columns: big numbers are never wasted, and it forgives sloppy play.
- **Short fights:** normal nodes are 3 columns and take seconds; big boards are for elites and bosses.
- **Glow hints:** while holding a tile, cells that would finish a column glow.
- **Loud payoff:** totals count up, chains flash, the board shakes on a large overkill.
- **Momentum:** winning with tiles to spare gives +1 to every tile in the next fight.
- **Bonus cells** (+1, +2, x2) as board variety.

### 7.5 Still open

- Missed column: costs hero HP, or strict pass or fail?
- Keep Guard enemies and the Double tile?
- Fixed or free unit colours.

## 8. Decisions for the run prototype

Prototype: `prototype/samples/tile-run.html`, rules as built in `docs/TILE_RUN_PROTOTYPE.md`.

- **Unit = colour with a fixed kit that grows with level.** One unit per colour, no repeats, a team is five units. A higher level adds tiles and more tile types (level 1 mostly Strikes; Forks, boosters, Doubles arrive at levels 2 and 3). Units differ only by their kit.
- **Colourless inventory tiles.** Universal tiles kept in a persisted inventory, earned as loot; up to 3 go in the bag before a run.
- **Reactions.** The Mix/Chain pair was rejected (it collapses into one colour per row). Per-unit reactions (five different effects per team) were tried next and rejected as too hard to remember. Replaced by one universal, pure-damage reaction rule at a time, shown in a strip under the board. The prototype offers three to compare: **Sandwich** (a tile between two tiles of one other colour is doubled; default), **Melds** (Flush, Run, Set in a line of three), **Wheel** (a tile boosts touching Strike/Fork tiles of the next colour on a five-colour ring), plus "none". An optional **enemy colour** match (same colour deals double) is a separate toggle, default off. Colourless tiles are never a colour for these rules (they count by number for Run and Set).
- **Tiles deplete over a run and replace rations.** A tile on the board at Attack is spent for the run; the bag is the resource and fights are chosen with that in mind.
- **Bosses replenish**, sometimes beyond the starting bag (bonus colourless tiles for the rest of the run), and heal some HP. The run then goes deeper; the player can bank and leave at any time, defeat keeps half.
- **The hero HP bar stays** across the run; enemy HP persists between attacks; surviving enemies hit back.
- **Columns grow per area (3, 4, 5)** as a balancing matter, not a rule.
- **Momentum is experimental and tunable** (win in one attack: +N to every tile on the next fight's first attack); toggle and value in Settings.
- **Bonus cells are level design** (+1, +2, x2), generated per fight. **Guard and Double stay. Exact is dropped.**

## 9. Feedback on the run prototype, and ideas (brainstorm, not coded)

Owner feedback after playing `prototype/samples/tile-run.html`:
- Sandwich is OK. Melds, Wheel and enemy colours are rejected.
- Fun at the start, then tiring and repetitive.
- Progression is underwhelming: the unit tile types never change, even at the end.

Likely causes: every fight asks the same question; the bag only shrinks, so play turns into
careful saving; nothing new arrives during a run; a level only adds more of the same five shapes.

### 9.1 Progression: units that become different

- **Signature shape per unit.** Each unit has one reach pattern no other unit has, unlocked at
  level 3, drawn on the tile glyph so it needs no text. Candidates: Lance (own column, counts
  twice against wide enemies), Diagonal (the two columns diagonally ahead), Sweep (own column and
  both neighbours at half), Pillar (booster for its whole column), Echo (copies the number of the
  tile in front), Giant (large number, takes two cells).
- **Evolution choice.** At level 5 a unit picks one of two branches (for example more big Strikes,
  or boosters and a second signature tile). Two players' Ember differ.
- **Tile stars.** Duplicate loot merges into a tile for +1, so every drop matters.
- **Rare colourless tiles.** Loot has rarity; rare ones carry unusual shapes. This is the item
  chase and reuses the "all drop common, roll up" idea from DESIGN_V2.

### 9.2 Runs that grow instead of only shrinking

- **Pick one of three after every fight:** a new tile for this run, an upgrade to a tile (+2, or a
  second colour so it sandwiches more easily), or return two spent tiles.
- **Run perks (few, chosen, always shown):** "sandwiches triple instead of double", "Forks also
  hit their own column", "the first tile each fight is not spent". At most three per run.
- **Node variety:** forge (upgrade a tile), rest (return tiles or heal), shop, treasure, event.
  Fewer plain fights between them.

### 9.3 Fights that differ

Enemy types, each shown by one icon and all about damage:
- **Bomb:** when killed, deals its max HP to both neighbours. Chain kills.
- **Grower:** gains HP every turn it survives. Kill it first.
- **Runner:** leaves after one turn; killing it gives a bonus tile. Optional greed.
- **Charger:** attacks only every second turn, but hard. A visible countdown.
Bosses get one hand-designed trick each instead of only a second HP bar.

### 9.4 Less chore, more payoff

- Normal fights in an area you out-level end in one attack; the thinking is saved for elites and bosses.
- Per-fight bonus goal ("win with 3 tiles or fewer") that returns a spent tile.
- Overkill carries over: damage beyond a kill is stored as a bonus for the next fight.
- Count and reward sandwiches made in a run.

### 9.5 Recommended next build

Signature shapes and the level-5 choice; pick one of three after each fight; Bomb, Grower and
Runner enemies; forge and rest nodes; rare colourless tiles. Remove Melds, Wheel and enemy colours.

## 10. Decisions for the second run prototype

Prototype: `prototype/samples/tile-run.html`, rules as built in `docs/TILE_RUN_PROTOTYPE.md` (answers section 9).

- **Sandwich is the only reaction.** Melds, Wheel, the "none" mode and enemy colours were removed after the owner's play test. A two-colour tile counts as both colours for Sandwich.
- **Tiles no longer run out.** Default: a tile used in an attack rests until the end of that fight and the whole bag is back for the next fight (`tileReturn = fight`); the switch `turn` makes everything available every attack, for comparison. Boss replenish, bag-empty defeat and bag-conservation text are gone; a run ends by hero HP or by banking. Reason: "reward creativity, not bad thinking": bad layouts now cost HP, not tiles. In the bot runs `turn` is clearly easier (first boss beaten 100 percent against 78 percent in Area 1 at level 1).
- **Fewer tiles per colour.** 3 at level 1, then 5, 7, 8 and 10 at level 5 (15 to 50 in a team bag).
- **Unit progression in five levels.** Levels 1 and 2 basic shapes; level 3 the unit's signature shape (Diagonal, Sweep, Pillar, Echo, wide or tall Giant) with its reach drawn on the glyph; level 4 a stronger tile; level 5 a choice of two branches (Heavy or Support), saved and changeable in the test panel. Units of one colour differ by signature and kit.
- **Rare colourless tiles.** Loot has rarity (Common, Rare, Epic), shown by a gem. Rare and Epic carry signature shapes with bigger numbers; elites and bosses have better odds, bosses always give Rare or better. Up to 3 colourless tiles go into the bag.
- **Tile stars are an experiment** (Settings toggle, default on): a duplicate colourless loot tile merges into a star, +1 to its number, cap 3. Needs playtesting.
- **Runs grow.** After every won fight pick one of three: a new tile for the run, an upgrade (+2 or a second colour) or a heal. Forge, Rest and Treasure nodes sit between fights, so there are fewer plain fights per boss.
- **Bosses have one hand-designed layout trick each**: Area 1 twin bodies that must die in the same attack, Area 2 a blocked back cell each turn with a telegraph, Area 3 an armoured boss that needs 3 different tiles. Guaranteed Rare-or-better tile and a heal.
- **New enemy: Runner** (leaves after the first attack; killing it gives a bonus colourless tile). Guard and wide stay.
- **Dropped for now:** Bomb, Grower, bonus goals and overkill carry-over (owner said no), shop and event nodes, run perks.
- **The run is saved**, so a reload resumes it. Momentum stays, with its toggle. The HP bar persists across a run; columns grow per area (3, 4, 5) as a balancing matter.

## 11. Third prototype: general tiles and the 10-stage campaign

Prototype: `prototype/samples/tile-run.html`, rules as built in `docs/TILE_RUN_PROTOTYPE.md`.

Owner feedback after playing to the end game: each stage is too long because it never ends; the endless mode can be another game type, the main campaign must be shorter and more casual with progression stages (up to 10) covering tiles, units and board size; the corner mini-grid on tiles is misleading; Sandwich should multiply across both axes; a blue/green tile between two greens was not doubled (bug); the owner wants "all possible combinations" of tile reach rather than a fixed list; the Diagonal tile is not wanted; the upgrade choice needs the whole bag on screen.

Decisions:
- **Sandwich across both axes:** a tile is doubled once for its row and once for its column (x4 at most), with the middle tile sandwiched when the outer pair shares a colour X and the middle tile has a colour that is not X (two-colour tiles count as both colours, colourless never counts). For multi-cell tiles it is enough that one line through the tile on an axis has matching outer tiles at both ends of the tile's span in that line; each axis counts once.
- **Diagonal removed.** With one row of enemies it equalled Fork.
- **Tile faces show what a tile does on its edges** (arrows on the top edge for lanes, plus dots for boosts, dashed x dots for multipliers, an equals dot for copies, bars for whole rows or columns, true polyomino shapes); names are only in cards. A reach overlay on hold complements it. The corner mini-grid is dropped.
- **General tile model:** attack lanes (any of own, left, right), boosts and multipliers on any subset of the four neighbours or a whole row, column or both, copies (one direction, resolved last, never copy a copy), and polyominoes of 2 to 4 cells (rotations are separate tiles). Old names are special cases. Rare and Epic loot and run picks draw from the whole space with a number budget in CONFIG (wider reach means a lower number).
- **Campaign is the main mode: ten short stages** (about 4 choices then a boss, 6 to 9 attacks), each with its own board (3x2 up to 6x4), colour count (3, 4, 5), unit level cap (1 to 5), newly introduced tile types and a boss with one visible layout trick. Clearing a stage ends the run, banks the loot, unlocks the next stage and pays a one-time reward; defeat keeps half. Tile types a stage has not introduced do not appear in kits, loot or picks; locked kit tiles show their stage.
- **Endless is a separate mode,** unlocked after stage 3, with the previous never-ending structure on the board of any cleared stage and its own best depth.
- **Forge and every upgrade choice show the whole bag** (colour tabs, tiles on offer highlighted).
- **The test panel** gets "unlock all stages" and unit levels 0 to 5 with the branch choice.
- Kept: no-run-out tiles (rest for the fight), tile stars (still an experiment), momentum (still experimental), rarity, picks of three, nodes, Runner and Guard.

## 12. Where to take it next: combining with the older designs (brainstorm, not coded)

Test for every idea: does it add fun without adding a rule the player must remember? Anything new
must be visible on the tile, the board or one always-shown line.

### 12.1 Give it faces (from DESIGN_V2 and the bestiary)
- **Units become guardian beasts.** The 15 units map onto beasts from `docs/data/units.json`; the
  five colours are five elements (red Fire, blue Water, green Wood, yellow Light, purple Shadow).
  The level-5 branch is the beast's evolution. The portrait sits on the unit card and small on its
  tiles; rules stay number, edge marks and colour.
- **Enemies become bestiary monsters.** Wide bodies and bosses already match the old multi-tile
  footprints. Each region draws its monsters from one culture set.

### 12.2 Put it on the map (from WP20 and WORLD_PROGRESSION)
- The ten stages are the ten regions; a stage's four steps and boss are spots in one sub-area of
  the tile map that already exists for Greenvale and Ashkara.
- **Puzzle shrines:** hand-made one-attack puzzles with a fixed hand (the first sample), found on
  the map, one-time reward. A daily shrine with a shared seed.

### 12.3 One hero button (from the hero design)
- A hero has one ability, usable once per fight, shown as a single button: "every tile +1 this
  attack", "one rested tile comes back", "one tile counts as any colour this attack".
- Heroes are collectible and change how a team is built.

### 12.4 Relics as run perks (from the relic list; left out of the prototype so far)
- At most three per run, picked after elites and bosses, always listed under the board.
- All about layout and damage: "sandwiches triple", "the front row gets +1", "a x4 sandwich heals 2",
  "Forks also hit their own column".

### 12.5 Items are tiles with extra marks (from the item design: all drop common, roll up)
- A colourless tile that rolls Rare or Epic gains extra edge marks (another lane, another boost
  side) instead of text sub-effects, so an item is read like any tile.
- Each boss drops its own signature shape, which nothing else drops.

### 12.6 Camp (from the Camp design)
- Coins also buy permanent upgrades between stages: hero HP, a fourth colourless slot, a better
  first pick, a camp forge that stars a colourless tile permanently.

### 12.7 Needed fixes before any of this
- Cap multiplier stacking (late layouts reach thousands of damage).
- Big tiles are too small to read in the hand.
- Rebalance stage 9's boss and Endless.

### 12.8 Suggested order
1. Fixes in 12.7. 2. Hero button and relics (most fun per rule added). 3. Beasts and monsters as
faces with existing placeholder art. 4. Puzzle shrines. 5. Map as the stage select. 6. Camp and
item marks.

## 13. Fourth prototype: fixes, heroes, relics and puzzle shrines

Prototype: `prototype/samples/tile-run.html`, details in `docs/TILE_RUN_PROTOTYPE.md`. The owner asked for steps 1, 2 and 4 of 12.8 ("the map will be later; for now still maintain as a list"; "implement first, don't balance yet"). Nothing here is balanced.

- **Fixes:** multiplier stacking is capped (`multCap`, placeholder 4; Sandwich applies on top; a "max" mark shows); big tiles are drawn at true shape and proportion in the hand, bag and pick cards; two-colour tiles got readable numbers; the enemy HP number no longer touches the attack number on 6-column boards. Stage 9's boss and Endless are not rebalanced.
- **Hero button:** one hero per run (five, the first owned, others unlock for coins), one ability once per fight as a single button on the fight screen: Rally, Second Wind, Prism, Overcharge, Guard. Tap-to-aim abilities have a targeting state and Cancel; effects show in the live totals before attacking and are undone on cancel.
- **Relics:** twelve run-only perks, at most three per run, one sentence each, always listed under the board and on the run map. Offered one of three after each elite and, in Endless, after each boss; in the campaign the boss ends the stage so relics come only after the stage's elite. Perks that were order dependent or hard to show (first tile doubled, boosts boosting boosts, free colour choice) were dropped.
- **Puzzle shrines:** a "Puzzles" list on Home with 15 hand-made one-attack puzzles that use the game's rules, unlocked with the stages, each teaching one idea; first solve pays, replays are free, retry is instant. A brute-force solver script that shares the rules code verified every puzzle (2 to 64 layouts each; at most 1.1 percent of random fills win) and stored solutions are used for testing. A daily puzzle is generated from the date with a hidden solution built first, one small reward per day.
- **Left for later (12.8):** beasts and monsters as faces, the map as stage select, camp and item marks. The puzzle shrines are a list on Home for now.

## 14. Progression brainstorm: collectable coloured tiles, units, rainbow, map (now built, see Implemented below)

Status: brainstorm; implemented in the fifth prototype version, see "Implemented" at the end of this section. Home screen choice so far: layout C "Focus" (one big Continue tile, pips, small row).

### 14.1 The user's proposal

1. Coloured tiles become collectable. After beating a boss the player may keep one coloured tile gained in that run.
2. Only tiles that were new in the run can be kept. Upgrades made during a run are reset when the run ends.
3. Kept tiles can merge and gain stars like colourless tiles.
4. Each unit has only 3 base tiles. Unit level-ups upgrade those 3 tiles and nothing else.
5. Units also have extra slots, gained by level or bought, which hold collected tiles.
6. Units come from gacha. Higher rarity units have better base tiles.
7. Stages get progressively longer; higher stages give a higher chance of better tiles.
8. New tile kind: Rainbow. A universal colour that can sandwich with every colour. Animated five-colour border.
9. Colourless tiles cannot sandwich, so their base values must be strong to compensate (a coloured tile can reach x4 or more).
10. Open question from the user: should tiles be gacha too?
11. The stage select is a field of stage tiles that expands in all directions from an origin; the further from the origin, the harder. Each stage tile carries art built from the earlier tile-defense tilesets (a 3x3 or 5x5 picture), so progress gradually opens the map.

### 14.2 Review

What works well
- It answers the old complaint "the unit types don't change until endgame": the unit is a small fixed identity (3 tiles) and the slots are where the player's own collection shows.
- A run now ends with a lasting, chosen reward (one tile), which gives a reason to replay stages without raising stakes or adding rules.
- "Upgrades reset, only new tiles are kept" is one sentence and keeps permanent power under control.
- Three tile families with one-line identities:
  - Coloured: normal value, can be sandwiched and can be bread.
  - Colourless: high value, never part of a sandwich.
  - Rainbow: low value, counts as every colour.
- The map as a growing field of tiles uses the game's own picture (a board that fills up) for the meta game.

Risks and how to handle them
- Too many power axes (unit rarity, unit level, slots, tile rarity, stars). Suggestion: let each axis do one job.
  - Unit rarity = more interesting base tiles (shapes, lanes, a boost or multiplier in the kit), not simply bigger numbers. A common unit should stay usable.
  - Unit level = numbers on the 3 base tiles (+1 steps), with the existing level 5 branch A/B kept as the one big choice.
  - Slots = how much of the collection a unit can carry (start 1, up to 3 or 4).
  - Tile stars = numbers on collected tiles.
- Bag size and hand clutter. With 5 units x (3 base + up to 4 slots) + 3 colourless the bag could reach 38 tiles. Suggest a cap near 25: 3 base + 2 slots per unit by default, a third slot late.
- Kept tiles should be bound to a colour, not to a unit, so changing the red unit does not strand the red collection.
- Rainbow rule must stay one sentence: "A rainbow tile counts as every colour." Under the existing sandwich rule this gives:
  - As bread: a rainbow and any coloured tile (or two rainbows) bracket a tile.
  - As filling between two tiles of one colour: doubled, since it also has other colours.
  - As filling between two rainbows: not doubled (it has no colour the bread lacks). Slightly odd but follows from the rule; alternatively state "rainbow bread always works" as the single exception. To decide when prototyping.
  - Rainbow is strong as bread, so keep it rare and low in base value, and limit how many fit in a bag (e.g. 2).
- Where rainbow tiles live: simplest is "a rainbow tile fits any unit's slot". The existing in-run upgrade "second colour" could have rainbow as its top step (one colour, two colours, rainbow), but since upgrades reset that would be run-only; permanent rainbows would be rare boss drops.
- Colourless value: with every bracketed line now counting (x2, x4, x8 for wide tiles) a colourless tile needs roughly 2x to 3x the number of a coloured tile of the same shape to be a real choice. To tune later; flag only.
- Longer stages versus "short and casual". Suggest length grows by ring, with a ceiling: ring 1 = 3 fights + boss, ring 2 = 4, ring 3 = 5, ring 4+ = 6 with a mid-boss. Runs already save and resume. One keep per boss (so a mid-boss gives a second keep on long stages).
- Losing a run: options (to decide)
  a. Keep nothing but coins (clear, but harsh).
  b. Keep is only offered on a boss win (same thing, phrased as a reward).
  c. On defeat keep one random new tile at Common quality.
  Recommendation: b. No penalty wording, the boss is simply where tiles are earned.

Should tiles be gacha too?
- Recommendation: no. Units from gacha, tiles from play. Reasons: two gachas split the currency and the excitement; tiles earned from stages give every stage a purpose (its drop table); it keeps "reward creativity" (you earn the tile by using it in a run you won).
- Softer alternatives if more sources are wanted: a small daily tile shop for coins (3 offers), a forge that merges three unwanted tiles into one random tile of the same rarity, the daily puzzle paying one tile.

### 14.3 More ideas in the same direction

Units and gacha
- Rarity tiers Common / Rare / Epic (same words and edge colours as tiles).
- Duplicate units convert to level shards for that unit, so a pull is never wasted.
- A visible pity counter; pulls paid with coins earned in play (prototype has no real money).
- Each unit's 3 base tiles follow a pattern the player can read at a glance: 2 attack tiles + 1 signature tile (the boost, multiplier, copy or big shape that defines the unit).
- Starter team is five Commons, one per colour.

Collected tiles
- Every stage shows its drop table on the map: which colours, which tile kinds, best rarity. Higher rings add rarity chance and bigger shapes.
- Signature drops: one special tile per boss that only that boss gives (a chase, and a reason to revisit).
- In-run picks stay as they are (new tile / upgrade / heal). The new tiles picked during the run are the candidates for the keep.
- The keep screen shows the candidates at base value with the note "upgrades are not kept".
- Duplicates merge into stars (as colourless do now). A codex screen lists every tile seen and owned.
- Loadout: per unit, drag owned tiles of its colour into its slots; presets later.

Map
- Origin tile in the centre; neighbours are revealed (dashed) when an adjacent stage is cleared; ring distance = difficulty and run length.
- Each direction is a region with its own tileset art and its own colour bias for drops (for example north = snow = blue tiles), so the player chooses a direction to get what the team lacks.
- Stage art: each stage tile is a 3x3 (ring 1 to 2) or 5x5 (later rings) picture made of the old tile-defense tileset tiles. Battle screens stay abstract; art appears only on the map.
- Special cells among the stages: puzzle shrines (the current 15 puzzles placed on the map), the Endless gate (ring 3), a hero shrine, a shop.
- The core rule on the map: a stage lying between two cleared stages of the same region is "sandwiched" and gives a bonus (double coins or a better drop chance). One rule, reused, and it rewards choosing a route.
- Home (layout C) keeps the big Continue tile; its face becomes the art of the next stage and the pips become a tiny map; tapping it opens the full map.
- Stars or a tick per stage for one-attack clears, as a quiet optional goal (not a mission row in battle).

Rainbow look
- Options are being drawn in `prototype/samples/tile-run-rainbow.html`: animated or static five-colour borders in the game's muted colours, calm and distinct from two-colour tiles, gold clamps and rarity edges.

### 14.4 Open questions for the user

1. Losing a run: nothing kept except coins (option b above), or a small consolation?
2. Slots: how many per unit at most (2, 3 or 4), and bought with coins, earned by level, or both?
3. Rainbow between two rainbows: follow the plain rule (not doubled) or allow it?
4. Rainbow source: boss-only drops, gacha units' base tiles, or both?
5. Does unit rarity change numbers at all, or only the kind of base tiles?
6. Map shape: square grid like the board (4 neighbours) or free in 8 directions; and roughly how many stages (25 = 5x5, 49 = 7x7)?
7. Do the current 10 campaign stages become the first cells of the map, with the list removed?

### 14.5 Suggested build order (when coding starts)

1. Home screen layout C.
2. Unit rework: 3 base tiles + slots, level-ups upgrade base tiles; coloured tile inventory; keep-one after a boss; upgrades reset.
3. Rainbow tile kind and its sandwich rule.
4. Map as stage select (abstract cells first, art after).
5. Unit gacha with coins.
6. Balance pass (colourless values, slot counts, drop tables).

### 14.6 Implemented (fifth prototype version)

Built in `prototype/samples/tile-run.html`; rules and numbers are in `TILE_RUN_PROTOTYPE.md` (fifth iteration). Defaults chosen for the open questions in 14.4:

1. Losing a run: only coins are kept (option b); a keep is earned at a boss, so an earlier mid-boss keep stays. Endless gives no keeps.
2. Slots: Common 1, Rare 2, Epic 3, bought with coins at rising prices (40, 90, 160), not by level.
3. Rainbow between two rainbows: not doubled (the plain rule plus an explicit exception); every other case follows the rule literally.
4. Rainbow source: boss drops on far cells only (tier 7 or more), offered on the keep screen; not part of any unit's base tiles. Max 2 in a team.
5. Unit rarity changes the kind of base tiles (shapes, lanes, signature) and the strength of its one effect; level 1-5 only raises numbers. The level 5 branches were dropped.
6. Map: square grid, 4 neighbours, 7x7 (49 cells), Manhattan distance 0..6 mapped to the ten tiers (tiers at distance 3 to 5 have two options chosen by position).
7. The old 10 stages are the ten tiers; the list is gone, the map is the home screen. Run length 3 steps at the origin up to 8 at the far edge, a mid-boss from 6.
- Also decided: levels come only from duplicate shards (no coin route); single pull 30 coins, Epic pity every 20 pulls; tiles are not gacha; colourless numbers doubled (`colourlessFactor`); no "sandwich on the map" bonus (rejected by the user); Endless after clearing a cell at distance 2; stage art is a 3x3 terrain-tile mosaic per cell (5 regions x 4 tiles, about 43 KB).
