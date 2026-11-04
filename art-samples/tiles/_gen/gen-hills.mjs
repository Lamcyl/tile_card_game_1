// Misty Highlands (greenvale/misty-highlands): ochre pasture, heather, gorse, moor, scree and rock-slab ground, decals (goats, birds), autotiles, rope bridge. Objects: gen-hills-objects.mjs.
import { T, P, rng, hash, f, ell, circ, rect, path, line, ink, tuft, FAM, skeleton, inShape, maker, bloom, scat, SUBS, sparkle, fronds } from './sub.mjs';
import { interior } from './ground.mjs';
import { wrapped } from './lib.mjs';
import { PEAT } from './marsh-lib.mjs';
import { MOSS } from './ruins-lib.mjs';
import { OCHRE, HEATH, SCREE, MOOR, SLAB, CHASM, mossy, wetOchre, flecks, stoneS, heatherS, gorseS, mixc } from './hills-lib.mjs';

const SUB = SUBS.hills, { mk, out } = maker(SUB);
const rr = (s) => rng(hash(s));
const gnd = (cat, name, v, base, fn, tags = []) => { const t = mk(cat, name, v); t.add(base, fn(rr(name + v), t)); out(t, cat, name, v, ['seamless', 'ground', ...tags]); };
const tf = (r, n, col = '#8f8a48') => scat(r, n, 10, 11).map(([x, y]) => tuft(x, y, col, .65, .7)).join('');
const blades = (r, n, col = '#b0a060') => scat(r, n, 9, 8).map(([x, y]) => line(`M${f(x)} ${f(y)}q${f(r.range(-3, 3))} -5 ${f(r.range(-4, 4))} ${f(-r.range(8, 13))}`, col, 1.1, .8) + line(`M${f(x + 2)} ${f(y)}q${f(r.range(-2, 2))} -4 ${f(r.range(-3, 3))} -8`, col, 1, .7)).join('');
// ground: ochre pasture
gnd('ground', 'ochre-pasture', 'a', skeleton(OCHRE), (r) => interior(OCHRE, 9501, { n: 4, tufts: 3 }), ['ochre', 'pasture']);
gnd('ground', 'ochre-pasture', 'b', skeleton(OCHRE), (r) => interior(OCHRE, 9502, { n: 3, tufts: 0 }) + blades(r, 7), ['ochre', 'pasture', 'grass']);
gnd('ground', 'ochre-pasture', 'c', skeleton(OCHRE), (r) => interior(OCHRE, 9503, { n: 3, tufts: 2 }) + scat(r, 4, 12, 12).map(([x, y], i) => bloom(['bluebell', 'daisy', 'bluebell', 'clover'][i], x, y, .75)).join(''), ['ochre', 'pasture', 'flowers']);
gnd('ground', 'ochre-pasture', 'd', skeleton(OCHRE), (r) => interior(OCHRE, 9504, { n: 4, cols: ['#bfae70', '#d9c88c'], tufts: 2 }) + stoneS(22, 40, .8) + stoneS(42, 24, .6), ['ochre', 'pasture', 'stones']);
gnd('ground', 'ochre-dry', 'a', skeleton(OCHRE), (r) => interior(OCHRE, 9511, { n: 4, cols: ['#c4b074', '#dccd94'], tufts: 0 }) + blades(r, 9, '#a89858'), ['ochre', 'dry']);
gnd('ground', 'ochre-dry', 'b', skeleton(OCHRE), (r) => interior(OCHRE, 9512, { n: 4, cols: ['#c4b074', '#dccd94'], tufts: 0 }) + flecks('od', 5, '#9a8a58').replace(/(<path)/g, '$1') + tf(r, 3, '#a89858'), ['ochre', 'dry']);
// heather: purple-brown wash with bell dabs
const heathDabs = (r, n, big = false) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(10, 54), y = r.range(12, 54); o += ell(x, y, r.range(3, 5.4) * (big ? 1.3 : 1), r.range(1.6, 2.6), r.pick(['#a070b8', '#b888c8', '#8a5aa8', '#c8a0d4']), .75, r.range(-30, 30)) + ell(x - 1, y - .8, 1.4, .7, '#e0c8ec', .6); } return o; };
gnd('ground', 'heather', 'a', skeleton(HEATH), (r) => interior(HEATH, 9521, { n: 4, tufts: 0 }) + heathDabs(r, 12), ['heather', 'moor']);
gnd('ground', 'heather', 'b', skeleton(HEATH), (r) => interior(HEATH, 9522, { n: 4, cols: ['#aa9aa6', '#c8b4c4'], tufts: 0 }) + heathDabs(r, 16, true), ['heather', 'moor', 'bloom']);
gnd('ground', 'heather', 'c', skeleton(HEATH), (r) => interior(HEATH, 9523, { n: 3, tufts: 1 }) + scat(r, 5, 11, 11).map(([x, y]) => heatherS(x, y + 4, 1)).join(''), ['heather', 'moor']);
gnd('ground', 'heather', 'd', skeleton(HEATH), (r) => interior(HEATH, 9524, { n: 3, tufts: 0 }) + heathDabs(r, 8) + stoneS(36, 38, .9) + stoneS(22, 22, .6), ['heather', 'moor', 'stones']);
// gorse: ochre ground with yellow-flecked scrub
const gorseDabs = (r, n) => { let o = ''; for (let i = 0; i < n; i++) { const x = r.range(10, 54), y = r.range(12, 54); o += ell(x, y, r.range(4, 7), r.range(2.4, 3.6), r.pick(['#6f9a48', '#5a8a40', '#7aa650']), .8, r.range(-30, 30)); for (let k = 0; k < 4; k++) o += circ(x + r.range(-4, 4), y + r.range(-2, 2), r.range(.9, 1.3), '#f6d42a', 1); } return o; };
gnd('ground', 'gorse', 'a', skeleton(OCHRE), (r) => interior(OCHRE, 9531, { n: 3, tufts: 0 }) + gorseDabs(r, 5), ['gorse', 'scrub']);
gnd('ground', 'gorse', 'b', skeleton(OCHRE), (r) => interior(OCHRE, 9532, { n: 3, tufts: 0 }) + gorseDabs(r, 8), ['gorse', 'scrub']);
gnd('ground', 'gorse', 'c', skeleton(OCHRE), (r) => interior(OCHRE, 9533, { n: 3, tufts: 0 }) + gorseS(24, 40, 1.1) + gorseS(42, 30, .9) + gorseDabs(r, 2), ['gorse', 'scrub']);
// moor grass and scree and slab
gnd('ground', 'moor-grass', 'a', skeleton(MOOR), (r) => interior(MOOR, 9541, { n: 4, tufts: 3 }), ['moor', 'grass']);
gnd('ground', 'moor-grass', 'b', skeleton(MOOR), (r) => interior(MOOR, 9542, { n: 3, tufts: 1 }) + blades(r, 6, '#8aa05a') + stoneS(40, 40, .7), ['moor', 'grass']);
const scr = (r, n) => scat(r, n, 10, 9).map(([x, y]) => stoneS(x, y, r.range(.5, 1.1), r.pick([['#e0e1d6', '#b4b4a6', '#868678'], ['#e6dcc8', '#c4b8a0', '#968a74'], ['#d4d6d8', '#a2a6ac', '#74787e']]))).join('');
gnd('ground', 'scree', 'a', skeleton(SCREE), (r) => interior(SCREE, 9551, { n: 3, tufts: 0 }) + scr(r, 9), ['scree', 'rock']);
gnd('ground', 'scree', 'b', skeleton(SCREE), (r) => interior(SCREE, 9552, { n: 3, tufts: 0 }) + scr(r, 14), ['scree', 'rock']);
gnd('ground', 'scree', 'c', skeleton(SCREE), (r) => interior(SCREE, 9553, { n: 3, tufts: 1 }) + scr(r, 7) + tf(r, 2, '#8a9a58'), ['scree', 'rock']);
gnd('ground', 'scree', 'd', skeleton(SCREE), (r) => interior(SCREE, 9554, { n: 3, tufts: 0 }) + scr(r, 5) + flecks('sc', 6), ['scree', 'rock']);
gnd('ground', 'rock-slab', 'a', skeleton(SLAB), (r) => interior(SLAB, 9561, { n: 3, tufts: 0 }) + flecks('sl1', 7) + line('M14 30L30 28L46 34', '#6a6658', 1.1, .5), ['rock', 'slab']);
gnd('ground', 'rock-slab', 'b', skeleton(SLAB), (r) => interior(SLAB, 9562, { n: 3, tufts: 0 }) + flecks('sl2', 7) + line('M20 22L28 34L40 38L50 50', '#6a6658', 1.1, .5) + scat(r, 3, 12, 14).map(([x, y]) => ell(x, y, 4, 2, '#9ab070', .7, 10)).join(''), ['rock', 'slab', 'lichen']);
gnd('ground', 'rock-slab', 'c', skeleton(SLAB), (r) => interior(SLAB, 9563, { n: 3, tufts: 0 }) + flecks('sl3', 5) + scat(r, 4, 12, 11).map(([x, y]) => tuft(x, y, '#8a9a58', .8, .6)).join('') + stoneS(40, 30, .8), ['rock', 'slab']);
gnd('ground', 'wet-moor', 'a', skeleton(MOOR), (r) => interior(MOOR, 9571, { n: 3, tufts: 1 }) + ell(30, 34, 11, 3.6, '#7a8a96', .35) + ell(30, 34.4, 9.6, 2.8, '#b4cad4', .9) + ell(27, 33, 4, 1, '#fff', .7), ['moor', 'wet', 'puddle']);
// ramps from the marsh and from the ruins up into the highlands (same wash geometry as ochre, mixed colours)
for (const [nm, F, tg] of [['ochre-peat-ramp', (u) => wetOchre(u), 'marsh'], ['ochre-moss-ramp', (u) => mossy(u), 'mossy-ruins']]) for (const [v, u, s] of [['a', .35, 9581], ['b', .65, 9582]]) gnd('ground', nm, v, skeleton(F(u)), (r) => interior(F(u), s, { n: 4, tufts: 3 }), ['blend', 'ramp', tg]);
// baked detail
const gd = (name, v, base, fn, tags = []) => gnd('ground-detail', name, v, base, fn, tags);
gd('heather-bloom', 'a', skeleton(HEATH), (r) => interior(HEATH, 9601, { n: 3, tufts: 0 }) + scat(r, 7, 11, 9).map(([x, y]) => heatherS(x, y + 4, 1.1)).join(''), ['heather', 'flowers']);
gd('heather-bloom', 'b', skeleton(OCHRE), (r) => interior(OCHRE, 9602, { n: 3, tufts: 1 }) + scat(r, 5, 12, 12).map(([x, y]) => heatherS(x, y + 4, 1.2, ['#e8a0c0', '#f4c0d8', '#c8789c'])).join(''), ['heather', 'flowers', 'pink']);
gd('gorse-flower', 'a', skeleton(OCHRE), (r) => interior(OCHRE, 9603, { n: 3, tufts: 0 }) + gorseS(22, 44, 1.2) + gorseS(44, 30, 1) + gorseS(30, 24, .8), ['gorse', 'flowers']);
gd('thistle', 'a', skeleton(OCHRE), (r) => interior(OCHRE, 9604, { n: 3, tufts: 1 }) + scat(r, 4, 12, 12).map(([x, y]) => line(`M${f(x)} ${f(y + 4)}v-7`, '#5f8a48', 1, .9) + path(`M${f(x - 2.6)} ${f(y - 3)}l5.2 0l-1 -3l-3 0Z`, '#9a6ab8', 1, ink('#4a2a6a', .4, .7)) + ell(x, y - 7, 2.4, 1.6, '#c898d8', 1) + ell(x - 2.4, y + 1, 2.4, 1, '#5f8a48', 1, -30) + ell(x + 2.4, y + 1, 2.4, 1, '#5f8a48', 1, 30)).join(''), ['thistle', 'flowers']);
gd('harebell', 'a', skeleton(MOOR), (r) => interior(MOOR, 9605, { n: 3, tufts: 2 }) + scat(r, 5, 12, 10).map(([x, y]) => bloom('bluebell', x, y, .9, '#8aa0e8')).join(''), ['harebell', 'flowers']);
gd('pebbles-ochre', 'a', skeleton(OCHRE), (r) => interior(OCHRE, 9606, { n: 3, tufts: 1 }) + scr(r, 6), ['pebbles']);
gd('pebbles-ochre', 'b', skeleton(OCHRE), (r) => interior(OCHRE, 9607, { n: 3, tufts: 1 }) + scr(r, 10), ['pebbles']);
gd('lichen-slab', 'a', skeleton(SLAB), (r) => interior(SLAB, 9608, { n: 3, tufts: 0 }) + flecks('ls1', 5) + scat(r, 6, 11, 9).map(([x, y]) => ell(x, y, r.range(3, 5), r.range(2, 3), r.pick(['#b4c47a', '#d8c878', '#9ab070']), .8, r.range(0, 180)) + circ(x, y, .7, '#6a7a40', .8)).join(''), ['lichen', 'rock']);
gd('wool-tufts', 'a', skeleton(OCHRE), (r) => interior(OCHRE, 9609, { n: 3, tufts: 2 }) + scat(r, 4, 12, 13).map(([x, y]) => ell(x, y, 3.4, 2, '#fffaf0', .9, r.range(-20, 20), ink('#cfc8b0', .4, .5)) + ell(x - 1, y - .7, 1.4, .7, '#fff', .8)).join(''), ['pasture', 'sheep']);
gd('crocus', 'a', skeleton(MOOR), (r) => interior(MOOR, 9610, { n: 3, tufts: 1 }) + scat(r, 6, 12, 9).map(([x, y]) => line(`M${f(x)} ${f(y + 3)}v-3`, '#7aa650', 1, .9) + path(`M${f(x - 2)} ${f(y)}Q${f(x)} ${f(y - 6)} ${f(x + 2)} ${f(y)}Z`, r.pick(['#b890e0', '#f6f0e0', '#9a70d0']), 1, ink('#4a2a6a', .4, .7)) + circ(x, y - 1, .6, '#f3c24f')).join(''), ['crocus', 'flowers']);

