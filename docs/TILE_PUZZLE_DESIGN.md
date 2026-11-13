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
