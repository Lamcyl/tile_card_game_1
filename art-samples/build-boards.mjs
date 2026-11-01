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
const MAPS = [
  ['map-parchment', 'Explorer\'s parchment', 'Hand-inked fantasy map with watercolour regions, drawn on aged paper.'],
  ['map-diorama', 'Bright diorama', 'Polished top-down game terrain in the style of the location boards.'],
  ['map-islands', 'Floating islands', 'Isometric sky islands per region, linked by bridges.'],
  ['map-hex', 'Hex board game', 'Region hex tiles like a tabletop board, with tokens on nodes.'],
  ['map-pixel', 'Pixel JRPG', 'Retro 16-bit overworld with tile-based terrain.'],
  ['map-papercraft', 'Papercraft', 'Layered cut-paper diorama with soft drop shadows.'],
];
const EXPLORE = [
  ['explore-trails', 'Branching trails', 'Close-up path network: forks lead to monsters standing in clearings.'],
  ['explore-freeroam', 'Free roam', 'Open terrain the hero walks freely; monsters wander with danger rings.'],
  ['explore-tiles', 'Tile steps', 'The region as big terrain tiles; the hero moves tile to tile, monsters hold tiles.'],
  ['explore-isometric', 'Isometric 2.5D', 'Angled diorama camera with depth; paths wind up into the next region.'],
  ['map-diorama', 'Overview (fast travel)', 'The zoomed-out style-2 map, now used for fast travel between regions.'],
];
const TILES = [
  ['tiles-1-watercolour-square', 'Watercolour squares', 'Soft brushed-edge square tiles on paper: trees, rock, water and wall tiles, glowing ring pads under monsters, fog as drifting cloud.'],
  ['tiles-2-hex-boardgame', 'Painted hex board game', 'Chunky hexes on a wooden-framed game board; unexplored hexes are face-down indigo tiles with wave patterns.'],
  ['tiles-3-iso-diorama', 'Isometric diorama', 'Rounded diamond tiles with real height: cliffs, a sunken river and a raised wall gate, fading into cloud at the edges.'],
  ['tiles-4-ink-minimal', 'Ink grid on paper', 'Hairline square grid with small line-drawn icons and a single vermilion accent; fog is just stipple. Units stand out most here.'],
  ['tiles-5-papercraft-chunky', 'Chunky papercraft', 'Thick raised cardstock tiles with cut-out trees, round paper tokens under monsters; reachable tiles pop up in yellow, fog is crumpled grey paper.'],
];
const TILEMAPS = [
  ['tilemap-1-watercolour-wash', 'Watercolour wash', 'Japanese watercolour: washes bleed across tiles into one meadow, brush-mark trees, pooled-pigment river, paper-mist fog.'],
  ['tilemap-2-handpainted-autotile', 'Hand-painted autotiles', 'Crisp 2D tilemap: sandy autotiled shores, cliff tops with front faces, round-canopy forest, corner-tick step highlight.'],
  ['tilemap-3-three-quarter-tall', 'Three-quarter tall objects', 'Trees, cliffs, the shrine, the shop and the boss gate stand up and overlap the tile above; fog is soft clouds.'],
  ['tilemap-4-lowpoly-terraces', 'Low-poly terraces', 'Faceted diorama: a raised rock plateau, a sunken lake, pine cones, octagon pads under monsters and the hero.'],
  ['tilemap-5-flat-bold-regions', 'Flat bold regions', 'Minimal tilemap of bold colour regions with rounded plates only under tiles of interest; fog is scalloped lavender.'],
];
const TILEMAPS4 = [
  ['tilemap4-a-bright-block-diorama', 'A. Bright block diorama', 'Isometric tile blocks with earth-layer sides, grass terraces, a stone rock wall and gatehouse, and water all around.'],
  ['tilemap4-b-pastel-island-chain', 'B. Pastel island chain', 'Softer pastel palette and deeper bevels: islands joined by narrow strips, blossom trees and drifting fog clouds.'],
  ['tilemap4-c-moody-fortress-plateau', 'C. Moody fortress plateau', 'Darker three-quarter view: stone plateaus, a battlemented wall and a torch-lit boss gate with its guardian beside it.'],
  ['tilemap4-d-watercolour-tile-blocks', 'D. Watercolour tile blocks', 'Our indigo, moss, ochre and rose palette with vermilion accents, rendered as stacked three-quarter tile blocks.'],
];
const TILEMAPS3 = [
  ['tilemap3-a-wash-ink-outlines', 'A. Wash ground, inked objects', 'Seamless watercolour ground with a thin ink outline on the tall trees, cliffs, gate, shrine, shop and chest.'],
  ['tilemap3-b-painted-soft-shadow', 'B. Wash ground, painted objects', 'Same ground; objects have no outlines, only soft painted shading and a gentle drop shadow that anchors them.'],
  ['tilemap3-c-high-camera-contact', 'C. Higher camera, contact shadows', 'Camera tilted more top-down: shorter cliffs and squatter trees, tight contact shadows under every object.'],
  ['tilemap3-d-rich-terrain-step-cues', 'D. Rich terrain, step cues', 'Flowers, pebbles and puddles in the grass; tiny corner ticks appear only on the hero\'s four step tiles.'],
  ['tilemap-1-watercolour-wash', 'Round 2 · 1. Watercolour wash', 'For comparison: the terrain you liked.'],
  ['tilemap-3-three-quarter-tall', 'Round 2 · 3. Three-quarter tall', 'For comparison: the crisp objects you liked.'],
];

