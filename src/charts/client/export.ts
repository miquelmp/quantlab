/**
 * Exportar un gráfico (RF-GRA-09): imagen SVG o PNG con todos sus paneles y los colores del tema
 * actual, y los datos de la tabla en CSV (separador «;», como espera una hoja de cálculo en español).
 */
import type { ChartApi } from './mount';
import { esc } from '../svg';

const PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'stroke-linejoin', 'stroke-linecap',
  'opacity', 'font-family', 'font-size', 'font-weight', 'paint-order'];

/** Copia los estilos calculados de cada elemento a atributos, para que la imagen se vea igual fuera de la página. */
function inlineStyles(src: SVGElement, dst: SVGElement) {
  const a = [src, ...src.querySelectorAll<SVGElement>('*')];
  const b = [dst, ...dst.querySelectorAll<SVGElement>('*')];
  a.forEach((el, i) => {
    const cs = getComputedStyle(el);
    const style = PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
    b[i].setAttribute('style', style);
    b[i].removeAttribute('class');
  });
}

/** Une todos los paneles (también los ocultos por las pestañas del móvil) en un único SVG. */
export function chartSvg(api: ChartApi): { svg: string; w: number; h: number } {
  const W = 600;
  const title = api.root.querySelector('h3')?.textContent?.trim() ?? '';
  const host = document.createElement('div');
  host.className = api.root.className;
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:1300px;visibility:hidden';
  api.root.appendChild(host);
  const parts: { x: number; y: number; w: number; h: number; head: string; el: SVGElement }[] = [];
  let x = 0, y = 34, rowH = 0;
  const narrow = api.def.panels.filter((p) => !p.wide).length;
  // Algunos gráficos dibujan muchos puntos en un lienzo aparte (Monte Carlo): para exportar se
  // pide la versión en SVG, que lleva los puntos dentro.
  const data = api.data && typeof api.data === 'object' && 'useCanvas' in api.data ? { ...api.data, useCanvas: false } : api.data;
  for (const p of api.def.panels) {
    const pw = p.wide || narrow < 2 ? 2 * W : W;
    if (x + pw > 2 * W) { x = 0; y += rowH; rowH = 0; }
    const div = document.createElement('div');
    div.innerHTML = p.render(data, api.state, pw, api.ctx);
    host.appendChild(div);
    const src = div.querySelector('svg')!;
    const clone = src.cloneNode(true) as SVGElement;
    inlineStyles(src, clone);
    const ph = Number(src.getAttribute('height')) || 300;
    parts.push({ x, y, w: pw, h: ph + 22, head: p.title(api.ctx), el: clone });
    x += pw; rowH = Math.max(rowH, ph + 22);
  }
  const cs = getComputedStyle(api.root);
  const bg = cs.getPropertyValue('--surface').trim() || '#fff';
  const ink = cs.getPropertyValue('--text').trim() || '#000';
  const font = getComputedStyle(document.body).fontFamily;
  host.remove();
  const w = 2 * W, h = y + rowH + 24;
  let out = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${esc(font)}">` +
    `<rect width="100%" height="100%" fill="${bg}"/>` +
    `<text x="16" y="24" font-size="17" font-weight="700" fill="${ink}">${esc(title)}</text>`;
  // XMLSerializer (no outerHTML): el HTML escribe entidades como &nbsp; que un SVG suelto no entiende.
  const xml = new XMLSerializer();
  for (const pt of parts) {
    pt.el.setAttribute('x', String(pt.x));
    pt.el.setAttribute('y', String(pt.y + 22));
    pt.el.removeAttribute('role'); pt.el.removeAttribute('aria-labelledby');
    out += `<text x="${pt.x + 16}" y="${pt.y + 14}" font-size="13" font-weight="600" fill="${ink}">${esc(pt.head)}</text>` + xml.serializeToString(pt.el);
  }
  out += `<text x="${w - 16}" y="${h - 8}" font-size="11" text-anchor="end" fill="${ink}" opacity="0.7">${esc(location.href.split('?')[0].split('#')[0])}</text></svg>`;
  return { svg: out, w, h };
}

function download(name: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function csvOf(head: string[], rows: string[][]): string {
  const cell = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

export async function exportChart(api: ChartApi, kind: 'svg' | 'png' | 'csv'): Promise<void> {
  const name = `quantlab-${api.def.id}`;
  if (kind === 'csv') {
    const t = api.def.table(api.data, api.state, api.ctx);
    download(`${name}.csv`, new Blob([csvOf(t.head, t.rows)], { type: 'text/csv;charset=utf-8' }));
    return;
  }
  const { svg, w, h } = chartSvg(api);
  if (kind === 'svg') { download(`${name}.svg`, new Blob([svg], { type: 'image/svg+xml' })); return; }
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = w * 2; canvas.height = h * 2;
  const g = canvas.getContext('2d')!;
  g.scale(2, 2);
  g.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (blob) download(`${name}.png`, blob);
}
