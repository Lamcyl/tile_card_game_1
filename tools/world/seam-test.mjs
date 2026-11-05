#!/usr/bin/env node
// 3 x 3 chunk (48 x 48 tiles) seam test: composes chunk canvases from the atlas like the runtime will, blits them at zoom 0.8 / 1.5
// with fractional camera offsets, writes screenshots and a numeric seam metric (boundary-column gradient / interior gradient).
// Usage: node tools/world/seam-test.mjs [region] [cx,cy tile of the 3x3 area origin]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'prototype/assets/world');
const id = process.argv[2] || 'greenvale';
const shotDir = process.env.SEED_OUT || path.join(ROOT, 'prototype/assets/world/_seam');
fs.mkdirSync(shotDir, { recursive: true });
const layer = JSON.parse(fs.readFileSync(path.join(OUT, id + '.json'), 'utf8'));
const atlas = JSON.parse(fs.readFileSync(path.join(OUT, id + '-atlas.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-samples/tiles/manifest.json'), 'utf8'));
const idxOfPath = new Map(layer.tiles.map((p, i) => [p, i]));
const pieceIdx = {}; // "category/name" -> {variant: tile idx}
for (const t of manifest.tiles) if (t.region === layer.id || t.region === 'greenvale') { const i = idxOfPath.get(t.path); if (i == null) continue; (pieceIdx[`${t.category}/${t.name}`] ||= {})[t.variant] = i; }
const unrle = (a) => { const o = []; for (let i = 0; i < a.length; i += 2) for (let k = 0; k < a[i + 1]; k++) o.push(a[i]); return o; };
const N = layer.size, ground = unrle(layer.ground), detail = unrle(layer.detail);
const sets = layer.setOrder.map((k) => ({ k, type: layer.sets[k].type, grid: unrle(layer.sets[k].grid), pieces: pieceIdx[k] || {} }));
const sheets = atlas.sheets.map((s) => fs.readFileSync(path.join(OUT, s.file)).toString('base64'));
const [ox, oy] = (process.argv[3] || `${Math.floor(N / 2) - 24},${Math.floor(N / 2) - 24}`).split(',').map(Number);

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.setContent('<body style="margin:0;background:#222"><canvas id="v" width="390" height="844" style="width:390px;height:844px"></canvas></body>');
const res = await page.evaluate(async ({ atlas, sheets, ground, detail, sets, N, ox, oy }) => {
  const imgs = await Promise.all(sheets.map(async (b) => { const im = new Image(); im.src = 'data:image/webp;base64,' + b; await im.decode(); return im; }));
  const T = 64, CH = 16;
  const draw = (g, i, x, y) => { const f = atlas.frames[i]; if (!f) return; const s = atlas.sheets[f[0]]; g.drawImage(imgs[f[0]], f[1], f[2], f[3], f[4], x, y, T + 1, T + 1); }; // 1 px overdraw
  const chunks = [];
  for (let cy = 0; cy < 3; cy++) for (let cx = 0; cx < 3; cx++) {
    const c = document.createElement('canvas'); c.width = c.height = CH * T; const g = c.getContext('2d');
    for (let y = 0; y < CH; y++) for (let x = 0; x < CH; x++) {
      const wx = ox + cx * CH + x, wy = oy + cy * CH + y, k = wy * N + wx; if (wx < 0 || wy < 0 || wx >= N || wy >= N) continue;
      draw(g, ground[k], x * T, y * T); if (detail[k]) draw(g, detail[k], x * T, y * T);
      for (const s of sets) { const m = s.grid[k]; if (!m) continue; const v = s.type === 'blob' ? String(m).padStart(3, '0') : String(m).padStart(2, '0'); const pi = s.pieces[v]; if (pi != null) draw(g, pi, x * T, y * T); }
    }
    chunks.push(c);
  }
  const v = document.getElementById('v'), vg = v.getContext('2d'), out = {};
  for (const [zoom, camx, camy] of [[0.8, 13.37, 7.71], [1.5, 101.13, 55.49]]) {
    vg.setTransform(2, 0, 0, 2, 0, 0); vg.fillStyle = '#222'; vg.fillRect(0, 0, 390, 844); vg.imageSmoothingQuality = 'high';
    vg.setTransform(2 * zoom, 0, 0, 2 * zoom, -camx * 2 * zoom, -camy * 2 * zoom);
    chunks.forEach((c, i) => vg.drawImage(c, (i % 3) * CH * T, ((i / 3) | 0) * CH * T));
    // seam metric on a horizontal strip: |dx| at tile-boundary columns vs other columns (device px)
    const sc = 2 * zoom, W = 780, H = 1688, im = vg.getImageData ? (vg.setTransform(1, 0, 0, 1, 0, 0), vg.getImageData(0, 0, W, H)) : null;
    const d = im.data; const lum = (x, y) => { const o = (y * W + x) * 4; return d[o] * 0.3 + d[o + 1] * 0.59 + d[o + 2] * 0.11; };
    let b = 0, nb = 0, o = 0, no = 0;
    for (let y = 40; y < H - 40; y += 3) for (let x = 40; x < W - 40; x++) {
      const wx = (x / sc) + camx; const frac = wx / T - Math.floor(wx / T); const onB = frac * T * sc < 1.2 || (1 - frac) * T * sc < 0.3;
      const g = Math.abs(lum(x, y) - lum(x - 1, y)); if (onB) { b += g; nb++; } else { o += g; no++; }
    }
    out['zoom' + zoom] = { boundary: +(b / nb).toFixed(3), interior: +(o / no).toFixed(3), ratio: +((b / nb) / (o / no)).toFixed(3) };
    out['png' + zoom] = v.toDataURL('image/png').split(',')[1];
  }
  return out;
}, { atlas, sheets, ground, detail, sets, N, ox, oy });
for (const z of ['0.8', '1.5']) { fs.writeFileSync(path.join(shotDir, `${id}-seam-${z}.png`), Buffer.from(res['png' + z], 'base64')); console.log(id, 'zoom', z, JSON.stringify(res['zoom' + z])); }
await browser.close();
