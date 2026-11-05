// Manifest lookup for one tileset: keys are "category/name"; every lookup throws on a typo.
import fs from 'node:fs';
import { canon } from './autotile.mjs';

export function loadManifest(root) {
  return JSON.parse(fs.readFileSync(`${root}/art-samples/tiles/manifest.json`, 'utf8'));
}
export function tileIndex(manifest, region) {
  const by = new Map(); // key -> {variants: Map(variant->path), cells, obstacle}
  for (const t of manifest.tiles) {
    if (t.region !== region) continue;
    const key = `${t.category}/${t.name}`;
    let e = by.get(key); if (!e) by.set(key, (e = { variants: new Map(), cells: t.cells, obstacle: false }));
    if (!e.variants.has(t.variant)) e.variants.set(t.variant, t.path);
    if (t.tags.includes('obstacle')) e.obstacle = true;
  }
  const get = (k) => { const e = by.get(k); if (!e) throw new Error(`tile key not in manifest (${region}): ${k}`); return e; };
  const used = new Set();
  return {
    region, used,
    need: (k) => { get(k); },
    needAll: (ks) => ks.forEach((k) => get(k)),
    needSet: (k, type) => { const e = get(k); if (!e.variants.size) throw new Error('empty set ' + k); },
    needMask: (k, m, type) => {
      const v = type === 'blob' ? String(m).padStart(3, '0') : String(m).padStart(2, '0');
      if (!get(k).variants.has(v)) throw new Error(`missing autotile piece ${k}-${v} (${region})`);
    },
    cells: (k) => get(k).cells,
    variants: (k) => [...get(k).variants.keys()],
    obstacle: (k) => get(k).obstacle,
    path: (k, v) => { const p = get(k).variants.get(v); if (!p) throw new Error(`no variant ${v} for ${k}`); used.add(p); return p; },
  };
}
