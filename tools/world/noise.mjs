// Seeded randomness and value noise (deterministic, no Math.random).
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash2(seed, x, y) {
  let h = (seed ^ Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const sm = (t) => t * t * (3 - 2 * t);
/** Smooth value noise in [0,1). */
export function valueNoise(seed) {
  return (x, y) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = sm(x - x0), fy = sm(y - y0);
    const a = hash2(seed, x0, y0), b = hash2(seed, x0 + 1, y0);
    const c = hash2(seed, x0, y0 + 1), d = hash2(seed, x0 + 1, y0 + 1);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
  };
}
/** Two-octave noise in [0,1). */
export function fbm2(seed, scale) {
  const n1 = valueNoise(seed), n2 = valueNoise(seed + 7919);
  return (x, y) => n1(x / scale, y / scale) * 0.65 + n2(x / (scale * 0.45), y / (scale * 0.45)) * 0.35;
}
