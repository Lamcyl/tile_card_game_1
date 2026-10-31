// Prints an SVG <image> tag that embeds a unit drawing as a data URI, so a board mockup can place units
// without their CSS classes or ids clashing: node art-samples/boards/unit-image.mjs <set>/<file>.svg x y size
import { readFileSync } from 'node:fs';

const [file, x, y, size] = process.argv.slice(2);
const svg = readFileSync(new URL('../' + file, import.meta.url));
console.log(`<image x="${x}" y="${y}" width="${size}" height="${size}" href="data:image/svg+xml;base64,${svg.toString('base64')}"/>`);
