import { describe, it, expect } from 'vitest';
import { parseUserNumber, checkAnswer } from '../src/lib/format';

describe('números escritos en inglés', () => {
  it('coma de miles y punto decimal', () => {
    expect(parseUserNumber('40,000', '.')!.value).toBe(40000);
    expect(parseUserNumber('1,102.50', '.')!.value).toBeCloseTo(1102.5);
    expect(parseUserNumber('0.12', '.')!.value).toBeCloseTo(0.12);
    expect(parseUserNumber('$2.5 million', '.')!.value).toBeCloseTo(2.5e6);
    expect(checkAnswer('12%', 0.12, 'porcentaje', undefined, '.')).toBe(true);
  });
  it('el español no cambia', () => {
    expect(parseUserNumber('40.000')!.value).toBe(40000);
    expect(parseUserNumber('0,12')!.value).toBeCloseTo(0.12);
  });
});
