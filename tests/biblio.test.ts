import { describe, it, expect } from 'vitest';
import { refId } from '../src/lib/biblio';

describe('bibliografía: anclas', () => {
  it('apellido y año', () => {
    expect(refId('Bailey, D. H. y López de Prado, M. (2014). The deflated…')).toBe('bailey-2014');
    expect(refId('★ Jorion, P. (2007). Value at Risk…')).toBe('jorion-2007');
  });
  it('autores institucionales y normas', () => {
    expect(refId('Basel Committee on Banking Supervision (1996a). Amendment…')).toBe('basel-committee-on-1996a');
    expect(refId('FINRA (2009). Regulatory Notice 09-31')).toBe('finra-2009');
    expect(refId('Directiva 2009/65/CE del Parlamento Europeo y del Consejo, de 13 de julio')).toMatch(/^directiva-2009/);
  });
});
