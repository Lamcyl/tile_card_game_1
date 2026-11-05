// Builds the tileset gallery from tiles/manifest.json (run: node art-samples/tiles/build-tileset.mjs).
//   art-samples/tileset-gallery.html        index: overview, sample patches (with reroll), links to the pages below
//   art-samples/tileset/<id>.html           one page per set: common, sunny-meadows, old-oak-wood, bamboo-valley, mirror-lake
// Pages reference the tile SVGs by RELATIVE path (../tiles/greenvale/... from tileset/, tiles/greenvale/... from the index), so each page is only
// a few hundred KB. Host `tileset-gallery.html`, `tileset/` and `tiles/greenvale/` together (same relative layout as in the repo).
// Env: STRICT=1 draws the sample patches without the 0.35px seam-hiding overlap (for seam testing).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compose } from './_gen/compose.mjs';
import { composeSub } from './_gen/compose-sub.mjs';
import { composeDesert } from './_gen/compose-desert.mjs';
import { composeShallows } from './_gen/compose-dune-shallows.mjs';
import { composeSevenPalms } from './_gen/compose-seven-palms.mjs';
import { composeSingingErg } from './_gen/compose-singing-erg.mjs';
import { composeSaltMirror } from './_gen/compose-salt-mirror.mjs';

const here = dirname(fileURLToPath(import.meta.url)), art = join(here, '..');
const man = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const STRICT = !!process.env.STRICT;
const PRE = { 'sunny-meadows': 'sm:', 'old-oak-wood': 'oo:', 'bamboo-valley': 'bv:', 'mirror-lake': 'ml:', 'rice-terraces': 'rt:', 'mossy-ruins': 'mr:', 'firefly-marsh': 'fm:', 'misty-highlands': 'mh:' };
const keyOf = (p) => p.replace(/^ashkara\/dune-shallows\//, 'dd:').replace(/^ashkara\/seven-palms\//, 'sp:').replace(/^ashkara\/singing-erg\//, 'se:').replace(/^ashkara\/salt-mirror\//, 'sl:').replace(/^ashkara\/common\//, 'ds:').replace(/^greenvale\/common\//, '').replace(/^greenvale\/(sunny-meadows|old-oak-wood|bamboo-valley|mirror-lake|rice-terraces|mossy-ruins|firefly-marsh|misty-highlands)\//, (m, s) => PRE[s]).replace(/\.svg$/, '');
const byKey = new Map(man.tiles.map(t => [keyOf(t.path), t]));
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const has = (k) => byKey.has(k);

// ---- set definitions ----
const SETS = {
  common: { title: 'Common', jp: '共通', note: 'Shared by the whole region: seamless ground families, the autotile sets (water shore, deep water, dirt, sand, cliff, forest), trees, rocks, fences and hedges, props, interest objects and overlays.' },
  'desert-common': { region: 'ashkara', sub: 'common', file: 'desert-common', title: 'Ashkara: Desert common', jp: '砂の国', note: 'Step 1 of the second region, the desert Ashkara (design in maps/DESERT.md). Seamless sand, rippled dune, cracked hardpan, reg gravel, sandstone slab, oasis grass and oasis water (all on one shared wash geometry, plus fringe ramps), four 47-piece autotile sets (dune ridge, oasis shore, hardpan patch, sandstone cliff), a mud-brick connect-4 wall, date palms, acacia, cacti, shrubs, mesas, spires and an arch, bones, jars, columns, an obelisk, tents, a camel caravan, a campfire, well and shaduf, chests, shop stalls, a waypoint stele, the djinn lamp, the sandstone pylon gate (closed, open), a sphinx, and heat shimmer, blown sand and dune shadow overlays.' },
  'ashkara-dune-shallows': { region: 'ashkara', sub: 'dune-shallows', file: 'ashkara-dune-shallows', title: 'Ashkara: Dune Shallows', jp: '砂丘の浅瀬', note: 'Sub-area 1 of Ashkara (maps/DESERT.md): pale cream sand under a bright sky with almost no shade. Cream sand, wavelets, dry wadi puddles and clay, shell and fossil sand, scrub sprigs, ramps into the common desert ground; four 47-piece autotile sets (dune crest, dry pool, scrub patch, shell bed) and a driftwood-and-rope fence; dune scrub, saltbush, bleached brush and thorn acacia, sand-washed and half-buried rocks, wind pillars, marram and sea-oats; cairn trails, tumbleweed, whale bones, windsock poles, wagon wheels and camp debris; the half-buried caravan wagon, the waypoint cairn on the dune crest, the whale-rib arch gate (closed and open), a whale skeleton, a fossil dig, an abandoned camp and a driftwood shelter; plus lizard, shell, rut and drift decals and bright haze, spindrift and glare overlays.' },
  'ashkara-seven-palms': { region: 'ashkara', sub: 'seven-palms', file: 'ashkara-seven-palms', title: 'Ashkara: Seven Palms', jp: '七本椰子のオアシス', note: 'Sub-area 2 of Ashkara (maps/DESERT.md): the oasis. Lush yellow-green grass, loam, oasis sand and a cool turquoise pool with lily pads and lotus, ramps into the common desert ground and into the Dune Shallows cream sand; four 47-piece autotile sets (lagoon pool, lush meadow, papyrus bed, irrigated field), a mud-brick irrigation ditch and an oleander hedge (connect-4); fruiting date palms, groves, tamarisk, oleander, pomegranate and fig, papyrus, cattails, shaduf, wells, fish traps, date baskets and jugs, the oasis pool ringed by seven palms (landmark), the palm-frond gate (closed and open), stalls, huts, a pavilion, fountain, dock and camp, decals and palm-shade overlays.' },
  'ashkara-singing-erg': { region: 'ashkara', sub: 'singing-erg', file: 'ashkara-singing-erg', title: 'Ashkara: Singing Erg', jp: '歌う砂海', note: 'Sub-area 3 of Ashkara (maps/DESERT.md): a sea of rippled dunes. Warm apricot sand with violet lee shadows, wind-packed and slip-face sand, bright crest sand, gravel lag, rare dune grass, ramps into the common desert ground, the Seven Palms oasis to the south and the Salt Mirror hardpan to the east; four 47-piece autotile sets (slip-face ridge, lee hollow, dune-grass patch, ripple field), a chime-pole line and a sand-slat fence (connect-4); saxaul, ghost trees, wind acacia, desert broom, buried column tops, statue heads, crest cairns, yardangs, dune grass and singing reeds, chime poles, bone drifts, sand devils, scarab swarms, the drum and bronze bell; the Singing Dune with wind-chime poles (landmark), the twin-pillar arch gate (closed and open), a buried colonnade, a colossal statue head, a chime grove, a nomad camp, a drum platform, a beast skeleton, a crest monument and a scarab nest; plus sound-ring, track, bone and shadow decals and dune-shadow, crest-plume, shimmer and sand-veil overlays.' },
  'ashkara-salt-mirror': { region: 'ashkara', sub: 'salt-mirror', file: 'ashkara-salt-mirror', title: 'Ashkara: Salt Mirror', jp: '塩の鏡', note: 'Sub-area 4 of Ashkara (maps/DESERT.md): a blinding salt lake with a mirage island. Near-white bleached ground under hard cold light, pink brine, cracked hardpan and salt polygons, brine pools, deep brine, raised salt shelves and wet mirror flats, salt-block walls and mine track, salt pillars, dead trees and palms, bleached skulls, abandoned mining carts, glass shards, flamingos, the salt-block gate (closed and open), and mirage shimmer and reflection overlays.' },
  'sunny-meadows': { title: 'Sunny Meadows', jp: '陽だまりの野', note: 'Wildflower carpets and patch autotiles, rolling hills, farm fields with crops, farm fences and stone walls, windmill, barn, beehives, scarecrows, picnic, orchard and sunflowers, the lone blossom tree with petal drift, and a lily pond.' },
  'old-oak-wood': { title: 'Old Oak Wood', jp: '古い樫の森', note: 'Forest-floor variants (moss, roots, litter, ferns, glow), oaks of every age, the sacred oak and its hollow-trunk door, root arches, fungi and glowing mushrooms, fallen logs, shrine stones and a stone circle, a woodcutter camp, owls and webs, plus the meadow to forest blends.' },
  'bamboo-valley': { title: 'Bamboo Valley', jp: '竹の谷', note: 'Green, golden, black and young bamboo (clumps, bushes, stands, three tree-line autotiles), a clear stream autotile with pebbly banks that flows east, stepping stones, rapids, koi, plank bridges and an arched bridge, a waterfall, thatched huts and the hut gate, a tea house, stone lanterns, shishi-odoshi and tsukubai, bamboo fences and screens, valley mist and light shafts. The stream-mouth set blends the stream into Mirror Lake.' },
  'mirror-lake': { title: 'Mirror Lake', jp: '鏡の湖', note: 'Open water with reflections and ripples, lily pads and lotus in several states, reeds and cattails, a pebble-beach shoreline autotile, reflective deep water, islets and island autotile, lily beds, connecting jetties, rowboats and a ferry, the vermilion torii standing in the water with its reflection, boathouse gate, shrine islet, market boat, fishing nets, herons and ducks, willows, and evening sparkle.' },
  'rice-terraces': { title: 'Rice Terraces', jp: '棚田', note: 'Stepped paddy terraces, earth banks, channels and a waterwheel. Flooded paddies in every growth stage (bare water, young shoots, mid green, ripe gold, stubble) with reflections, azolla, tadpoles and seedling bundles; five stepped terrace autotiles whose earth banks and dry-stone retaining walls read as height steps, flat bunded paddy fields, and a lake shore that turns into an earth bank; irrigation channels, wooden flumes and drying-rack lines, a sluice gate, plank bridges, an animated-looking waterwheel (four phases), farmhouses, the white kura storehouse gate to the Mossy Ruins, scarecrows, field shrines and foxes, persimmon trees, straw stacks, ducks, egrets, straw-hat farmer decals and harvest overlays.' },
  'mossy-ruins': { title: 'Mossy Ruins', jp: '苔むす遺跡', note: 'Moss-covered shrine ruins with flagstone, broken torii and wisps. Mossy, cracked, wet and broken flagstone ground, moss carpets, murky pools, a paving patch, moss-grown pool and terrace autotiles that continue the rice terraces uphill into a paved shrine platform, crumbled wall sets (plain, ivy, low rubble) and a flagstone path, standing and toppled pillars, stone lanterns (lit, unlit, broken, spirit-lit), jizo, komainu, gorinto and steles, broken torii, the ruined archway gate to the Firefly Marsh, a collapsed shrine, overgrown stairs, ivy, vines, puddles, will-o-the-wisp glows, mist and light shafts.' },
  'firefly-marsh': { title: 'Firefly Marsh', jp: '蛍の沼', note: 'The marsh at dusk. Dusk-tinted grass (and half-way ramps back to day grass), peat, mud and bog ground, marsh water with duckweed, lilies, sky and firefly reflections; pool, deep-water, peat, mud, bog, reed-bed and dusk-blend autotiles (the dusk patches fade into day grass and into the Mossy Ruins moss); connecting boardwalks (plain, mossy, broken, lantern-lit) and a reed fence; willows, snags, swamp cypress, alders, reeds, cattails, irises, dusk lily pads, sunken boats, stumps in water, floating paper lanterns, lantern poles, will-o-wisps, frogs, heron silhouettes, jizo and shrine pieces; stilt huts, the stilt-hut gate (closed, open), a watchtower, pier and islet shrine; fireflies in several densities, swarms, floating lanterns, mist banks and dusk tint washes.' },
  'misty-highlands': { title: 'Misty Highlands', jp: '霧の高原', note: 'Ochre pasture, heather, gorse, moor, scree and rock slab ground (with ramps from the marsh and the ruins); autotiles for ochre, heather and scree patches, gorse thickets, grey ridges with height, mountain streams and a ravine; a rope bridge, prayer-flag lines, dry-stone walls and rope fences; wind-bent pines, rowan, birch, standing stones, stone circles, cairns, boulders, mountain shrines and lanterns, waterfalls, shepherd huts, goat and bird decals, and the stone mountain gate (closed, open) that leads out of Greenvale; drifting and low mist, rising ravine mist and cloud shadows.' },
};
const catInfo = {
  ground: ['Ground', 'Seamless terrain. Every variant of a family shares one edge-safe wash skeleton, so any two can sit side by side.'],
  'ground-detail': ['Ground detail', 'Terrain with flowers, leaves, fish, pebbles or crops painted inside the safe zone, so it also tiles freely.'],
  decals: ['Decals', 'Transparent stamps (no ground) to scatter over any terrain.'],
  edges: ['Edges and transitions (autotile)', '47-piece blob sets: pick the piece by the 8-neighbour mask. Mask bits N1 NE2 E4 SE8 S16 SW32 W64 NW128.'],
  trees: ['Trees and bushes', 'Tall trees use a 64x128 canvas with the trunk in the bottom cell; great trees fill 128x128.'],
  rocks: ['Rocks and standing stones', 'Obstacles, stepping stones, islets and landmarks.'],
  grass: ['Tall grass, reeds, lilies', 'Concealing grass and water-edge plants.'],
  fences: ['Fences, hedges and jetties (connect pieces)', 'Sixteen pieces per set, chosen by the N1 E2 S4 W8 neighbour mask.'],
  props: ['Small props', 'Stumps, mushrooms, signs, lanterns, boats, bridges, barrels, crates and village dressing.'],
  interest: ['Interest objects', 'Chests, torii, shop stalls, caches, gates (closed and open), huts, boathouses and camps.'],
  overlays: ['Overlays', 'Fog edges, mist, fireflies, dappled light, sparkle and drifting petals. Drawn above everything else.'],
};
const catOrder = Object.keys(catInfo);
const inSet = (t, id) => { const S = SETS[id]; return t.region === (S.region || 'greenvale') && t.sub === (S.sub || id); };
const sets = (tiles) => { const m = new Map(); for (const t of tiles) { if (!m.has(t.name)) m.set(t.name, []); m.get(t.name).push(t); } return m; };

// ---- scenes (same composers run again in the browser for the reroll buttons) ----
const PATCHES = [
  ['p1', 'meadow', 'common', compose(7, has, 'meadow'), 'Reroll meadow'], ['p2', 'forest', 'common', compose(23, has, 'forest'), 'Reroll forest'],
  ['p3', 'meadows', 'sub', composeSub(11, has, 'meadows'), 'Reroll Sunny Meadows'], ['p4', 'oakwood', 'sub', composeSub(5, has, 'oakwood'), 'Reroll Old Oak Wood'],
  ['p5', 'blend', 'sub', composeSub(8, has, 'blend'), 'Reroll meadow to forest blend'],
  ['p6', 'bamboo', 'sub', composeSub(4, has, 'bamboo'), 'Reroll Bamboo Valley'], ['p7', 'lake', 'sub', composeSub(9, has, 'lake'), 'Reroll Mirror Lake'], ['p8', 'stream', 'sub', composeSub(3, has, 'stream'), 'Reroll stream to lake blend'],
  ['p9', 'rice', 'sub', composeSub(6, has, 'rice'), 'Reroll Rice Terraces'], ['p10', 'ruins', 'sub', composeSub(13, has, 'ruins'), 'Reroll Mossy Ruins'], ['p11', 'terraces', 'sub', composeSub(2, has, 'terraces'), 'Reroll lake to terraces to ruins blend'],
  ['p12', 'marsh', 'sub', composeSub(5, has, 'marsh'), 'Reroll Firefly Marsh'], ['p13', 'highlands', 'sub', composeSub(7, has, 'highlands'), 'Reroll Misty Highlands'], ['p14', 'ascent', 'sub', composeSub(3, has, 'ascent'), 'Reroll ruins and marsh to highlands blend'],
  ['p15', 'overview', 'overview', composeSub(12, has, 'overview'), 'Reroll Greenvale overview'],
  ['p16', 'desert', 'desert', composeDesert(14, has), 'Reroll desert oasis'],
  ['p17', 'shallows', 'shallows', composeShallows(5, has), 'Reroll Dune Shallows'],
  ['p18', 'sevenpalms', 'sevenpalms', composeSevenPalms(9, has), 'Reroll Seven Palms'],
  ['p19', 'erg', 'erg', composeSingingErg(4, has), 'Reroll Singing Erg'],
  ['p20', 'saltmirror', 'saltmirror', composeSaltMirror(6, has), 'Reroll Salt Mirror'],
];
const imgPath = (rel, t) => rel + 'tiles/' + t.path;
const sceneSvg = (scene, id, rel) => {
  const body = scene.items.map(it => { const t = byKey.get(it.k), o = !STRICT && ['ground', 'ground-detail', 'edges'].includes(t.category) ? .35 : 0; return `<image href="${imgPath(rel, t)}" x="${it.x - o}" y="${it.y - o}" width="${it.w + 2 * o}" height="${it.h + 2 * o}"/>`; }).join('');
  return `<svg id="${id}" class="patch" viewBox="0 0 ${scene.w} ${scene.h}" role="img" aria-label="Sample scene composed from the tileset">${body}</svg>`;
};
const runtime = `
const compose = ${compose.toString()};
const composeDesert = ${composeDesert.toString()};
const composeShallows = ${composeShallows.toString()};
const composeSevenPalms = ${composeSevenPalms.toString()};
const composeSingingErg = ${composeSingingErg.toString()};
const composeSaltMirror = ${composeSaltMirror.toString()};
const composeSub = ${composeSub.toString()};
const files = ${JSON.stringify(Object.fromEntries(man.tiles.map(t => [keyOf(t.path), [t.path]])))};
const OPAQUE = new Set(['ground', 'ground-detail', 'edges']), STRICT = ${STRICT};
const cat = ${JSON.stringify(Object.fromEntries(man.tiles.map(t => [keyOf(t.path), t.category])))};
const has = (k) => k in files;
function draw(id, seed, which) {
  const sc = (which === 'saltmirror' ? composeSaltMirror : which === 'erg' ? composeSingingErg : which === 'sevenpalms' ? composeSevenPalms : which === 'shallows' ? composeShallows : which === 'desert' ? composeDesert : which === 'meadow' || which === 'forest' ? compose : composeSub)(seed, has, which), el = document.getElementById(id);
  el.innerHTML = sc.items.map(it => { const o = !STRICT && OPAQUE.has(cat[it.k]) ? .35 : 0; return '<image href="tiles/' + files[it.k][0] + '" x="' + (it.x - o) + '" y="' + (it.y - o) + '" width="' + (it.w + 2 * o) + '" height="' + (it.h + 2 * o) + '"/>'; }).join('');
}
for (const b of document.querySelectorAll('[data-reroll]')) b.addEventListener('click', () => draw(b.dataset.reroll, (Math.random() * 1e9) | 0, b.dataset.which));
`;

// ---- page shell ----
const css = readFileSync(join(here, '_gen', 'gallery.css'), 'utf8');
const shell = (title, body, { script = '', nav = '' } = {}) => `<!DOCTYPE html>
<html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>${css}</style>
<body>
<div class="wrap">${body}</div>
${script ? `<script>${script}</script>` : ''}
</html>
`;
const crumbs = (rel, cur) => `<nav class="toc"><a href="${rel}tileset-gallery.html">Overview</a>${Object.entries(SETS).map(([id, s]) => id === cur ? `<b>${esc(s.title)}</b>` : `<a href="${rel}tileset/${id}.html">${esc(s.title)}</a>`).join('')}</nav>`;

// ---- cards ----
const card = (t, rel) => {
  const cells = t.size[0] / 64, w = t.size[0] * 2, label = `${t.name}${t.variant ? ' ' + t.variant : ''}`;
  return `<figure class="card${cells > 1 ? ' wide' : ''}" title="${esc(t.path)}"><div class="paper${t.category === 'overlays' || t.category === 'decals' ? ' dark' : ['ground', 'ground-detail', 'edges'].includes(t.category) ? ' opq' : ''}"><img loading="lazy" decoding="async" src="${imgPath(rel, t)}" width="${t.size[0]}" height="${t.size[1]}" style="width:${w}px;max-width:100%;height:auto" alt="${esc(label)}"></div><figcaption><b>${esc(t.name)}</b> <span>${esc(t.variant || '')}</span><small>${t.size[0]}&times;${t.size[1]}</small></figcaption></figure>`;
};
const catHtml = (cat, tiles, rel) => {
  const [title, note] = catInfo[cat], auto = tiles.some(t => t.tags.includes('autotile'));
  let h = `<section class="cat" id="c-${cat}"><h3>${title} <em>${tiles.length}</em></h3><p class="note">${note}</p>`;
  if (auto) for (const [name, ts] of sets(tiles)) h += `<details${ts.length > 60 ? '' : ' open'}><summary><b>${esc(name)}</b> &middot; ${ts.length} pieces</summary><div class="grid dense">${ts.map(t => card(t, rel)).join('')}</div></details>`;
  else h += `<div class="grid">${tiles.map(t => card(t, rel)).join('')}</div>`;
  return h + '</section>';
};

mkdirSync(join(art, 'tileset'), { recursive: true });
for (const f of readdirSync(join(art, 'tileset'))) if (f.endsWith('.html')) unlinkSync(join(art, 'tileset', f));
const sizes = {};
for (const [id, S] of Object.entries(SETS)) {
  const ts = man.tiles.filter(t => inSet(t, id)), cs = catOrder.filter(c => ts.some(t => t.category === c));
  const body = `${crumbs('../', id)}<header class="top"><h1>${esc(S.title)} <span class="jp">${S.jp}</span></h1><p>${S.note}</p><p class="note">${ts.length} tiles. Shown at 2&times; on paper cards; tiles are loaded from <code>../tiles/${esc(ts[0].path.replace(/\/[^/]+$/, '').replace(/\/[^/]+$/, ''))}/</code>. Spec in <code>tiles/TILESET.md</code>.</p><div class="chips">${cs.map(c => `<a class="chip" href="#c-${c}">${catInfo[c][0].split(' (')[0]} <b>${ts.filter(t => t.category === c).length}</b></a>`).join('')}</div></header>${cs.map(c => catHtml(c, ts.filter(t => t.category === c), '../')).join('')}`;
  const html = shell(`${S.title} - ${S.region === 'ashkara' ? 'Ashkara' : 'Greenvale'} tileset`, body); writeFileSync(join(art, 'tileset', id + '.html'), html); sizes[id] = html.length;
}
const counts = (id) => man.tiles.filter(t => inSet(t, id)).length;
const idxBody = `<header class="top"><h1>Greenvale tileset <span class="jp">緑の谷</span> and Ashkara <span class="jp">砂の国</span></h1>
  <p>${man.total} hand-written SVG tiles in round-3 design B (seamless watercolour terrain, crisp 3/4-view props with soft painted shading and a soft drop shadow): the common set plus Sunny Meadows, Old Oak Wood (step 2), Bamboo Valley and Mirror Lake (step 3), Rice Terraces and Mossy Ruins (step 4), Firefly Marsh and Misty Highlands (step 5), plus the first set of the second region, the desert Ashkara (<code>tileset/desert-common.html</code>, ${counts('desert-common')} tiles, design in <code>maps/DESERT.md</code>). Base cell 64&times;64, tall props 64&times;128, large objects 128&times;128. Spec in <code>tiles/TILESET.md</code>.</p>
  <div class="chips">${Object.entries(SETS).map(([id, s]) => `<a class="chip" href="tileset/${id}.html">${esc(s.title)} <b>${counts(id)}</b></a>`).join('')}</div></header>
  <nav class="toc"><a href="#overview">Overview</a><a href="#desert">Desert patch</a><a href="#shallows">Dune Shallows patch</a><a href="#sevenpalms">Seven Palms patch</a><a href="#erg">Singing Erg patch</a><a href="#saltmirror">Salt Mirror patch</a><a href="#patch">Sample patches</a><a href="#sets">Tile sets</a>${Object.entries(SETS).map(([id, s]) => `<a href="tileset/${id}.html">${esc(s.title)}</a>`).join('')}</nav>
  <section id="sets" class="patchbox"><h2>Tile sets</h2><p class="note">One page per set; each lists every tile by category with the autotile sets grouped by name. The pages load the SVG files by relative path, so keep the layout <code>tileset-gallery.html</code>, <code>tileset/</code>, <code>tiles/greenvale/</code> together when hosting.</p>
    <div class="setgrid">${Object.entries(SETS).map(([id, s]) => { const ts = man.tiles.filter(t => inSet(t, id)), pick = ['interest', 'trees', 'props'].map(c => ts.find(t => t.category === c && t.size[0] >= 64 && t.size[1] >= 128)).filter(Boolean).slice(0, 3); return `<a class="setcard" href="tileset/${id}.html"><div class="thumbs paper">${pick.map(t => `<img loading="lazy" src="tiles/${t.path}" alt="" style="height:${t.size[1]}px">`).join('')}</div><h3>${esc(s.title)} <em>${ts.length}</em></h3><p class="note">${esc(s.note.split('. ')[0].replace(/\.$/, ''))}.</p></a>`; }).join('')}</div></section>
  <section id="patch" class="patchbox"><header><div><h2>Sample patches</h2><p class="note">Composed at random from the tiles: random grass variants side by side with no seams, ponds and lakes (shore set, deep set, lily beds), cliffs, tree lines, fenced fields, plus props and fog. Reroll for a new layout.</p></div></header>
    <h2 class="subpatch">Common</h2><div class="patchpair">${PATCHES.filter(p => p[2] === 'common').map(([id, w, , sc, label]) => `<div><header class="chips"><button data-reroll="${id}" data-which="${w}">${label}</button></header>${sceneSvg(sc, id, '')}</div>`).join('')}</div>
    <h2 class="subpatch">Sub-areas</h2><p class="note">Each sub-area composed from its own sets (with common props where useful). The three blends: the meadow to forest edge, the Bamboo Valley stream widening through the stream-mouth autotiles into Mirror Lake, and the Mirror Lake shore climbing through earth banks, paddy terraces and mossy stone terraces into the Mossy Ruins platform, and, from step 5, Firefly Marsh at dusk, the Misty Highlands, and the ruins and marsh climbing into the highlands.</p><div class="patchpair">${PATCHES.filter(p => p[2] === 'sub').map(([id, w, , sc, label]) => `<div><header class="chips"><button data-reroll="${id}" data-which="${w}">${label}</button></header>${sceneSvg(sc, id, '')}</div>`).join('')}</div></section>
  <section id="desert" class="patchbox"><header><div><h2>Ashkara desert patch</h2><p class="note">An oasis pool with date palms, a camp and caravan, a bazaar stall, a sphinx and pylon gate on a sandstone plateau, dune ridges, a hardpan flat and a mud-brick wall, composed from the desert common set only. Reroll for a new layout.</p></div><button data-reroll="p16" data-which="desert">Reroll desert oasis</button></header><div style="max-width:768px;margin:0 auto;width:100%">${sceneSvg(PATCHES.find(p => p[0] === 'p16')[3], 'p16', '')}</div></section>
  <section id="shallows" class="patchbox"><header><div><h2>Ashkara: Dune Shallows patch</h2><p class="note">Sub-area 1 of the desert: pale cream sand with a dune crest carrying the waypoint cairn, a dry wadi pool, a scrub patch and a shell bed, the half-buried caravan wagon, a fossil dig and abandoned camp, a dry well, the rib-arch gate on the west edge, and ramps into the common desert ground on the east. Reroll for a new layout.</p></div><button data-reroll="p17" data-which="shallows">Reroll Dune Shallows</button></header><div style="max-width:768px;margin:0 auto;width:100%">${sceneSvg(PATCHES.find(p => p[0] === 'p17')[3], 'p17', '')}</div></section>
  <section id="sevenpalms" class="patchbox"><header><div><h2>Ashkara: Seven Palms patch</h2><p class="note">Sub-area 2 of the desert: a turquoise pool with lily pads and a papyrus bed, an irrigated field and irrigation ditch from a shaduf, the oasis pool ringed by seven palms, a reed hut, a stall and a camp, an oleander hedge, the palm-frond gate on the north edge, and lush grass fading east through ramps into the Dune Shallows cream sand. Reroll for a new layout.</p></div><button data-reroll="p18" data-which="sevenpalms">Reroll Seven Palms</button></header><div style="max-width:768px;margin:0 auto;width:100%">${sceneSvg(PATCHES.find(p => p[0] === 'p18')[3], 'p18', '')}</div></section>
  <section id="erg" class="patchbox"><header><div><h2>Ashkara: Singing Erg patch</h2><p class="note">Sub-area 3 of the desert: warm apricot dunes with a slip-face ridge casting violet lee shadow, a lee hollow, a dune-grass patch and a ripple field, the Singing Dune with its wind-chime poles, a chime grove, a buried colonnade, a colossal statue head, a nomad camp and a beast skeleton, the twin-pillar arch gate on the east edge fading into the salt hardpan, and the Seven Palms oasis grass creeping in from the south. Reroll for a new layout.</p></div><button data-reroll="p19" data-which="erg">Reroll Singing Erg</button></header><div style="max-width:768px;margin:0 auto;width:100%">${sceneSvg(PATCHES.find(p => p[0] === 'p19')[3], 'p19', '')}</div></section>
  <section id="saltmirror" class="patchbox"><header><div><h2>Ashkara: Salt Mirror patch</h2><p class="note">Sub-area 4 of the desert: a pink brine pool with a deeper core, a wet mirage flat and a raised salt-crust shelf on near-white polygon crust, the salt lake with its mirage island as the landmark, a salt-block wall, mine track and rope fence, salt pillars, dead trees, skulls and mining carts, the salt-block gate on the east edge, the Singing Erg apricot dunes on the west and the Dune Shallows sand to the south. Reroll for a new layout.</p></div><button data-reroll="p20" data-which="saltmirror">Reroll Salt Mirror</button></header><div style="max-width:768px;margin:0 auto;width:100%">${sceneSvg(PATCHES.find(p => p[0] === 'p20')[3], 'p20', '')}</div></section>
  <section id="overview" class="patchbox"><header><div><h2>Greenvale overview</h2><p class="note">A 16&times;24 strip walking north through all eight sub-areas, each in its own tiles: Sunny Meadows, Old Oak Wood (floor-patch blend), Bamboo Valley with its stream running into Mirror Lake, the Rice Terraces climbing through paddy and mossy terraces into the Mossy Ruins, dusk-patch into Firefly Marsh, and ochre patches rising into the Misty Highlands under the stone mountain gate.</p></div><button data-reroll="p15" data-which="overview">Reroll Greenvale overview</button></header><div style="max-width:640px;margin:0 auto;width:100%">${sceneSvg(PATCHES.find(p => p[0] === 'p15')[3], 'p15', '')}</div></section>`;
const idx = shell('Greenvale tileset', idxBody, { script: runtime });
writeFileSync(join(art, 'tileset-gallery.html'), idx); sizes.index = idx.length;
console.log(Object.entries(sizes).map(([k, v]) => `${k} ${(v / 1048576).toFixed(2)} MB`).join(', '));
