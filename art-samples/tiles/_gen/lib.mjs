// Shared helpers for the Greenvale tileset generators (round-3 design B: watercolour ground, crisp painted props).
// Usage: import { Tile, save, ... } from './lib.mjs'. Every tile is hand-written SVG: flat shapes + gradients, no filters.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const T = 64;                       // base cell
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');   // art-samples/tiles
export const registry = [];                // manifest entries collected while generating

export function rng(seed) {                // mulberry32
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (a, b) => a + (b - a) * r();
  r.int = (a, b) => Math.floor(a + (b - a + 1) * r());
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  return r;
}
export const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
export const f = (n) => +n.toFixed(1);

// ---- palette (see TILESET.md) ----
export const P = {
  paper: '#efe5cd', cream: '#f6efdc', rimG: '#7fa862', tuftG: '#5f8f4c', inkG: '#1d4a26', inkW: '#4a3220', inkR: '#5e4e3e', inkB: '#2a4a63',
  grass: '#c6db98', grassW: ['#b3d283', '#cfe1a0', '#dfe8ae', '#bcd98d'],
  leaf: ['#9be08f', '#5fae5c', '#3a8048', '#27583a'],          // light -> dark crown
  leaf2: ['#86cd7f', '#4a9a50', '#2f6e3a'],
  pineC: ['#6fb27a', '#3c7a47', '#27583a'],
  blossom: ['#fbdde6', '#f6c6d4', '#e0a0b6'],
  maple: ['#f3a45a', '#d2622e', '#a03c22'],
  bark: ['#8a6a44', '#6b4a2c', '#4a3220'],
  stone: ['#e0d9c4', '#b4ad98', '#857d6c'],
  stoneG: ['#cfd0c4', '#a2a596', '#74786a'],
  moss: ['#a8cf86', '#7fae5e', '#5f8f4c'],
  red: ['#e0583f', '#c8352b', '#8e2118'],
  indigo: ['#7a8fc0', '#4d639a', '#33456f'],
  gold: '#f3c24f', amber: '#e8a83a', glow: '#fff6e0',
  water: { sh: '#9fd0dc', shW: ['#8cc3d3', '#b2dce4', '#7fb7cb', '#a6d6e0'], dp: '#6fa6c6', dpW: ['#5f98ba', '#7db1cf', '#548bb0', '#6aa3c4'], rim: '#4f8aa8', foam: '#f6f3e6' },
  dirt: { b: '#d6c08c', w: ['#c9ae7a', '#dfcb9a', '#c4a56e', '#e4d3a8'], rim: '#a98a58' },
  sand: { b: '#ecdcae', w: ['#e4d29c', '#f3e8c4', '#dccb92', '#f0e2b4'], rim: '#c9b27a' },
  floor: { b: '#8fb26c', w: ['#7ea45f', '#9bbd78', '#6f9658', '#a8c884'], rim: '#5f8f4c' },
  cliffTop: { b: '#d3c6a8', w: ['#c8b996', '#ddd1b4', '#bdae8f', '#e2d8bf'], rim: '#9a8670' },
  cliffFace: ['#a79480', '#8a7660', '#6e5c49'],
};

// ---- Tile builder ----
export class Tile {
  constructor(path, w = T, h = T, meta = {}) {
    this.path = path; this.w = w; this.h = h; this.meta = meta; this.defs = []; this.body = []; this.n = 0;
    this.pre = 'g' + hash(path).toString(36).slice(0, 5);
  }
  id() { return `${this.pre}${this.n++}`; }
  // linear gradient (objectBoundingBox). angle in degrees: 90 = top->bottom, 0 = left->right, 45 = upper-left -> lower-right
  lg(stops, angle = 90) {
    const id = this.id(), a = angle * Math.PI / 180, dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
    this.defs.push(`<linearGradient id="${id}" x1="${f(.5 - dx)}" y1="${f(.5 - dy)}" x2="${f(.5 + dx)}" y2="${f(.5 + dy)}">${stops.map((c, i) => `<stop offset="${f(i / (stops.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>`);
    return `url(#${id})`;
  }
  // radial gradient with highlight towards upper-left; stops = colours light -> dark; alphas optional
  rg(stops, cx = .36, cy = .3, r = .75, alphas = null) {
    const id = this.id();
    this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map((c, i) => `<stop offset="${f(i / (stops.length - 1))}" stop-color="${c}"${alphas ? ` stop-opacity="${alphas[i]}"` : ''}/>`).join('')}</radialGradient>`);
    return `url(#${id})`;
  }
  clip(d) { const id = this.id(); this.defs.push(`<clipPath id="${id}"><path clip-rule="evenodd" d="${d}"/></clipPath>`); return `url(#${id})`; }
  add(...s) { this.body.push(...s); return this; }
  svg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.w} ${this.h}" width="${this.w}" height="${this.h}">${this.defs.length ? `<defs>${this.defs.join('')}</defs>` : ''}${this.body.join('')}</svg>\n`;
  }
}

