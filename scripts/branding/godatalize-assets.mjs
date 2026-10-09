// scripts/branding/godatalize-assets.mjs
//
// Generates the raster/derived assets of the GoDatalize brand pack
// (public/branding/godatalize/) from the approved symbol geometry.
//
// The shared generator (generate-favicons.mjs) draws a single FILLED glyph on
// a coloured tile; the GoDatalize "Señal" symbol is a STROKED arc plus an amber
// node in two colours, so it gets this small dedicated script instead.
//
// Rules (brand doc §3, "Construcción del símbolo"):
//   - app icon: symbol at 72% of the side, centred on an ink (#0A0E14) square
//     with 22% corner radius;
//   - iOS (apple-touch-icon) and maskable: full square, symbol at 60%.
//
// The SVG logos in public/branding/godatalize/brand/ are verbatim copies of the
// approved files and are NOT generated here.
//
// Run: npm --prefix scripts/branding install && node scripts/branding/godatalize-assets.mjs

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PACK_DIR = path.join(REPO_ROOT, 'public/branding/godatalize');

const INK = '#0A0E14';
const TEAL = '#36D7B7';
const AMBER = '#FFB547';

const ARC = 'M18.36 5.64A9 9 0 1 0 21 12H14.6';

/** The symbol drawn in a 24-unit grid, as SVG children. */
function symbol(arcColour, nodeColour) {
  return (
    `<path d="${ARC}" fill="none" stroke="${arcColour}" stroke-width="3" ` +
    `stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="12.6" cy="12" r="2.6" fill="${nodeColour}"/>`
  );
}

/** Square icon: ink tile (optionally rounded) with the symbol at `coverage`. */
function iconSvg(size, { coverage, radius }) {
  const scale = (coverage * size) / 24;
  const offset = (size - coverage * size) / 2;
  const rx = radius * size;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" rx="${rx}" fill="${INK}"/>` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})">${symbol(TEAL, AMBER)}</g>` +
    `</svg>`
  );
}

const ROUNDED = { coverage: 0.72, radius: 0.22 };
const FULL_BLEED = { coverage: 0.6, radius: 0 };

async function png(svg, out) {
  await sharp(Buffer.from(svg)).png().toFile(path.join(PACK_DIR, out));
  console.log('wrote', out);
}

async function main() {
  await mkdir(PACK_DIR, { recursive: true });

  await png(iconSvg(192, ROUNDED), 'icon-192.png');
  await png(iconSvg(512, ROUNDED), 'icon-512.png');
  await png(iconSvg(512, FULL_BLEED), 'icon-maskable-512.png');
  await png(iconSvg(180, FULL_BLEED), 'apple-touch-icon.png');

  // favicon.ico (16/32/48) from the rounded tile, matching favicon.svg.
  const icoPngs = await Promise.all(
    [16, 32, 48].map((s) => sharp(Buffer.from(iconSvg(s, ROUNDED))).png().toBuffer())
  );
  await writeFile(path.join(PACK_DIR, 'favicon.ico'), await pngToIco(icoPngs));
  console.log('wrote favicon.ico');

  // Safari pinned tab: single-colour silhouette (Safari applies the colour).
  const pinned =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${symbol('#000000', '#000000')}</svg>\n`;
  await writeFile(path.join(PACK_DIR, 'safari-pinned-tab.svg'), pinned);
  console.log('wrote safari-pinned-tab.svg');

  // Social preview 1200x630: horizontal dark logo centred on ink.
  const logo = await readFile(path.join(PACK_DIR, 'brand/godatalize-logo-oscuro.svg'));
  const logoPng = await sharp(logo, { density: 300 }).resize({ width: 760 }).png().toBuffer();
  await sharp({ create: { width: 1200, height: 630, channels: 4, background: INK } })
    .composite([{ input: logoPng, gravity: 'center' }])
    .png()
    .toFile(path.join(PACK_DIR, 'social-preview.png'));
  console.log('wrote social-preview.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
