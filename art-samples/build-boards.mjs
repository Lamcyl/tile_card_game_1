// Builds boards-gallery.html: the board design mockups side by side at phone size.
// node art-samples/build-boards.mjs
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const BOARDS = [
  ['ink-scroll', 'Ink scroll', 'Sumi-e hanging scroll: rice paper, brushed grid, misty mountains in grey wash.'],
  ['papyrus-tomb', 'Papyrus tomb', 'Egyptian tomb wall: sandstone, glyph border, lotus columns, a Nile band.'],
  ['maya-stone', 'Maya stone', 'Carved limestone temple: stepped frame, glyph blocks, creeping jungle vines.'],
  ['norse-longhouse', 'Norse longhouse', 'Carved oak game table: knotwork border, iron straps, firelight.'],
  ['slavic-papercut', 'Slavic papercut', 'Folk cut-paper motifs in red and black, cross-stitch border.'],
  ['ukiyo-e', 'Ukiyo-e', 'Woodblock print: flat colour, keylines, stylised waves and clouds.'],
  ['stained-glass', 'Stained glass', 'Gothic window: dark leading, jewel-tone panes, clear glass tiles.'],
  ['watercolour', 'Watercolour', 'Storybook painting: soft washes, a meadow from above, paper showing through.'],
  ['star-chart', 'Star chart', 'Celestial astrolabe: night blue, gold constellations, brass rings.'],
  ['swiss-minimal', 'Swiss minimal', 'Pure minimalism: off-white, hairline grid, one accent, nothing else.'],
];

const LOCATIONS = [
  ['loc-grassland', 'Grassland', 'Open meadow with stone pavers set in the grass.'],
  ['loc-forest', 'Forest', 'Forest clearing under the canopy.'],
  ['loc-swamp', 'Swamp', 'Murky marsh with planks and reeds.'],
  ['loc-beach', 'Beach', 'Sandy shore meeting the sea.'],
  ['loc-desert', 'Desert', 'Dunes and sun-baked sand slabs.'],
  ['loc-canyon', 'Canyon', 'Red-rock badlands and mesa ledges.'],
  ['loc-ice', 'Ice field', 'Frozen tundra with ice plates and snow.'],
  ['loc-mountain', 'Mountain peak', 'Rocky summit above the clouds.'],
  ['loc-volcano', 'Volcano', 'Cooled basalt slabs over glowing lava.'],
  ['loc-crystal-cave', 'Crystal cave', 'Underground cavern lit by crystals.'],
];
// node build-boards.mjs locations → the round-2 location boards.
const round = process.argv[2] === 'locations' ? 'locations' : '';
const LIST = round ? LOCATIONS : BOARDS;
const dir = new URL('./boards/', import.meta.url);
let n = 0;
const cards = LIST.map(([slug, name, desc]) => {
  n++;
  const file = new URL(slug + '.svg', dir);
  // Embedded as an <img> so each board's own styles and ids stay isolated.
  const art = existsSync(file)
    ? '<img alt="' + name + ' board" src="data:image/svg+xml;base64,' + readFileSync(file).toString('base64') + '">'
    : '<div class="missing">Not drawn</div>';
  return '<article class="card"><header><span class="num">' + n + '</span><div><h2>' + name + '</h2><p>' + desc + '</p></div></header><div class="phone">' + art + '</div></article>';
}).join('\n');

const page = `<!DOCTYPE html>
<html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Board ${round ? 'Locations' : 'Designs'}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
  /* Layout: a numbered card per board, each showing the full phone-sized mockup. */
  :root {
    --paper: #f3eee3; --card: #fbf8f1; --ink: #1b1a1a; --muted: #6b655c; --line: #ddd5c6; --seal: #c8352b;
    --display: "Shippori Mincho", "Hiragino Mincho ProN", Georgia, serif; --body: "Zen Kaku Gothic New", system-ui, sans-serif;
  }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; } }
  :root[data-theme="dark"] { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; color-scheme: dark; }
  * { box-sizing: border-box; }
  body { background: var(--paper); color: var(--ink); font: 15px/1.5 var(--body);
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  .wrap { max-width: 1240px; margin: 0 auto; padding-block: 28px 56px; display: grid; gap: 24px; }
  h1 { font: 800 clamp(28px, 4.5vw, 42px)/1.1 var(--display); margin: 0; }
  .top p { margin: 8px 0 0; color: var(--muted); max-width: 68ch; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: grid; gap: 12px; align-content: start; min-width: 0; }
  .card header { display: flex; gap: 10px; align-items: flex-start; }
  .num { flex: none; width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--seal); color: var(--seal); display: grid; place-items: center; font: 800 14px var(--display); }
  h2 { font: 800 19px/1.2 var(--display); margin: 0; }
  .card header p { margin: 2px 0 0; font-size: 13px; color: var(--muted); }
  .phone { border-radius: 22px; overflow: hidden; border: 6px solid #1b1a1a; aspect-ratio: 390 / 700; background: #000; }
  .phone img { display: block; width: 100%; height: 100%; }
  .missing { height: 100%; display: grid; place-items: center; color: #999; }
</style>
<div class="wrap">
  <header class="top"><h1>Board designs${round ? ': locations' : ''}</h1><p>Ten ${round ? 'locations' : 'directions'} for the 5×5 battle board (2 enemy rows on top, 3 player rows below), each shown on a phone screen with real units placed and one highlighted drop tile. Tell me which numbers to take further.</p></header>
  <section class="grid">
${cards}
  </section>
</div>`;
const out = round ? 'boards-locations.html' : 'boards-gallery.html';
writeFileSync(new URL('./' + out, import.meta.url), page);
console.log(out, Math.round(page.length / 1024) + ' kB');