const GREENVALE = [
  ['greenvale-1-sunny-meadows', '1. Sunny Meadows', 'Rolling wildflower grass, a lone blossom tree, a farm gate in the hedge. Gentle: tanuki boss, one-skull foes.'],
  ['greenvale-2-old-oak-wood', '2. Old Oak Wood', 'Dense oak forest in dappled shade, the giant sacred oak with its shimenawa rope, a door in a hollow trunk. Tengu boss.'],
  ['greenvale-3-bamboo-valley', '3. Bamboo Valley', 'Bamboo groves split by a stream and a plank bridge, a stone lantern event, a thatched hut gate. Jorogumo boss.'],
  ['greenvale-4-mirror-lake', '4. Mirror Lake', 'A still lake with lilies and reeds, a vermilion torii standing in the water, a jetty and a boathouse gate. Imugi boss.'],
  ['greenvale-5-rice-terraces', '5. Rice Terraces', 'Stepped paddies with earth banks, a water channel and waterwheel, a white storehouse gate. Bulgasari boss.'],
  ['greenvale-6-mossy-ruins', '6. Mossy Ruins', 'Crumbled shrine walls under moss, a broken torii, glowing stone lanterns, a ruined archway gate. Gashadokuro boss.'],
  ['greenvale-7-firefly-marsh', '7. Firefly Marsh', 'Dusk over a wetland: boardwalk islands, lily pads, lanterns and drifting fireflies, a stilt-hut gate. Orochi boss.'],
  ['greenvale-8-misty-highlands', '8. Misty Highlands', 'Rocky ochre pasture, standing stones and drifting mist below the stone mountain gate. Raijin boss.'],
];