// ---- primitives ----
const fl = (fill, x) => (x && 'fill' in x) ? '' : ` fill="${fill}"`;
const at = (o) => Object.entries(o || {}).map(([k, v]) => ` ${k}="${v}"`).join('');
export const ell = (cx, cy, rx, ry, fill, op = 1, rot = 0, x = {}) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"${fl(fill, x)}${op < 1 ? ` opacity="${op}"` : ''}${rot ? ` transform="rotate(${f(rot)} ${f(cx)} ${f(cy)})"` : ''}${at(x)}/>`;
export const circ = (cx, cy, r, fill, op = 1, x = {}) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"${fl(fill, x)}${op < 1 ? ` opacity="${op}"` : ''}${at(x)}/>`;
export const rect = (x, y, w, h, fill, rx = 0, op = 1, ex = {}) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"${rx ? ` rx="${rx}"` : ''}${fl(fill, ex)}${op < 1 ? ` opacity="${op}"` : ''}${at(ex)}/>`;
export const path = (d, fill, op = 1, ex = {}) => `<path d="${d}"${fl(fill, ex)}${op < 1 ? ` opacity="${op}"` : ''}${at(ex)}/>`;
export const line = (d, stroke, w = 1, op = 1, ex = {}) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` opacity="${op}"` : ''}${at(ex)}/>`;
export const ink = (color, w = .9, op = .75) => ({ stroke: color, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-opacity': op });
export const g = (inner, ex = {}) => `<g${at(ex)}>${Array.isArray(inner) ? inner.join('') : inner}</g>`;
// soft drop shadow (light from upper-left, so it falls to the lower-right): two stacked ellipses, no filters
export const shadow = (cx, cy, rx, ry, op = 1) => ell(cx + rx * .12, cy, rx * 1.12, ry * 1.15, '#3b3a24', .09 * op) + ell(cx + rx * .1, cy, rx * .92, ry * .88, '#3b3a24', .15 * op) + ell(cx + rx * .08, cy - ry * .05, rx * .6, ry * .55, '#2e2c1a', .12 * op);
// irregular blob path around (cx,cy)
export function blobPath(r, cx, cy, rx, ry, n = 9, j = .18) {
  const pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (r() - .5) * 2 * j; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  let d = `M${f((pts[0][0] + pts[n - 1][0]) / 2)} ${f((pts[0][1] + pts[n - 1][1]) / 2)}`;
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; d += `Q${f(p[0])} ${f(p[1])} ${f((p[0] + q[0]) / 2)} ${f((p[1] + q[1]) / 2)}`; }
  return d + 'Z';
}
// draw `fn(x, y)` at (cx,cy) and at every +-64 wrapped copy that touches the 64x64 cell => seamless on all four sides
export function wrapped(cx, cy, rad, fn, size = T) {
  const out = [];
  for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) {
    const x = cx + dx, y = cy + dy;
    if (x + rad > 0 && x - rad < size && y + rad > 0 && y - rad < size) out.push(fn(x, y));
  }
  return out.join('');
}
export const tuft = (x, y, col = P.tuftG, op = .5, s = 1) => line(`M${f(x)} ${f(y)}q${f(1 * s)}-${f(5 * s)} ${f(3 * s)}-${f(7 * s)}M${f(x + 3 * s)} ${f(y)}q0-${f(5 * s)}-${f(1 * s)}-${f(8 * s)}M${f(x - 3 * s)} ${f(y)}q${f(-1 * s)}-${f(4 * s)}${f(-3 * s)}-${f(5 * s)}`, col, 1.1, op);

// ---- output ----
// meta: {region, sub, cat, name, variant, tags[], anchor}
export function save(tile, { region = 'greenvale', sub = 'common', cat, name, variant, tags = [], note = '' }) {
  const rel = `${region}/${sub}/${cat}/${name}${variant ? '-' + variant : ''}.svg`;
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, tile.svg());
  registry.push({ path: rel, region, sub, category: cat, name, variant: variant || '', size: [tile.w, tile.h], cells: [tile.w / T, tile.h / T], tags, note });
}
export function newTile(spec, w = T, h = T) { // spec used as tile id for gradient prefixes
  return new Tile(`${spec.region || 'greenvale'}/${spec.sub || 'common'}/${spec.cat}/${spec.name}-${spec.variant || ''}`, w, h);
}
