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