// ======================= decals =======================
const decal = (name, v, fn, tags = []) => { const t = mk('decals', name, v); fn(t, rr(name + v)); out(t, 'decals', name, v, ['overlay', 'decal', 'transparent', 'highland', ...tags]); };
for (const v of ['a', 'b', 'c']) decal('scree-scatter', v, (t, r) => t.add(scr(r, 7 + (v === 'c' ? 4 : 0))), ['scree']);
for (const v of ['a', 'b']) decal('rock-flecks', v, (t, r) => { for (let i = 0; i < 7; i++) t.add(line(`M${f(r.range(10, 50))} ${f(r.range(12, 52))}l${f(r.range(3, 6))} ${f(r.range(-1, 1.4))}`, '#8a8678', 1, .45)); });
for (const v of ['a', 'b']) decal('goat-tracks', v, (t, r) => { for (let i = 0; i < 5; i++) { const x = 10 + i * 10, y = 36 + Math.sin(i * 1.2 + (v === 'b' ? 2 : 0)) * 8; t.add(path(`M${x} ${y}l-1.2 -3.4l2.4 0Z`, '#7a6a48', .55), path(`M${x + 2.4} ${y}l-1.2 -3.4l2.4 0Z`, '#7a6a48', .55)); } });
for (const v of ['a', 'b', 'c']) decal('wind-grass', v, (t, r) => { for (let i = 0; i < 6; i++) { const x = r.range(8, 40), y = r.range(14, 52), w = r.range(14, 22); t.add(line(`M${f(x)} ${f(y)}q${f(w / 2)} ${f(-3)} ${f(w)} ${f(r.range(-2, 2))}`, '#d8cc94', 1.2, .6)); } }, ['wind']);
for (const v of ['a', 'b']) decal('lichen-patch', v, (t, r) => { for (let i = 0; i < 3; i++) t.add(ell(r.range(16, 48), r.range(18, 46), r.range(5, 9), r.range(3, 5), r.pick(['#b4c47a', '#d8c878']), .75, r.range(0, 180)), ...Array.from({ length: 5 }, () => circ(r.range(12, 52), r.range(14, 50), .8, '#6a7a40', .6))); });
for (const v of ['a', 'b']) decal('feather', v, (t, r) => { for (let i = 0; i < 2; i++) { const x = r.range(20, 44), y = r.range(24, 44), a = r.range(0, 360); t.add(`<g transform="rotate(${f(a)} ${f(x)} ${f(y)})">` + path(`M${f(x - 7)} ${f(y)}Q${f(x)} ${f(y - 3)} ${f(x + 7)} ${f(y)}Q${f(x)} ${f(y + 2.4)} ${f(x - 7)} ${f(y)}Z`, '#f0ece0', 1, ink('#9a9480', .5, .8)) + line(`M${f(x - 7)} ${f(y)}H${f(x + 7)}`, '#9a9480', .6, .7) + '</g>'); } });
// ---- goats ----
function goat(t, x, y, s, pose, col = ['#fffaf0', '#d8d0bc', '#9a927c']) {
  const g = t.lg([col[0], col[1], col[2]], 70), ik = ink('#4a3e30', .8, .85); let o = ell(x + 1, y + 6 * s, 11 * s, 2.6 * s, '#3b3a24', .2);
  if (pose === 'rest') {
    o += ell(x, y + 2 * s, 10 * s, 5 * s, g, 1, 0, ik) + ell(x - 3 * s, y - .6 * s, 5 * s, 2 * s, '#fff', .35) + ell(x + 10 * s, y - 1 * s, 4.2 * s, 3.2 * s, g, 1, -12, ik) + path(`M${f(x + 8 * s)} ${f(y - 4 * s)}q${f(-1 * s)} ${f(-7 * s)} ${f(4 * s)} ${f(-8 * s)}M${f(x + 11 * s)} ${f(y - 4 * s)}q${f(1 * s)} ${f(-7 * s)} ${f(6 * s)} ${f(-6 * s)}`, 'none', 1, { fill: 'none', stroke: '#6a5a42', 'stroke-width': 1.5 * s, 'stroke-linecap': 'round' }) + circ(x + 12 * s, y - 1.6 * s, .6 * s, '#111') + ell(x - 9 * s, y + 3 * s, 2 * s, 1.2 * s, col[1], 1);
    return o;
  }
  const leg = (lx, ly, k = 0) => line(`M${f(lx)} ${f(ly)}L${f(lx + k)} ${f(y + 6 * s)}`, '#6a5a42', 1.5 * s, 1);
  o += leg(x - 7 * s, y + 3 * s, -1) + leg(x - 4 * s, y + 3 * s, 1) + leg(x + 5 * s, y + 3 * s, -1) + leg(x + 8 * s, y + 3 * s, 1);
  o += ell(x, y, 10 * s, 5.6 * s, g, 1, 0, ik) + ell(x - 3 * s, y - 2 * s, 5.4 * s, 2 * s, '#fff', .4, -8) + path(`M${f(x - 10 * s)} ${f(y - 2 * s)}q${f(-3 * s)} ${f(-1 * s)} ${f(-3 * s)} ${f(2 * s)}`, 'none', 1, { fill: 'none', stroke: col[1], 'stroke-width': 2 * s });
  if (pose === 'graze') o += path(`M${f(x + 7 * s)} ${f(y - 2 * s)}Q${f(x + 12 * s)} ${f(y)} ${f(x + 12 * s)} ${f(y + 4 * s)}`, 'none', 1, { fill: 'none', stroke: col[1], 'stroke-width': 3.6 * s, 'stroke-linecap': 'round' }) + ell(x + 12.6 * s, y + 5.4 * s, 3 * s, 2 * s, col[1], 1, 30, ik) + path(`M${f(x + 11 * s)} ${f(y + 3.4 * s)}q${f(-2 * s)} ${f(-4 * s)} ${f(-5 * s)} ${f(-3 * s)}`, 'none', 1, { fill: 'none', stroke: '#6a5a42', 'stroke-width': 1.4 * s, 'stroke-linecap': 'round' }) + circ(x + 13 * s, y + 4.6 * s, .6 * s, '#111') + path(`M${f(x + 12 * s)} ${f(y + 7 * s)}l${f(-.4 * s)} ${f(3 * s)}l${f(1.6 * s)} ${f(-2.4 * s)}Z`, '#fffaf0', 1);
  else o += path(`M${f(x + 7 * s)} ${f(y - 2 * s)}Q${f(x + 10 * s)} ${f(y - 8 * s)} ${f(x + 11 * s)} ${f(y - 9 * s)}`, 'none', 1, { fill: 'none', stroke: col[1], 'stroke-width': 3.4 * s, 'stroke-linecap': 'round' }) + ell(x + 12.4 * s, y - 9.6 * s, 3.8 * s, 2.6 * s, col[0], 1, -16, ik) + path(`M${f(x + 10 * s)} ${f(y - 11 * s)}q${f(-2 * s)} ${f(-8 * s)} ${f(3 * s)} ${f(-9 * s)}M${f(x + 12 * s)} ${f(y - 11.4 * s)}q${f(1 * s)} ${f(-7 * s)} ${f(6 * s)} ${f(-6 * s)}`, 'none', 1, { fill: 'none', stroke: '#6a5a42', 'stroke-width': 1.5 * s, 'stroke-linecap': 'round' }) + circ(x + 13.4 * s, y - 10.2 * s, .6 * s, '#111') + path(`M${f(x + 15 * s)} ${f(y - 8.4 * s)}l${f(-.6 * s)} ${f(3 * s)}l${f(1.8 * s)} ${f(-2.4 * s)}Z`, '#fffaf0', 1);
  return o;
}
decal('goat', 'a', (t) => t.add(goat(t, 30, 38, 1.4, 'graze')), ['creature', 'goat']);
decal('goat', 'b', (t) => t.add(goat(t, 30, 38, 1.4, 'stand', ['#eadfc8', '#bcae92', '#8a7c62'])), ['creature', 'goat']);
decal('goat', 'c', (t) => t.add(goat(t, 22, 42, .8, 'stand'), goat(t, 44, 40, 1.1, 'graze', ['#c8b8a0', '#9a8a72', '#6a5a46'])), ['creature', 'goat', 'kid']);
decal('goat', 'd', (t) => t.add(goat(t, 30, 38, 1.4, 'rest', ['#e0d4bc', '#b4a68a', '#8a7a60'])), ['creature', 'goat']);
// ---- birds ----
const hawk = (x, y, s, rot = 0) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})">` + ell(4, 22, 14, 4, '#3b3a24', .15) + path('M0 -3Q-8 -8 -20 -4Q-17 -1 -14 1Q-10 -1 -6 2Q-3 0 0 3Q3 0 6 2Q10 -1 14 1Q17 -1 20 -4Q8 -8 0 -3Z', '#8a6a48', 1, ink('#3a2418', .7, .8)) + path('M-20 -4Q-17 -1 -14 1M20 -4Q17 -1 14 1', 'none', 1, { fill: 'none', stroke: '#3a2418', 'stroke-width': .8 }) + ell(0, 1, 3, 6, '#a88a64', 1, 0, ink('#3a2418', .7, .8)) + path('M-3 7L0 14L3 7Z', '#6a4a30', 1) + circ(0, -5, 2.2, '#c8a878', 1, ink('#3a2418', .5, .8)) + path('M-.8 -7l.8 -2l.8 2Z', '#e8c040', 1) + '</g>';
decal('bird-hawk', 'a', (t) => t.add(hawk(32, 28, 1.2, -10)), ['creature', 'bird', 'soaring']);
decal('bird-hawk', 'b', (t) => t.add(hawk(26, 24, .9, 20), hawk(44, 40, .7, -25)), ['creature', 'bird', 'soaring']);
const crow = (x, y, s, flip = 1) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s * flip} ${s})">` + ell(1, 6, 7, 1.8, '#3b3a24', .2) + line('M-1 4v3M2 4v3', '#2a2a30', 1) + path('M-7 -1Q-5 -6 3 -5Q8 -4 8 0Q4 5 -3 4Q-7 3 -7 -1Z', '#2a2f48', 1, ink('#10141f', .6, .85)) + path('M-7 -1L-13 1L-8 3Z', '#2a2f48', 1) + circ(6.5, -4, 2.4, '#2a2f48', 1, ink('#10141f', .6, .85)) + path('M8.6 -4.4l4 1.2l-4 1.2Z', '#4a4a50', 1) + circ(7, -4.6, .5, '#fff') + ell(-1, -2.4, 3.4, 1.2, '#5a6a8c', .55, -10) + '</g>';
decal('bird-crow', 'a', (t) => t.add(crow(32, 38, 1.5)), ['creature', 'bird', 'crow']);
decal('bird-crow', 'b', (t) => t.add(crow(24, 40, 1.2), crow(42, 34, 1.1, -1)), ['creature', 'bird', 'crow']);
decal('bird-lark', 'a', (t) => t.add(ell(34, 48, 8, 2, '#3b3a24', .18), stoneS(32, 44, 1.4), `<g transform="translate(32 34)">` + path('M-5 0Q-4 -5 2 -5Q6 -4 6 0Q3 4 -3 4Q-5 3 -5 0Z', '#a8845a', 1, ink('#4a3220', .7, .85)) + path('M-5 1L-10 4L-4 3Z', '#7a5a3a', 1) + circ(5, -5, 2, '#a8845a', 1, ink('#4a3220', .6, .85)) + path('M6.6 -5.4l3 1l-3 1Z', '#e8c060', 1) + circ(5.6, -5.6, .5, '#111') + ell(0, 1, 3.4, 2.6, '#e8d4a8', 1) + line('M-1 4v3M2 4v3', '#6a5a42', 1) + '</g>'), ['creature', 'bird', 'lark']);
decal('bird-flock', 'a', (t) => { const b = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})">` + path('M0 0Q-4 -4 -9 -1Q-5 -1 0 2Q5 -1 9 -1Q4 -4 0 0Z', '#3a3a4a', .92) + '</g>'; t.add(b(32, 20, 1.1), b(20, 28, .9), b(44, 28, .9), b(10, 36, .7), b(54, 36, .7)); }, ['creature', 'bird', 'flock']);
await import('./gen-hills-edges.mjs');
await import('./gen-hills-objects.mjs');
