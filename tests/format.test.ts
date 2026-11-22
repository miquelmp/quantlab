import { describe, it, expect } from 'vitest';
import { fmtNum, fmtPct, parseUserNumber, checkAnswer } from '../src/lib/format';

describe('formato español', () => {
  it('coma decimal y punto de miles, también con cuatro cifras', () => {
    expect(fmtNum(1000)).toBe('1.000');
    expect(fmtNum(27302.4)).toBe('27.302');
    expect(fmtNum(-0.1667, 3)).toBe('−0,167');
    expect(fmtPct(0.0701, 2)).toBe('7,01 %');
    expect(fmtNum(-0.0001, 2)).toBe('0,00');
  });
});

describe('lectura de respuestas del lector (CU-04)', () => {
  it.each([
    ['-12 %', -0.12, true], ['−0,12', -0.12, true], ['-12', -0.12, true], ['0.12', 0.12, true],
    ['40.000', 40000, false], ['40000', 40000, false], ['2,7 millones', 2.7e6, false], ['1,25', 1.25, false],
  ])('%s', (raw, value, pct) => {
    const p = parseUserNumber(raw)!;
    const v = p.percent ? p.value / 100 : p.value;
    expect(pct || !p.percent).toBe(true);
    expect(Math.abs((raw === '-12' ? v / 100 : v) - value)).toBeLessThan(1e-9);
  });
  it('comprueba con tolerancia y acepta porcentaje o tanto por uno', () => {
    expect(checkAnswer('-12 %', -0.12, 'porcentaje')).toBe(true);
    expect(checkAnswer('-0,12', -0.12, 'porcentaje')).toBe(true);
    expect(checkAnswer('-12', -0.12, 'porcentaje')).toBe(true);
    expect(checkAnswer('-12,78 %', -0.1278, 'porcentaje')).toBe(true);
    expect(checkAnswer('-13 %', -0.1278, 'porcentaje')).toBe(false);
    expect(checkAnswer('40.000', 40000, 'numero', 0)).toBe(true);
    expect(checkAnswer('2,7 millones', 2.7e6, 'numero', 50000)).toBe(true);
    expect(checkAnswer('125 %', 1.25, 'porcentaje')).toBe(true);
    expect(checkAnswer('hola', 1, 'numero')).toBe(null);
  });
});