// node build-boards.mjs locations → the round-2 location boards; maps → overworld map styles.
const round = ['locations', 'maps', 'explore', 'tiles', 'tilemaps', 'tilemaps3', 'tilemaps4', 'greenvale'].includes(process.argv[2]) ? process.argv[2] : '';
const LIST = round === 'greenvale' ? GREENVALE : round === 'tilemaps4' ? TILEMAPS4 : round === 'tilemaps3' ? TILEMAPS3 : round === 'tilemaps' ? TILEMAPS : round === 'tiles' ? TILES : round === 'explore' ? EXPLORE : round === 'maps' ? MAPS : round ? LOCATIONS : BOARDS;
const dir = new URL(round === 'maps' || round === 'explore' || round === 'tiles' || round === 'tilemaps' || round === 'tilemaps3' || round === 'tilemaps4' || round === 'greenvale' ? './maps/' : './boards/', import.meta.url);
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
<title>${round === 'greenvale' ? 'Greenvale: 8 sub-areas' : round === 'tilemaps4' ? 'Tile map designs, round 4' : round === 'tilemaps3' ? 'Tile map designs, round 3' : round === 'tilemaps' ? 'Tile map designs, round 2' : round === 'tiles' ? 'Tile map designs' : round === 'explore' ? 'Exploration Map' : round === 'maps' ? 'Overworld Map Styles' : 'Board ' + (round ? 'Locations' : 'Designs')}</title>
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
  <header class="top"><h1>${round === 'greenvale' ? 'Greenvale: 8 sub-areas' : round === 'tilemaps4' ? 'Tile map designs, round 4' : round === 'tilemaps3' ? 'Tile map designs, round 3' : round === 'tilemaps' ? 'Tile map designs, round 2' : round === 'tiles' ? 'Tile map designs' : round === 'explore' ? 'Exploration map' : round === 'maps' ? 'Overworld map styles' : 'Board designs' + (round ? ': locations' : '')}</h1><p>${round === 'greenvale' ? 'The starting region as eight tilemap mockups in the round-3 design B style, from very easy to the region boss gate. Each shows its landmark, obstacles, the hero\'s step tiles, three enemies with skull pips, points of interest, fog at the edges and the sub-area boss beside its gate.' : round === 'tilemaps4' ? 'Four tabletop-diorama takes: chunky tile blocks with visible earth and stone sides, flat-shaded low-poly props, enemies on round pedestals with skull pips, the hero\'s step tiles raised and lit, and unexplored tiles under fog. No filters used. Tell me which to take further.' : round === 'tilemaps3' ? 'Four blends of round 2\'s watercolour terrain with its crisp three-quarter objects, no filters used. Each shows the boss beside the gate door, enemies with skull pips, and the hero\'s four step tiles. Round-2 designs 1 and 3 are at the end for comparison. Tell me which to take further.' : round === 'tilemaps' ? 'Five seamless tilemaps, no grid lines: terrain joins into continuous ground with proper shores, forests and cliffs. The grid is felt through tile-sized objects and the soft highlight on the hero\'s step options. Tell me which numbers to take further.' : round === 'tiles' ? 'Five tile-based takes on the exploration map: every tile is passable ground, an obstacle or boundary, or a tile of interest (enemy with danger skulls, chest, shrine, shop, boss gate). No paths; the hero steps to a highlighted neighbouring tile. Tell me which numbers to take further.' : round === 'explore' ? 'Four takes on the zoomed-in map the player explores — choosing a direction and which monster to fight — in the Bright diorama style, with the zoomed-out overview last for comparison as the fast-travel map.' : round === 'maps' ? 'Six styles for the overworld map, each a phone-screen slice: the Camp and grassland at the bottom, other regions above, cleared, available and locked encounter nodes, elites, a boss and fog beyond it.' : 'Ten ' + (round ? 'locations' : 'directions') + ' for the 5×5 battle board (2 enemy rows on top, 3 player rows below), each shown on a phone screen with real units placed and one highlighted drop tile.'} Tell me which numbers to take further.</p></header>
  <section class="grid">
${cards}
  </section>
</div>`;
const out = round === 'greenvale' ? 'greenvale-gallery.html' : round === 'tilemaps4' ? 'tilemaps4-gallery.html' : round === 'tilemaps3' ? 'tilemaps3-gallery.html' : round === 'tilemaps' ? 'tilemaps-gallery.html' : round === 'tiles' ? 'tiles-gallery.html' : round === 'explore' ? 'explore-gallery.html' : round === 'maps' ? 'maps-gallery.html' : round ? 'boards-locations.html' : 'boards-gallery.html';
writeFileSync(new URL('./' + out, import.meta.url), page);
console.log(out, Math.round(page.length / 1024) + ' kB');
