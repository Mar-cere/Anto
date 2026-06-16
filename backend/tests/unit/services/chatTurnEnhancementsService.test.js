import { jest } from '@jest/globals';

const mockPlanChatActionSuggestions = jest.fn();
const mockBuildActiveTccProtocolsPromptSnippet = jest.fn();
const mockPlanChatTccLite = jest.fn();
const mockLoadTccLiteState = jest.fn();
const mockSaveTccLiteState = jest.fn();
const mockRecordShown = jest.fn();
const mockToTccLiteClientPayload = jest.fn();

await jest.unstable_mockModule('../../../services/psychoeducationPromptSnippetService.js', () => ({
  planChatActionSuggestions: mockPlanChatActionSuggestions,
}));

await jest.unstable_mockModule('../../../services/activeTccProtocolsContextService.js', () => ({
  buildActiveTccProtocolsPromptSnippet: mockBuildActiveTccProtocolsPromptSnippet,
}));

await jest.unstable_mockModule('../../../services/chatTccLiteService.js', () => ({
  planChatTccLite: mockPlanChatTccLite,
  attachTccLiteToAssistantMetadata: (meta, plan) => ({ ...meta, tccLite: plan }),
  toTccLiteClientPayload: mockToTccLiteClientPayload,
}));

await jest.unstable_mockModule('../../../services/tccLiteConversationStateService.js', () => ({
  loadTccLiteStateFromConversation: mockLoadTccLiteState,
  saveTccLiteStateToConversation: mockSaveTccLiteState,
}));

await jest.unstable_mockModule('../../../services/chatInterventionGraphService.js', () => ({
  default: { recordSuggestionEventsShown: mockRecordShown },
}));

await jest.unstable_mockModule('../../../services/digitalPhenotypeChatContextService.js', () => ({
  buildDigitalPhenotypeChatSnippet: jest.fn().mockResolvedValue(null),
}));

await jest.unstable_mockModule('../../../services/recentAbcChatContextService.js', () => ({
  buildRecentAbcChatSnippet: jest.fn().mockResolvedValue(null),
}));

const {
  planChatTurnEnhancements,
  buildClientTurnPayload,
  finalizeChatTurnEnhancements,
} = await import('../../../services/chatTurnEnhancementsService.js');

describe('chatTurnEnhancementsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadTccLiteState.mockResolvedValue(null);
    mockPlanChatActionSuggestions.mockResolvedValue({
      shouldShow: true,
      formatted: [{ id: 'dbt_stop_skill', screen: 'MicroGuide' }],
      rankingPersonalized: true,
      primaryPsychoeducationId: null,
    });
    mockBuildActiveTccProtocolsPromptSnippet.mockResolvedValue('protocol snippet');
    mockPlanChatTccLite.mockReturnValue({ active: true, step: 'capture_thought' });
    mockToTccLiteClientPayload.mockReturnValue({ active: true, step: 'capture_thought' });
    mockSaveTccLiteState.mockResolvedValue(undefined);
    mockRecordShown.mockResolvedValue(undefined);
  });

  it('planChatTurnEnhancements agrega sugerencias, TCC y protocolos', async () => {
    const result = await planChatTurnEnhancements({
      userId: '507f1f77bcf86cd799439011',
      conversationId: '507f1f77bcf86cd799439012',
      userContent: 'estoy ansioso',
      conversationHistory: [],
      emotionalAnalysis: { mainEmotion: 'ansiedad' },
      contextualAnalysis: {},
      riskLevel: 'LOW',
      sessionIntention: null,
      language: 'es',
      resumeTccLite: { distortionType: 'catastrophizing' },
    });

    expect(result.suggestionPlan.formatted).toHaveLength(1);
    expect(result.tccLitePlan.active).toBe(true);
    expect(result.activeTccProtocolsPromptSnippet).toBe('protocol snippet');
    expect(mockPlanChatTccLite).toHaveBeenCalledWith(
      expect.objectContaining({
        resumeFromInsight: expect.objectContaining({ distortionType: 'catastrophizing' }),
      }),
    );
  });

  it('buildClientTurnPayload respeta shouldShow y ranking', () => {
    const payload = buildClientTurnPayload({
      tccLitePlan: { active: true },
      suggestionPlan: {
        shouldShow: true,
        formatted: [{ id: 'a' }],
        rankingPersonalized: true,
      },
      language: 'en',
    });
    expect(payload.suggestions).toHaveLength(1);
    expect(payload.suggestionsPersonalized).toBe(true);
    expect(mockToTccLiteClientPayload).toHaveBeenCalled();
  });

  it('buildClientTurnPayload oculta sugerencias si shouldShow es false', () => {
    const payload = buildClientTurnPayload({
      tccLitePlan: { active: false },
      suggestionPlan: { shouldShow: false, formatted: [{ id: 'a' }] },
      language: 'es',
    });
    expect(payload.suggestions).toEqual([]);
  });

  it('finalizeChatTurnEnhancements persiste TCC y telemetría', async () => {
    await finalizeChatTurnEnhancements({
      conversationId: '507f1f77bcf86cd799439012',
      userId: '507f1f77bcf86cd799439011',
      assistantMessageId: '507f1f77bcf86cd799439013',
      tccLitePlan: { active: true },
      suggestionPlan: { formatted: [{ id: 'grief_roadmap' }] },
      emotionalAnalysis: {},
      contextualAnalysis: {},
      userContent: 'duelo',
      riskLevel: 'LOW',
    });

    expect(mockSaveTccLiteState).toHaveBeenCalled();
    expect(mockRecordShown).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'chat_suggestions_v1' }),
    );
  });
});
