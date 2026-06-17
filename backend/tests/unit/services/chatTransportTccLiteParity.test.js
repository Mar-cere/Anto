/**
 * Paridad SSE ↔ Socket.IO para extras de turno TCC lite (#201).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildClientTurnPayload } from '../../../services/chatTurnEnhancementsService.js';
import { toTccLiteClientPayload } from '../../../services/chatTccLiteService.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function readSource(relPath) {
  return fs.readFileSync(path.join(root, relPath), 'utf8');
}

describe('chat transport TCC lite parity (#201)', () => {
  const socketSrc = readSource('config/socket.js');
  const routesSrc = readSource('routes/chatRoutes.js');

  it('socket y chatRoutes comparten planificación y payload de turno', () => {
    for (const src of [socketSrc, routesSrc]) {
      expect(src).toMatch(/planChatTurnEnhancements/);
      expect(src).toMatch(/buildClientTurnPayload/);
      expect(src).toMatch(/buildAssistantMetadataWithEnhancements/);
      expect(src).toMatch(/finalizeChatTurnEnhancements/);
      expect(src).toMatch(/resumeTccLite/);
    }
  });

  it('buildClientTurnPayload expone tccLite y sugerencias con forma estable', () => {
    const payload = buildClientTurnPayload({
      tccLitePlan: {
        active: true,
        step: 'capture_thought',
        stepIndex: 0,
        stepTotal: 4,
        distortionType: 'catastrophizing',
        distortionLabel: 'Catastrofización',
        completed: false,
      },
      suggestionPlan: {
        shouldShow: true,
        formatted: [{ id: 'automatic_thought_record', interventionType: 'exercise' }],
        rankingPersonalized: false,
      },
      language: 'es',
    });
    expect(payload.suggestions).toHaveLength(1);
    expect(payload.tccLite.active).toBe(true);
    expect(payload.tccLite.step).toBe('capture_thought');
    expect(payload.suggestionsPersonalized).toBe(false);
  });

  it('toTccLiteClientPayload conserva atHandoff al completar (#89)', () => {
    const handoff = { screen: 'AutomaticThoughtRecord', params: { fromTccLite: true } };
    const payload = toTccLiteClientPayload(
      { active: false, completed: true, atHandoff: handoff },
      'es',
    );
    expect(payload.completed).toBe(true);
    expect(payload.atHandoff).toEqual(handoff);
  });

  it('buildClientTurnPayload bloquea extras terapéuticos en crisis', () => {
    const payload = buildClientTurnPayload({
      tccLitePlan: { active: true, step: 'capture_thought' },
      suggestionPlan: {
        shouldShow: true,
        formatted: [{ id: 'automatic_thought_record' }],
      },
      riskLevel: 'HIGH',
      userMessage: 'no aguanto más',
    });
    expect(payload.suggestions).toEqual([]);
    expect(payload.tccLite.active).toBe(false);
  });
});
