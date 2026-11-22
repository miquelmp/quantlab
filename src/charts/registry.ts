/**
 * Qué gráfico corresponde a cada capítulo. Para añadir el gráfico de otro capítulo:
 * crear src/charts/chNN-nombre.ts con su ChartDef y añadirlo aquí.
 */
import type { ChartDef } from './types';

export const CHART_BY_CHAPTER: Record<number, string> = {
  1: 'perdidas',
  2: 'capitalizar',
  3: 'dados',
  4: 'paseo',
  5: 'campana',
  6: 'montecarlo',
  7: 'volatilidad',
  8: 'sharpe',
  9: 'lastre',
  10: 'correlacion',
  11: 'diversificacion',
  12: 'frontera',
  13: 'capm',
  14: 'kelly',
};

/** Prefijo de los textos de interfaz de cada gráfico en src/i18n/<idioma>.json. */
export const I18N_PREFIX: Record<string, string> = {
  capm: 'c13.',
  frontera: 'c12.',
  diversificacion: 'c11.',
  correlacion: 'c10.',
  lastre: 'c9.',
  sharpe: 'c8.',
  volatilidad: 'c7.',
  perdidas: 'c1.',
  capitalizar: 'c2.',
  dados: 'c3.',
  paseo: 'c4.',
  campana: 'c5.',
  montecarlo: 'c6.',
  kelly: 'c14.',
};

export async function loadChart(id: string): Promise<ChartDef<any, any>> {
  switch (id) {
    case 'perdidas': return (await import('./ch01-perdidas')).chart01;
    case 'capitalizar': return (await import('./ch02-capitalizar')).chart02;
    case 'dados': return (await import('./ch03-dados')).chart03;
    case 'paseo': return (await import('./ch04-paseo')).chart04;
    case 'campana': return (await import('./ch05-campana')).chart05;
    case 'montecarlo': return (await import('./ch06-montecarlo')).chart06;
    case 'kelly': return (await import('./ch14-kelly')).chart14;
    case 'volatilidad': return (await import('./ch07-volatilidad')).chart07;
    case 'sharpe': return (await import('./ch08-sharpe')).chart08;
    case 'lastre': return (await import('./ch09-lastre')).chart09;
    case 'correlacion': return (await import('./ch10-correlacion')).chart10;
    case 'diversificacion': return (await import('./ch11-diversificacion')).chart11;
    case 'frontera': return (await import('./ch12-frontera')).chart12;
    case 'capm': return (await import('./ch13-capm')).chart13;
    default: throw new Error(`Gráfico desconocido: ${id}`);
  }
}
