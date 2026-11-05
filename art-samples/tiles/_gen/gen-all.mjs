// Regenerates every tile + manifest.json:   node art-samples/tiles/_gen/gen-all.mjs
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, registry } from './lib.mjs';
rmSync(join(ROOT, 'greenvale'), { recursive: true, force: true });
rmSync(join(ROOT, 'ashkara'), { recursive: true, force: true });
await import('./gen-ground.mjs'); await import('./gen-props.mjs'); await import('./gen-interest.mjs');
await import('./gen-meadow.mjs'); await import('./gen-oakwood.mjs');   // sub-area step 2: Sunny Meadows + Old Oak Wood
await import('./gen-bamboo.mjs'); await import('./gen-lake.mjs');      // sub-area step 3: Bamboo Valley + Mirror Lake
await import('./gen-rice.mjs'); await import('./gen-ruins.mjs');      // sub-area step 4: Rice Terraces + Mossy Ruins (each pulls in its *-objects.mjs)
await import('./gen-marsh.mjs'); await import('./gen-hills.mjs');   // sub-area step 5: Firefly Marsh + Misty Highlands (each pulls in its edges/objects/props/interest files)
await import('./gen-desert-ground.mjs'); await import('./gen-desert-nature.mjs'); await import('./gen-desert-props.mjs'); await import('./gen-desert-interest.mjs');   // desert region step 1: Ashkara common
await import('./gen-ashkara-dune-shallows.mjs');   // Ashkara sub-area 1: Dune Shallows (pulls in its objects and interest files)
await import('./gen-ashkara-seven-palms.mjs');   // Ashkara sub-area 2: Seven Palms (pulls in its objects, interest and decals files)
await import('./gen-ashkara-singing-erg.mjs'); await import('./gen-ashkara-singing-erg-objects.mjs'); await import('./gen-ashkara-singing-erg-interest.mjs'); await import('./gen-ashkara-singing-erg-decals.mjs');   // Ashkara sub-area 3: Singing Erg (four files, each runnable on its own; helpers in singing-erg-lib.mjs)
await import('./gen-ashkara-salt-mirror.mjs'); await import('./gen-ashkara-salt-mirror-objects.mjs'); await import('./gen-ashkara-salt-mirror-interest.mjs'); await import('./gen-ashkara-salt-mirror-decals.mjs');   // Ashkara sub-area 4: Salt Mirror (four files, each runnable on its own; helpers in salt-mirror-lib.mjs)
await import('./gen-ashkara-red-wadi.mjs'); await import('./gen-ashkara-red-wadi-objects.mjs'); await import('./gen-ashkara-red-wadi-interest.mjs'); await import('./gen-ashkara-red-wadi-decals.mjs');   // Ashkara sub-area 5: Red Wadi (four files, each runnable on its own; helpers in red-wadi-lib.mjs)
await import('./gen-ashkara-dust-bazaar.mjs'); await import('./gen-ashkara-dust-bazaar-objects.mjs'); await import('./gen-ashkara-dust-bazaar-interest.mjs'); await import('./gen-ashkara-dust-bazaar-decals.mjs');   // Ashkara sub-area 6: Dust Bazaar (four files, each runnable on its own; helpers in dust-bazaar-lib.mjs)
await import('./gen-ashkara-tomb-approach.mjs'); await import('./gen-ashkara-tomb-approach-objects.mjs'); await import('./gen-ashkara-tomb-approach-interest.mjs'); await import('./gen-ashkara-tomb-approach-decals.mjs');   // Ashkara sub-area 7: Tomb Approach (four files, each runnable on its own; helpers in tomb-approach-lib.mjs)
await import('./gen-ashkara-sun-citadel.mjs'); await import('./gen-ashkara-sun-citadel-objects.mjs'); await import('./gen-ashkara-sun-citadel-interest.mjs'); await import('./gen-ashkara-sun-citadel-decals.mjs');   // Ashkara sub-area 8: Sun Citadel (four files, each runnable on its own; helpers in sun-citadel-lib.mjs)
const order = ['ground', 'ground-detail', 'decals', 'edges', 'trees', 'rocks', 'grass', 'fences', 'props', 'interest', 'overlays'];
const REGIONS = ['greenvale', 'ashkara'];   // greenvale first keeps its manifest order unchanged
registry.sort((a, b) => REGIONS.indexOf(a.region) - REGIONS.indexOf(b.region) || order.indexOf(a.category) - order.indexOf(b.category) || a.path.localeCompare(b.path));
const countsOf = (rs) => { const c = {}; for (const t of rs) c[t.category] = (c[t.category] || 0) + 1; return c; };
const counts = countsOf(registry.filter(t => t.region === 'greenvale'));   // Greenvale counts (unchanged); see regions.<name>.counts for the others
const manifest = {
  version: 1, tileSize: 64, canvases: { cell: [64, 64], tall: [64, 128], large: [128, 128] },
  light: 'upper-left', pathPattern: '<region>/<subarea|common>/<category>/<name>-<variant>.svg',
  autotile: {
    blob47: { bits: { N: 1, NE: 2, E: 4, SE: 8, S: 16, SW: 32, W: 64, NW: 128 }, rule: 'a diagonal bit counts only when both adjacent orthogonal bits are set', pieces: 47, sets: ['water-shore', 'water-deep', 'dirt-patch', 'sand-patch', 'cliff', 'forest', 'wildflower-patch', 'buttercup-patch', 'lavender-patch', 'floor-patch', 'grass-clearing', 'oak-forest', 'oak-grove', 'bamboo-grove', 'bamboo-grove-golden', 'bamboo-thicket', 'stream', 'stream-mouth', 'lake-shore-pebble', 'lake-deep-mirror', 'lake-beach', 'lake-island', 'lily-bed', 'terrace-earth', 'terrace-stone', 'terrace-paddy-young', 'terrace-paddy-ripe', 'terrace-paddy-stone', 'paddy-field-young', 'paddy-field-ripe', 'paddy-field-stubble', 'lake-bank-earth', 'ruin-paving', 'moss-carpet', 'ruin-pool', 'terrace-mossy', 'platform-paved', 'marsh-pool', 'marsh-pool-weed', 'marsh-pool-lily', 'marsh-deep', 'peat-patch', 'mud-flat', 'bog-carpet', 'dusk-patch', 'dusk-patch-moss', 'reed-bed', 'ochre-patch', 'ochre-patch-peat', 'ochre-patch-moss', 'heather-patch', 'scree-patch', 'gorse-thicket', 'ridge-grey', 'ridge-high', 'mountain-stream', 'ravine', 'dune-ridge', 'oasis-shore', 'hardpan-patch', 'sandstone-cliff', 'dune-crest', 'dry-pool', 'scrub-patch', 'shell-bed', 'pool-lagoon', 'lush-meadow', 'papyrus-bed', 'irrigated-field', 'slip-face-ridge', 'lee-hollow', 'dune-grass-patch', 'ripple-field', 'brine-pool', 'brine-deep', 'salt-crust-shelf', 'mirage-flat', 'hall-wall', 'tomb-wall', 'avenue-paving', 'sand-drift'], fileSuffix: 'zero-padded decimal canonical mask, e.g. water-shore-017.svg', neighbourOutsideSet: 'a neighbour in the set (bit = 1) means the tile continues across that edge' },
    connect4: { bits: { N: 1, E: 2, S: 4, W: 8 }, pieces: 16, sets: ['fence-wood', 'hedge', 'hedge-blossom', 'fence-rail', 'wall-stone-low', 'hedge-wildflower', 'fence-wattle', 'wall-stone-mossy', 'fence-shimenawa', 'fence-bamboo', 'fence-bamboo-screen', 'hedge-sasa', 'jetty-wood', 'jetty-old', 'fence-net', 'channel-water', 'channel-flume', 'rack-line', 'wall-ruined', 'wall-ruined-ivy', 'wall-ruined-low', 'path-flagstone', 'boardwalk', 'boardwalk-mossy', 'boardwalk-broken', 'boardwalk-lantern', 'fence-reed', 'rope-bridge', 'prayer-flags', 'wall-drystone', 'fence-rope-post', 'wall-mudbrick', 'fence-driftwood', 'ditch-irrigation', 'hedge-oleander', 'fence-chime-line', 'fence-sand-slat', 'wall-salt-block', 'track-mine', 'fence-salt-rope', 'wall-hieroglyph', 'wall-sandstone-low', 'colonnade'], fileSuffix: 'two-digit decimal mask, e.g. fence-wood-06.svg' },
    fogEdge: { bits: { N: 1, E: 2, S: 4, W: 8 }, pieces: 15, note: 'bit set = fog hugs that side; mask 0 is empty so it is omitted' },
  },
  subareas: { common: 'shared by the whole region', 'sunny-meadows': 'done (step 2)', 'old-oak-wood': 'done (step 2)', 'bamboo-valley': 'done (step 3)', 'mirror-lake': 'done (step 3)', 'rice-terraces': 'done (step 4)', 'mossy-ruins': 'done (step 4)', 'firefly-marsh': 'done (step 5)', 'misty-highlands': 'done (step 5)' },
  regions: {
    greenvale: { total: registry.filter(t => t.region === 'greenvale').length, counts },
    ashkara: { name: 'Ashkara (desert)', doc: 'art-samples/maps/DESERT.md', total: registry.filter(t => t.region === 'ashkara').length, counts: countsOf(registry.filter(t => t.region === 'ashkara')), subareas: { common: 'done (desert step 1)', 'dune-shallows': 'done (desert step 2)', 'seven-palms': 'done (desert step 3)', 'singing-erg': 'done (desert step 4)', 'salt-mirror': 'done (desert step 5)', 'red-wadi': 'done (desert step 6)', 'dust-bazaar': 'done (desert step 7)', 'tomb-approach': 'done (desert step 8)', 'sun-citadel': 'done (desert step 9)' } },
  },
  counts, total: registry.length, tiles: registry,
};
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(registry.length, 'tiles', counts, 'ashkara', countsOf(registry.filter(t => t.region === 'ashkara')));
