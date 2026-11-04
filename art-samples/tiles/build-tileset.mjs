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

const here = dirname(fileURLToPath(import.meta.url)), art = join(here, '..');
const man = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const STRICT = !!process.env.STRICT;
const PRE = { 'sunny-meadows': 'sm:', 'old-oak-wood': 'oo:', 'bamboo-valley': 'bv:', 'mirror-lake': 'ml:', 'rice-terraces': 'rt:', 'mossy-ruins': 'mr:' };
const keyOf = (p) => p.replace(/^greenvale\/common\//, '').replace(/^greenvale\/(sunny-meadows|old-oak-wood|bamboo-valley|mirror-lake|rice-terraces|mossy-ruins)\//, (m, s) => PRE[s]).replace(/\.svg$/, '');
const byKey = new Map(man.tiles.map(t => [keyOf(t.path), t]));
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const has = (k) => byKey.has(k);

// ---- set definitions ----
const SETS = {
  common: { title: 'Common', jp: '共通', note: 'Shared by the whole region: seamless ground families, the autotile sets (water shore, deep water, dirt, sand, cliff, forest), trees, rocks, fences and hedges, props, interest objects and overlays.' },
  'sunny-meadows': { title: 'Sunny Meadows', jp: '陽だまりの野', note: 'Wildflower carpets and patch autotiles, rolling hills, farm fields with crops, farm fences and stone walls, windmill, barn, beehives, scarecrows, picnic, orchard and sunflowers, the lone blossom tree with petal drift, and a lily pond.' },
  'old-oak-wood': { title: 'Old Oak Wood', jp: '古い樫の森', note: 'Forest-floor variants (moss, roots, litter, ferns, glow), oaks of every age, the sacred oak and its hollow-trunk door, root arches, fungi and glowing mushrooms, fallen logs, shrine stones and a stone circle, a woodcutter camp, owls and webs, plus the meadow to forest blends.' },
  'bamboo-valley': { title: 'Bamboo Valley', jp: '竹の谷', note: 'Green, golden, black and young bamboo (clumps, bushes, stands, three tree-line autotiles), a clear stream autotile with pebbly banks that flows east, stepping stones, rapids, koi, plank bridges and an arched bridge, a waterfall, thatched huts and the hut gate, a tea house, stone lanterns, shishi-odoshi and tsukubai, bamboo fences and screens, valley mist and light shafts. The stream-mouth set blends the stream into Mirror Lake.' },
  'mirror-lake': { title: 'Mirror Lake', jp: '鏡の湖', note: 'Open water with reflections and ripples, lily pads and lotus in several states, reeds and cattails, a pebble-beach shoreline autotile, reflective deep water, islets and island autotile, lily beds, connecting jetties, rowboats and a ferry, the vermilion torii standing in the water with its reflection, boathouse gate, shrine islet, market boat, fishing nets, herons and ducks, willows, and evening sparkle.' },
  'rice-terraces': { title: 'Rice Terraces', jp: '棚田', note: 'Stepped paddy terraces, earth banks, channels and a waterwheel. Flooded paddies in every growth stage (bare water, young shoots, mid green, ripe gold, stubble) with reflections, azolla, tadpoles and seedling bundles; five stepped terrace autotiles whose earth banks and dry-stone retaining walls read as height steps, flat bunded paddy fields, and a lake shore that turns into an earth bank; irrigation channels, wooden flumes and drying-rack lines, a sluice gate, plank bridges, an animated-looking waterwheel (four phases), farmhouses, the white kura storehouse gate to the Mossy Ruins, scarecrows, field shrines and foxes, persimmon trees, straw stacks, ducks, egrets, straw-hat farmer decals and harvest overlays.' },
  'mossy-ruins': { title: 'Mossy Ruins', jp: '苔むす遺跡', note: 'Moss-covered shrine ruins with flagstone, broken torii and wisps. Mossy, cracked, wet and broken flagstone ground, moss carpets, murky pools, a paving patch, moss-grown pool and terrace autotiles that continue the rice terraces uphill into a paved shrine platform, crumbled wall sets (plain, ivy, low rubble) and a flagstone path, standing and toppled pillars, stone lanterns (lit, unlit, broken, spirit-lit), jizo, komainu, gorinto and steles, broken torii, the ruined archway gate to the Firefly Marsh, a collapsed shrine, overgrown stairs, ivy, vines, puddles, will-o-the-wisp glows, mist and light shafts.' },
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
const sets = (tiles) => { const m = new Map(); for (const t of tiles) { if (!m.has(t.name)) m.set(t.name, []); m.get(t.name).push(t); } return m; };

// ---- scenes (same composers run again in the browser for the reroll buttons) ----
const PATCHES = [
  ['p1', 'meadow', 'common', compose(7, has, 'meadow'), 'Reroll meadow'], ['p2', 'forest', 'common', compose(23, has, 'forest'), 'Reroll forest'],
  ['p3', 'meadows', 'sub', composeSub(11, has, 'meadows'), 'Reroll Sunny Meadows'], ['p4', 'oakwood', 'sub', composeSub(5, has, 'oakwood'), 'Reroll Old Oak Wood'],
  ['p5', 'blend', 'sub', composeSub(8, has, 'blend'), 'Reroll meadow to forest blend'],
  ['p6', 'bamboo', 'sub', composeSub(4, has, 'bamboo'), 'Reroll Bamboo Valley'], ['p7', 'lake', 'sub', composeSub(9, has, 'lake'), 'Reroll Mirror Lake'], ['p8', 'stream', 'sub', composeSub(3, has, 'stream'), 'Reroll stream to lake blend'],
  ['p9', 'rice', 'sub', composeSub(6, has, 'rice'), 'Reroll Rice Terraces'], ['p10', 'ruins', 'sub', composeSub(13, has, 'ruins'), 'Reroll Mossy Ruins'], ['p11', 'terraces', 'sub', composeSub(2, has, 'terraces'), 'Reroll lake to terraces to ruins blend'],
];
const imgPath = (rel, t) => rel + 'tiles/' + t.path;
const sceneSvg = (scene, id, rel) => {
  const body = scene.items.map(it => { const t = byKey.get(it.k), o = !STRICT && ['ground', 'ground-detail', 'edges'].includes(t.category) ? .35 : 0; return `<image href="${imgPath(rel, t)}" x="${it.x - o}" y="${it.y - o}" width="${it.w + 2 * o}" height="${it.h + 2 * o}"/>`; }).join('');
  return `<svg id="${id}" class="patch" viewBox="0 0 ${scene.w} ${scene.h}" role="img" aria-label="Sample scene composed from the tileset">${body}</svg>`;
};
const runtime = `
const compose = ${compose.toString()};
const composeSub = ${composeSub.toString()};
const files = ${JSON.stringify(Object.fromEntries(man.tiles.map(t => [keyOf(t.path), [t.path.replace(/^greenvale\//, '')]])))};
const OPAQUE = new Set(['ground', 'ground-detail', 'edges']), STRICT = ${STRICT};
const cat = ${JSON.stringify(Object.fromEntries(man.tiles.map(t => [keyOf(t.path), t.category])))};
const has = (k) => k in files;
function draw(id, seed, which) {
  const sc = (which === 'meadow' || which === 'forest' ? compose : composeSub)(seed, has, which), el = document.getElementById(id);
  el.innerHTML = sc.items.map(it => { const o = !STRICT && OPAQUE.has(cat[it.k]) ? .35 : 0; return '<image href="tiles/greenvale/' + files[it.k][0] + '" x="' + (it.x - o) + '" y="' + (it.y - o) + '" width="' + (it.w + 2 * o) + '" height="' + (it.h + 2 * o) + '"/>'; }).join('');
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
  const ts = man.tiles.filter(t => t.sub === id), cs = catOrder.filter(c => ts.some(t => t.category === c));
  const body = `${crumbs('../', id)}<header class="top"><h1>${esc(S.title)} <span class="jp">${S.jp}</span></h1><p>${S.note}</p><p class="note">${ts.length} tiles. Shown at 2&times; on paper cards; tiles are loaded from <code>../tiles/${esc(ts[0].path.replace(/\/[^/]+$/, '').replace(/\/[^/]+$/, ''))}/</code>. Spec in <code>tiles/TILESET.md</code>.</p><div class="chips">${cs.map(c => `<a class="chip" href="#c-${c}">${catInfo[c][0].split(' (')[0]} <b>${ts.filter(t => t.category === c).length}</b></a>`).join('')}</div></header>${cs.map(c => catHtml(c, ts.filter(t => t.category === c), '../')).join('')}`;
  const html = shell(`${S.title} - Greenvale tileset`, body); writeFileSync(join(art, 'tileset', id + '.html'), html); sizes[id] = html.length;
}
const counts = (id) => man.tiles.filter(t => t.sub === id).length;
const idxBody = `<header class="top"><h1>Greenvale tileset <span class="jp">緑の谷</span></h1>
  <p>${man.total} hand-written SVG tiles in round-3 design B (seamless watercolour terrain, crisp 3/4-view props with soft painted shading and a soft drop shadow): the common set plus Sunny Meadows, Old Oak Wood (step 2), Bamboo Valley and Mirror Lake (step 3), Rice Terraces and Mossy Ruins (step 4). Base cell 64&times;64, tall props 64&times;128, large objects 128&times;128. Spec in <code>tiles/TILESET.md</code>.</p>
  <div class="chips">${Object.entries(SETS).map(([id, s]) => `<a class="chip" href="tileset/${id}.html">${esc(s.title)} <b>${counts(id)}</b></a>`).join('')}</div></header>
  <nav class="toc"><a href="#patch">Sample patches</a><a href="#sets">Tile sets</a>${Object.entries(SETS).map(([id, s]) => `<a href="tileset/${id}.html">${esc(s.title)}</a>`).join('')}</nav>
  <section id="sets" class="patchbox"><h2>Tile sets</h2><p class="note">One page per set; each lists every tile by category with the autotile sets grouped by name. The pages load the SVG files by relative path, so keep the layout <code>tileset-gallery.html</code>, <code>tileset/</code>, <code>tiles/greenvale/</code> together when hosting.</p>
    <div class="setgrid">${Object.entries(SETS).map(([id, s]) => { const ts = man.tiles.filter(t => t.sub === id), pick = ['interest', 'trees', 'props'].map(c => ts.find(t => t.category === c && t.size[0] >= 64 && t.size[1] >= 128)).filter(Boolean).slice(0, 3); return `<a class="setcard" href="tileset/${id}.html"><div class="thumbs paper">${pick.map(t => `<img loading="lazy" src="tiles/${t.path}" alt="" style="height:${t.size[1]}px">`).join('')}</div><h3>${esc(s.title)} <em>${ts.length}</em></h3><p class="note">${esc(s.note.split('. ')[0].replace(/\.$/, ''))}.</p></a>`; }).join('')}</div></section>
  <section id="patch" class="patchbox"><header><div><h2>Sample patches</h2><p class="note">Composed at random from the tiles: random grass variants side by side with no seams, ponds and lakes (shore set, deep set, lily beds), cliffs, tree lines, fenced fields, plus props and fog. Reroll for a new layout.</p></div></header>
    <h2 class="subpatch">Common</h2><div class="patchpair">${PATCHES.filter(p => p[2] === 'common').map(([id, w, , sc, label]) => `<div><header class="chips"><button data-reroll="${id}" data-which="${w}">${label}</button></header>${sceneSvg(sc, id, '')}</div>`).join('')}</div>
    <h2 class="subpatch">Sub-areas</h2><p class="note">Each sub-area composed from its own sets (with common props where useful). The three blends: the meadow to forest edge, the Bamboo Valley stream widening through the stream-mouth autotiles into Mirror Lake, and the Mirror Lake shore climbing through earth banks, paddy terraces and mossy stone terraces into the Mossy Ruins platform.</p><div class="patchpair">${PATCHES.filter(p => p[2] === 'sub').map(([id, w, , sc, label]) => `<div><header class="chips"><button data-reroll="${id}" data-which="${w}">${label}</button></header>${sceneSvg(sc, id, '')}</div>`).join('')}</div></section>
  <section class="patchbox"><h2>Remaining sub-areas</h2><div class="chips">${Object.entries(man.subareas).filter(([, v]) => v === 'planned').map(([k]) => `<span class="chip">${k.replace(/-/g, ' ')}</span>`).join('')}</div></section>`;
const idx = shell('Greenvale tileset', idxBody, { script: runtime });
writeFileSync(join(art, 'tileset-gallery.html'), idx); sizes.index = idx.length;
console.log(Object.entries(sizes).map(([k, v]) => `${k} ${(v / 1048576).toFixed(2)} MB`).join(', '));
