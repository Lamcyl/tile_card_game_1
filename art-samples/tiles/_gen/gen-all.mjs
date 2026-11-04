// Regenerates every tile + manifest.json:   node art-samples/tiles/_gen/gen-all.mjs
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, registry } from './lib.mjs';
rmSync(join(ROOT, 'greenvale'), { recursive: true, force: true });
await import('./gen-ground.mjs'); await import('./gen-props.mjs'); await import('./gen-interest.mjs');
await import('./gen-meadow.mjs'); await import('./gen-oakwood.mjs');   // sub-area step 2: Sunny Meadows + Old Oak Wood
await import('./gen-bamboo.mjs'); await import('./gen-lake.mjs');      // sub-area step 3: Bamboo Valley + Mirror Lake
const order = ['ground', 'ground-detail', 'decals', 'edges', 'trees', 'rocks', 'grass', 'fences', 'props', 'interest', 'overlays'];
registry.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.path.localeCompare(b.path));
const counts = {}; for (const t of registry) counts[t.category] = (counts[t.category] || 0) + 1;
const manifest = {
  version: 1, tileSize: 64, canvases: { cell: [64, 64], tall: [64, 128], large: [128, 128] },
  light: 'upper-left', pathPattern: '<region>/<subarea|common>/<category>/<name>-<variant>.svg',
  autotile: {
    blob47: { bits: { N: 1, NE: 2, E: 4, SE: 8, S: 16, SW: 32, W: 64, NW: 128 }, rule: 'a diagonal bit counts only when both adjacent orthogonal bits are set', pieces: 47, sets: ['water-shore', 'water-deep', 'dirt-patch', 'sand-patch', 'cliff', 'forest', 'wildflower-patch', 'buttercup-patch', 'lavender-patch', 'floor-patch', 'grass-clearing', 'oak-forest', 'oak-grove', 'bamboo-grove', 'bamboo-grove-golden', 'bamboo-thicket', 'stream', 'stream-mouth', 'lake-shore-pebble', 'lake-deep-mirror', 'lake-beach', 'lake-island', 'lily-bed'], fileSuffix: 'zero-padded decimal canonical mask, e.g. water-shore-017.svg', neighbourOutsideSet: 'a neighbour in the set (bit = 1) means the tile continues across that edge' },
    connect4: { bits: { N: 1, E: 2, S: 4, W: 8 }, pieces: 16, sets: ['fence-wood', 'hedge', 'hedge-blossom', 'fence-rail', 'wall-stone-low', 'hedge-wildflower', 'fence-wattle', 'wall-stone-mossy', 'fence-shimenawa', 'fence-bamboo', 'fence-bamboo-screen', 'hedge-sasa', 'jetty-wood', 'jetty-old', 'fence-net'], fileSuffix: 'two-digit decimal mask, e.g. fence-wood-06.svg' },
    fogEdge: { bits: { N: 1, E: 2, S: 4, W: 8 }, pieces: 15, note: 'bit set = fog hugs that side; mask 0 is empty so it is omitted' },
  },
  subareas: { common: 'shared by the whole region', 'sunny-meadows': 'done (step 2)', 'old-oak-wood': 'done (step 2)', 'bamboo-valley': 'done (step 3)', 'mirror-lake': 'done (step 3)', 'rice-terraces': 'planned', 'mossy-ruins': 'planned', 'firefly-marsh': 'planned', 'misty-highlands': 'planned' },
  counts, total: registry.length, tiles: registry,
};
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(registry.length, 'tiles', counts);
