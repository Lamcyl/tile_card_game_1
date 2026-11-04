// Builds art-samples/tileset-gallery.html from tiles/manifest.json (run: node art-samples/tiles/build-tileset.mjs).
// Each tile SVG is inlined once as a <symbol>; cards and the sample patch reference it with <use>, so the page is self-contained.
// Env: STRICT=1 draws the sample patch without the 0.35px seam-hiding overlap (for seam testing).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compose } from './_gen/compose.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const man = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const STRICT = !!process.env.STRICT;
const svgs = new Map(), symId = new Map();
man.tiles.forEach((t, i) => { const s = readFileSync(join(here, t.path), 'utf8').trim(); svgs.set(t.path, s); symId.set(t.path, 's' + i); });
const keyOf = (p) => p.replace(/^greenvale\/common\//, '').replace(/\.svg$/, '');
const byKey = new Map(man.tiles.map(t => [keyOf(t.path), t]));
const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// symbols: strip the outer <svg>, keep viewBox
const symbols = man.tiles.map(t => {
  const s = svgs.get(t.path), m = s.match(/^<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>$/);
  return `<symbol id="${symId.get(t.path)}" viewBox="${m[1]}">${m[2]}</symbol>`;
}).join('');
const OPAQUE = new Set(['ground', 'ground-detail', 'edges']);
const sceneSvg = (scene, id) => {
  const body = scene.items.map(it => { const t = byKey.get(it.k), o = !STRICT && OPAQUE.has(t.category) ? .35 : 0; return `<use href="#${symId.get(t.path)}" x="${it.x - o}" y="${it.y - o}" width="${it.w + 2 * o}" height="${it.h + 2 * o}"/>`; }).join('');
  return `<svg id="${id}" class="patch" viewBox="0 0 ${scene.w} ${scene.h}" role="img" aria-label="Sample scene composed from the tileset">${body}</svg>`;
};
const has = (k) => byKey.has(k);
const meadow = compose(7, has, 'meadow'), forest = compose(23, has, 'forest');

// ---- grouping ----
const catInfo = {
  ground: ['Ground', 'Seamless terrain. Every variant of a family shares one edge-safe wash skeleton, so any two can sit side by side.'],
  'ground-detail': ['Ground detail', 'Grass tiles with flowers, clover, pebbles and fallen leaves painted inside the safe zone, so they also tile freely.'],
  decals: ['Decals', 'Transparent stamps (no ground) to scatter over any terrain.'],
  edges: ['Edges and transitions (autotile)', '47-piece blob sets: pick the piece by the 8-neighbour mask. Mask bits N1 NE2 E4 SE8 S16 SW32 W64 NW128.'],
  trees: ['Trees and bushes', 'Tall trees use a 64x128 canvas with the trunk in the bottom cell; great trees fill 128x128.'],
  rocks: ['Rocks and standing stones', 'Obstacles and landmarks.'],
  grass: ['Tall grass, reeds, lilies', 'Concealing grass and water-edge plants.'],
  fences: ['Fences and hedges (connect pieces)', 'Sixteen pieces per set, chosen by the N1 E2 S4 W8 neighbour mask.'],
  props: ['Small props', 'Stumps, mushrooms, signs, lanterns, barrels, crates and village dressing.'],
  interest: ['Interest objects', 'Chests, torii waypoints, shop stalls, caches, gates (closed and open) and camp.'],
  overlays: ['Overlays', 'Fog edges, mist, fireflies, dappled light and drifting petals. Drawn above everything else.'],
};
const catOrder = Object.keys(catInfo);
const sets = (tiles) => { const m = new Map(); for (const t of tiles) { const k = t.name; if (!m.has(k)) m.set(k, []); m.get(k).push(t); } return m; };
const card = (t) => {
  const cells = t.size[0] / 64, tall = t.size[1] / 64, w = t.size[0] * 2;
  const label = `${t.name}${t.variant ? ' ' + t.variant : ''}`;
  return `<figure class="card${cells > 1 ? ' wide' : ''}" title="${esc(t.path)}"><div class="paper${t.category === 'overlays' || t.category === 'decals' ? ' dark' : ''}"><svg viewBox="0 0 ${t.size[0]} ${t.size[1]}" style="width:${w}px;max-width:100%" aria-label="${esc(label)}"><use href="#${symId.get(t.path)}" width="${t.size[0]}" height="${t.size[1]}"/></svg></div><figcaption><b>${esc(t.name)}</b> <span>${esc(t.variant || '')}</span><small>${t.size[0]}&times;${t.size[1]}</small></figcaption></figure>`;
};
const catHtml = (cat, tiles) => {
  const [title, note] = catInfo[cat];
  const auto = tiles.some(t => t.tags.includes('autotile'));
  let h = `<section class="cat" id="c-${cat}"><h3>${title} <em>${tiles.length}</em></h3><p class="note">${note}</p>`;
  if (auto) for (const [name, ts] of sets(tiles)) h += `<details open><summary><b>${esc(name)}</b> &middot; ${ts.length} pieces</summary><div class="grid dense">${ts.map(card).join('')}</div></details>`;
  else h += `<div class="grid">${tiles.map(card).join('')}</div>`;
  return h + '</section>';
};
const counts = man.counts;
const regionHtml = () => {
  const common = man.tiles.filter(t => t.sub === 'common');
  let h = `<section class="region" id="greenvale"><h2>Greenvale <span class="jp">緑の谷</span></h2><div class="sub" id="common"><h2 class="subh">Common <small>${common.length} tiles shared by all eight sub-areas</small></h2>`;
  for (const c of catOrder) { const ts = common.filter(t => t.category === c); if (ts.length) h += catHtml(c, ts); }
  h += '</div>';
  const planned = Object.entries(man.subareas).filter(([k, v]) => v === 'planned');
  h += `<div class="sub planned"><h2 class="subh">Sub-area sets <small>planned for the next steps</small></h2><div class="chips">${planned.map(([k], i) => `<span class="chip"><b>${i + 1}</b> ${k.replace(/-/g, ' ')}</span>`).join('')}</div><p class="note">Folders <code>greenvale/&lt;sub-area&gt;/&lt;category&gt;/</code> are reserved. Sub-area tiles reuse the same palette, canvases and autotile masks.</p></div></section>`;
  return h;
};
const toc = catOrder.map(c => `<a href="#c-${c}">${catInfo[c][0].split(' (')[0]}</a>`).join('');
const statChips = catOrder.map(c => `<span class="chip">${catInfo[c][0].split(' (')[0]} <b>${counts[c] || 0}</b></span>`).join('');

// the browser re-runs the same composer for the reroll buttons
const runtime = `
const compose = ${compose.toString()};
const syms = ${JSON.stringify(Object.fromEntries(man.tiles.map(t => [keyOf(t.path), [symId.get(t.path), t.category]])))};
const STRICT = ${STRICT};
const has = (k) => k in syms;
function draw(id, seed, which) {
  const sc = compose(seed, has, which), el = document.getElementById(id);
  el.innerHTML = sc.items.map(it => { const [s, c] = syms[it.k], o = !STRICT && (c === 'ground' || c === 'ground-detail' || c === 'edges') ? .35 : 0; return '<use href="#' + s + '" x="' + (it.x - o) + '" y="' + (it.y - o) + '" width="' + (it.w + 2 * o) + '" height="' + (it.h + 2 * o) + '"/>'; }).join('');
}
for (const b of document.querySelectorAll('[data-reroll]')) b.addEventListener('click', () => draw(b.dataset.reroll, (Math.random() * 1e9) | 0, b.dataset.which));
`;

const html = `<!DOCTYPE html>
<html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Greenvale tileset</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;700&display=swap">
<style>
  :root { --paper: #f3eee3; --card: #fbf8f1; --ink: #1b1a1a; --muted: #6b655c; --line: #ddd5c6; --seal: #c8352b; --tile: #c6db98; --tile-dark: #5a6a52; --wash1: rgba(198,219,152,.35); --wash2: rgba(143,198,210,.25); --wash3: rgba(246,198,212,.28);
    --display: "Shippori Mincho", "Hiragino Mincho ProN", Georgia, serif; --body: "Zen Kaku Gothic New", system-ui, sans-serif; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; --tile: #7f9a62; --wash1: rgba(110,150,90,.12); --wash2: rgba(90,140,170,.1); --wash3: rgba(190,120,140,.08); color-scheme: dark; } }
  :root[data-theme="dark"] { --paper: #17161a; --card: #211f24; --ink: #efe9dd; --muted: #a59d90; --line: #36323a; --tile: #7f9a62; --wash1: rgba(110,150,90,.12); --wash2: rgba(90,140,170,.1); --wash3: rgba(190,120,140,.08); color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--paper) radial-gradient(ellipse 60% 40% at 8% 4%, var(--wash1), transparent 70%), radial-gradient(ellipse 50% 35% at 96% 14%, var(--wash2), transparent 70%), radial-gradient(ellipse 60% 40% at 30% 60%, var(--wash3), transparent 70%); color: var(--ink); font: 15px/1.5 var(--body);
    padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  .wrap { max-width: 1240px; margin: 0 auto; padding-block: 28px 64px; display: grid; gap: 28px; }
  h1 { font: 800 clamp(28px, 4.5vw, 42px)/1.1 var(--display); margin: 0; }
  h2 { font: 800 clamp(22px, 3.4vw, 30px)/1.2 var(--display); margin: 0; }
  h3 { font: 800 19px/1.2 var(--display); margin: 0 0 4px; } h3 em { font: 700 12px var(--body); font-style: normal; color: var(--seal); border: 1px solid var(--seal); border-radius: 999px; padding: 1px 8px; margin-left: 6px; vertical-align: 2px; }
  .jp { color: var(--seal); font-size: .7em; margin-left: 6px; }
  .top p, .note { margin: 8px 0 0; color: var(--muted); max-width: 70ch; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px 8px; margin-top: 12px; }
  .chip { font-size: 12.5px; padding: 3px 10px; border: 1px solid var(--line); border-radius: 999px; background: var(--card); } .chip b { color: var(--seal); margin-left: 3px; }
  nav.toc { display: flex; gap: 6px 16px; font-size: 14px; overflow-x: auto; white-space: nowrap; scrollbar-width: none; position: sticky; top: 0; background: color-mix(in srgb, var(--paper) 92%, transparent); padding: 8px 0; z-index: 3; border-bottom: 1px solid var(--line); }
  nav.toc a { color: var(--ink); text-decoration: none; border-bottom: 1px dotted var(--muted); }
  .patchbox { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; display: grid; gap: 10px; }
  .patchbox header { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; justify-content: space-between; }
  button { font: 700 13px var(--body); color: var(--ink); background: var(--paper); border: 1.5px solid var(--seal); border-radius: 999px; padding: 6px 14px; cursor: pointer; min-height: 36px; }
  svg.patch { display: block; width: 100%; height: auto; border-radius: 10px; background: #c6db98; }
  .patchpair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 14px; }
  .region { display: grid; gap: 28px; } .sub { display: grid; gap: 22px; }
  .subh { padding-bottom: 6px; border-bottom: 2px solid var(--seal); } .subh small { font: 400 13px var(--body); color: var(--muted); margin-left: 8px; }
  .cat { display: grid; gap: 6px; }
  details { margin-top: 8px; } summary { cursor: pointer; padding: 6px 0; font-size: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin-top: 10px; }
  .grid.dense { grid-template-columns: repeat(auto-fill, minmax(136px, 1fr)); gap: 8px; }
  .card { margin: 0; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 8px; display: grid; gap: 6px; align-content: start; min-width: 0; }
  .card.wide { grid-column: span 2; }
  @media (max-width: 400px) { .grid { grid-template-columns: repeat(2, 1fr); } .card.wide { grid-column: span 2; } }
  .paper { background: var(--tile); border-radius: 8px; display: grid; place-items: center; padding: 0; overflow: hidden; }
  .paper.dark { background: var(--tile-dark); }
  .paper svg { display: block; height: auto; }
  figcaption { font-size: 12px; line-height: 1.25; display: flex; flex-wrap: wrap; gap: 2px 6px; } figcaption span { color: var(--seal); font-weight: 700; } figcaption small { color: var(--muted); margin-left: auto; }
  code { font-size: .9em; background: var(--card); padding: 1px 5px; border-radius: 5px; border: 1px solid var(--line); }
</style>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs></defs>${symbols}</svg>
<div class="wrap">
  <header class="top"><h1>Greenvale tileset</h1>
    <p>Step 1 of the tile library: ${man.total} hand-written SVG tiles in round-3 design B (seamless watercolour terrain, crisp 3/4-view props with soft painted shading and a soft drop shadow). Base cell 64&times;64, tall props 64&times;128, large objects 128&times;128. Shown at 2&times; on paper cards. Spec in <code>tiles/TILESET.md</code>.</p>
    <div class="chips">${statChips}</div></header>
  <nav class="toc"><a href="#patch">Sample patch</a>${toc}</nav>
  <section id="patch" class="patchbox"><header><div><h2>Sample patches</h2><p class="note">Composed at random from the tiles below: random grass variants side by side with no seams, a pond (shallow shore set + deep set), a cliff plateau, a tree line, a dirt paddock with fences, plus props and fog. Reroll for a new layout.</p></div></header>
    <div class="patchpair">
      <div><header class="chips"><button data-reroll="p1" data-which="meadow">Reroll meadow</button></header>${sceneSvg(meadow, 'p1')}</div>
      <div><header class="chips"><button data-reroll="p2" data-which="forest">Reroll forest</button></header>${sceneSvg(forest, 'p2')}</div>
    </div></section>
  ${regionHtml()}
</div>
<script>${runtime}</script>
</html>
`;
writeFileSync(join(here, '..', 'tileset-gallery.html'), html);
console.log('wrote tileset-gallery.html', (html.length / 1048576).toFixed(2) + ' MB');
