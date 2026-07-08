/**
 * Respuestas estructuradas en crisis sin LLM (hard-stop y seguimiento inmediato).
 */
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { normalizeStoredCrisisRiskLevel } from '../constants/crisis.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import {
  buildCrisisHardStopClientPayload,
  buildHardStopCrisisAssistantContent,
} from './crisisHardStopService.js';
import { buildAssistantMetadataWithEnhancements } from './chatTurnEnhancementsService.js';
import { normalizeCrisisProtocolState } from './crisisProtocolService.js';

const MIXED_DISTRESS_AFTER_BUT =
  /\b(terrible|horrible|fatal|peor|no aguanto|muy mal|ansiedad|triste|deprim|asustad|miedo|llor|dolor|awful|so bad|can't cope|cannot cope|anxious|depressed|scared|crying)\b/i;

/** Lee metadata (objeto plano o Map de Mongoose) de forma segura. */
function readMessageMetadataCrisis(message) {
  const metadata = message?.metadata;
  if (!metadata) return null;
  if (typeof metadata.get === 'function') {
    return metadata.get('crisis') || null;
  }
  return metadata.crisis || null;
}

function readMessageContextResponse(message) {
  const metadata = message?.metadata;
  if (!metadata) return null;
  const context = metadata.context;
  if (!context) return null;
  return context.response ?? null;
}

function readCrisisHardStopFromContextResponse(contextResponse) {
  if (!contextResponse) return false;
  if (typeof contextResponse === 'string') {
    try {
      const parsed = JSON.parse(contextResponse);
      return parsed?.crisisHardStop === true || parsed?.crisis?.hardStop === true;
    } catch {
      return false;
    }
  }
  // If it is already an object
  if (typeof contextResponse === 'object') {
    return contextResponse.crisisHardStop === true || contextResponse.crisis?.hardStop === true;
  }
  return false;
}

/**
 * Detecta si el mensaje de asistente más reciente fue un hard-stop de crisis.
 * Red de seguridad: si el estado del protocolo se corrompió (p. ej. por un cierre
 * erróneo previo), el seguimiento estructurado igual debe dispararse tras un hard-stop.
 * @param {Array<{ role?: string }>|null} conversationHistoryNewestFirst
 */
export function wasLastAssistantTurnCrisisHardStop(conversationHistoryNewestFirst) {
  if (!Array.isArray(conversationHistoryNewestFirst)) return false;
  const lastAssistant = conversationHistoryNewestFirst.find((m) => m?.role === 'assistant');
  if (!lastAssistant) return false;
  const crisis = readMessageMetadataCrisis(lastAssistant);
  if (crisis?.hardStop === true) return true;

  // Backward compatible: algunos mensajes antiguos guardaban el flag en
  // `metadata.context.response` (JSON).
  const contextResponse = readMessageContextResponse(lastAssistant);
  return readCrisisHardStopFromContextResponse(contextResponse);
}

export function shouldUseCrisisProtocolFollowUpFastPath({
  protocolWasActive,
  willHardStop,
  previousAssistantWasHardStop = false,
  protocolExitingThisTurn = false,
} = {}) {
  if (willHardStop === true) return false;
  // Si el protocolo se cierra en este turno (usuario estabilizado o «ya estoy bien»),
  // no imponemos un seguimiento enlatado: dejamos que el cierre lo maneje el LLM de forma cálida.
  if (protocolExitingThisTurn === true) return false;
  return protocolWasActive === true || previousAssistantWasHardStop === true;
}

/**
 * Seguimiento inmediato tras hard-stop: sin LLM, sin duplicar números (panel).
 */
export function buildCrisisProtocolFollowUpContent({ messageContent, language = 'es' } = {}) {
  const lang = normalizeApiLanguage(language);
  const en = lang === 'en';
  const text = String(messageContent || '').trim();
  const mentionsSafety =
    /\b(estoy a salvo|me siento a salvo|i feel safe|i am safe|i'm safe)\b/i.test(text);
  const mentionsDistress = MIXED_DISTRESS_AFTER_BUT.test(text);

  if (en) {
    const open = 'Thank you for answering. What you share matters.';
    if (mentionsSafety && mentionsDistress) {
      return [
        open,
        'I hear that you feel safe right now and also feel very unwell. Both can be true at once.',
        'Support lines are still below if you want to talk to someone now.',
        'What do you feel in your body right now, from 0 to 10?',
      ].join('\n\n');
    }
    if (mentionsSafety) {
      return [
        open,
        'I am glad you feel safe right now.',
        'Support lines remain below if you want human help.',
        'What would help you most in the next few minutes?',
      ].join('\n\n');
    }
    return [
      open,
      'I am here with you. You do not have to go through this alone.',
      'Support lines are below if you want to talk to someone now.',
      'What feels heaviest for you in this moment?',
    ].join('\n\n');
  }

  const openEs = 'Gracias por responder. Lo que compartes importa.';
  if (mentionsSafety && mentionsDistress) {
    return [
      openEs,
      'Escucho que ahora te sientes a salvo y, al mismo tiempo, te sientes muy mal. Las dos cosas pueden convivir.',
      'Los recursos de apoyo siguen abajo por si quieres hablar con alguien ahora.',
      '¿Qué sientes en el cuerpo en este momento, del 0 al 10?',
    ].join('\n\n');
  }
  if (mentionsSafety) {
    return [
      openEs,
      'Me alegra que ahora te sientas a salvo.',
      'Las líneas de apoyo siguen abajo por si las necesitas.',
      '¿Qué te ayudaría más en los próximos minutos?',
    ].join('\n\n');
  }
  return [
    openEs,
    'Sigo aquí contigo. No tienes que pasar esto solo/a.',
    'Los recursos de apoyo están abajo por si quieres hablar con alguien ahora.',
    '¿Qué es lo que más pesa en este momento?',
  ].join('\n\n');
}

export function resolveCrisisStructuredAssistantContent({
  willHardStop,
  protocolWasActive,
  previousAssistantWasHardStop = false,
  protocolExitingThisTurn = false,
  messageContent,
  language,
  preferences,
  phone,
}) {
  if (willHardStop) {
    return {
      kind: 'hard_stop',
      content: buildHardStopCrisisAssistantContent({
        riskLevel: 'HIGH',
        language,
        preferences,
        phone,
        resourcesDeliveredInPanel: true,
      }),
      hardStop: true,
    };
  }
  if (
    shouldUseCrisisProtocolFollowUpFastPath({
      protocolWasActive,
      willHardStop,
      previousAssistantWasHardStop,
      protocolExitingThisTurn,
    })
  ) {
    return {
      kind: 'protocol_follow_up',
      content: buildCrisisProtocolFollowUpContent({ messageContent, language }),
      hardStop: false,
    };
  }
  return null;
}

export async function persistCrisisStructuredAssistantTurn({
  userId,
  conversationId,
  content,
  riskLevel,
  hardStop,
  kind,
  emotionalAnalysis,
  contextualAnalysis,
  language = 'es',
}) {
  const responseMeta =
    kind === 'hard_stop'
      ? { crisisHardStop: true }
      : { crisisProtocolFollowUp: true };

  const assistantMessage = new Message({
    userId,
    content,
    role: 'assistant',
    conversationId,
    metadata: buildAssistantMetadataWithEnhancements(
      {
        status: 'sent',
        crisis: {
          riskLevel: normalizeStoredCrisisRiskLevel(riskLevel),
          hardStop: hardStop === true,
          structuredKind: kind,
        },
        context: {
          emotional: emotionalAnalysis,
          contextual: contextualAnalysis,
          response: JSON.stringify(responseMeta),
        },
      },
      { active: false },
      language,
    ),
  });
  await assistantMessage.save();
  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: assistantMessage._id,
  });
  return {
    assistantMessage,
    clientTurn: buildCrisisHardStopClientPayload(language),
  };
}

export function readProtocolWasActive(conversation) {
  return normalizeCrisisProtocolState(conversation?.crisisProtocolState).active === true;
}

export default {
  shouldUseCrisisProtocolFollowUpFastPath,
  wasLastAssistantTurnCrisisHardStop,
  buildCrisisProtocolFollowUpContent,
  resolveCrisisStructuredAssistantContent,
  persistCrisisStructuredAssistantTurn,
  readProtocolWasActive,
};
