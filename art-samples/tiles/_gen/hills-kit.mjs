// Shared kit for the Misty Highlands object generators.
import { T, P, rng, hash, ink, maker, SUBS } from './sub.mjs';
export const SUB = SUBS.hills;
export const { mk, out } = maker(SUB);
export const R = (s) => rng(hash(s));
export const prop = (cat, name, v, tags, fn, w = T, h = T) => { const t = mk(cat, name, v, w, h); fn(t, R(name + v)); out(t, cat, name, v, ['highland', ...tags]); };
export const GS = ['#d4d8d6', '#a6aaac', '#70767c'], ln = ink(P.inkR, .9, .8), iw = ink('#3a2418', .9, .8);
