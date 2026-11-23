import { describe, it, expect } from 'vitest';
import { fold, variants } from '../src/lib/client/search';

describe('buscador', () => {
  it('no distingue tildes ni mayúsculas', () => {
    expect(fold('  Déficit   Esperado ')).toBe('deficit esperado');
  });
  it('sinónimos básicos (RF-BUS-05)', () => {
    expect(variants('VaR')).toContain('valor en riesgo');
    expect(variants('valor en riesgo')).toContain('var');
    expect(variants('ES')).toContain('deficit esperado');
    expect(variants('VaR al 99 %')).toContain('valor en riesgo al 99 %');
  });
  it('«es» dentro de una frase no se toma por la sigla del déficit esperado', () => {
    expect(variants('que es la volatilidad')).toEqual(['que es la volatilidad']);
    expect(variants('deficit esperado')).not.toContain('es');
  });
});
