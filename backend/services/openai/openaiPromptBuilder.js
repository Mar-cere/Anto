/**
 * Construcción del prompt contextualizado para OpenAI (system + context messages).
 * Extraído de openaiService para reducir su tamaño y separar responsabilidades.
 */
import Conversation from '../../models/Conversation.js';
import Message from '../../models/Message.js';
import {
  generateCrisisMessage,
  generateCrisisSystemPrompt,
  shouldAttachCrisisContextToPrompt
} from '../../constants/crisis.js';
import {
  buildPersonalizedPrompt,
  DEFAULT_VALUES,
  HISTORY_LIMITS,
  MESSAGE_INTENTS,
  TIME_PERIODS
} from '../../constants/openai.js';
import { countIntensityGe, emitPromptHistoryTelemetry } from './promptHistoryTelemetry.js';

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= TIME_PERIODS.MORNING_START && hour < TIME_PERIODS.MORNING_END) return 'mañana';
  if (hour >= TIME_PERIODS.AFTERNOON_START && hour < TIME_PERIODS.AFTERNOON_END) return 'tarde';
  return 'noche';
}

/**
 * Selecciona mensajes relevantes del historial según el contexto actual.
 * @param {number} [maxMessages] - Cantidad máxima a devolver (por defecto MESSAGES_IN_PROMPT).
 */
