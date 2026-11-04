// Water helpers shared by Bamboo Valley (stream) and Mirror Lake: pebble-bank water autotile (stream / mouth / lake), fish, koi, ripples.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, skeleton, FAM, BIT, blobGeom, inShape } from './sub.mjs';
import { waterFill } from './ground.mjs';
import { wrapped } from './lib.mjs';

export const WMG = 9, WR = 22;         // same margins as the common water-shore set: stream, mouth and lake pieces share one outline
export const ripple = (x, y, w = 12, col = P.water.foam, op = .75, sw = 1.2) => line(`M${f(x - w / 2)} ${f(y)}q${f(w / 4)}-3 ${f(w / 2)} 0t${f(w / 2)} 0`, col, sw, op);
export const ring = (x, y, rx, col = '#f6f3e6', op = .7) => ell(x, y, rx, rx * .42, 'none', 1, 0, { fill: 'none', stroke: col, 'stroke-width': 1, 'stroke-opacity': op });
export const stoneW = (x, y, s = 1, foam = true) => (foam ? ell(x, y + 1.4 * s, 6.4 * s, 2.6 * s, '#f6f3e6', .6) + ell(x, y + 1.4 * s, 4.6 * s, 1.8 * s, '#8cc3d3', .5) : '') + ell(x + .8 * s, y + 2.2 * s, 4.4 * s, 1.5 * s, '#3b3a24', .16) + ell(x, y, 4 * s, 2.9 * s, '#a2a596', 1, 0, ink(P.inkR, .6, .65)) + ell(x - 1.2 * s, y - 1 * s, 2 * s, 1.2 * s, '#e0e1d6', .9);
// koi seen from above. kind: kohaku (white/red), gold, shiro (white/black), ogon (orange)
export function koi(x, y, rot = 0, s = 1, kind = 'kohaku', op = .92) {
  const C = { kohaku: ['#fff6ea', '#e8503a'], gold: ['#f6d060', '#e88a2c'], shiro: ['#f4f4ee', '#2a2a30'], ogon: ['#f29a4a', '#f6d060'] }[kind];
  return `<g opacity="${op}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s * .8)})">`
    + ell(1, 5, 11, 2.4, '#1d4a63', .18)
    + path('M-9 0Q-14 -4 -17 -5Q-15 0 -17 5Q-14 4 -9 0Z', C[0], .9, ink('#8a6050', .4, .5))
    + ell(-1, -3.8, 3.4, 1.3, C[0], .95, 28, ink('#8a6050', .3, .5)) + ell(-1, 3.8, 3.4, 1.3, C[0], .95, -28, ink('#8a6050', .3, .5))
    + path('M9 0Q8 -4 1 -4.2Q-6 -4 -9 0Q-6 4 1 4.2Q8 4 9 0Z', C[0], 1, ink('#8a6050', .6, .6))
    + path('M6 -2.6Q1 -4 -2 -2.2Q0 1 4 .6Z', C[1], 1) + path('M-4 1.2Q-7 2.6 -8 .4Q-6 -1 -4 1.2Z', C[1], .95) + (kind === 'gold' ? '' : ell(-1, 2.6, 2, 1, C[1], .9))
    + circ(7, -1.5, .7, '#2a2a30') + circ(7, 1.5, .7, '#2a2a30') + ell(2, -1.8, 4, .7, '#fff', .35) + '</g>';
}
// ---- pebble-bank water autotile: stream (narrow clear water, flow streaks, grassy bank), lake (sandy shingle bank, still water), mouth (stream on the west fading to lake on the east) ----
const CAND = (() => { const r = rng(hash('bank-cands')); return Array.from({ length: 70 }, () => ({ x: r.range(4, 60), y: r.range(4, 60), s: r.range(.55, 1.15), c: r.int(0, 3), u: r(), v: r(), g: r(), a: r.range(-30, 30) })); })();
const STREAK = (() => { const r = rng(hash('flow-cands')); return Array.from({ length: 18 }, () => ({ x: r.range(14, 50), y: r.range(8, 56), w: r.range(10, 16), u: r() })); })();
const PEB = [['#ece3cc', '#b8ae94'], ['#d8d0bc', '#a09680'], ['#e6d6b0', '#b09c70'], ['#cfd0c4', '#9a9c8e']];
export const pebbleSmall = (x, y, s, ci) => ell(x + .5, y + 1, 2.8 * s, 1.1 * s, '#3b3a24', .15) + ell(x, y, 2.5 * s, 1.8 * s, PEB[ci][1], 1, 0, ink(P.inkR, .4, .5)) + ell(x - .6 * s, y - .5 * s, 1.3 * s, .8 * s, PEB[ci][0], .95);
export function pebbleWater(t, G, mask, { kind = 'stream', banks = 'grass' } = {}) {
  const Gx = blobGeom(mask, { n: WMG - 7, e: WMG - 7, s: WMG - 7, w: WMG - 7 }, WR + 4);
  const lk = (x) => kind === 'lake' ? 1 : kind === 'mouth' ? x / 64 : 0;        // 0 = stream, 1 = lake
  const clip = t.clip(G.d), id = clip.slice(5, -1), sw = (n, a, b) => `<stop offset="${n}" stop-color="#e8d9a8" stop-opacity="${a}"/>`;
  t.add(skeleton(FAM.grass));
  // sandy shingle band (fades in from the stream towards the lake)
  const gid = t.id(); t.defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${T}" y2="0"><stop offset="0" stop-color="#e8d9a8" stop-opacity="${kind === 'lake' ? .55 : 0}"/><stop offset="1" stop-color="#e8d9a8" stop-opacity="${kind === 'stream' ? 0 : .55}"/></linearGradient>`);
  t.add(path(G.d, 'none', 1, { stroke: '#7fae6a', 'stroke-width': 11, 'stroke-opacity': .22, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: `url(#${gid})`, 'stroke-width': 15, 'stroke-linejoin': 'round' }));
  t.add(`<g clip-path="url(#${id})">`, waterFill('shallow'));
  t.add(path(G.d, 'none', 1, { stroke: '#d8f0ee', 'stroke-width': 13, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }), path(G.d, 'none', 1, { stroke: '#e9f6f0', 'stroke-width': 5, 'stroke-opacity': .45, 'stroke-linejoin': 'round' }));
  if (kind !== 'lake') for (const s of STREAK) if (inShape(G, s.x, s.y, 6)) { const k = 1 - lk(s.x); if (s.u < .15 + .8 * k) t.add(line(`M${f(s.x - s.w / 2)} ${f(s.y)}q${f(s.w / 4)}-1.6 ${f(s.w / 2)} 0t${f(s.w / 2)} 0`, '#fff', 1.1, .7 * k + .1)); }
  t.add('</g>');
  t.add(path(G.d, 'none', 1, { stroke: P.water.rim, 'stroke-width': 1.3, 'stroke-opacity': .5, 'stroke-linejoin': 'round' }));
  for (const c of CAND) {
    const near = !inShape(G, c.x, c.y, 0) && inShape(Gx, c.x, c.y, 0), L = lk(c.x);
    if (near && c.u < .3 + .55 * L) t.add(pebbleSmall(c.x, c.y, c.s, c.c));
    else if (kind !== 'lake' && !inShape(G, c.x, c.y, 0) && !inShape(Gx, c.x, c.y, 0) && inShape(blobGeom(mask, { n: 0, e: 0, s: 0, w: 0 }, 0), c.x, c.y, 4) && c.g < .16 * (1 - L) && c.x > 8 && c.x < 56 && c.y > 10 && c.y < 56) t.add(tuft(c.x, c.y + 3, '#5f9a48', .8, .7));
    else if (kind !== 'lake' && inShape(G, c.x, c.y, 9) && c.v < .04 * (1 - L) && c.x > 10 && c.x < 54 && c.y > 10 && c.y < 54) t.add(stoneW(c.x, c.y, .75 + c.s * .3));
  }
}
