import { jest } from '@jest/globals';

const mockGetConsent = jest.fn();
const mockIsAllowed = jest.fn();
const mockFetchSeries = jest.fn();
const mockAnalyze = jest.fn();
const mockMessageFindOne = jest.fn();

jest.unstable_mockModule('../../../services/signalConsentService.js', () => ({
  getSignalConsentForUser: mockGetConsent,
  isDigitalHealthAllowed: mockIsAllowed,
}));

jest.unstable_mockModule('../../../services/digitalPhenotypeService.js', () => ({
  fetchDigitalPhenotypeSeries: mockFetchSeries,
  analyzePhenotypeTrends: mockAnalyze,
}));

jest.unstable_mockModule('../../../models/Message.js', () => ({
  default: {
    findOne: mockMessageFindOne,
  },
}));

const { pickPhenotypeAlertKind, hasRecentElevatedRisk, buildDigitalPhenotypeFocusAlert } =
  await import('../../../services/digitalPhenotypePatternAlertService.js');

/** Encadenable .select().lean() que resuelve a `doc`. */
function messageQuery(doc) {
  return { select: () => ({ lean: () => Promise.resolve(doc) }) };
}

function daysWithSleep(n) {
  return Array.from({ length: n }, (_, i) => ({
    dayKey: `2026-06-${String(10 + i).padStart(2, '0')}`,
    sleepHours: 7,
    steps: 4000,
  }));
}

describe('pickPhenotypeAlertKind', () => {
  it('prioriza pródromo de sueño sobre el resto', () => {
    expect(
      pickPhenotypeAlertKind({ prodromeSleepDelay: true, sleepTrend: -2, stepsTrend: -2000 }),
    ).toBe('sleep_prodrome');
  });

  it('detecta descenso de sueño con umbral conservador', () => {
    expect(pickPhenotypeAlertKind({ sleepTrend: -0.6 })).toBe('sleep_decline');
    expect(pickPhenotypeAlertKind({ sleepTrend: -0.5 })).toBeNull();
  });

  it('detecta menos movimiento solo si no hay señal de sueño', () => {
    expect(pickPhenotypeAlertKind({ stepsTrend: -800 })).toBe('low_movement');
    expect(pickPhenotypeAlertKind({ stepsTrend: -799 })).toBeNull();
  });

  it('devuelve null sin patrón claro o con entrada inválida', () => {
    expect(pickPhenotypeAlertKind({ sleepTrend: -0.1, stepsTrend: -100 })).toBeNull();
    expect(pickPhenotypeAlertKind(null)).toBeNull();
  });
});

describe('hasRecentElevatedRisk', () => {
  beforeEach(() => jest.clearAllMocks());

  it('devuelve false sin userId y no consulta', async () => {
    expect(await hasRecentElevatedRisk(null)).toBe(false);
    expect(mockMessageFindOne).not.toHaveBeenCalled();
  });

  it('devuelve true si hay un mensaje reciente con riesgo elevado', async () => {
    mockMessageFindOne.mockReturnValue(messageQuery({ _id: 'm1' }));
    expect(await hasRecentElevatedRisk('u1')).toBe(true);
    const query = mockMessageFindOne.mock.calls[0][0];
    expect(query['metadata.crisis.riskLevel'].$in).toEqual(
      expect.arrayContaining(['HIGH', 'MEDIUM', 'WARNING']),
    );
  });

  it('devuelve false si no hay mensaje de riesgo reciente', async () => {
    mockMessageFindOne.mockReturnValue(messageQuery(null));
    expect(await hasRecentElevatedRisk('u1')).toBe(false);
  });
});

describe('buildDigitalPhenotypeFocusAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConsent.mockResolvedValue({ digitalHealth: { enabled: true } });
    mockIsAllowed.mockReturnValue(true);
    mockMessageFindOne.mockReturnValue(messageQuery(null));
  });

  it('devuelve null sin userId', async () => {
    expect(await buildDigitalPhenotypeFocusAlert({})).toBeNull();
    expect(mockFetchSeries).not.toHaveBeenCalled();
  });

  it('devuelve null si no hay consentimiento de salud digital', async () => {
    mockIsAllowed.mockReturnValue(false);
    expect(await buildDigitalPhenotypeFocusAlert({ userId: 'u1' })).toBeNull();
    expect(mockFetchSeries).not.toHaveBeenCalled();
  });

  it('suprime la alerta si hubo riesgo elevado reciente', async () => {
    mockMessageFindOne.mockReturnValue(messageQuery({ _id: 'm1' }));
    mockFetchSeries.mockResolvedValue(daysWithSleep(4));
    mockAnalyze.mockReturnValue({ prodromeSleepDelay: true });
    expect(await buildDigitalPhenotypeFocusAlert({ userId: 'u1' })).toBeNull();
    expect(mockFetchSeries).not.toHaveBeenCalled();
  });

  it('devuelve null con menos de 3 días con señal', async () => {
    mockFetchSeries.mockResolvedValue(daysWithSleep(2));
    expect(await buildDigitalPhenotypeFocusAlert({ userId: 'u1' })).toBeNull();
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it('devuelve kind y días con datos cuando hay patrón claro', async () => {
    mockFetchSeries.mockResolvedValue(daysWithSleep(4));
    mockAnalyze.mockReturnValue({ prodromeSleepDelay: true });
    const result = await buildDigitalPhenotypeFocusAlert({ userId: 'u1' });
    expect(result).toEqual({ kind: 'sleep_prodrome', daysWithData: 4 });
  });

  it('devuelve null si hay datos pero ningún patrón supera umbrales', async () => {
    mockFetchSeries.mockResolvedValue(daysWithSleep(4));
    mockAnalyze.mockReturnValue({ sleepTrend: -0.2, stepsTrend: -100 });
    expect(await buildDigitalPhenotypeFocusAlert({ userId: 'u1' })).toBeNull();
  });
});
