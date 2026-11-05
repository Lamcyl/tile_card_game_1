// Tile renderer (WP20). Draws the generated tile world from the WebP atlases: 16 x 16 tile terrain chunks composed once and
// cached (LRU), y-sorted props and caller sprites per frame, then the fog layer. See docs/WORLD_SPEC.md "Render".
//
// Data conventions (tools/build-world.mjs, tools/world/raster.mjs):
//  * layer values `ground`, `detail`, `props[].t` are tile index + 1 (0 = none): frame = atlas.frames[v - 1].
//  * autotile set grids store mask + 1 (0 = empty, so mask 255 is stored as 256); piece name = 3-digit blob mask or
//    2-digit connect-4 mask, and the manifest path of that piece is found through `tiles` (`<set>-<mask>.svg`).
//  * a prop's x,y is its bottom-left cell (tall and large props extend upwards); t = [closed, open] for gates.
(function () {
  'use strict';
  const T = 64, CH = 16, BLEED = 2, CHPX = CH * T + 2 * BLEED;
  const files = import.meta.glob('../assets/world/*.{json,webp}', { query: '?url', import: 'default', eager: true });
  const urlOf = (name) => files['../assets/world/' + name];
  const unrle = (a, N) => { const o = new Int32Array(N); let k = 0; for (let i = 0; i < a.length; i += 2) { o.fill(a[i], k, k + a[i + 1]); k += a[i + 1]; } return o; };
  const hash2 = (x, y, s) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul((s | 0) + 7, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  const R = {};              // region id -> state
  const chunkCache = new Map(); // "id:cx,cy" -> {cv, last}
  let frameNo = 0, MAX_CHUNKS = 20;
  let fogFn = null, fogVer = 0, gateFn = null;

  async function load(id) {
    if (R[id]) return R[id];
    const [layer, atlas] = await Promise.all([fetch(urlOf(id + '.json')).then((r) => r.json()), fetch(urlOf(id + '-atlas.json')).then((r) => r.json())]);
    const imgs = await Promise.all(atlas.sheets.map(async (s) => { const im = new Image(); im.src = urlOf(s.file); await im.decode(); return im; }));
    const N = layer.size, M = N * N;
    // set pieces: stored mask+1 -> tile index. Tile paths look like "<region>/<sub>/edges/<name>-<mask>.svg".
    const byPath = {}; layer.tiles.forEach((p, i) => { byPath[p.replace(/^[^/]+\/[^/]+\//, '')] = i; });
    const sets = layer.setOrder.map((k) => {
      const [cat, name] = k.split('/'), grid = unrle(layer.sets[k].grid, M), blob = layer.sets[k].type === 'blob', pieces = new Map();
      for (const p in byPath) { if (!p.startsWith(cat + '/' + name + '-')) continue; const m = p.slice(cat.length + name.length + 2).replace('.svg', ''); if (/^\d+$/.test(m) && m.length === (blob ? 3 : 2)) pieces.set(+m + 1, byPath[p]); }
      return { k, grid, pieces };
    });
    const q = { id, layer, atlas, imgs, N, ox: layer.origin[0], oy: layer.origin[1], ground: unrle(layer.ground, M), detail: unrle(layer.detail, M), sets, sub: null, fogged: null, fogVer: -1 };
    // props sorted by foot row; gates remember their closed/open tiles
    q.props = layer.props.map((p) => ({ ...p, wx: (q.ox + p.x) * T, wy: (q.oy + p.y + 1) * T })).sort((a, b) => a.wy - b.wy || a.wx - b.wx);
    q.fog = { edge: [], full: [] };
    for (let m = 1; m <= 15; m++) q.fog.edge[m] = atlas.extra['overlays/fog-edge-' + String(m).padStart(2, '0')];
    for (const v of 'abcdefgh') { const f = atlas.extra['overlays/fog-full-' + v]; if (f) q.fog.full.push(f); }
    const nv = window.WorldNav && window.WorldNav.byId[id]; if (nv) { q.sub = nv.sub; q.subIds = nv.r.subIds; }
    R[id] = q; return q;
  }
  function setSubGrid(id, sub, subIds) { const q = R[id]; q.sub = sub; q.subIds = subIds; q.fogVer = -1; }

  function blit(g, q, f, x, y, w, h) { if (f) g.drawImage(q.imgs[f[0]], f[1], f[2], f[3], f[4], x, y, w, h); }
  const frameOf = (q, v) => (v > 0 ? q.atlas.frames[v - 1] : null);

  function compose(q, cx, cy) {
    const cv = document.createElement('canvas'); cv.width = cv.height = CHPX; const g = cv.getContext('2d');
    for (let y = -1; y <= CH; y++) for (let x = -1; x <= CH; x++) {
      const lx = cx * CH + x, ly = cy * CH + y; if (lx < 0 || ly < 0 || lx >= q.N || ly >= q.N) continue;
      const k = ly * q.N + lx, px = BLEED + x * T, py = BLEED + y * T;
      const gf = frameOf(q, q.ground[k]); if (gf) blit(g, q, gf, px, py, T + 1, T + 1);
      const df = frameOf(q, q.detail[k]); if (df) blit(g, q, df, px, py, T + 1, T + 1);
      for (const s of q.sets) { const m = s.grid[k]; if (!m) continue; const pi = s.pieces.get(m); if (pi != null) blit(g, q, q.atlas.frames[pi], px, py, T + 1, T + 1); }
    }
    return cv;
  }
  let composedThisFrame = 0;
  function chunkFor(q, cx, cy, force) {
    const key = q.id + ':' + cx + ',' + cy; let c = chunkCache.get(key);
    if (!c) { if (!force && composedThisFrame >= 2) return null; c = { cv: compose(q, cx, cy), last: 0 }; chunkCache.set(key, c); composedThisFrame++; }
    c.last = frameNo; return c;
  }
  function evict() {
    if (chunkCache.size <= MAX_CHUNKS) return;
    const all = [...chunkCache.entries()].sort((a, b) => a[1].last - b[1].last);
    for (let i = 0; i < all.length - MAX_CHUNKS; i++) if (all[i][1].last < frameNo - 1) chunkCache.delete(all[i][0]);
  }

  // fog: a cell is fogged when fogFn(subId) says so (subId 0 = rim and corridors are never fogged)
  function fogGrid(q) {
    if (q.fogVer === fogVer || !q.sub) return;
    const F = new Uint8Array(q.N * q.N);
    if (fogFn) for (let i = 0; i < F.length; i++) { const v = q.sub[i]; if (v && fogFn(q.subIds[v - 1])) F[i] = 1; }
    q.fogged = F; q.fogVer = fogVer;
  }

  /** view = {x0,y0,x1,y1} in world units; ctx already carries the world transform. sprites = [{y, draw(ctx)}] sorted in with the props. */
  function render(ctx, view, sprites, now) {
    frameNo++; composedThisFrame = 0;
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const vis = [];
    for (const id in R) {
      const q = R[id], wx0 = q.ox * T, wy0 = q.oy * T;
      if (view.x1 < wx0 || view.y1 < wy0 || view.x0 > wx0 + q.N * T || view.y0 > wy0 + q.N * T) continue;
      vis.push(q);
      const c0 = Math.max(0, Math.floor((view.x0 - wx0) / (CH * T))), c1 = Math.min(Math.ceil(q.N / CH) - 1, Math.floor((view.x1 - wx0) / (CH * T)));
      const r0 = Math.max(0, Math.floor((view.y0 - wy0) / (CH * T))), r1 = Math.min(Math.ceil(q.N / CH) - 1, Math.floor((view.y1 - wy0) / (CH * T)));
      for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) { const c = chunkFor(q, cx, cy, true); ctx.drawImage(c.cv, wx0 + cx * CH * T - BLEED, wy0 + cy * CH * T - BLEED); }
      // warm the neighbours one chunk per frame so walking never composes in view
      outer: for (let cy = r0 - 1; cy <= r1 + 1; cy++) for (let cx = c0 - 1; cx <= c1 + 1; cx++) { if (cx < 0 || cy < 0 || cx * CH >= q.N || cy * CH >= q.N) continue; if (!chunkCache.has(q.id + ':' + cx + ',' + cy)) { chunkFor(q, cx, cy, false); break outer; } }
    }
    evict();
    // y-sorted props and sprites
    const list = [];
    for (const q of vis) {
      fogGrid(q);
      for (const p of q.props) {
        const top = p.wy - p.h * T; if (p.wy < view.y0 - 8 || top > view.y1 || p.wx + p.w * T < view.x0 || p.wx > view.x1) continue;
        if (q.fogged && q.fogged[(p.y) * q.N + p.x]) continue;
        list.push({ y: p.wy - 1, x: p.wx, p, q });
      }
    }
    if (sprites) for (const s of sprites) list.push({ y: s.y, x: s.x || 0, s });
    list.sort((a, b) => a.y - b.y || a.x - b.x);
    for (const e of list) {
      if (e.s) { e.s.draw(ctx); continue; }
      const p = e.p, q = e.q; let v = p.t;
      if (Array.isArray(v)) v = (p.gate && gateFn && gateFn(q, p)) ? v[1] : v[0];
      const f = frameOf(q, v); if (!f) continue;
      const sc = q.atlas.sheets[f[0]].scale || 1; blit(ctx, q, f, p.wx, p.wy - f[4] / sc, f[3] / sc, f[4] / sc);
    }
    // fog: full tiles over fogged cells, edge pieces on open cells that border fog
    for (const q of vis) {
      const F = q.fogged; if (!F) continue;
      const x0 = Math.max(0, Math.floor(view.x0 / T) - q.ox), x1 = Math.min(q.N - 1, Math.floor(view.x1 / T) - q.ox), y0 = Math.max(0, Math.floor(view.y0 / T) - q.oy), y1 = Math.min(q.N - 1, Math.floor(view.y1 / T) - q.oy);
      const fg = (x, y) => (x >= 0 && y >= 0 && x < q.N && y < q.N && F[y * q.N + x] === 1);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const wx = (q.ox + x) * T, wy = (q.oy + y) * T;
        if (F[y * q.N + x]) { const f = q.fog.full[Math.floor(hash2(x, y, 3) * q.fog.full.length)]; blit(ctx, q, f, wx, wy, T + 1, T + 1); continue; }
        const m = (fg(x, y - 1) ? 1 : 0) | (fg(x + 1, y) ? 2 : 0) | (fg(x, y + 1) ? 4 : 0) | (fg(x - 1, y) ? 8 : 0);
        if (m) blit(ctx, q, q.fog.edge[m], wx, wy, T + 1, T + 1);
      }
    }
  }

  window.TileMap = {
    T, load, regions: R, setSubGrid, render,
    setFog(fn) { fogFn = fn; fogVer++; },
    refreshFog() { fogVer++; },
    setGateState(fn) { gateFn = fn; },
    chunkCount: () => chunkCache.size,
    clearCache() { chunkCache.clear(); },
  };
})();
