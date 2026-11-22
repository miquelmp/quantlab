import type { NumFmt } from '../lib/format';

export type Tr = (key: string, vars?: Record<string, string | number>) => string;

export interface ChartCtx {
  tr: Tr;
  fmt: NumFmt;
}

export interface SliderDef {
  key: string;
  label: string;                       // clave de traducción
  min: number;
  max: number;
  step: number;
  format: (v: number, ctx: ChartCtx) => string;
}

export interface Stat { label: string; value: string; note?: string }

export interface HoverInfo { x: number; lines: string[] }

export interface PanelDef<S, D> {
  id: string;
  title: (ctx: ChartCtx) => string;
  wide?: boolean;                      // ocupa todo el ancho
  height: (w: number) => number;
  render: (d: D, s: S, w: number, ctx: ChartCtx) => string;
  hover?: (d: D, s: S, w: number, xpx: number, ctx: ChartCtx) => HoverInfo | null;
}

export interface TableData { caption: string; head: string[]; rows: string[][] }

export interface ChartDef<S extends Record<string, number>, D> {
  id: string;
  simulated: boolean;                  // tiene semilla y «Nueva semilla»
  defaults: S;
  sliders: SliderDef[];
  compute: (s: S) => D;
  panels: PanelDef<S, D>[];
  stats: (d: D, s: S, ctx: ChartCtx) => Stat[];
  describe: (d: D, s: S, ctx: ChartCtx) => string;
  table: (d: D, s: S, ctx: ChartCtx) => TableData;
}
