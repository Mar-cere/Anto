/**
 * Tests para hooks de biblioteca límites IA (#194).
 */
import { renderHook } from '@testing-library/react-native';
import { AI_LIMIT_TOPIC } from '../../constants/aiCompetenceLimits';
import { useAiLimitTopic, useAiLimitsLibrary } from '../useAiLimitTopic';

const mockLib = {
  SECTION_TITLE: 'Límites',
  SECTION_INTRO: 'Intro',
  HINT_A11Y: 'Más sobre límites',
  SHEET_CLOSE: 'Cerrar',
  SHEET_OPEN_LIBRARY: 'Ver biblioteca',
  TOPICS: {
    crisis: {
      title: 'Crisis',
      body: 'Cuerpo crisis',
      bullets: ['Uno', ''],
    },
    general: {
      title: 'General',
      body: 'Cuerpo general',
    },
  },
};

jest.mock('../useTranslations', () => ({
  useSectionTranslations: jest.fn(() => ({
    AI_LIMITS_LIBRARY: mockLib,
  })),
}));

describe('useAiLimitTopic', () => {
  it('expone contenido normalizado para un tema válido', () => {
    const { result } = renderHook(() => useAiLimitTopic(AI_LIMIT_TOPIC.CRISIS));
    expect(result.current.hasContent).toBe(true);
    expect(result.current.title).toBe('Crisis');
    expect(result.current.body).toBe('Cuerpo crisis');
    expect(result.current.bullets).toEqual(['Uno']);
  });

  it('rechaza topicId inválido sin contenido', () => {
    const { result } = renderHook(() => useAiLimitTopic('tema_inventado'));
    expect(result.current.hasContent).toBe(false);
    expect(result.current.title).toBe('');
  });
});

describe('useAiLimitsLibrary', () => {
  it('ordena solo temas con copy completo', () => {
    const { result } = renderHook(() => useAiLimitsLibrary());
    expect(result.current.sectionTitle).toBe('Límites');
    expect(result.current.topics.map((t) => t.id)).toEqual([
      AI_LIMIT_TOPIC.GENERAL,
      AI_LIMIT_TOPIC.CRISIS,
    ]);
  });
});
