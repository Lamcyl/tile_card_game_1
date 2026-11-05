// One review SVG per region: coloured sub-areas, borders, gates, nodes.
const COL = ['#e7c07a', '#8fbf7a', '#7ab6c9', '#c98fa8', '#b7a3d9', '#d9a76a', '#9fcf9f', '#d9d27a', '#e0907a', '#7aa0d9'];
export function previewSvg(g, def) {
  const { N, lab, land, border, blocked, gap, gates, props, subOut, sets } = g; const P = 8;
  const ids = def.subareas.map((d) => d.id);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${N * P}" height="${N * P + 24}" viewBox="0 0 ${N * P} ${N * P + 24}" font-family="sans-serif">`;
  s += `<rect width="${N * P}" height="${N * P + 24}" fill="#35404a"/>`;
  s += `<text x="6" y="16" fill="#fff" font-size="13">${def.name} (${N}x${N} tiles, 1 tile = ${P}px). dark = rim, hatched = border bands, blue = blocked water, white gaps = gates</text>`;
  const Y = 24;
  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) {
      const i = y * N + x; let c;
      const kind = (j) => (!land[j] ? 'r' : gap[j] ? 'g' + lab[j] : border[j] ? 'b' + lab[j] : 'l' + lab[j]);
      const k = kind(i); let e = x; while (e < N && kind(y * N + e) === k) e++;
      if (k[0] === 'l') c = COL[+k.slice(1) % COL.length];
      else if (k[0] === 'b') c = '#555a60';
      else if (k[0] === 'g') c = '#fff';
      else c = '#1d252c';
      if (k !== 'r') s += `<rect x="${x * P}" y="${Y + y * P}" width="${(e - x) * P}" height="${P}" fill="${c}"/>`;
      x = e;
    }
  }
  // blocked sub-set cells (lakes etc.)
  for (let i = 0; i < N * N; i++) if (blocked[i] && land[i] && !border[i]) s += `<rect x="${(i % N) * P}" y="${Y + ((i / N) | 0) * P}" width="${P}" height="${P}" fill="#3b78a8" opacity=".75"/>`;
  for (const p of props) for (const [fx, fy] of p.foot) if (!p.gate && blocked[fy * N + fx] && land[fy * N + fx]) s += `<rect x="${fx * P + 2}" y="${Y + fy * P + 2}" width="${P - 4}" height="${P - 4}" fill="#3d5a35" opacity=".8"/>`;
  for (const gt of gates) s += `<rect x="${gt.c[0] * P - 1.5 * P}" y="${Y + gt.c[1] * P - P}" width="${3 * P}" height="${2 * P}" fill="none" stroke="#e02b2b" stroke-width="2"/>` + `<text x="${gt.c[0] * P + 2 * P}" y="${Y + gt.c[1] * P}" fill="#fff" font-size="10">${gt.from}>${gt.to || 'exit'}</text>`;
  const dot = (i, r, fill, label) => { if (i < 0 || i == null) return ''; const x = (i % N) * P + P / 2, y = Y + ((i / N) | 0) * P + P / 2; return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="#000" stroke-width="1"/>` + (label ? `<text x="${x}" y="${y + 3}" font-size="8" text-anchor="middle" fill="#000">${label}</text>` : ''); };
  for (const n of g.allNodes) {
    for (const i of n.spots) s += dot(i, 4, '#fff');
    for (const i of n.elites) s += dot(i, 5, '#f4a020', 'E');
    s += dot(n.boss, 6, '#d02020', 'B'); s += dot(n.wp, 4, '#40c0ff', 'W'); s += dot(n.poi, 4, '#60e060', 'P');
    s += dot(n.shop, 4, '#f0e040', '$'); s += dot(n.event, 4, '#c070f0', '?'); s += dot(n.secret, 4, '#202020', 'S');
  }
  ids.forEach((id, k) => {
    let sx = 0, sy = 0, c = 0; for (let i = 0; i < N * N; i++) if (lab[i] === k) { sx += i % N; sy += (i / N) | 0; c++; }
    if (c) s += `<text x="${(sx / c) * P}" y="${Y + (sy / c) * P - 12}" font-size="12" font-weight="bold" fill="#111" text-anchor="middle" stroke="#fff" stroke-width="3" paint-order="stroke">${def.subareas[k].name} (${c})</text>`;
  });
  return s + '</svg>';
}
