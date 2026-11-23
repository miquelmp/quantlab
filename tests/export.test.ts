/** RF-GRA-09: el CSV de los datos de un gráfico se abre bien en una hoja de cálculo en español. */
import { describe, it, expect } from 'vitest';
import { csvOf } from '../src/charts/client/export';

describe('exportar datos en CSV', () => {
  it('usa «;», marca UTF-8 y comillas cuando hace falta', () => {
    const s = csvOf(['Año', 'Valor'], [['1', '1.040,00 €'], ['2', 'a;b "c"']]);
    expect(s.startsWith('﻿')).toBe(true);
    expect(s).toContain('Año;Valor\r\n1;1.040,00 €\r\n');
    expect(s).toContain('2;"a;b ""c"""');
  });
});
