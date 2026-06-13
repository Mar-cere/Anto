/**
 * Hook de telemetría de tecleo (#215). Solo métricas agregadas, sin texto.
 */
import { useCallback, useRef } from 'react';

const MAX_FLIGHT_SAMPLES = 40;

export function useChatTypingTelemetry() {
  const stateRef = useRef({
    draftStartedAt: null,
    lastChangeAt: null,
    lastLength: 0,
    backspaces: 0,
    keystrokes: 0,
    flightTimes: [],
    revisions: 0,
  });

  const trackChange = useCallback((text) => {
    const now = Date.now();
    const state = stateRef.current;
    const nextLength = String(text || '').length;

    if (!state.draftStartedAt) state.draftStartedAt = now;
    if (state.lastChangeAt != null) {
      const flight = now - state.lastChangeAt;
      if (flight >= 0 && flight <= 8000) {
        state.flightTimes.push(flight);
        if (state.flightTimes.length > MAX_FLIGHT_SAMPLES) {
          state.flightTimes.shift();
        }
      }
    }
    state.lastChangeAt = now;

    if (nextLength < state.lastLength) {
      const removed = state.lastLength - nextLength;
      state.backspaces += removed;
      if (removed >= 3) state.revisions += 1;
    }
    state.keystrokes += 1;
    state.lastLength = nextLength;
  }, []);

  const buildPayload = useCallback(() => {
    const state = stateRef.current;
    if (!state.draftStartedAt) return null;
    const draftDurationMs = Math.max(0, Date.now() - state.draftStartedAt);
    const flights = state.flightTimes.filter((v) => Number.isFinite(v));
    const avgFlightTimeMs =
      flights.length > 0
        ? Math.round(flights.reduce((sum, v) => sum + v, 0) / flights.length)
        : 0;
    const backspaceRate =
      state.keystrokes > 0 ? Math.min(1, state.backspaces / state.keystrokes) : 0;

    return {
      draftDurationMs,
      avgFlightTimeMs,
      backspaceRate,
      revisionCount: state.revisions,
      charCountFinal: state.lastLength,
    };
  }, []);

  const resetDraft = useCallback(() => {
    stateRef.current = {
      draftStartedAt: null,
      lastChangeAt: null,
      lastLength: 0,
      backspaces: 0,
      keystrokes: 0,
      flightTimes: [],
      revisions: 0,
    };
  }, []);

  return { trackChange, buildPayload, resetDraft };
}

export default useChatTypingTelemetry;
