#!/usr/bin/env node
// Atlas rasteriser: region layer file (assets/world/<id>.json) -> WebP sheets + atlas.json.
// Uses Playwright's Chromium to rasterise the SVG tiles (resvg is not needed; Chromium renders gradients correctly).
// Usage: node tools/world/raster.mjs [--region id[,id]] [--terrain-scale 0.75] [--prop-scale 1] [--fx-scale 0.75]
//                                    [--terrain-q 0.8] [--prop-q 0.85] [--fx-q 0.75]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TILES = path.join(ROOT, 'art-samples/tiles');
const OUT = path.join(ROOT, 'prototype/assets/world');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const CFG = {
  terrain: { scale: +opt('terrain-scale', 1), q: +opt('terrain-q', 0.85) },
  prop: { scale: +opt('prop-scale', 1), q: +opt('prop-q', 0.85) },
  fx: { scale: +opt('fx-scale', 1), q: +opt('fx-q', 0.75) },
};
const GUT = 2, MAXW = 2048;
const TERRAIN_CATS = new Set(['ground', 'ground-detail', 'edges']);

function shelfPack(items, scale) { // items: {w,h} native px -> positions, sheet size
  const out = []; let x = 0, y = 0, rowH = 0, W = 0;
  for (const it of items) {
    const w = Math.ceil(it.w * scale) + GUT, h = Math.ceil(it.h * scale) + GUT;
    if (x + w > MAXW) { y += rowH; x = 0; rowH = 0; }
    out.push({ ...it, x, y, pw: w - GUT, ph: h - GUT }); x += w; rowH = Math.max(rowH, h); W = Math.max(W, x);
  }
  return { out, w: W, h: y + rowH };
}

export async function rasterRegion(page, id) {
  const manifest = JSON.parse(fs.readFileSync(path.join(TILES, 'manifest.json'), 'utf8'));
  const byPath = new Map(manifest.tiles.map((t) => [t.path, t]));
  const layer = JSON.parse(fs.readFileSync(path.join(OUT, id + '.json'), 'utf8'));
  // entries: {ref, path, grp, cls}
  const entries = [];
  layer.tiles.forEach((p, i) => {
    const t = byPath.get(p); if (!t) throw new Error('not in manifest: ' + p);
    entries.push({ ref: i, path: p, grp: TERRAIN_CATS.has(t.category) ? 'terrain' : 'prop', size: t.size });
  });
  // extras: fog + this region's overlays (all variants), keyed by "category/name"
  const extraKeys = new Set([layer.fog.edge, layer.fog.full]);
  for (const l of Object.values(layer.overlays)) l.forEach((k) => extraKeys.add(k));
  const extraList = [];
  for (const t of manifest.tiles) {
    if (t.category !== 'overlays') continue;
    const key = `${t.category}/${t.name}`;
    if (!extraKeys.has(key)) continue;
    if (t.region !== id && !(key === layer.fog.edge || key === layer.fog.full)) continue;
    if (t.region !== id && t.region !== 'greenvale') continue; // shared fog tiles come from greenvale
    extraList.push({ ref: `${key}-${t.variant}`, path: t.path, grp: 'fx', size: t.size });
    entries.push(extraList[extraList.length - 1]);
  }
  const sheets = []; const frames = {}; const extra = {};
  for (const grp of ['terrain', 'prop', 'fx']) for (const cls of ['cell', 'tall', 'large']) {
    const want = cls === 'cell' ? '64x64' : cls === 'tall' ? '64x128' : '128x128';
    const items = entries.filter((e) => e.grp === grp && e.size.join('x') === want).map((e) => ({ e, w: e.size[0], h: e.size[1] }));
    if (!items.length) continue;
    const { out, w, h } = shelfPack(items, CFG[grp].scale);
    const jobs = out.map((o) => ({ x: o.x, y: o.y, w: o.pw, h: o.ph, svg: fs.readFileSync(path.join(TILES, o.e.path), 'utf8') }));
    const b64 = await page.evaluate(async ({ jobs, w, h, q }) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      await Promise.all(jobs.map(async (j) => {
        const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(j.svg); await img.decode();
        j.img = img;
      }));
      for (const j of jobs) g.drawImage(j.img, j.x, j.y, j.w, j.h);
      const blob = await new Promise((r) => c.toBlob(r, 'image/webp', q));
      const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return btoa(s);
    }, { jobs, w, h, q: CFG[grp].q });
    const file = `${id}-${grp}-${cls}.webp`;
    const buf = Buffer.from(b64, 'base64'); fs.writeFileSync(path.join(OUT, file), buf);
    const si = sheets.length;
    sheets.push({ file, grp, cls, w, h, scale: CFG[grp].scale, bytes: buf.length });
    out.forEach((o) => { const f = [si, o.x, o.y, o.pw, o.ph]; if (typeof o.e.ref === 'number') frames[o.e.ref] = f; else extra[o.e.ref] = f; });
  }
  const frameArr = layer.tiles.map((_, i) => frames[i]);
  const atlas = { id, sheets, frames: frameArr, extra };
  fs.writeFileSync(path.join(OUT, id + '-atlas.json'), JSON.stringify(atlas));
  const total = sheets.reduce((a, s) => a + s.bytes, 0);
  return { id, sheets, total, tiles: entries.length };
}

async function main() {
  const require = createRequire(import.meta.url);
  const { chromium } = require('playwright');
  const only = opt('region', null);
  const ids = (only ? only.split(',') : fs.readdirSync(OUT).filter((f) => f.endsWith('.json') && !f.endsWith('-atlas.json')).map((f) => f.replace('.json', ''))).sort();
  const browser = await chromium.launch(); const page = await browser.newPage();
  await page.goto('about:blank');
  const rows = [];
  for (const id of ids) {
    const r = await rasterRegion(page, id);
    rows.push(r);
    console.log(`${id}: ${r.tiles} tiles, ${(r.total / 1e6).toFixed(2)} MB  ` + r.sheets.map((s) => `${s.file} ${s.w}x${s.h} ${(s.bytes / 1e3).toFixed(0)}kB`).join(', '));
  }
  await browser.close();
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
