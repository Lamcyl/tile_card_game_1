// world-gen.js is a UMD module: the bundler treats it as CommonJS, so a plain import does not set window.WorldGen.
// main.js imports this file before world-nav.js, tilemap.js and world-data.js (which read the global).
import WG from './world-gen.js';
window.WorldGen = WG;
