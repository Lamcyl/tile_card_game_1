// Ashkara sub-area 3: Singing Erg interest objects: the Singing Dune with wind-chime poles (landmark), the twin-pillar arch gate (closed/open),
// a buried colonnade, colossal statue head, chime grove, nomad listening camp, drum platform, beast skeleton, crest monument, scarab nest and sand chests.
// Runs on its own; helpers come from singing-erg-lib.mjs.
import { T, rng, f, ell, circ, rect, path, line, ink, D, sh, tuft, blobPath, C, TALL, LG, tile, VIO, AP, ERGROCK, heap, drift, chimePole, bone, rib, skull, scarab, dgrass, mix, wind, stroke } from './singing-erg-lib.mjs';

const IN = (n, v, size, tags, fn) => tile('interest', n, v, size, [...tags, size === LG ? 'large' : size === TALL ? 'tall' : 'one'], fn);
const wood = (t, ang = 0) => t.lg(['#b8905c', '#8a6238', '#5a3c20'], ang);
const stone = (t, ang = 0) => t.lg(['#f8dcae', '#d09a6a', '#946a52'], ang);
// a big dune mound: bright windward flank (upper-left), a sharp crest line, a steep violet slip face on the right. x0..x1 along the base y.
function dune(t, x0, x1, y, h, peak = .45, o = {}) {
  const px = x0 + (x1 - x0) * peak, py = y - h, wl = px - x0, wr = x1 - px;
  const body = `M${x0} ${y}C${f(x0 + wl * .45)} ${f(y - h * .08)} ${f(px - wl * .42)} ${f(py + h * .04)} ${f(px)} ${f(py)}C${f(px + wr * .1)} ${f(py + h * .02)} ${f(px + wr * .18)} ${f(py + h * .55)} ${f(px + wr * .42)} ${f(y - h * .18)}C${f(px + wr * .5)} ${f(y - h * .05)} ${f(px + wr * .8)} ${f(y)} ${x1} ${y}Z`;
  let s = path(body, t.lg(['#fff0cc', '#f1cb94', '#d89c68'], 20), 1, ink('#b07a52', 1, .6));
  const lee = `M${f(px)} ${f(py)}C${f(px + wr * .1)} ${f(py + h * .02)} ${f(px + wr * .18)} ${f(py + h * .55)} ${f(px + wr * .42)} ${f(y - h * .18)}C${f(px + wr * .5)} ${f(y - h * .05)} ${f(px + wr * .8)} ${f(y)} ${x1} ${y}H${f(px + wr * .12)}C${f(px + wr * .1)} ${f(y - h * .4)} ${f(px + wr * .04)} ${f(py + h * .3)} ${f(px)} ${f(py)}Z`;
  s += path(lee, t.lg(['#b9a2c4', '#8e7aa8', '#6a5a88'], 30), .78) + line(`M${f(px - wl * .2)} ${f(py + h * .03)}C${f(px - wl * .08)} ${f(py - 1)} ${f(px + wr * .04)} ${f(py)} ${f(px + wr * .1)} ${f(py + h * .22)}`, '#fffaf0', 1.5, .9);
  for (let i = 0; i < 6; i++) { const yy = y - 6 - i * h / 7, w = (x1 - x0) * (.46 - i * .05); s += line(`M${f(x0 + (x1 - x0) * .12 + i * 4)} ${f(yy)}q${f(w * .25)} -2.4 ${f(w * .5)} 0t${f(w * .5)} 0`, '#c48a5a', 1, .4); }
  return { s, px, py };
}
// ===== landmark: the Singing Dune with wind-chime poles =====
const singing = (t, v) => {
  const r = rng(v === 'a' ? 31 : 32); let o = ell(66, 112, 58, 7, '#8a5a30', .16);
  const d = dune(t, 6, 124, 112, 62, .5); o += d.s;
  const crest = [[46, 52, 38, -3], [58, 40, 50, 0], [72, 36, 44, 2]];
  if (v === 'a') {
    o += [[20, 94, 32], [32, 82, 38], [45, 68, 42], [57, 60, 46], [67, 70, 38], [104, 110, 34]].map(([x, y, h], i) => { const p = chimePole(t, x, y, h, .62, (i - 2.5) * .9, i % 3 === 1 ? 'bone' : i % 3 === 2 ? 'glass' : 'bronze'); return p; }).join('');
    o += [10, 17, 24].map((rx, i) => ell(66, 104, rx * 2.6, rx * .9, 'none', 1, 0, ink('#fff3d6', 1.2, .5 - i * .12))).join('');
  } else {
    o += [[24, 90, 34], [38, 76, 40], [52, 62, 46], [64, 64, 40], [108, 108, 34]].map(([x, y, h], i) => chimePole(t, x, y, h, .62, (i - 2) * 1.2, ['bronze', 'bone', 'bronze', 'glass', 'bone'][i])).join('');
    for (let i = 0; i < 4; i++) o += line(`M${70 + i * 10} ${68 + i * 8}q10 -8 20 0`, '#fffaf0', 1.1, .5 - i * .08);
    // pilgrims' drum on the foot of the dune
    o += `<g transform="translate(26 108)">` + ell(2, 3, 12, 3, '#3b3a24', .2) + path('M-9 -6V0Q-9 4 0 4T9 0V-6Z', t.lg(['#d8a070', '#a86a3a', '#6a3c20'], 0), 1, ink('#4a2a14', .9, .85)) + ell(0, -6, 9, 3, '#fff6dc', 1, 0, ink('#4a2a14', .9, .85)) + `</g>`;
  }
  // wind-blown plume off the crest
  o += [0, 1, 2, 3, 4].map(i => ell(d.px + 8 + i * 9, d.py + 2 - i * .5 + (i % 2), 9 - i, 1.6, '#fff3d6', .5 - i * .08)).join('');
  o += ell(30, 112, 30, 6, t.lg(AP, 70), .9) + ell(100, 112, 24, 5, VIO[1], .22);
  // grass at the foot and bones
  o += [[14, 108], [20, 110], [112, 108]].map(([x, y]) => dgrass(x, y, .8, '#8f9a50')).join('') + bone(88, 110, 10, 12);
  return o;
};
IN('singing-dune', 'a', LG, ['landmark', 'dune', 'chime', 'singing', 'signature', 'obstacle'], (t) => singing(t, 'a'));
IN('singing-dune', 'b', LG, ['landmark', 'dune', 'chime', 'singing', 'signature', 'obstacle'], (t) => singing(t, 'b'));
// ===== gate: twin pillar arch =====
const pillar = (t, x, fy, w, h, flip) => {
  let o = path(`M${x - w / 2 - 3} ${fy}V${fy - 7}H${x + w / 2 + 3}V${fy}Z`, stone(t, 0), 1, ink(D.inkS, 1, .85));
  o += path(`M${x - w / 2} ${fy - 7}L${x - w / 2 + 1} ${fy - h}H${x + w / 2 - 1}L${x + w / 2} ${fy - 7}Z`, t.lg(['#f8dcae', '#dcae7c', '#a97a52'], 0), 1, ink(D.inkS, 1, .85));
  for (let i = 1; i < 4; i++) o += line(`M${x - w / 2 + i * w / 4} ${fy - 8}V${fy - h + 2}`, '#a97a52', 1, .5);
  o += path(`M${x + w / 2 - 6} ${fy - 8}L${x + w / 2 - 5} ${fy - h}H${x + w / 2 - 1}L${x + w / 2} ${fy - 8}Z`, VIO[1], .28);
  // lotus-bud capital
  o += path(`M${x - w / 2 - 2} ${fy - h}Q${x - w / 2 - 6} ${fy - h - 12} ${x} ${fy - h - 16}Q${x + w / 2 + 6} ${fy - h - 12} ${x + w / 2 + 2} ${fy - h}Z`, t.lg(['#f8dcae', '#d09a6a', '#946a52'], 0), 1, ink(D.inkS, 1, .85)) + line(`M${x - w / 4} ${fy - h - 2}Q${x - w / 4 - 1} ${fy - h - 10} ${x} ${fy - h - 14}M${x + w / 4} ${fy - h - 2}Q${x + w / 4 + 1} ${fy - h - 10} ${x} ${fy - h - 14}`, '#946a52', 1, .6) + line(`M${x - w / 2} ${fy - h + 6}H${x + w / 2}`, '#3fb0ac', 2.4, .9) + line(`M${x - w / 2} ${fy - h + 10}H${x + w / 2}`, '#c0504a', 1.6, .9);
  return o;
};
const gate = (t, open) => {
  const fy = 114; let o = sh(64, fy + 1, 58, 6) + ell(64, fy, 60, 6, t.lg(AP, 70), .95) + ell(94, fy + 2, 24, 4, VIO[1], .2);
  const lx0 = 22, lx1 = 106, ly = 36;
  if (!open) {
    // sealed: a sand-stone slab door set between the pillars, with a sun disc and chime bar
    o += path(`M${lx0 + 8} ${fy - 4}V${ly + 14}Q64 ${ly - 4} ${lx1 - 8} ${ly + 14}V${fy - 4}Z`, t.lg(['#e8c8a0', '#c8926a', '#946a52'], 0), 1, ink(D.inkS, 1, .85));
    for (let y = ly + 30; y < fy - 6; y += 14) o += line(`M${lx0 + 9} ${y}H${lx1 - 9}`, '#946a52', 1, .55) + line(`M${lx0 + 9} ${y - 1}H${lx1 - 9}`, '#fff0d0', .7, .5);
    o += circ(64, 62, 11, '#f3c24f', 1, ink('#5a3a0a', 1, .85)) + circ(64, 62, 6.4, '#fff0a8', 1, ink('#b8862a', .8, .8)) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => line(`M${f(64 + Math.cos(i * .785) * 12)} ${f(62 + Math.sin(i * .785) * 12)}l${f(Math.cos(i * .785) * 5)} ${f(Math.sin(i * .785) * 5)}`, '#f3c24f', 1.6, 1)).join('');
    o += path('M58 82h12v18h-12Z', '#5a3c20', 1, ink('#3a2210', .8, .85)) + circ(64, 90, 2.4, '#f3c24f') + line('M44 78v12M84 78v12', '#6aaa9a', 2, .9);
  } else {
    o += path(`M${lx0 + 8} ${fy - 4}V${ly + 14}Q64 ${ly - 4} ${lx1 - 8} ${ly + 14}V${fy - 4}Z`, t.lg(['#fff0cc', '#f1cb94', '#d89c68'], 70), .0);
    o += `<path d="M${lx0 + 8} ${fy - 4}V${ly + 14}Q64 ${ly - 4} ${lx1 - 8} ${ly + 14}V${fy - 4}Z" fill="${t.lg(['#fbe4b8', '#f1cb94', '#e0a874'], 90)}"/>`;   // sand-lit passage into the dunes
    o += path(`M${lx0 + 8} ${ly + 14}Q64 ${ly - 4} ${lx1 - 8} ${ly + 14}V${ly + 44}Q64 ${ly + 24} ${lx0 + 8} ${ly + 44}Z`, VIO[1], .22) + ell(64, fy - 10, 18, 4, '#fff3d6', .5) + line('M40 100Q64 90 88 100', '#c48a5a', 1.2, .4);
    o += path(`M${lx0 + 8} ${ly + 14}V${fy - 4}H${lx0 + 20}V${ly + 18}Z`, '#946a52', .25);
    // the slab sunk into the sand at the side
    o += path('M28 112L30 96H44L46 112Z', t.lg(['#e8c8a0', '#c8926a', '#946a52'], 0), 1, ink(D.inkS, .9, .85)) + circ(37, 102, 3, '#f3c24f', 1, ink('#5a3a0a', .7, .85));
    o += [[58, 96], [70, 100], [64, 108]].map(([x, y]) => ell(x, y, 5, 1.2, '#fff3d6', .55)).join('');
  }
  o += pillar(t, lx0, fy - 1, 16, 72, false) + pillar(t, lx1, fy - 1, 16, 72, true);
  // arch lintel
  o += path(`M${lx0 - 12} ${ly + 2}Q64 ${ly - 20} ${lx1 + 12} ${ly + 2}V${ly + 12}Q64 ${ly - 8} ${lx0 - 12} ${ly + 12}Z`, t.lg(['#f8dcae', '#d09a6a', '#946a52'], 0), 1, ink(D.inkS, 1.1, .85)) + path(`M${lx0 - 8} ${ly + 4}Q64 ${ly - 16} ${lx1 + 8} ${ly + 4}`, 'none', 1, { stroke: '#fff0d0', 'stroke-width': 1.2, 'stroke-opacity': .7 });
  o += [[36, ly - 3], [50, ly - 8], [78, ly - 8], [92, ly - 3]].map(([x, y], i) => line(`M${x} ${y + 4}v4`, '#5a3c20', .7, .9) + `<rect x="${x - 1.4}" y="${y + 8}" width="2.8" height="${8 + (i % 2) * 3}" rx="1" fill="#e8b84a" stroke="#4a3220" stroke-width=".5"/>`).join('');   // chime bars hang from the lintel
  o += `<circle cx="64" cy="${ly - 9}" r="3.6" fill="#f3c24f" stroke="#5a3a0a" stroke-width=".7"/>`;
  o += drift(24, fy, 20, 6, t) + drift(104, fy, 20, 6, t) + [[12, 112], [118, 112]].map(([x, y]) => dgrass(x, y, .8, '#8f9a50')).join('');
  return o;
};
IN('gate-twin-pillar', 'closed', LG, ['gate', 'closed', 'obstacle'], (t) => gate(t, false));
IN('gate-twin-pillar', 'open', LG, ['gate', 'open'], (t) => gate(t, true));
// ===== buried colonnade: a row of column tops and a lintel breaking out of a dune =====
IN('buried-colonnade', 'a', LG, ['ruin', 'column', 'buried', 'signature', 'obstacle'], (t) => {
  let o = ell(64, 112, 58, 7, '#8a5a30', .16); const d = dune(t, 4, 124, 112, 56, .55); o += d.s;
  for (const [x, top, w] of [[20, 70, 14], [42, 56, 16], [66, 48, 18], [90, 58, 16], [110, 76, 12]]) {
    o += path(`M${x - w / 2} 104V${top + 6}Q${x} ${top - 2} ${x + w / 2} ${top + 6}V104Z`, t.lg(['#f8dcae', '#d09a6a', '#946a52'], 0), 1, ink(D.inkS, .9, .85)) + path(`M${x - w / 2 - 3} ${top + 6}Q${x - w / 2 - 4} ${top - 8} ${x} ${top - 10}Q${x + w / 2 + 4} ${top - 8} ${x + w / 2 + 3} ${top + 6}Z`, t.lg(['#f8dcae', '#d09a6a', '#946a52'], 0), 1, ink(D.inkS, .9, .85)) + [-1, 0, 1].map(k => line(`M${x + k * w / 4} ${top + 6}Q${x + k * w / 4} ${top - 2} ${x + k * w / 5} ${top - 8}`, '#946a52', .9, .6)).join('') + line(`M${x - w / 2} ${top + 10}H${x + w / 2}`, '#3fb0ac', 1.8, .85);
    o += ell(x, 104, w * .9, 5, t.lg(AP, 70), .95) + ell(x + w * .3, 106, w * .6, 3, VIO[1], .2);
  }
  o += path('M12 62L44 40H88L116 66V74H12Z', 'none', 1, { stroke: 'none' });
  o += path('M52 44L80 38L100 48L72 56Z', t.lg(['#f8dcae', '#d09a6a', '#946a52'], 30), 1, ink(D.inkS, .9, .85)) + line('M58 48l8 -2M70 46l8 -2', '#7a4a2a', 1, .7);
  return o + ell(64, 110, 50, 4, t.lg(AP, 70), .8) + bone(40, 112, 10, -12);
});
// ===== colossal half-buried statue head =====
const colossus = (t, v) => {
  let o = ell(66, 112, 58, 7, '#8a5a30', .16);
  o += path('M20 108Q14 60 38 36Q64 18 92 36Q116 60 108 108Z', t.lg(['#f8dcae', '#d09a6a', '#946a52'], 40), 1, ink(D.inkS, 1.2, .85)) + path('M82 40Q104 60 100 108H88Q94 62 82 40Z', VIO[1], .3);
  o += path('M28 52Q64 6 100 50L96 40Q64 -2 32 40Z', v === 'a' ? '#3a6a9a' : '#c8923a', 1, ink(D.inkS, 1, .85)) + [0, 1, 2, 3].map(i => line(`M${34 + i * 4} ${46 - i}Q64 ${14 + i * 3} ${96 - i * 4} ${46 - i}`, v === 'a' ? '#f3c24f' : '#7a4a2a', 1.4, .8)).join('') + path('M24 58Q64 28 104 58V66Q64 38 24 66Z', stone(t, 0), 1, ink(D.inkS, .9, .85));
  o += path('M36 74Q44 70 54 74Q46 80 36 74Z', '#fff6dc', 1, ink('#4a3220', 1, .85)) + path('M74 74Q84 70 92 74Q82 80 74 74Z', '#fff6dc', 1, ink('#4a3220', 1, .85)) + circ(45, 74, 2.8, '#2a2a2a') + circ(83, 74, 2.8, '#2a2a2a') + line('M34 70Q45 66 56 70M72 70Q83 66 94 70', '#3a2a1a', 2, .9);
  o += path('M60 76L56 96Q64 100 72 96L68 76Z', '#c08858', .7, ink(D.inkS, .8, .7)) + path('M48 100Q64 108 80 100', 'none', 1, { stroke: '#7a4a2a', 'stroke-width': 3, 'stroke-linecap': 'round' });
  if (v === 'b') o += path('M88 40L96 60L86 72L92 90', 'none', 1, { stroke: '#4a3220', 'stroke-width': 1.8, 'stroke-opacity': .75, 'stroke-linejoin': 'round' });
  o += `<path d="M4 112Q16 90 36 94Q50 84 66 96Q86 90 100 100Q116 96 126 112Z" fill="${t.lg(AP, 80)}" stroke="#c48a5a" stroke-width=".8" stroke-opacity=".5"/>` + ell(40, 98, 22, 4, '#fff', .35, -4) + ell(108, 108, 14, 3, VIO[1], .25);
  return o + dgrass(112, 110, .8, '#8f9a50') + dgrass(10, 110, .8, '#8f9a50');
};
IN('statue-colossus', 'a', LG, ['statue', 'ruin', 'head', 'signature', 'obstacle'], (t) => colossus(t, 'a'));
IN('statue-colossus', 'b', LG, ['statue', 'ruin', 'head', 'signature', 'obstacle'], (t) => colossus(t, 'b'));
// ===== chime grove =====
IN('chime-grove', 'a', LG, ['chime', 'singing', 'signature', 'obstacle'], (t) => {
  let o = ell(64, 108, 54, 10, '#8a5a30', .14) + ell(62, 108, 52, 9, t.lg(AP, 70), .9) + ell(92, 110, 24, 5, VIO[1], .2);
  const ps = [[28, 92, 58, 'bone'], [48, 104, 74, 'bronze'], [70, 96, 66, 'glass'], [92, 106, 76, 'bronze'], [108, 94, 54, 'bone'], [60, 86, 50, 'bronze']].sort((a, b) => a[1] - b[1]);
  for (const [x, y, h, k] of ps) o += chimePole(t, x, y, h, .78, (x - 64) * .04, k);
  return o + [[16, 108], [114, 106]].map(([x, y]) => dgrass(x, y, .8, '#8f9a50')).join('');
});
// ===== nomad listening camp =====
IN('nomad-camp', 'a', LG, ['camp', 'nomad', 'tent', 'obstacle'], (t) => {
  let o = ell(64, 108, 56, 8, '#8a5a30', .14) + ell(62, 108, 54, 7, t.lg(AP, 70), .9);
  o += path('M18 104L44 52L70 104Z', t.lg(['#fff6e0', '#e0c898', '#a88858'], 40), 1, ink('#5a4a30', 1, .85)) + path('M44 52L70 104L52 104Z', '#7a6a50', .25) + path('M34 104L44 70L54 104Z', '#3a2a18', .85) + line('M44 52V42', '#5a3c20', 2, 1) + path('M44 44h12l-3 3l3 3h-12Z', '#b0405a', .95) + line('M22 96L44 56M64 96L44 56', '#c0a070', .9, .7);
  o += path('M52 104L84 62L112 104Z', t.lg(['#f6e0b8', '#c8a470', '#8a6a40'], 40), 1, ink('#5a4a30', 1, .85)) + path('M84 62L112 104H96Z', '#5a3a28', .3) + path('M76 104L84 78L94 104Z', '#3a2a18', .85) + [[62, 90], [96, 92]].map(([x, y]) => line(`M${x} ${y}h8`, '#3fb0ac', 2, .9)).join('');
  o += `<g transform="translate(18 112)">${ell(0, 2, 8, 2.4, '#3b3a24', .2)}${path('M-6 0Q-6 -9 0 -9Q6 -9 6 0Z', '#8a6238', 1, ink(D.inkS, .8, .85))}${ell(0, -9, 6, 2, '#c0501e')}</g>`;
  o += chimePole(t, 112, 108, 46, .6, 1, 'bronze') + `<g transform="translate(40 114)">${ell(0, 0, 10, 3, '#3b3a24', .0)}${ell(0, -2, 8, 4, '#3a2a18', .0)}</g>`;
  o += `<g transform="translate(66 112)">${ell(0, 2, 14, 3, '#3b3a24', .18)}${path('M-12 0Q-10 -8 0 -8Q10 -8 12 0Z', '#e8c898', 1, ink(D.inkS, .8, .85))}${circ(-4, -5, 1.2, '#fff6dc')}${line('M-8 -5h16', '#b0405a', 1.6, .9)}</g>`;
  return o + `<g transform="translate(92 112)"><ellipse cx="0" cy="2" rx="9" ry="2.4" fill="#3b3a24" opacity=".18"/><path d="M-8 0Q-6 -10 0 -10Q6 -10 8 0Z" fill="#c8923a" stroke="#5a3a0a" stroke-width=".8"/><path d="M-3 -10Q0 -16 3 -10" fill="none" stroke="#5a3a0a" stroke-width="1.4"/></g>` + ell(30, 112, 6, 1.4, '#fff3d6', .5);
});
// ===== drum platform where the dune is coaxed to sing =====
IN('drum-platform', 'a', LG, ['drum', 'singing', 'ruin', 'obstacle'], (t) => {
  let o = ell(64, 108, 54, 9, '#8a5a30', .15);
  o += path('M12 100L24 78H104L116 100V108H12Z', t.lg(['#f8dcae', '#d09a6a', '#946a52'], 20), 1, ink(D.inkS, 1, .85)) + path('M24 78H104L98 72H30Z', '#fff0cc', 1, ink(D.inkS, .9, .85)) + path('M100 78L116 100V108H98Z', VIO[1], .3) + [0, 1, 2].map(i => line(`M${30 + i * 28} 80V106`, '#946a52', 1, .5)).join('');
  o += `<g transform="translate(64 72)">` + ell(2, 4, 28, 6, '#3b3a24', .18) + path('M-24 -22V-2Q-24 8 0 8T24 -2V-22Z', t.lg(['#d8a070', '#a86a3a', '#6a3c20'], 0), 1, ink('#4a2a14', 1.1, .85)) + ell(0, -22, 24, 8, '#f6e8c8', 1, 0, ink('#4a2a14', 1.1, .85)) + ell(0, -22, 18, 5.4, '#fff6dc', 1) + ell(-5, -23, 7, 2, '#e0d0a8', .6) + [0, 1, 2, 3, 4, 5].map(i => line(`M${-20 + i * 8} -17L${-17 + i * 6.6} 4`, '#e8d8a8', 1.2, .8)).join('') + line('M20 -34L8 -24', '#5a3c20', 3, 1) + circ(20, -35, 3.4, '#c8a070', 1, ink('#5a3c20', .8, .85)) + `</g>`;
  o += [18, 8, 28].map((rx, i) => ell(64, 52, rx * 2, rx * .7, 'none', 1, 0, ink('#fff3d6', 1.2, .55 - i * .14))).join('');
  return o + drift(14, 108, 16, 5, t) + drift(116, 108, 14, 5, t) + chimePole(t, 20, 96, 40, .55, 2, 'bone');
});
// ===== skeleton of a great desert beast half-buried in a dune =====
IN('beast-skeleton', 'a', LG, ['bones', 'skeleton', 'signature', 'obstacle'], (t) => {
  let o = ell(64, 108, 56, 8, '#8a5a30', .15) + ell(62, 106, 54, 7, t.lg(AP, 70), .9);
  o += path('M12 92Q20 78 38 82', 'none', 1, { stroke: '#eadcc0', 'stroke-width': 5, 'stroke-linecap': 'round' }) + path('M12 91Q20 77 38 81', 'none', 1, { stroke: '#fffaf0', 'stroke-width': 1.8, 'stroke-linecap': 'round' });
  for (let i = 0; i < 6; i++) { const x = 36 + i * 11, h = 34 - Math.abs(i - 2.4) * 3; o += path(`M${x} 100Q${x - 2} ${100 - h} ${x + 12} ${96 - h}Q${x + 6} ${100 - h * .4} ${x + 9} 100`, 'none', 1, { stroke: '#3b3a24', 'stroke-width': 4, 'stroke-opacity': .16, transform: 'translate(1.4 2)' }) + path(`M${x} 100Q${x - 2} ${100 - h} ${x + 12} ${96 - h}`, 'none', 1, { stroke: '#eadcc0', 'stroke-width': 4, 'stroke-linecap': 'round' }) + path(`M${x - .6} 100Q${x - 2.6} ${100 - h} ${x + 11.4} ${96 - h}`, 'none', 1, { stroke: '#fffaf0', 'stroke-width': 1.4, 'stroke-linecap': 'round' }); }
  o += line('M30 98Q70 90 112 98', '#bfa888', 3, .9) + line('M30 96.6Q70 88.6 112 96.6', '#fffaf0', 1, .8);
  o += `<g transform="translate(106 76)">` + path('M-16 14Q-18 -4 -4 -10Q10 -14 22 -6Q26 0 22 8L12 12L2 8Q-6 16 -16 14Z', '#fffaf0', 1, ink('#8a7458', 1, .85)) + circ(2, -2, 4.4, '#3a2a1a') + line('M6 10v4M10 10.4v4M14 10v4M18 8.4v4', '#8a7458', 1, .8) + path('M-6 -10L-12 -22L-4 -14Z M2 -12L2 -24L8 -12Z', '#fffaf0', 1, ink('#8a7458', .8, .85)) + `</g>`;
  return o + drift(26, 106, 22, 6, t) + drift(98, 106, 22, 6, t) + scarab(60, 104, .9, 80);
});
// ===== crest monument: a big cairn tower with prayer flags =====
IN('crest-monument', 'a', LG, ['cairn', 'monument', 'waypoint', 'obstacle'], (t) => {
  const r = rng(77); let o = ell(64, 110, 50, 7, '#8a5a30', .16); const d = dune(t, 14, 114, 110, 30, .5); o += d.s;
  let y = 96, w = 30; const cols = [['#f4dcb0', '#dcae7c', '#a97a52'], ['#e8c8a0', '#c8926a', '#946a52'], ['#f0d4aa', '#d4a074', '#9a704c']];
  for (let i = 0; i < 6; i++) { const h = 11 - i * .8; o += ell(64 + r.range(-2, 2), y - h / 2, w, h, t.lg(cols[i % 3], 70), 1, r.range(-3, 3), ink(D.inkS, 1, .85)) + ell(64 - w * .3, y - h / 2 - 2, w * .4, h * .26, '#fff', .45); y -= h * 1.45; w -= 3.8; }
  o += line(`M64 ${y + 4}V12`, '#6b4a2c', 2, 1) + circ(64, 12, 2.4, '#f3c24f', 1, ink('#5a3a0a', .6, .85));
  const flagC = ['#b0405a', '#f3c24f', '#3fb0ac', '#f8f0e0', '#c8352b'];
  for (const [x1, y1, x2] of [[64, 16, 20], [64, 16, 108]]) { o += line(`M${x1} ${y1}Q${(x1 + x2) / 2} ${y1 + 22} ${x2} ${y1 + 46}`, '#5a3c20', .9, .9); for (let i = 1; i <= 5; i++) { const u = i / 6, x = x1 + (x2 - x1) * u, yy = (1 - u) * (1 - u) * y1 + 2 * u * (1 - u) * (y1 + 22) + u * u * (y1 + 46) + 1; o += path(`M${f(x - 3)} ${f(yy)}h6v8h-6Z`, flagC[i % 5], .95, ink('#3a2a1a', .5, .8)); } o += line(`M${x2} ${y1 + 46}V${y1 + 80}`, '#6b4a2c', 1.8, 1); }
  return o + ell(30, 110, 18, 4, t.lg(AP, 70), .9);
});
// ===== scarab nest: a dung-and-sand mound with a guardian =====
IN('scarab-nest', 'a', LG, ['scarab', 'nest', 'creature', 'obstacle'], (t) => {
  let o = ell(64, 108, 50, 8, '#8a5a30', .16);
  o += path('M16 106Q14 74 44 62Q66 54 86 66Q112 78 112 106Z', t.lg(['#9a7a58', '#6a4a30', '#3a2a18'], 40), 1, ink('#2a1a0a', 1.1, .85)) + path('M36 70Q50 62 66 62Q56 72 40 78Z', '#c8a478', .5) + [[44, 88], [62, 82], [82, 92], [72, 100], [52, 100]].map(([x, y]) => ell(x, y, 7, 3.4, '#4a3220', .75)).join('');
  o += [[44, 80], [64, 74], [86, 86], [34, 96]].map(([x, y]) => `<g>${ell(x + .6, y + 1.4, 5, 3.6, '#3b3a24', .2)}${ell(x, y, 4.6, 3.4, '#f4ecd8', 1, 0, ink('#8a7458', .6, .85))}${ell(x - 1.4, y - 1, 1.6, 1, '#fff', .8)}</g>`).join('');
  o += `<g transform="translate(94 90) scale(1.5)">${scarab(0, 0, 1.6, -50, '#3a2a6a')}</g>`;
  for (let i = 0; i < 9; i++) o += scarab(20 + i * 10.4 + (i % 2) * 3, 106 + (i % 3) * 2 - 2, .8, (i * 47) % 360, '#2a3a5a');
  return o;
});
// ===== buried obelisk leaning out of the dune =====
IN('obelisk-buried', 'a', LG, ['ruin', 'obelisk', 'buried', 'obstacle'], (t) => {
  let o = ell(64, 112, 56, 7, '#8a5a30', .16); const d = dune(t, 6, 122, 112, 44, .66); o += d.s;
  o += `<g transform="rotate(14 60 100)">` + path('M44 100L48 20L60 4L72 20L76 100Z', t.lg(['#f8dcae', '#d09a6a', '#946a52'], 0), 1, ink(D.inkS, 1.1, .85)) + path('M60 4L72 20L76 100H64Z', VIO[1], .3) + path('M48 20L60 4L72 20Z', '#f3c24f', 1, ink('#5a3a0a', .9, .85)) + [[54, 30], [54, 44], [54, 58], [54, 72]].map(([x, y]) => line(`M${x} ${y}h14M${x + 3} ${y + 3}h8`, '#7a4a2a', 1.2, .75) + circ(x + 7, y - 3, 1.2, '#7a4a2a', .6)).join('') + `</g>`;
  return o + ell(60, 106, 30, 6, t.lg(AP, 70), .95) + ell(88, 108, 24, 4, VIO[1], .22) + dgrass(14, 110, .8, '#8f9a50');
});
// ===== chests half-buried in the sand =====
const chest = (t, open) => {
  let o = sh(32, 52, 18, 4) + ell(32, 52, 22, 5, t.lg(AP, 70), .95);
  o += path('M14 48V32H50V48Z', t.lg(['#cfa878', '#8a6238', '#5a3c20'], 0), 1, ink('#3a2210', 1, .85)) + line('M14 38H50M14 44H50', '#5a3c20', .9, .5) + rect(28, 36, 8, 8, '#f3c24f', 1.4, 1, ink('#5a3a0a', .8, .85)) + circ(32, 40, 1.4, '#5a3a0a');
  if (!open) o += path('M14 32Q14 20 32 20T50 32Z', t.lg(['#cfa878', '#8a6238', '#5a3c20'], 0), 1, ink('#3a2210', 1, .85)) + line('M16 28Q32 20 48 28', '#e0c090', .8, .7) + path('M14 30H50', 'none', 1, { stroke: '#8a6218', 'stroke-width': 2 });
  else o += path('M16 32L12 14Q30 8 50 14L48 32Z', t.lg(['#8a6238', '#5a3c20', '#3a2210'], 0), 1, ink('#3a2210', 1, .85)) + ellipseGold(t);
  return o + ell(18, 52, 12, 3, t.lg(AP, 70), .95) + ell(46, 52, 10, 3, t.lg(AP, 70), .95);
};
const ellipseGold = (t) => ell(32, 30, 14, 3, '#fff0a8', .9) + circ(26, 30, 2, '#f3c24f') + circ(34, 29, 2.2, '#f3c24f') + circ(40, 30, 1.8, '#e8a83a') + circ(30, 28.4, 1, '#fff') + path('M22 30Q32 22 42 30', 'none', 1, { stroke: '#f3c24f', 'stroke-width': 1.2, 'stroke-opacity': .8 });
IN('chest-sand', 'closed', C, ['chest', 'loot', 'closed'], (t) => chest(t, false));
IN('chest-sand', 'open', C, ['chest', 'loot', 'open'], (t) => chest(t, true));
