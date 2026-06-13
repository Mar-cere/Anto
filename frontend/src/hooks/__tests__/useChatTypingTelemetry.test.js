import { act, renderHook } from '@testing-library/react-native';
import { useChatTypingTelemetry } from '../useChatTypingTelemetry';

describe('useChatTypingTelemetry', () => {
  it('buildPayload resume dwell, flight y backspace', () => {
    const { result } = renderHook(() => useChatTypingTelemetry());
    act(() => {
      result.current.trackChange('Hola');
      result.current.trackChange('Hola,');
      result.current.trackChange('Hola, estoy');
    });
    const payload = result.current.buildPayload();
    expect(payload).toMatchObject({
      draftDurationMs: expect.any(Number),
      avgFlightTimeMs: expect.any(Number),
      backspaceRate: expect.any(Number),
      revisionCount: expect.any(Number),
      charCountFinal: 11,
    });
    act(() => {
      result.current.resetDraft();
    });
    expect(result.current.buildPayload()).toBeNull();
  });
});
