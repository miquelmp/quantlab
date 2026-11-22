/**
 * Qué gráfico corresponde a cada capítulo. Para añadir el gráfico de otro capítulo:
 * crear src/charts/chNN-nombre.ts con su ChartDef y añadirlo aquí.
 */
import type { ChartDef } from './types';

export const CHART_BY_CHAPTER: Record<number, string> = {
  1: 'perdidas',
  2: 'capitalizar',
  3: 'dados',
  6: 'montecarlo',
  14: 'kelly',
};

/** Prefijo de los textos de interfaz de cada gráfico en src/i18n/<idioma>.json. */
export const I18N_PREFIX: Record<string, string> = {
  perdidas: 'c1.',
  capitalizar: 'c2.',
  dados: 'c3.',
  montecarlo: 'c6.',
  kelly: 'c14.',
};

export async function loadChart(id: string): Promise<ChartDef<any, any>> {
  switch (id) {
    case 'perdidas': return (await import('./ch01-perdidas')).chart01;
    case 'capitalizar': return (await import('./ch02-capitalizar')).chart02;
    case 'dados': return (await import('./ch03-dados')).chart03;
    case 'montecarlo': return (await import('./ch06-montecarlo')).chart06;
    case 'kelly': return (await import('./ch14-kelly')).chart14;
    default: throw new Error(`Gráfico desconocido: ${id}`);
  }
}