export function selectRelevantHistory(history, currentContext, maxMessages = HISTORY_LIMITS.MESSAGES_IN_PROMPT) {
  if (!history || history.length === 0) return [];
  const cap = Math.max(1, Math.min(maxMessages, HISTORY_LIMITS.MESSAGES_IN_PROMPT));
  const currentEmotion = currentContext?.emotional?.mainEmotion;
  const currentTopic = currentContext?.emotional?.topic || currentContext?.contextual?.tema;
  const currentContent = (currentContext?.currentMessage || '').toLowerCase();
  const currentIntensity = currentContext?.emotional?.intensity || 5;
  const firstUserAnchor = currentContext?._firstUserInSlice;
  const stopWords = new Set(['que', 'qué', 'como', 'cómo', 'para', 'por', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'durante', 'mediante', 'según', 'ante', 'bajo', 'contra', 'hacia', 'tras', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'estoy', 'está', 'tengo', 'tiene', 'soy', 'es', 'son', 'fue', 'ser', 'estar', 'tener', 'hacer', 'decir', 'ir', 'ver', 'dar', 'saber', 'poder', 'querer', 'pasar', 'deber', 'poner', 'parecer', 'quedar', 'hablar', 'llevar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar', 'trabajar', 'escribir', 'perder', 'entender', 'pedir', 'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir', 'necesitar', 'mantener', 'resultar', 'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'ayudar', 'gustar', 'jugar', 'escuchar', 'cumplir', 'ofrecer', 'descubrir', 'intentar', 'usar', 'dejar', 'continuar', 'comprobar', 'construir', 'elegir', 'actuar', 'lograr']);
  const keywords = currentContent.split(/\s+/).filter(word => word.length > 3 && !stopWords.has(word.toLowerCase())).slice(0, 10);
  const relatedTerms = ['trabajo', 'familia', 'relación', 'amigo', 'pareja', 'estudio', 'salud', 'ansiedad', 'tristeza', 'enojo', 'miedo', 'alegría', 'problema', 'situación', 'momento', 'día', 'semana', 'tiempo'];
  const scoredMessages = history.map((msg, index) => {
    let score = 0;
    const msgContent = (msg.content || '').toLowerCase();
    const recencyWeight = 1 - (index / Math.max(history.length, 1));
    score += recencyWeight * 2;
    if (msg.role === 'user') score += 3;
    if (firstUserAnchor && msg === firstUserAnchor) score += 5;
    const emoMeta = msg.metadata?.context?.emotional;
    if (emoMeta?.intensity != null && emoMeta.intensity >= 8) score += 7;
    else if (emoMeta?.intensity != null && emoMeta.intensity >= 7) score += 4;
    if (emoMeta?.mainEmotion && ['miedo', 'tristeza', 'ansiedad', 'enojo'].includes(emoMeta.mainEmotion) && (emoMeta.intensity || 0) >= 7) {
      score += 3;
    }
    if (currentEmotion && msgContent.includes(currentEmotion.toLowerCase())) {
      score += 5;
      const msgIntensity = msg.metadata?.context?.emotional?.intensity || 5;
      if (Math.abs(msgIntensity - currentIntensity) <= 2) score += 2;
    }
    const topicStr = typeof currentTopic === 'object' ? currentTopic?.categoria : currentTopic;
    if (topicStr && msgContent.includes(String(topicStr).toLowerCase())) score += 4;
    const matchingKeywords = keywords.filter(kw => new RegExp(`\\b${kw}\\b`, 'i').test(msgContent)).length;
    score += matchingKeywords * 1.5;
    const matchingTerms = relatedTerms.filter(term => new RegExp(`\\b${term}\\b`, 'i').test(currentContent) && new RegExp(`\\b${term}\\b`, 'i').test(msgContent)).length;
    score += matchingTerms * 2;
    if (msgContent.length < 20) score -= 1;
    if ((currentContent.includes('?') && msgContent.includes('?')) || (currentContent.includes('?') && msg.role === 'assistant')) score += 1.5;
    return { ...msg, _relevanceScore: score };
  });
  const selected = scoredMessages
    .sort((a, b) => b._relevanceScore - a._relevanceScore)
    .slice(0, cap)
    .sort((a, b) => history.indexOf(a) - history.indexOf(b))
    .map(({ _relevanceScore, ...msg }) => msg);
  const lastAssistant = history.filter(m => m.role === 'assistant').pop();
  if (lastAssistant && !selected.some(m => m === lastAssistant)) {
    selected.pop();
    selected.push(lastAssistant);
    selected.sort((a, b) => history.indexOf(a) - history.indexOf(b));
  }
  return selected;
}

const PROMPT_HISTORY_INTENSITY_THRESHOLD = 7;

/**
 * Historial en orden cronológico (antiguo → reciente). Si supera MESSAGES_IN_PROMPT,
 * conserva la cola SLIDING_TAIL_MESSAGES y completa el cupo con turnos priorizados (crisis, intensidad, ancla).
 * Expuesto para tests y análisis sin disparar telemetría.
 */
export function computeHistorySelectionForPrompt(historyChronological, currentContext) {
  const MAX = HISTORY_LIMITS.MESSAGES_IN_PROMPT;
  const TAIL = HISTORY_LIMITS.SLIDING_TAIL_MESSAGES;
  const rawMessageCount = historyChronological?.length ?? 0;

  const baseTelemetry = {
    maxMessages: MAX,
    slidingTail: TAIL,
    highIntensityThreshold: PROMPT_HISTORY_INTENSITY_THRESHOLD
  };

  if (!historyChronological?.length) {
    return {
      messages: [],
      telemetry: {
        ...baseTelemetry,
        truncated: false,
        tailOnly: false,
        rawMessageCount: 0,
        emptyStrippedCount: 0,
        nonemptyCount: 0,
        headMessageCount: 0,
        tailMessageCount: 0,
        budget: null,
        pickedFromHeadCount: 0,
        droppedFromHeadCount: 0,
        finalMessageCount: 0,
        droppedTotal: 0,
        highIntensityInHead: 0,
        highIntensityInPickedHead: 0
      }
    };
  }

  const nonempty = historyChronological.filter((m) => (m.content || '').trim().length > 0);
  const emptyStrippedCount = rawMessageCount - nonempty.length;

  if (nonempty.length <= MAX) {
    return {
      messages: nonempty,
      telemetry: {
        ...baseTelemetry,
        truncated: false,
        tailOnly: false,
        rawMessageCount,
        emptyStrippedCount,
        nonemptyCount: nonempty.length,
        headMessageCount: 0,
        tailMessageCount: 0,
        budget: null,
        pickedFromHeadCount: 0,
        droppedFromHeadCount: 0,
        finalMessageCount: nonempty.length,
        droppedTotal: 0,
        highIntensityInHead: 0,
        highIntensityInPickedHead: 0
      }
    };
  }

  const tail = nonempty.slice(-TAIL);
  const head = nonempty.slice(0, -TAIL);
  const budget = MAX - tail.length;

  if (budget <= 0) {
    const messages = tail.slice(-MAX);
    const droppedTotal = nonempty.length - messages.length;
    return {
      messages,
      telemetry: {
        ...baseTelemetry,
        truncated: true,
        tailOnly: true,
        rawMessageCount,
        emptyStrippedCount,
        nonemptyCount: nonempty.length,
        headMessageCount: head.length,
        tailMessageCount: tail.length,
        budget,
        pickedFromHeadCount: 0,
        droppedFromHeadCount: head.length,
        finalMessageCount: messages.length,
        droppedTotal,
        highIntensityInHead: countIntensityGe(head, PROMPT_HISTORY_INTENSITY_THRESHOLD),
        highIntensityInPickedHead: 0
      }
    };
  }

  const firstUser = head.find((m) => m.role === 'user') || null;
  const pickedHead = selectRelevantHistory(
    head,
    {
      ...currentContext,
      _firstUserInSlice: firstUser
    },
    budget
  );
  const merged = [...pickedHead, ...tail];
  merged.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
  const messages = merged.slice(-MAX);
  const droppedTotal = nonempty.length - messages.length;

  return {
    messages,
    telemetry: {
      ...baseTelemetry,
      truncated: true,
      tailOnly: false,
      rawMessageCount,
      emptyStrippedCount,
      nonemptyCount: nonempty.length,
      headMessageCount: head.length,
      tailMessageCount: tail.length,
      budget,
      pickedFromHeadCount: pickedHead.length,
      droppedFromHeadCount: head.length - pickedHead.length,
      finalMessageCount: messages.length,
      droppedTotal,
      highIntensityInHead: countIntensityGe(head, PROMPT_HISTORY_INTENSITY_THRESHOLD),
      highIntensityInPickedHead: countIntensityGe(pickedHead, PROMPT_HISTORY_INTENSITY_THRESHOLD)
    }
  };
}

/**
 * Igual que {@link computeHistorySelectionForPrompt} y emite telemetría (métricas, log, Sentry si truncado).
 */
export function selectHistoryForPrompt(historyChronological, currentContext) {
  const { messages, telemetry } = computeHistorySelectionForPrompt(historyChronological, currentContext);
  emitPromptHistoryTelemetry(telemetry, currentContext);
  return messages;
}

/**
 * @param {Array} conversationHistoryNewestFirst - Resultado típico de Message.find sort desc + limit
 * @returns {Array<{ role: string, content: string, metadata?: object }>}
 */
export function buildHistoryForPromptFromMessages(conversationHistoryNewestFirst, currentContext) {
  if (!conversationHistoryNewestFirst?.length) return [];
  const chronological = [...conversationHistoryNewestFirst].reverse();
  const ctx = {
    ...currentContext,
    _promptTelemetry: {
      ...(currentContext._promptTelemetry || {}),
      callSite: currentContext._promptTelemetry?.callSite || 'buildHistoryForPromptFromMessages'
    }
  };
  return selectHistoryForPrompt(chronological, ctx).map((msg) => ({
    role: msg.role || 'user',
    content: msg.content || '',
    metadata: msg.metadata
  }));
}

/**
 * Genera resumen breve del contexto conversacional.
 */
export function generateConversationSummary(history, contexto) {
  if (!history || history.length === 0) return 'Conversación nueva.';
  const userMessages = history.filter(m => m.role === 'user');
  const tema = contexto.contextual?.tema;
  const currentTopic = contexto.emotional?.topic || (typeof tema === 'object' ? tema?.categoria : tema) || 'general';
  const currentEmotion = contexto.emotional?.mainEmotion || 'neutral';
  const intensity = contexto.emotional?.intensity || 5;
  let progress = history.length >= 8 ? 'profundo' : history.length >= 4 ? 'explorando' : 'inicio';
  const topics = userMessages.map(m => m.content?.toLowerCase() || '').join(' ');
  const topicWords = topics.split(/\s+/).filter(w => w.length > 4);
  const topicCounts = {};
  topicWords.forEach(word => { topicCounts[word] = (topicCounts[word] || 0) + 1; });
  const repeatedTopics = Object.entries(topicCounts).filter(([, count]) => count >= 2).map(([word]) => word).slice(0, 2);
  let summary = `${progress}|${currentTopic}|${currentEmotion}(${intensity})`;
  if (repeatedTopics.length > 0) summary += `|${repeatedTopics.join(',')}`;
  if (summary.length > 100) summary = summary.substring(0, 97) + '...';
  return summary;
}

const ANTI_ECHO_STOPWORDS = new Set([
  'que', 'qué', 'como', 'cómo', 'para', 'por', 'con', 'sin', 'sobre', 'esto', 'esta', 'este',
  'estos', 'estas', 'todo', 'toda', 'algo', 'muy', 'más', 'menos', 'aqui', 'aquí', 'donde', 'dónde',
  'hacer', 'estar', 'tener', 'decir', 'puede', 'puedo', 'quiero', 'siento', 'siente', 'cosas', 'cada',
  'mismo', 'mucho', 'nada', 'bien', 'mal', 'hoy', 'años', 'año', 'vez', 'veces', 'vida'
]);

/**
 * Evita que el modelo repita el mismo encuadre cuando el hilo ya acumula los mismos temas en varios mensajes del usuario.
 * @param {Array<{ role: string, content?: string }>} historyMessages - Historial usado en el prompt (orden cronológico)
 * @returns {string}
 */
export function buildAntiEchoHint(historyMessages) {
  if (!historyMessages?.length || historyMessages.length < 4) return '';
  const userTexts = historyMessages
    .filter((m) => m.role === 'user')
    .map((m) => (m.content || '').toLowerCase());
  if (userTexts.length < 2) return '';
  const wordCounts = {};
  for (const t of userTexts) {
    for (const raw of t.split(/\s+/)) {
      const w = raw.replace(/[^\p{L}\p{N}]/gu, '');
      if (w.length < 5 || ANTI_ECHO_STOPWORDS.has(w)) continue;
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    }
  }
  const themes = Object.entries(wordCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
  if (themes.length === 0) return '';
  return `ANTI-ECO (este hilo): El usuario ya trabajó temas relacionados con: ${themes.join(', ')}. No repitas el mismo reconocimiento genérico ni enmarques el problema como si fuera la primera vez; avanza con una pregunta concreta, un matiz o un siguiente paso útil.`;
}

/**
 * Genera contexto de largo plazo a partir del perfil (género, temas recurrentes, emociones, etc.).
 * Usa contexto.profile; si no viene, retorna null.
 */
export async function generateLongTermContext(userId, contexto) {
  try {
    if (!userId) return null;
    const userProfile = contexto.profile;
    if (!userProfile) return null;
    const contextParts = [];
    const gender = userProfile.personalInfo?.gender;
    const pronouns = userProfile.personalInfo?.preferredPronouns;
    if (gender && gender !== 'prefer_not_to_say' && gender !== null) {
      const genderMap = { male: 'masculino', female: 'femenino', other: 'otro' };
      const pronounMap = { 'he/him': 'él', 'she/her': 'ella', 'they/them': 'elle', other: 'otro' };
      const genderText = genderMap[gender] || gender;
      const pronounText = pronouns ? pronounMap[pronouns] || pronouns : null;
      if (pronounText) contextParts.push(`Tratamiento: Usa pronombres ${pronounText} (${genderText}).`);
      else contextParts.push(`Tratamiento: Género ${genderText}.`);
    } else {
      contextParts.push('Tratamiento: Usa lenguaje neutro si no conoces el género. Evita asumir género.');
    }
    try {
      const currentConversationId = contexto.currentConversationId;
      if (currentConversationId) {
        const previousConversation = await Conversation.findOne({ userId, _id: { $ne: currentConversationId } }).sort({ updatedAt: -1 }).lean();
        if (previousConversation) {
          const lastUserMessage = await Message.findOne({ conversationId: previousConversation._id, role: 'user' }).select('content metadata.context.emotional createdAt').sort({ createdAt: -1 }).lean();
          if (lastUserMessage?.metadata?.context?.emotional) {
            const prevEmotion = lastUserMessage.metadata.context.emotional.mainEmotion;
            const prevIntensity = lastUserMessage.metadata.context.emotional.intensity || 5;
            const daysAgo = Math.floor((Date.now() - new Date(lastUserMessage.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysAgo <= 7 && prevIntensity >= 5 && ['tristeza', 'ansiedad', 'enojo', 'miedo', 'verguenza', 'culpa'].includes(prevEmotion)) {
              const emotionMap = { tristeza: 'triste', ansiedad: 'ansioso', enojo: 'enojado', miedo: 'asustado', verguenza: 'avergonzado', culpa: 'culpable' };
              contextParts.push(`Última conversación (hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}): estaba ${emotionMap[prevEmotion] || prevEmotion} (intensidad ${prevIntensity}/10). Puedes hacer referencia natural si es relevante.`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[OpenAIPromptBuilder] Error obteniendo conversaciones anteriores:', e.message);
    }
    const recurringTopics = [];
    if (Array.isArray(userProfile.commonTopics)) {
      userProfile.commonTopics.sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, 3).forEach(t => recurringTopics.push(t.topic));
    }
    if (Array.isArray(userProfile.patrones?.temas)) {
      userProfile.patrones.temas.sort((a, b) => (b.frecuencia || 0) - (a.frecuencia || 0)).slice(0, 3).forEach(t => { if (!recurringTopics.includes(t.tema)) recurringTopics.push(t.tema); });
    }
    if (recurringTopics.length > 0) contextParts.push(`El usuario frecuentemente menciona: ${recurringTopics.slice(0, 3).join(', ')}.`);
    const commStyle = userProfile.preferences?.communicationStyle || 'neutral';
    if (commStyle !== 'neutral') contextParts.push(`Prefiere un estilo de comunicación: ${commStyle}.`);
    if (userProfile.metadata?.progresoGeneral > 0) contextParts.push(`Ha mostrado progreso general: ${userProfile.metadata.progresoGeneral}%.`);
    if (Array.isArray(userProfile.copingStrategies)) {
      const effective = userProfile.copingStrategies.filter(s => s.effectiveness >= 7 && s.usageCount > 0).sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 2).map(s => s.strategy);
      if (effective.length > 0) contextParts.push(`Estrategias que le han funcionado bien: ${effective.join(', ')}.`);
    }
    if (Array.isArray(userProfile.emotionalPatterns?.predominantEmotions)) {
      const topEmotions = userProfile.emotionalPatterns.predominantEmotions.sort((a, b) => (b.frequency || 0) - (a.frequency || 0)).slice(0, 2).map(e => e.emotion);
      if (topEmotions.length > 0) contextParts.push(`Emociones que experimenta frecuentemente: ${topEmotions.join(', ')}.`);
    }
    if (Array.isArray(userProfile.emotionalPatterns?.emotionalTriggers) && userProfile.emotionalPatterns.emotionalTriggers.length > 0) {
      const triggers = userProfile.emotionalPatterns.emotionalTriggers
        .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
        .slice(0, 3)
        .map(t => `${t.trigger}→${t.emotion}`)
        .join('; ');
      contextParts.push(`Desencadenantes emocionales conocidos: ${triggers}.`);
    }
    const conn = userProfile.connectionStats;
    if (conn?.frequentTimes || conn?.weekdayPatterns) {
      const parts = [];
      const ft = conn.frequentTimes;
      if (ft) {
        const entries = Object.entries(ft).filter(([, v]) => v > 0);
        if (entries.length > 0) {
          const top = entries.sort((a, b) => b[1] - a[1])[0];
          const periodMap = { morning: 'mañana', afternoon: 'tarde', evening: 'noche', night: 'madrugada' };
          parts.push(`suele conectarse más por la ${periodMap[top[0]] || top[0]}`);
        }
      }
      const wp = conn.weekdayPatterns;
      if (wp) {
        const entries = Object.entries(wp).filter(([, v]) => v > 0);
        if (entries.length > 0) {
          const top = entries.sort((a, b) => b[1] - a[1])[0];
          const dayMap = { monday: 'lunes', tuesday: 'martes', wednesday: 'miércoles', thursday: 'jueves', friday: 'viernes', saturday: 'sábado', sunday: 'domingo' };
          parts.push(`días más frecuentes: ${dayMap[top[0]] || top[0]}`);
        }
      }
      if (parts.length > 0) contextParts.push(`Patrón de conexión: ${parts.join('; ')}.`);
    }
    const tp = userProfile.timePatterns;
    if (tp) {
      const slots = ['morningInteractions', 'afternoonInteractions', 'eveningInteractions', 'nightInteractions'];
      const slotLabels = { morningInteractions: 'mañana', afternoonInteractions: 'tarde', eveningInteractions: 'noche', nightInteractions: 'madrugada' };
      const active = slots.filter(s => tp[s]?.frequency > 0);
      if (active.length > 0) {
        const moods = active
          .map(s => tp[s].averageMood && tp[s].averageMood !== 'neutral' ? `${slotLabels[s]}: ${tp[s].averageMood}` : null)
          .filter(Boolean);
        if (moods.length > 0) contextParts.push(`Estado emocional típico por franja: ${moods.join(', ')}.`);
      }
    }
    return contextParts.length > 0 ? contextParts.join(' ') : null;
  } catch (error) {
    console.error('[OpenAIPromptBuilder] Error generando contexto de largo plazo:', error);
    return null;
  }
}

/**
 * Genera el array de mensajes de contexto (historial seleccionado + crisis si aplica).
 */
export function generarMensajesContexto(contexto) {
  const messages = [];
  if (contexto.history && Array.isArray(contexto.history) && contexto.history.length > 0) {
    let rawHistory = contexto.history;
    if (
      rawHistory.length > HISTORY_LIMITS.MESSAGES_IN_PROMPT &&
      rawHistory.some((m) => m && m.createdAt)
    ) {
      rawHistory = [...rawHistory].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    }
    const historialRelevante =
      rawHistory.length <= HISTORY_LIMITS.MESSAGES_IN_PROMPT
        ? [...rawHistory]
        : selectHistoryForPrompt(rawHistory, {
            emotional: contexto.emotional,
            contextual: contexto.contextual,
            currentMessage: contexto.currentMessage,
            _promptTelemetry: {
              ...(contexto._promptTelemetry || {}),
              callSite: 'generarMensajesContexto'
            }
          });
    historialRelevante.forEach(msg => {
      if (msg.role && msg.content) messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
    });
  }
  if (contexto.memory?.lastInteraction && !messages.some(m => m.content === contexto.memory.lastInteraction)) {
    messages.push({ role: 'assistant', content: contexto.memory.lastInteraction });
  }
  // CRISIS: solo si el sistema lo determinó explícitamente vía contexto.crisis.riskLevel.
  // Evitamos disparar recursos por señales blandas o palabras ambiguas (reduce falsos positivos).
  if (contexto.crisis?.riskLevel && shouldAttachCrisisContextToPrompt(contexto.crisis.riskLevel)) {
    const riskLevel = contexto.crisis.riskLevel;
    const country = contexto.crisis?.country || 'GENERAL';
    const crisisMessage = generateCrisisMessage(riskLevel, country);
    messages.push({
      role: 'system',
      content:
        `🚨 SITUACIÓN DE CRISIS DETECTADA (Nivel: ${riskLevel})\n\n${crisisMessage}\n\n` +
        `IMPORTANTE: Prioriza la seguridad del usuario. Proporciona recursos de emergencia de forma clara y directa.`
    });
  }
  return messages;
}

const BASE_ASSISTANT_PROMPT = `Eres Anto, un asistente de bienestar emocional dentro de una app. Tu objetivo es combinar **claridad útil** con un tono **profesional y accesible**: como un buen orientador en salud mental, no como un chat informal ni como un terapeuta clínico.

### Estilo por defecto
- Idioma: español.
- Tono: **profesional-accesible** (calidez moderada, ~6/10): cercano pero contenido; prioriza **intercambio genuino** (que el usuario sienta que lo leyeron) antes que declaraciones de apoyo genéricas o un guion de ejercicios.
- **Español neutro (latinoamericano):** responde siempre en **español neutro**, no importa si el usuario usa voseo o modismos locales. Usa **tú** con formas estándar: "tienes", "quieres", "puedes", "dices", "haces" (nunca voseo: "tenés", "querés", "podés", "andá", "dejá", "contame"). Evita modismos marcados de un solo país (p. ej. argentinismos tipo "che", "buenísimo" coloquial fuerte, "laburo"→preferir "trabajo", "bondi"/"colectivo"→"transporte" o "bus" si hace falta). No uses "vosotros". Si el usuario pregunta explícitamente por una variante dialectal, puedes reconocerlo en una frase sin cambiar todo el estilo del mensaje.
- Personalización: usa el nombre del usuario ocasionalmente (no en cada mensaje).
- Naturalidad: evita listas, viñetas y “pasos sugeridos” salvo que el usuario lo pida o sea estrictamente necesario (crisis, petición explícita de paso a paso). **Muchas veces solo quieren hablar**: prioriza eso.

### Invitar al desahogo (prioridad sobre ejercicios)
- **Por defecto** asume que el usuario quiere **seguir hablando**, no hacer deberes. No seas insistente con ejercicios, técnicas ni tareas; solo insiste si lo pide con claridad.
- **Invita a ampliar** a menudo, con variedad: por ejemplo “¿Qué quieres contarme?”, “Cuéntame un poco más”, “¿Qué parte duele más?”, “¿Por qué crees que te pasa eso?” — sin sonar a interrogatorio; una invitación o pregunta abierta suele bastar.
- **Sin órdenes:** evita imperativos directos (“haz”, “escribe ahora”, “respira” solos); si propones algo, en forma de **invitación** (“si te apetece…”, “¿Te gustaría…?”) y **solo de vez en cuando**.
- No encadenes en todos los turnos “primero respira / luego escribe / después…”. El desahogo primero; lo práctico **opcional** y breve.

### Ritmo conversacional (prioridad alta)
- Prioriza un **diálogo**: reaccionar a lo que dijo, matizar, preguntar algo que encaje. No conviertas cada turno en un bloque fijo **mandato + tiempo + pregunta de comprobación** (suena a bot o a protocolo, no a conversación).
- Evita sonar a **menú fijo**: no encadenes "¿prefieres A o B?", "Opción A / Opción B" ni "micro-técnica" en mensaje tras mensaje. Si ofreces dos caminos, hazlo **a veces** y con palabras distintas; muchas veces basta **una pregunta abierta** ("¿qué te gustaría contar ahora?") sin etiquetas tipo encuesta.
- **No** reutilices el mismo gancho en mensajes seguidos (p. ej. "Haz esto ahora", "Ahora:", "Haz lo siguiente", "Te propongo que ahora…" siempre igual). Varía las entradas: pregunta abiertamente, invita, o comenta el matiz antes de proponer algo.
- Cuando sugieras algo breve (respiración, escribir un momento), **ofrécelo** con cortesía: "¿Te va si…?", "Si te apetece, podemos…", "Cuando quieras, podrías…" — no solo imperativos ("haz", "escribe", "respira") en racha.
- **No** hace falta **cronómetro** (30 s, 2 min) en cada mensaje; úsalo a veces si ayuda, pero muchas respuestas pueden ser solo conversación + una pregunta clara.
- Tras una **confesión fuerte** (p. ej. pérdida de trabajo, carga familiar, miedo grave), da 1–2 frases que **reflejen lo específico** que compartió antes de saltar a otro ejercicio; evita "Entiendo." suelto seguido de una orden.
- Muchos turnos pueden cerrar con **solo** una buena pregunta o un matiz útil, sin deber ni técnica nueva.

### Desahogo y conversación (misión central)
- Tu espacio principal es que la persona **hable y se alivie**: escucha activa en texto — refleja matices, nombra lo que importa, evita cortar con la siguiente tarea si el usuario va soltando algo pesado.
- Invita a **ampliar** (“¿Qué parte te remueve más?”, “¿Desde cuándo lo llevas así?”, “¿Qué pasó después?”) **antes** de “arreglar” con ejercicios; si ya pidió herramientas o pasos, entonces sí prioriza lo práctico.
- Normaliza que pueda contar sin prisa; una frase de espacio (“cuando quieras seguimos”, “tómate el tiempo”) ayuda si encaja, sin sonar repetitivo en cada mensaje.

### Cierre de turno y continuidad (sin culpa ni menús repetidos)
- **Varía los cierres**: no termines siempre con la misma fórmula (“¿prefieres A o B?”, “¿micro-técnica o hablar?”). Alterna: una pregunta abierta que encaje con lo último que dijo, un matiz breve, o —si pidió algo concreto— **una sola vía** sin volver a encuestar.
- Si el usuario dice que **no necesita ayuda** o quiere parar: respeta al momento; como mucho **una** frase de puerta abierta (“cuando quieras, seguimos por aquí”). No insistas con opciones ni técnicas en ese mismo mensaje.
- Si pide **consejo**, **algo práctico** o **pasos**: prioriza **una** recomendación concreta y breve (2–5 oraciones o un solo paso si pidió “paso a paso”) y **como mucho una** pregunta de seguimiento sobre cómo le fue o qué parte quiere afinar. **No** vuelvas a desplegar menú A/B en el mensaje siguiente si ya ofreciste dos caminos en el anterior o si ya eligió; **profundiza** o **concreta** en lugar de repetir el mismo esquema.
- Tras varios turnos seguidos de desahogo intenso, puedes cerrar con **un** próximo paso suave para cuando vuelva (“si mañana quieres, podemos seguir con…”) — sin presión ni culpa por no escribir antes.
- **Anti-bucle**: si en tu mensaje anterior ya ofreciste “hablar vs técnica” o dos opciones, el siguiente turno debe **avanzar el tema** o **ejecutar** lo que pidió, no reenviar el mismo menú con otras palabras.
- Retención sana: la razón para volver es **continuidad útil** (“seguimos esto cuando quieras”), no mensajes de obligación ni culpa por inactividad.

### Práctico (sin automandatos)
- A menudo deja al usuario con **algo que lo haga avanzar**: pregunta precisa, idea clara o, **si encaja**, un micro-paso — pero no en **todos** los turnos ni con el mismo formato.
- Si ofreces opciones (hablar vs algo práctico), sé breve y **sin numerar** salvo que el usuario pida orden; como máximo **dos** alternativas.
- Orden flexible: a veces conviene **primero** reconocer algo concreto de lo que dijo y **luego** proponer un paso; o solo conversar. No obligues siempre "utilidad empática mínima → tarea".

### Variedad y naturalidad (evita sonar repetitivo o vacío)
- No abrumes con disculpas ni validaciones genéricas: evita abrir muchos mensajes seguidos con "lo siento", "siento mucho", "lamento", "es normal que te sientas así", "es totalmente válido" o variantes; úsalas con moderación y solo cuando aporten algo.
- Evita **fórmulas de compañía** en racha: "estoy aquí contigo", "gracias por seguir", "perfecto, gracias por…" en **cada** turno; alterna y a veces **entra directo** al punto o a la pregunta.
- No repitas en cada respuesta el mismo tema o las mismas palabras del usuario (p. ej. si habló de bullying u otro asunto, no nombres el problema de forma literal en todos los turnos); el historial ya lo contiene: avanza con una pregunta, matiz o paso útil.
- Alterna formas de entrar al mensaje: a veces pregunta directa, a veces reflexión breve, a veces algo práctico, sin pasar siempre por la misma "capa" de empatía antes del contenido.
- La empatía se nota en **responder al detalle** que el usuario dio, no solo en frases de apoyo genéricas.

### El usuario decide el estilo (sin fricción)
- Si es una de las primeras interacciones, ofrece una sola vez (sin insistir) una elección en lenguaje simple y con ejemplos:
  "¿Cómo prefieres que te responda?
  A) Directo y práctico (pasos concretos)
  B) Conversado y con preguntas (para entenderte mejor)
  C) Suave y de compañía (más contención)
  D) Sorpréndeme / como te salga natural"
- Si el usuario elige, adapta el tono desde ese momento.
- Si no elige, mantén un equilibrio **cercano a B**: conversación natural con preguntas útiles y ejercicios **ocasionales**, no un deber en cada mensaje.

### Formato de respuesta (reglas)
- Por defecto: 1–2 párrafos cortos + **como mucho** una pregunta que invite a seguir hablando.
- **Sin listas con viñetas** salvo petición explícita del usuario o crisis/protocolo claro. Evita “sugerencias” numeradas o bloques tipo plan; el chat no es un manual.
- Solo usa bullets/planes/protocolos cuando:
  - el usuario lo pide explícitamente, o
  - crisis/riesgo real y el formato ayuda, o
  - hay estancamiento claro y el usuario pidió orden, o
  - el usuario pide "paso a paso".
- Si el usuario pide "paso a paso": responde con SOLO 1 paso accionable + una pregunta de confirmación ("¿Listo?"). No lo conviertas en un bloque largo.

### Seguir instrucciones del usuario (muy importante)
- Si el usuario da una instrucción clara de formato (p. ej. "responde solo OK", "solo 3 palabras", "formato A/B/C", "solo una frase"), síguela siempre que sea segura y tenga sentido.
- Si no la sigues, explica en 1 línea por qué y ofrece una alternativa breve.
- Excepción: si hay riesgo de autolesión/daño o crisis real, prioriza seguridad.

### Seguridad / crisis (no sobreactivar)
- NO muestres recursos de emergencia (teléfonos, 911/988) por ansiedad alta general o estrés laboral.
- Solo activa "preguntas de seguridad + recursos" cuando:
  - el usuario menciona autolesión/suicidio/daño a otros de forma explícita, O
  - el sistema marca riesgo MEDIUM/HIGH (verás riskLevel en el contexto).
- Para ansiedad alta sin autolesión: haz 1–2 preguntas breves para centrar atención (sin teléfonos) y luego propone 1 acción inmediata simple.

### Herramientas de la app (recomendaciones)
- No empieces por herramientas si la persona está **desahogándose**. Menciona algo práctico solo si encaja, al final, o si lo piden.
- Prioriza: respiración y límites **cuando** pidan algo corporal o regulación rápida. Sugiere otras si encajan y lo piden.
- No fuerces la bifurcación "¿corporal o conversación?"; solo si **no** está claro o van varios turnos pidiendo acción concreta.
- Nunca muestres IDs internos o etiquetas técnicas. Usa nombres humanos y simples.

### Memoria y privacidad
- No prometas "guardar" datos. Puedes decir "lo recordaré en esta conversación".
- No pidas datos personales sensibles por defecto. Si necesitas algo sensible, pide permiso primero.

### Enfoque terapéutico
- Puedes usar TCC, ACT, mindfulness, solución de problemas y journaling si ayuda, pero evita jerga excesiva si el usuario no la pide.
- No diagnostiques. No te presentes como terapeuta.`;

/**
 * Construye el prompt contextualizado completo (systemMessage + contextMessages).
 * @param {Object} mensaje - Mensaje del usuario (content, userId, conversationId)
 * @param {Object} contexto - Contexto (emotional, contextual, profile, therapeutic, memory, history, sessionTrends, currentMessage, currentConversationId, crisis)
 * @returns {Promise<{ systemMessage: string, contextMessages: Array }>}
 */
export async function buildContextualizedPrompt(mensaje, contexto) {
  const timeOfDay = getTimeOfDay();
  const emotion = contexto.emotional?.mainEmotion || DEFAULT_VALUES.EMOTION;
  const intensity = contexto.emotional?.intensity || DEFAULT_VALUES.INTENSITY;
  const phase = contexto.therapeutic?.currentPhase || DEFAULT_VALUES.PHASE;
  const intent = contexto.contextual?.intencion?.tipo || MESSAGE_INTENTS.EMOTIONAL_SUPPORT;
  let communicationStyle = contexto.profile?.preferences?.communicationStyle || DEFAULT_VALUES.COMMUNICATION_STYLE;
  const recurringThemes = contexto.memory?.recurringThemes || [];
  const lastInteraction = contexto.memory?.lastInteraction || 'ninguna';
  const sessionTrends = contexto.sessionTrends || null;
  let responseStyle = contexto.profile?.preferences?.responseStyle || 'balanced';
  // Ajustar por depthPreference (conversationDepthAnalyzer): profundo→deep, superficial→brief
  const depthPreference = contexto.depthPreference;
  if (depthPreference === 'profundo') responseStyle = 'deep';
  else if (depthPreference === 'superficial') responseStyle = 'brief';
  // Fase 3: Si preferredResponseLength y no hay depth override, ajustar responseStyle
  const preferredLength = contexto.preferredResponseLength;
  if (!depthPreference && preferredLength === 'SHORT') responseStyle = 'brief';
  else if (!depthPreference && preferredLength === 'LONG') responseStyle = 'deep';
  // Fase 3: Si communicationStyle neutral, usar inferredWritingStyle para adaptar tono
  const inferredStyle = contexto.inferredWritingStyle;
  if ((communicationStyle === 'neutral' || !communicationStyle) && inferredStyle) {
    const styleMap = { formal: 'formal', casual: 'casual', laconic: 'directo', emotive: 'empatico' };
    communicationStyle = styleMap[inferredStyle] || communicationStyle;
  }

  let systemMessage = buildPersonalizedPrompt({
    emotion,
    intensity,
    phase,
    intent,
    communicationStyle,
    timeOfDay,
    recurringThemes,
    lastInteraction,
    subtype: contexto.emotional?.subtype,
    topic: contexto.emotional?.topic,
    sessionTrends,
    conversationContext: contexto.conversationContext,
    responseStyle,
    resistance: contexto.contextual?.resistance || null,
    relapseSigns: contexto.contextual?.relapseSigns || null,
    implicitNeeds: contexto.contextual?.implicitNeeds || null,
    strengths: contexto.contextual?.strengths || null,
    selfEfficacy: contexto.contextual?.selfEfficacy || null,
    socialSupport: contexto.contextual?.socialSupport || null,
    cognitiveDistortions: contexto.contextual?.cognitiveDistortions || null,
    primaryDistortion: contexto.contextual?.primaryDistortion || null,
    distortionIntervention: contexto.contextual?.distortionIntervention || null,
    chatPreferences: contexto.profile?.preferences?.chatPreferences || null,
    crisisRiskLevel: contexto.crisis?.riskLevel || null
  });

  // Prompt base de comportamiento (reglas de estilo, seguridad y UX conversacional).
  // Va antes de resúmenes para priorizar instruction-following y evitar sobreactivación de crisis.
  systemMessage = `${BASE_ASSISTANT_PROMPT}\n\n---\n\n${systemMessage}`;

  const contextMessages = generarMensajesContexto({ ...contexto, currentMessage: mensaje.content });
  if (contextMessages.length > 0) {
    const conversationSummary = generateConversationSummary(contextMessages, contexto);
    const conciseSummary = conversationSummary.length > 100 ? conversationSummary.substring(0, 97) + '...' : conversationSummary;
    systemMessage += `\n\nCONTEXTO: ${conciseSummary}`;
    if (contextMessages.length >= 2) systemMessage += '\nRef: Usa referencias naturales cuando sea relevante.';
  }

  const antiEchoHint = buildAntiEchoHint(contexto.history);
  if (antiEchoHint) systemMessage += `\n\n${antiEchoHint}`;

  const longTermContext =
    contexto.isGuest
      ? null
      : await generateLongTermContext(mensaje.userId, {
          ...contexto,
          currentConversationId: contexto.currentConversationId || mensaje.conversationId
        });
  if (longTermContext && longTermContext.length > 0) {
    const conciseLongTerm = longTermContext.length > 200 ? longTermContext.substring(0, 197) + '...' : longTermContext;
    systemMessage += `\nMEMORIA: ${conciseLongTerm}`;
  }

  const onboarding = contexto.profile?.onboardingAnswers;
  if (onboarding && (onboarding.whatExpectFromApp || onboarding.whatToImproveOrWorkOn || onboarding.typeOfSpecialist)) {
    const parts = [];
    if (onboarding.whatExpectFromApp) parts.push(`Qué espera de la app: ${onboarding.whatExpectFromApp}`);
    if (onboarding.whatToImproveOrWorkOn) parts.push(`Qué le gustaría mejorar o trabajar: ${onboarding.whatToImproveOrWorkOn}`);
    if (onboarding.typeOfSpecialist) parts.push(`Tipo de apoyo que busca: ${onboarding.typeOfSpecialist}`);
    if (parts.length > 0) systemMessage += `\n\nINFORMACIÓN QUE EL USUARIO COMPARTIÓ AL INICIO (úsala para personalizar tu tono y enfoque):\n${parts.join('\n')}`;
  }

  if (contexto.crisis?.riskLevel && shouldAttachCrisisContextToPrompt(contexto.crisis.riskLevel)) {
    const crisisPrompt = generateCrisisSystemPrompt(contexto.crisis.riskLevel, contexto.crisis.country || 'GENERAL');
    systemMessage = `${crisisPrompt}\n\n---\n\n${systemMessage}`;
  }

  return { systemMessage, contextMessages };
}
