// Autotile masks: 47-blob (8 neighbours) and connect-4, matching art-samples/tiles/TILESET.md.
export const BIT = { N: 1, NE: 2, E: 4, SE: 8, S: 16, SW: 32, W: 64, NW: 128 };
/** Canonical blob mask: a diagonal bit counts only when both adjacent orthogonals are set. */
export function canon(m) {
  let r = m & (BIT.N | BIT.E | BIT.S | BIT.W);
  if ((m & BIT.NE) && (m & BIT.N) && (m & BIT.E)) r |= BIT.NE;
  if ((m & BIT.SE) && (m & BIT.S) && (m & BIT.E)) r |= BIT.SE;
  if ((m & BIT.SW) && (m & BIT.S) && (m & BIT.W)) r |= BIT.SW;
  if ((m & BIT.NW) && (m & BIT.N) && (m & BIT.W)) r |= BIT.NW;
  return r;
}
/** has(x,y) -> bool; cells outside the map count as members (caller handles via has). */
export function blobMask(has, x, y) {
  let m = 0;
  if (has(x, y - 1)) m |= BIT.N;
  if (has(x + 1, y - 1)) m |= BIT.NE;
  if (has(x + 1, y)) m |= BIT.E;
  if (has(x + 1, y + 1)) m |= BIT.SE;
  if (has(x, y + 1)) m |= BIT.S;
  if (has(x - 1, y + 1)) m |= BIT.SW;
  if (has(x - 1, y)) m |= BIT.W;
  if (has(x - 1, y - 1)) m |= BIT.NW;
  return canon(m);
}
/** Connect-4 mask, bits N=1 E=2 S=4 W=8. */
export function connectMask(has, x, y) {
  return (has(x, y - 1) ? 1 : 0) | (has(x + 1, y) ? 2 : 0) | (has(x, y + 1) ? 4 : 0) | (has(x - 1, y) ? 8 : 0);
}
export const pad = (n, w) => String(n).padStart(w, '0');
