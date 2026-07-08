import { jest } from '@jest/globals';

const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockUpdateSessionCommitment = jest.fn();

jest.unstable_mockModule('../../../models/SessionCommitment.js', () => ({
  default: {
    findOne: mockFindOne,
    updateOne: mockUpdateOne,
  },
}));

jest.unstable_mockModule('../../../services/sessionCommitmentService.js', () => ({
  updateSessionCommitment: mockUpdateSessionCommitment,
}));

jest.unstable_mockModule('../../../utils/commitmentPostCrisisGuard.js', () => ({
  isUserInPostCrisisCommitmentCooldown: jest.fn().mockResolvedValue(false),
}));

const {
  classifyFollowUpAnswerFromText,
  buildCommitmentFollowUpPromptSnippet,
  buildCommitmentFollowUpPlan,
  markCommitmentFollowUpAsked,
  detectCommitmentFollowUpAnswer,
  shouldShowCommitmentFollowUpChips,
  MIN_USER_TURNS_FOR_FOLLOW_UP_CHIPS,
} = await import('../../../services/commitmentFollowUpService.js');

const VALID_ID = '507f1f77bcf86cd799439011';

/** findOne(...).sort(...).lean() → doc */
function chain(doc) {
  return { sort: () => ({ lean: () => Promise.resolve(doc) }) };
}

describe('shouldShowCommitmentFollowUpChips', () => {
  it('no muestra chips en el primer mensaje del usuario', () => {
    expect(
      shouldShowCommitmentFollowUpChips({
        conversationHistory: [{ role: 'user', content: 'hola' }],
      }),
    ).toBe(false);
  });

  it('muestra chips desde el segundo mensaje del usuario', () => {
    expect(
      shouldShowCommitmentFollowUpChips({
        conversationHistory: [
          { role: 'user', content: 'hola' },
          { role: 'assistant', content: 'respuesta' },
          { role: 'user', content: 'sigo' },
        ],
      }),
    ).toBe(true);
  });

  it('fuerza chips al retomar conversación', () => {
    expect(
      shouldShowCommitmentFollowUpChips({
        conversationHistory: [{ role: 'user', content: 'hola' }],
        forceFollowUp: true,
      }),
    ).toBe(true);
  });

  it('expone umbral mínimo de 2 turnos', () => {
    expect(MIN_USER_TURNS_FOR_FOLLOW_UP_CHIPS).toBe(2);
  });
});

describe('classifyFollowUpAnswerFromText', () => {
  it('clasifica afirmativo (es/en)', () => {
    expect(classifyFollowUpAnswerFromText('sí, lo hice')).toBe('yes');
    expect(classifyFollowUpAnswerFromText('yes, done')).toBe('yes');
  });

  it('clasifica negativo (es/en)', () => {
    expect(classifyFollowUpAnswerFromText('no pude')).toBe('no');
    expect(classifyFollowUpAnswerFromText("i didn't")).toBe('no');
    expect(classifyFollowUpAnswerFromText('se me olvidó')).toBe('no');
  });

  it('clasifica parcial con prioridad sobre negativo/afirmativo', () => {
    expect(classifyFollowUpAnswerFromText('más o menos')).toBe('partial');
    expect(classifyFollowUpAnswerFromText('a medias')).toBe('partial');
    expect(classifyFollowUpAnswerFromText('sort of')).toBe('partial');
  });

  it('no infiere en mensajes largos (deja a los chips)', () => {
    const long = 'hoy quiero contarte algo que me pasó en el trabajo y no sé bien cómo manejarlo, '
      + 'fue una situación complicada con un compañero';
    expect(classifyFollowUpAnswerFromText(long)).toBeNull();
  });

  it('devuelve null sin señal clara o vacío', () => {
    expect(classifyFollowUpAnswerFromText('hola, cómo estás')).toBeNull();
    expect(classifyFollowUpAnswerFromText('')).toBeNull();
  });
});

