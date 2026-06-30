/**
 * Resumen rodante del hilo persistido en Conversation (async, tras respuesta del asistente).
 * Mejora continuidad cuando el prompt solo incluye los últimos N mensajes.
 */
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import openaiService from './openaiService.js';

const MIN_TOTAL_MESSAGES = 14;
const REFRESH_EVERY_NEW_MESSAGES = 8;
const MAX_TRANSCRIPT_MESSAGES = 34;
const MAX_CHARS_PER_LINE = 420;
const SUMMARY_MAX_STORED = 3500;

/**
 * @param {number} totalMessages
 * @param {number} [rollingSummaryAtMessageCount]
 * @returns {boolean}
 */
export function shouldAttemptRollingSummary(
  totalMessages,
  rollingSummaryAtMessageCount = 0,
  { minTotal = MIN_TOTAL_MESSAGES, interval = REFRESH_EVERY_NEW_MESSAGES } = {}
) {
  if (totalMessages < minTotal) return false;
  const lastAt = rollingSummaryAtMessageCount ?? 0;
  if (lastAt <= 0) return true;
  return totalMessages - lastAt >= interval;
}

function buildMessageQuery({ conversationId, userId, guestSessionId, isGuest }) {
  const convId = mongoose.Types.ObjectId.isValid(String(conversationId))
    ? new mongoose.Types.ObjectId(conversationId)
    : conversationId;
  if (isGuest && guestSessionId) {
    const gs = mongoose.Types.ObjectId.isValid(String(guestSessionId))
      ? new mongoose.Types.ObjectId(guestSessionId)
      : guestSessionId;
    return { conversationId: convId, guestSessionId: gs };
  }
  const uid = mongoose.Types.ObjectId.isValid(String(userId)) ? new mongoose.Types.ObjectId(userId) : userId;
  return { conversationId: convId, userId: uid };
}

/**
 * Programa actualización en background (no bloquea la respuesta HTTP).
 * @param {{ conversationId: string, userId?: import('mongoose').Types.ObjectId|string|null, guestSessionId?: import('mongoose').Types.ObjectId|string|null, isGuest?: boolean }} params
 */
export function scheduleRollingSummaryRefresh(params) {
  return new Promise((resolve) => {
    setImmediate(() => {
      refreshRollingSummary(params)
        .catch((err) => {
          console.warn('[RollingSummary]', err?.message || err);
        })
        .finally(resolve);
    });
  });
}

/**
 * @param {{ conversationId: string, userId?: import('mongoose').Types.ObjectId|string|null, guestSessionId?: import('mongoose').Types.ObjectId|string|null, isGuest?: boolean }} params
 */
export async function refreshRollingSummary({
  conversationId,
  userId = null,
  guestSessionId = null,
  isGuest = false
}) {
  if (!process.env.OPENAI_API_KEY) return;

  const query = buildMessageQuery({ conversationId, userId, guestSessionId, isGuest });
  const count = await Message.countDocuments(query);
  const conv = await Conversation.findById(conversationId).select('rollingSummaryAtMessageCount').lean();
  const lastAt = conv?.rollingSummaryAtMessageCount ?? 0;

  if (!shouldAttemptRollingSummary(count, lastAt)) return;

  const skip = Math.max(0, count - MAX_TRANSCRIPT_MESSAGES);
  const msgs = await Message.find(query)
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(MAX_TRANSCRIPT_MESSAGES)
    .select('role content')
    .lean();

  const transcript = msgs
    .map((m) => {
      const line = String(m.content || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, MAX_CHARS_PER_LINE);
      return `${m.role}: ${line}`;
    })
    .join('\n');

  const model = process.env.CONVERSATION_SUMMARY_MODEL || 'gpt-4o-mini';

  const completion = await openaiService.createChatCompletionResilient({
    model,
    messages: [
      {
        role: 'system',
        content:
          'Resumes conversaciones de apoyo emocional en español. Salida: 5 a 10 frases breves en tono neutro ("La persona…", "Se habló de…"). Solo hechos y temas útiles como contexto interno. Sin juicios, sin diagnósticos, sin consejos terapéuticos. Omite datos identificables innecesarios.'
      },
      {
        role: 'user',
        content: `Resume este hilo para contexto interno del asistente:\n\n${transcript}`
      }
    ],
    max_completion_tokens: 450,
    temperature: 0.2
  });

  const text = completion?.choices?.[0]?.message?.content?.trim();
  if (!text || text.length < 25) return;

  const capped = text.slice(0, SUMMARY_MAX_STORED);
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { rollingSummary: capped, rollingSummaryAtMessageCount: count } }
  );
}
