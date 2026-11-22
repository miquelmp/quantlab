// Genera los iconos PNG de la app (public/icons/) a partir del logo. Ejecutar solo si cambia el logo:
//   node scripts/make-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const out = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(out, { recursive: true });
// Curva de crecimiento sobre azul. «maskable»: con margen de seguridad (el sistema recorta en círculo).
const svg = (size, maskable) => {
  const pad = maskable ? 0.2 : 0;
  const s = 32 / (1 - 2 * pad);
  const o = -pad * s;
  const rx = maskable ? 0 : 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${o} ${o} ${s} ${s}">` +
    `<rect x="${o}" y="${o}" width="${s}" height="${s}" rx="${rx}" fill="#1c5cab"/>` +
    `<polyline points="6,23 11,18 14,20 19,12 22,15 26,8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="26" cy="8" r="2.4" fill="#fff"/></svg>`;
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [name, size, mask] of [['icon-192.png', 192, false], ['icon-512.png', 512, false], ['maskable-512.png', 512, true], ['apple-touch-icon.png', 180, true]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent">${svg(size, mask)}</body></html>`);
    await p.screenshot({ path: path.join(out, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  }
  await b.close();
  console.log('Iconos generados en public/icons/');
})();
