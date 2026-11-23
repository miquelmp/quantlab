/**
 * Imágenes de vista previa (1200 × 630) para cuando se comparte un enlace en redes o mensajería.
 * Se generan en la compilación como SVG y se convierten a PNG con sharp.
 */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Parte un texto en líneas de como mucho `max` caracteres (sin cortar palabras), hasta `lines` líneas. */
export function wrap(text: string, max: number, lines: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/).filter(Boolean)) {
    if (cur && (cur + ' ' + w).length > max) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  if (out.length > lines) { out.length = lines; out[lines - 1] += '…'; }
  return out;
}

export interface OgCard { kicker: string; title: string; footer: string; site: string }

export function ogSvg(c: OgCard): string {
  const font = "Inter, 'DejaVu Sans', Arial, sans-serif";
  const size = c.title.length > 60 ? 58 : 68;
  const lines = wrap(c.title, size > 60 ? 24 : 28, 3);
  const titleY = 335 - ((lines.length - 1) * size * 1.15) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#fcfcfb"/>
<rect width="18" height="630" fill="#1c5cab"/>
<path d="M760 520 C 880 500, 930 420, 990 360 S 1100 200, 1160 130" fill="none" stroke="#1c5cab" stroke-opacity="0.16" stroke-width="10" stroke-linecap="round"/>
<g transform="translate(80 70) scale(2)"><rect width="32" height="32" rx="8" fill="#1c5cab"/><polyline points="6,23 11,18 14,20 19,12 22,15 26,8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="26" cy="8" r="2.4" fill="#fff"/></g>
<text x="160" y="118" font-family="${font}" font-size="40" font-weight="700" fill="#1f1e1d">${esc(c.site)}</text>
<text x="80" y="${titleY - size * 1.1}" font-family="${font}" font-size="28" font-weight="700" letter-spacing="2" fill="#1c5cab">${esc(c.kicker.toUpperCase())}</text>
${lines.map((l, i) => `<text x="80" y="${titleY + i * size * 1.15}" font-family="${font}" font-size="${size}" font-weight="700" fill="#1f1e1d">${esc(l)}</text>`).join('\n')}
<text x="80" y="570" font-family="${font}" font-size="28" fill="#5c5a56">${esc(c.footer)}</text>
</svg>`;
}
