import { describe, it, expect } from 'vitest';
import { refId, citedAuthors, citationId } from '../src/lib/biblio';

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

describe('bibliografía: citas del texto', () => {
  const li = (txt: string) => ({ type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: txt }] }] });
  const book = { extras: [{ key: 'bibliografia', nodes: [{ type: 'list', children: [
    li('Black, F. (1972). Capital market equilibrium…'),
    li('Black, F., Jensen, M. C. y Scholes, M. (1972). The capital asset pricing model…'),
    li('Harvey, C. R., Liu, Y. y Zhu, H. (2016). … and the cross-section…'),
    li('Sortino, F. A. y van der Meer, R. (1991). Downside risk.'),
    li('Bouchaud, J.-P., Bonart, J., Donier, J. y Gould, M. (2018). Trades, Quotes and Prices.'),
  ] }] as any }] };
  it('lee los autores de citas narrativas y entre paréntesis', () => {
    expect(citedAuthors('el umbral t > 3 de Harvey, Liu y Zhu (')?.authors).toEqual(['Harvey', 'Liu', 'Zhu']);
    expect(citedAuthors('(Sortino y van der Meer, ')?.authors).toEqual(['Sortino', 'van der Meer']);
    expect(citedAuthors('(Almgren et al., 2005; Bouchaud et al., ')).toEqual({ authors: ['Bouchaud'], etAl: true });
    expect(citedAuthors('la crisis de ')).toBeNull();
  });
  it('desambigua por coautores y no enlaza si no está claro', () => {
    expect(citationId(book, '(Black, ', '1972')).toBe('black-1972');
    expect(citationId(book, 'Black, Jensen y Scholes (', '1972')).toBe('black-1972-2');
    expect(citationId(book, 'de Harvey, Liu y Zhu (', '2016')).toBe('harvey-2016');
    expect(citationId(book, '(Bouchaud et al., ', '2018')).toBe('bouchaud-2018');
    expect(citationId(book, 'Por eso FINRA advirtió en ', '2009')).toBeNull();
  });
});