describe('buildCommitmentFollowUpPromptSnippet', () => {
  it('genera snippet es con la etiqueta', () => {
    const s = buildCommitmentFollowUpPromptSnippet('salir a caminar', 'es');
    expect(s).toContain('salir a caminar');
    expect(s).toContain('sin juzgar');
  });

  it('genera snippet en cuando language=en', () => {
    const s = buildCommitmentFollowUpPromptSnippet('go for a walk', 'en');
    expect(s).toContain('go for a walk');
    expect(s.toLowerCase()).toContain('no judgment');
  });

  it('devuelve null con etiqueta vacía', () => {
    expect(buildCommitmentFollowUpPromptSnippet('   ', 'es')).toBeNull();
  });
});

describe('buildCommitmentFollowUpPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockReturnValue(chain({ _id: VALID_ID, label: 'salir a caminar' }));
  });

  it('devuelve null en crisis (gating, incluso con forceFollowUp)', async () => {
    const plan = await buildCommitmentFollowUpPlan({
      userId: VALID_ID,
      riskLevel: 'HIGH',
      forceFollowUp: true,
    });
    expect(plan).toBeNull();
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('devuelve null si no es inicio de hilo y no se fuerza', async () => {
    const history = [
      { role: 'user' }, { role: 'assistant' }, { role: 'user' },
    ];
    const plan = await buildCommitmentFollowUpPlan({ userId: VALID_ID, conversationHistory: history });
    expect(plan).toBeNull();
  });

  it('dispara en hilo existente cuando forceFollowUp=true (retomar conversación)', async () => {
    const history = [
      { role: 'user' }, { role: 'assistant' }, { role: 'user' }, { role: 'assistant' },
    ];
    const plan = await buildCommitmentFollowUpPlan({
      userId: VALID_ID,
      conversationHistory: history,
      forceFollowUp: true,
    });
    expect(plan).toEqual({
      commitmentId: VALID_ID,
      label: 'salir a caminar',
      promptSnippet: expect.stringContaining('salir a caminar'),
    });
  });

  it('devuelve null si no hay compromiso vencido pendiente', async () => {
    mockFindOne.mockReturnValue(chain(null));
    const plan = await buildCommitmentFollowUpPlan({ userId: VALID_ID });
    expect(plan).toBeNull();
  });
});

describe('markCommitmentFollowUpAsked', () => {
  beforeEach(() => jest.clearAllMocks());

  it('marca followUpAskedAt con id válido', async () => {
    mockUpdateOne.mockResolvedValue({});
    await markCommitmentFollowUpAsked(VALID_ID);
    expect(mockUpdateOne).toHaveBeenCalledTimes(1);
    const update = mockUpdateOne.mock.calls[0][1];
    expect(update.$set.followUpAskedAt).toBeInstanceOf(Date);
  });

  it('ignora id inválido', async () => {
    await markCommitmentFollowUpAsked('no-valido');
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});

describe('detectCommitmentFollowUpAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateSessionCommitment.mockResolvedValue({ commitment: { id: VALID_ID } });
  });

  it('devuelve null si el texto no es una respuesta clara', async () => {
    const r = await detectCommitmentFollowUpAnswer({ userId: VALID_ID, userContent: 'hola' });
    expect(r).toBeNull();
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  it('no actualiza si no hay follow-up reciente pendiente', async () => {
    mockFindOne.mockReturnValue(chain(null));
    const r = await detectCommitmentFollowUpAnswer({ userId: VALID_ID, userContent: 'sí, lo hice' });
    expect(r).toBeNull();
    expect(mockUpdateSessionCommitment).not.toHaveBeenCalled();
  });

  it('actualiza el compromiso cuando hay respuesta clara y follow-up pendiente', async () => {
    mockFindOne.mockReturnValue(chain({ _id: VALID_ID }));
    const r = await detectCommitmentFollowUpAnswer({ userId: VALID_ID, userContent: 'no pude' });
    expect(r).toEqual({ commitmentId: VALID_ID, followUpAnswer: 'no' });
    expect(mockUpdateSessionCommitment).toHaveBeenCalledWith(VALID_ID, VALID_ID, { followUpAnswer: 'no' });
  });
});
