/**
 * Piezas comunes para dibujar gráficos en SVG como texto (RNF-MAN-01).
 * Funcionan igual en la compilación (imagen estática sin JavaScript) y en el navegador.
 * Los colores no se fijan aquí: se asignan con clases CSS (temas claro y oscuro).
 */
import { fmtNum, type NumFmt } from '../lib/format';

export interface Margin { top: number; right: number; bottom: number; left: number }

export interface Scale {
  (v: number): number;
  domain: [number, number];
  range: [number, number];
  invert(px: number): number;
}

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const s = ((v: number) => r0 + (v - d0) * k) as Scale;
  s.domain = domain; s.range = range;
  s.invert = (px: number) => (k === 0 ? d0 : d0 + (px - r0) / k);
  return s;
}

/** Marcas «redondas» de un eje lineal. */
export function ticks(lo: number, hi: number, count = 5): number[] {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  return out;
}

export function decimalsFor(step: number): number {
  return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
}

export function pathFrom(xs: ArrayLike<number>, ys: ArrayLike<number>, sx: Scale, sy: Scale): string {
  let d = '';
  let pen = false;
  for (let i = 0; i < xs.length; i++) {
    const y = ys[i];
    if (!Number.isFinite(y)) { pen = false; continue; }
    d += (pen ? 'L' : 'M') + r1(sx(xs[i])) + ',' + r1(sy(y));
    pen = true;
  }
  return d;
}

export function areaFrom(xs: ArrayLike<number>, y0: ArrayLike<number>, y1: ArrayLike<number>, sx: Scale, sy: Scale): string {
  let d = '';
  for (let i = 0; i < xs.length; i++) d += (i ? 'L' : 'M') + r1(sx(xs[i])) + ',' + r1(sy(y1[i]));
  for (let i = xs.length - 1; i >= 0; i--) d += 'L' + r1(sx(xs[i])) + ',' + r1(sy(y0[i]));
  return d + 'Z';
}

export function r1(v: number): string {
  return (Math.round(v * 10) / 10).toString();
}

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export interface AxisOpts {
  fmt: NumFmt;
  format?: (v: number) => string;
  ticks?: number[];
  label?: string;
  grid?: boolean;
}

export function axisX(sx: Scale, y: number, top: number, o: AxisOpts): string {
  const tk = o.ticks ?? ticks(sx.domain[0], sx.domain[1], Math.max(2, Math.floor(Math.abs(sx.range[1] - sx.range[0]) / 70)));
  const step = tk.length > 1 ? tk[1] - tk[0] : 1;
  const f = o.format ?? ((v: number) => fmtNum(v, decimalsFor(step), o.fmt));
  let s = `<g class="axis axis-x">`;
  if (o.grid) for (const v of tk) s += `<line class="grid" x1="${r1(sx(v))}" x2="${r1(sx(v))}" y1="${top}" y2="${y}"/>`;
  s += `<line class="domain" x1="${r1(sx.range[0])}" x2="${r1(sx.range[1])}" y1="${y}" y2="${y}"/>`;
  for (const v of tk) s += `<text x="${r1(sx(v))}" y="${y + 16}" text-anchor="middle">${esc(f(v))}</text>`;
  if (o.label) s += `<text class="axis-label" x="${r1((sx.range[0] + sx.range[1]) / 2)}" y="${y + 34}" text-anchor="middle">${esc(o.label)}</text>`;
  return s + '</g>';
}

export function axisY(sy: Scale, x: number, right: number, o: AxisOpts): string {
  const tk = o.ticks ?? ticks(sy.domain[0], sy.domain[1], Math.max(2, Math.floor(Math.abs(sy.range[0] - sy.range[1]) / 45)));
  const step = tk.length > 1 ? tk[1] - tk[0] : 1;
  const f = o.format ?? ((v: number) => fmtNum(v, decimalsFor(step), o.fmt));
  let s = `<g class="axis axis-y">`;
  if (o.grid !== false) for (const v of tk) s += `<line class="grid" x1="${x}" x2="${right}" y1="${r1(sy(v))}" y2="${r1(sy(v))}"/>`;
  for (const v of tk) s += `<text x="${x - 6}" y="${r1(sy(v) + 4)}" text-anchor="end">${esc(f(v))}</text>`;
  if (o.label) s += `<text class="axis-label" x="${x}" y="${sy.range[1] - 10}" text-anchor="start">${esc(o.label)}</text>`;
  return s + '</g>';
}

/** Leyenda horizontal: muestra trazo + texto (la identidad nunca depende solo del color). */
export function legend(items: { cls: string; label: string; dash?: boolean; box?: boolean }[], x: number, y: number, maxWidth: number): string {
  let s = `<g class="legend">`;
  let cx = x;
  let cy = y;
  for (const it of items) {
    const w = 26 + it.label.length * (present ? 8.3 : 6.6) + 14;
    if (cx + w > x + maxWidth && cx > x) { cx = x; cy += 18; }
    s += it.box
      ? `<rect class="${it.cls}" x="${cx}" y="${cy - 9}" width="14" height="10" rx="2"/>`
      : `<line class="${it.cls}${it.dash ? ' dash' : ''}" x1="${cx}" x2="${cx + 20}" y1="${cy - 4}" y2="${cy - 4}"/>`;
    s += `<text x="${cx + 26}" y="${cy}">${esc(it.label)}</text>`;
    cx += w;
  }
  return s + '</g>';
}

export function legendHeight(items: { label: string }[], maxWidth: number): number {
  let cx = 0;
  let rows = 1;
  for (const it of items) {
    const w = 26 + it.label.length * (present ? 8.3 : 6.6) + 14;
    if (cx + w > maxWidth && cx > 0) { cx = 0; rows++; }
    cx += w;
  }
  return rows * 18;
}

export function svgOpen(w: number, h: number, title: string, desc: string, id: string): string {
  return `<svg class="chart-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${id}-t ${id}-d" xmlns="http://www.w3.org/2000/svg">` +
    `<title id="${id}-t">${esc(title)}</title><desc id="${id}-d">${esc(desc)}</desc>`;
}

/**
 * Modo compacto (pantallas de móvil): los paneles son más bajos para que mandos, gráfico y
 * resultados quepan a la vez en la pantalla. Lo activa client/mount.ts según el ancho de la
 * ventana; en la compilación (imagen estática) siempre es falso.
 */
let compact = false;
export function setCompact(v: boolean): void { compact = v; }
/** Modo presentación (RF-GRA-08): paneles más altos para proyectar a pantalla completa. */
let present = false;
export function setPresent(v: boolean): void { present = v; }
export function panelH(_w: number, base: number): number {
  if (present) return Math.round(base * 1.35);
  return compact ? Math.round(base * 0.72) : base;
}
