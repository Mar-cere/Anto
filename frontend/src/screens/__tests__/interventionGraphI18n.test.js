import { TECHNIQUES as techniquesEs } from '../../constants/translations/es';
import { TECHNIQUES as techniquesEn } from '../../constants/translations/en';

const INTERVENTION_GRAPH_KEYS = [
  'INTERVENTION_GRAPH_TITLE',
  'INTERVENTION_GRAPH_META',
  'INTERVENTION_GRAPH_ERROR',
  'INTERVENTION_GRAPH_RETRY',
  'INTERVENTION_GRAPH_EMPTY',
  'INTERVENTION_GRAPH_METRICS',
  'INTERVENTION_GRAPH_RATES',
  'INTERVENTION_GRAPH_ENTRY_LINK',
  'INTERVENTION_GRAPH_VIEW_GRAPH',
  'INTERVENTION_GRAPH_VIEW_LIST',
  'INTERVENTION_GRAPH_LEGEND',
  'INTERVENTION_GRAPH_LIST_A11Y',
  'INTERVENTION_GRAPH_MAP_A11Y',
];

const MICRO_GUIDE_LIBRARY_KEYS = [
  'MICRO_GUIDE_LIBRARY_TITLE',
  'MICRO_GUIDE_LIBRARY_SUBTITLE',
  'MICRO_GUIDE_LIBRARY_LOADING',
  'MICRO_GUIDE_LIBRARY_ERROR',
  'MICRO_GUIDE_LIBRARY_RETRY',
  'MICRO_GUIDE_LIBRARY_EMPTY',
  'MICRO_GUIDE_LIBRARY_COUNT',
  'MICRO_GUIDE_LIBRARY_STEPS',
  'MICRO_GUIDE_LIBRARY_READ_TIME',
  'MICRO_GUIDE_LIBRARY_HERO_KICKER',
];

function assertSectionKeys(section, keys, lang) {
  keys.forEach((key) => {
    const value = section?.[key];
    expect(typeof value).toBe('string');
    expect(value.trim().length).toBeGreaterThan(0);
    if (lang === 'en') {
      expect(value).toMatch(/[A-Za-z]/);
    }
  });
}

describe('intervention graph i18n', () => {
  it('TECHNIQUES incluye claves del grafo en ES y EN', () => {
    assertSectionKeys(techniquesEs, INTERVENTION_GRAPH_KEYS, 'es');
    assertSectionKeys(techniquesEn, INTERVENTION_GRAPH_KEYS, 'en');
  });

  it('TECHNIQUES incluye claves de biblioteca micro-guías en ES y EN', () => {
    assertSectionKeys(techniquesEs, MICRO_GUIDE_LIBRARY_KEYS, 'es');
    assertSectionKeys(techniquesEn, MICRO_GUIDE_LIBRARY_KEYS, 'en');
  });

  it('entrada desde estadísticas comparte INTERVENTION_GRAPH_ENTRY_LINK', () => {
    expect(techniquesEs.INTERVENTION_GRAPH_ENTRY_LINK).toMatch(/mapa/i);
    expect(techniquesEn.INTERVENTION_GRAPH_ENTRY_LINK).toMatch(/map/i);
  });
});
