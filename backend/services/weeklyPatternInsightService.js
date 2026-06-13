/**
 * Informe semanal de patrones (#208) — narrativa desde motor #217.
 */
import mongoose from 'mongoose';
import { Message } from '../models/index.js';
import chatInterventionGraphService from './chatInterventionGraphService.js';
import { aggregateTypingTelemetry } from './chatTypingTelemetryService.js';
import { fetchDigitalPhenotypeSeries } from './digitalPhenotypeService.js';
import { buildInterventionGraphPhase3Payload } from './interventionGraphPhase3Service.js';
import { buildMultimodalCorrelations } from './multimodalCorrelationService.js';
import { getInterventionCatalogLabel, getInterventionCatalogEntry } from '../constants/interventionCatalog.js';
import WeeklyPatternInsight from '../models/WeeklyPatternInsight.js';
import WeeklyPatternInsightJob from '../models/WeeklyPatternInsightJob.js';
import MonthlyPatternInsight from '../models/MonthlyPatternInsight.js';
import { getIsoWeekKey, getPreviousIsoWeekKey, getWeekWindowFromKey } from '../utils/weekKeys.js';
import {
  formatMonthKey,
  getMonthWindowFromKey,
  getPreviousMonthKey,
  normalizeMonthKey,
} from '../utils/monthKeys.js';
import { isValidIsoWeekKey, normalizeIsoWeekKey } from '../utils/signalValidators.js';

const GENERATION_COOLDOWN_MS = 60_000;

function insightLabelFromCorrelation(row, language = 'es') {
  const es = {
    topic_intervention: 'Tema e intervención',
    concept_intervention: 'Idea recurrente',
    topic_mood_ba: 'Ánimo y activación',
    typing_cognitive_load: 'Ritmo al escribir',
    typing_revision: 'Revisión al escribir',
    phenotype_sleep_prodrome: 'Sueño',
    phenotype_isolation: 'Movimiento y chat',
    phenotype_screen_social: 'Pantalla social',
  };
  const en = {
    topic_intervention: 'Topic and intervention',
    concept_intervention: 'Recurring idea',
    topic_mood_ba: 'Mood and activation',
    typing_cognitive_load: 'Writing pace',
    typing_revision: 'Writing revisions',
    phenotype_sleep_prodrome: 'Sleep',
    phenotype_isolation: 'Movement and chat',
    phenotype_screen_social: 'Social screen time',
  };
  const map = language === 'en' ? en : es;
  return map[row?.type] || row?.type || '';
}

function buildInsightSentence(row, language = 'es', periodKind = 'week') {
  const isMonth = periodKind === 'month';
  const topic = row?.sourceLabel || row?.sourceId || '';
  const intervention = row?.interventionLabel || row?.targetId || '';
  if (row?.type === 'concept_intervention') {
    return language === 'en'
      ? `When you talk about “${topic}”, ${intervention} appears often in your history.`
      : `Cuando hablas de «${topic}», ${intervention} aparece con frecuencia en tu historial.`;
  }
  if (row?.type === 'topic_intervention') {
    return language === 'en'
      ? `With themes like ${topic}, ${intervention} tends to fit your rhythm.`
      : `En temas como ${topic}, ${intervention} suele encajar con tu ritmo.`;
  }
  if (row?.type === 'topic_mood_ba') {
    const delta = Math.abs(
      Number(row?.metrics?.avgMoodDeltaOnTopicDays || 0) -
        Number(row?.metrics?.avgMoodDeltaOverall || 0),
    ).toFixed(1);
    return row.direction === 'dip'
      ? language === 'en'
        ? `On ${topic} days, mood after BA activities dips ~${delta} points vs your average.`
        : `En días de ${topic}, el ánimo tras BA baja ~${delta} puntos respecto a tu media.`
      : language === 'en'
        ? `On ${topic} days, mood after BA activities rises ~${delta} points vs your average.`
        : `En días de ${topic}, el ánimo tras BA sube ~${delta} puntos respecto a tu media.`;
  }
  if (row?.type === 'typing_cognitive_load') {
    return language === 'en'
      ? 'Some messages took longer to shape, with pauses and edits — a sign of careful wording, not weakness.'
      : 'Algunos mensajes costaron más de formular, con pausas y retoques: eso puede ser cuidado al expresarte, no debilidad.';
  }
  if (row?.type === 'typing_revision') {
    return language === 'en'
      ? 'You often refine drafts before sending. That pattern can reflect inhibition or high standards.'
      : 'Sueles pulir el borrador antes de enviar. Ese patrón puede reflejar inhibición o exigencia contigo.';
  }
  if (row?.type === 'phenotype_sleep_prodrome') {
    return language === 'en'
      ? 'Sleep duration has trended shorter lately. Worth noticing before stress builds up in chat.'
      : 'El sueño ha ido acortándose estos días. Conviene notarlo antes de que el estrés se acumule en el chat.';
  }
  if (row?.type === 'phenotype_isolation') {
    return language === 'en'
      ? 'Less movement coincided with more chat activity — a possible “quiet day” pattern.'
      : 'Menos movimiento coincidió con más actividad en el chat: un posible patrón de “día quieto”.';
  }
  if (row?.type === 'phenotype_screen_social') {
    return language === 'en'
      ? isMonth
        ? 'Social screen time was high relative to your month.'
        : 'Social screen time was high relative to your week.'
      : isMonth
        ? 'El tiempo en pantallas sociales fue alto respecto a tu mes.'
        : 'El tiempo en pantallas sociales fue alto respecto a tu semana.';
  }
  return language === 'en'
    ? isMonth
      ? 'We noticed a recurring pattern in your month.'
      : 'We noticed a recurring pattern in your week.'
    : isMonth
      ? 'Notamos un patrón recurrente en tu mes.'
      : 'Notamos un patrón recurrente en tu semana.';
}

function buildHeadline(correlations, language = 'es', periodKind = 'week') {
  const isMonth = periodKind === 'month';
  const top = correlations?.[0];
  if (!top) {
    return language === 'en'
      ? isMonth
        ? 'A calm month — patterns will emerge with more data'
        : 'A calm week — patterns will emerge with more data'
      : isMonth
        ? 'Mes tranquilo: los patrones aparecerán con más datos'
        : 'Semana tranquila: los patrones aparecerán con más datos';
  }
  if (top.type === 'phenotype_sleep_prodrome') {
    return language === 'en' ? 'Your sleep rhythm shifted' : 'Tu ritmo de sueño cambió';
  }
  if (top.type?.startsWith('typing_')) {
    return language === 'en' ? 'How you wrote tells a story too' : 'Cómo escribiste también cuenta una historia';
  }
  if (top.type === 'concept_intervention' || top.type === 'topic_intervention') {
    return language === 'en'
      ? isMonth
        ? 'What helped you this month'
        : 'What helped you this week'
      : isMonth
        ? 'Qué te acompañó este mes'
        : 'Qué te acompañó esta semana';
  }
  return language === 'en'
    ? isMonth
      ? 'Patterns from your month'
      : 'Patterns from your week'
    : isMonth
      ? 'Patrones de tu mes'
      : 'Patrones de tu semana';
}

async function countActiveChatDays(userId, since, until) {
  const uid = new mongoose.Types.ObjectId(String(userId));
  const rows = await Message.aggregate([
    {
      $match: {
        userId: uid,
        role: 'user',
        createdAt: { $gte: since, $lt: until },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      },
    },
  ]);
  return rows.length;
}

async function buildPatternInsightPayload({ userId, since, until, language = 'es', periodKind = 'week' }) {
  const topicTagRaw = await chatInterventionGraphService.aggregateInterventionGraph({
    userId,
    since,
    limit: 80,
  });
  const topicFreeRaw = await chatInterventionGraphService.aggregateTopicFreeGraph({
    userId,
    since,
    limit: 50,
  });

  const mapEdge = (e, includeTopicFree = false) => {
    const interventionId = String(e?._id?.interventionId || '').slice(0, 80);
    const entry = getInterventionCatalogEntry(interventionId);
    return {
      topicTag: String(
        includeTopicFree ? e?.topicTag || 'general' : e?._id?.topicTag || 'general',
      ).slice(0, 64),
      ...(includeTopicFree ? { topicFree: String(e?._id?.topicFree || '').slice(0, 128) } : {}),
      interventionId,
      interventionLabel: getInterventionCatalogLabel(entry, language) || interventionId,
      shown: e.shown || 0,
      clicked: e.clicked || 0,
      dismissed: e.dismissed || 0,
      completed: e.completed || 0,
      ctr: typeof e.ctr === 'number' ? e.ctr : 0,
      completionRate: typeof e.completionRate === 'number' ? e.completionRate : 0,
    };
  };

  const mappedEdges = topicTagRaw.map((e) => mapEdge(e, false));
  const mappedTopicFreeEdges = topicFreeRaw.map((e) => mapEdge(e, true));
  const phase3 = await buildInterventionGraphPhase3Payload({
    userId,
    since,
    topicTagEdges: mappedEdges,
    topicFreeEdges: mappedTopicFreeEdges,
  });

  const phenotypeLimit = periodKind === 'month' ? 31 : 14;
  const [typingAggregate, phenotypeSeries, chatDaysActive] = await Promise.all([
    aggregateTypingTelemetry({ userId, since, until }),
    fetchDigitalPhenotypeSeries({ userId, since, until, limit: phenotypeLimit }),
    countActiveChatDays(userId, since, until),
  ]);

  const { correlations, summary } = await buildMultimodalCorrelations({
    userId,
    since,
    until,
    topicTagEdges: mappedEdges,
    conceptEdges: phase3.conceptEdges,
    conceptNodes: phase3.conceptNodes,
    typingAggregate,
    phenotypeSeries,
    chatDaysActive,
  });

  const insights = correlations.slice(0, 6).map((row) => ({
    type: row.type,
    label: insightLabelFromCorrelation(row, language),
    strength: row.strength,
    detail: buildInsightSentence(row, language, periodKind),
    disclaimer: row.disclaimer || 'pattern_observed',
  }));

  const headline = buildHeadline(correlations, language, periodKind);
  const body =
    insights.length > 0
      ? ''
      : language === 'en'
        ? 'There is not enough signal yet for a strong pattern. Keep using suggestions and techniques when you want.'
        : 'Aún no hay señal suficiente para un patrón sólido. Sigue usando sugerencias y técnicas cuando quieras.';

  return {
    headline,
    body: body.slice(0, 2000),
    insights,
    correlations: correlations.slice(0, 12),
    sourceSummary: { ...summary, chatDaysActive, typingCount: typingAggregate?.count || 0 },
  };
}

export async function generateWeeklyPatternInsight({
  userId,
  weekKey = null,
  language = 'es',
}) {
  const key = normalizeIsoWeekKey(weekKey, getPreviousIsoWeekKey());
  if (!key) {
    throw new Error('invalid_week_key');
  }
  const window = getWeekWindowFromKey(key);
  if (!userId || !window) {
    throw new Error('invalid_week_or_user');
  }

  const { since, until } = window;
  const payload = await buildPatternInsightPayload({
    userId,
    since,
    until,
    language,
    periodKind: 'week',
  });

  const doc = await WeeklyPatternInsight.findOneAndUpdate(
    { userId, weekKey: key },
    {
      $set: {
        language,
        status: 'ready',
        ...payload,
        generatedAt: new Date(),
        lastError: null,
      },
    },
    { upsert: true, new: true },
  );

  return doc;
}

export async function generateMonthlyPatternInsight({
  userId,
  monthKey = null,
  language = 'es',
}) {
  const key = normalizeMonthKey(monthKey, getPreviousMonthKey());
  if (!key) {
    throw new Error('invalid_month_key');
  }
  const window = getMonthWindowFromKey(key);
  if (!userId || !window) {
    throw new Error('invalid_month_or_user');
  }

  const { since, until } = window;
  const payload = await buildPatternInsightPayload({
    userId,
    since,
    until,
    language,
    periodKind: 'month',
  });

  const doc = await MonthlyPatternInsight.findOneAndUpdate(
    { userId, monthKey: key },
    {
      $set: {
        language,
        status: 'ready',
        ...payload,
        generatedAt: new Date(),
        lastError: null,
      },
    },
    { upsert: true, new: true },
  );

  return doc;
}

export async function getMonthlyPatternInsight({ userId, monthKey = null, language = 'es' }) {
  const key = normalizeMonthKey(monthKey, getPreviousMonthKey());
  if (!key) {
    throw new Error('invalid_month_key');
  }

  const lang = language === 'en' ? 'en' : 'es';

  let doc = await MonthlyPatternInsight.findOne({ userId, monthKey: key }).lean();
  if (doc?.status === 'ready' && doc.language === lang) return doc;

  if (doc?.status === 'ready' && doc.language !== lang) {
    return generateMonthlyPatternInsight({ userId, monthKey: key, language: lang });
  }

  const updatedAtMs = doc?.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
  if (updatedAtMs && Date.now() - updatedAtMs < GENERATION_COOLDOWN_MS) {
    return (
      doc || {
        userId,
        monthKey: key,
        status: 'pending',
        headline: '',
        body: '',
        insights: [],
        correlations: [],
        sourceSummary: {},
      }
    );
  }

  doc = await generateMonthlyPatternInsight({ userId, monthKey: key, language: lang });
  return doc;
}

export async function scheduleWeeklyPatternInsightJob({ userId, weekKey = null, runAt = null }) {
  const key = normalizeIsoWeekKey(weekKey, getPreviousIsoWeekKey());
  if (!key) return null;
  const when = runAt instanceof Date ? runAt : new Date();
  return WeeklyPatternInsightJob.findOneAndUpdate(
    { userId, weekKey: key },
    {
      $set: { runAt: when, status: 'pending', lastError: null },
      $setOnInsert: { attempts: 0 },
    },
    { upsert: true, new: true },
  );
}

export async function getWeeklyPatternInsight({ userId, weekKey = null, language = 'es' }) {
  const key = normalizeIsoWeekKey(weekKey, getPreviousIsoWeekKey());
  if (!key) {
    throw new Error('invalid_week_key');
  }

  const lang = language === 'en' ? 'en' : 'es';

  let doc = await WeeklyPatternInsight.findOne({ userId, weekKey: key }).lean();
  if (doc?.status === 'ready' && doc.language === lang) return doc;

  if (doc?.status === 'ready' && doc.language !== lang) {
    return generateWeeklyPatternInsight({ userId, weekKey: key, language: lang });
  }

  const updatedAtMs = doc?.updatedAt ? new Date(doc.updatedAt).getTime() : 0;
  if (updatedAtMs && Date.now() - updatedAtMs < GENERATION_COOLDOWN_MS) {
    return (
      doc || {
        userId,
        weekKey: key,
        status: 'pending',
        headline: '',
        body: '',
        insights: [],
        correlations: [],
        sourceSummary: {},
      }
    );
  }

  doc = await generateWeeklyPatternInsight({ userId, weekKey: key, language: lang });
  return doc;
}

export async function processWeeklyPatternInsightJobs({ limit = 5 } = {}) {
  const now = new Date();
  const jobs = await WeeklyPatternInsightJob.find({
    status: 'pending',
    runAt: { $lte: now },
  })
    .sort({ runAt: 1 })
    .limit(Math.max(1, Math.min(limit, 20)));

  let processed = 0;
  for (const job of jobs) {
    const claimed = await WeeklyPatternInsightJob.findOneAndUpdate(
      { _id: job._id, status: 'pending' },
      { $set: { status: 'processing' }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!claimed) continue;
    try {
      await generateWeeklyPatternInsight({ userId: claimed.userId, weekKey: claimed.weekKey });
      await WeeklyPatternInsightJob.updateOne({ _id: claimed._id }, { $set: { status: 'done' } });
      processed += 1;
    } catch (error) {
      await WeeklyPatternInsightJob.updateOne(
        { _id: claimed._id },
        {
          $set: {
            status: claimed.attempts >= 3 ? 'failed' : 'pending',
            lastError: String(error?.message || error).slice(0, 500),
            runAt: new Date(Date.now() + 30_000),
          },
        },
      );
    }
  }
  return { processed };
}

const TICK_MS = Number(process.env.WEEKLY_PATTERN_INSIGHT_TICK_MS) || 120_000;
let workerTimer = null;

export function startWeeklyPatternInsightWorker() {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    void processWeeklyPatternInsightJobs().catch(() => {});
  }, TICK_MS);
}

export function stopWeeklyPatternInsightWorker() {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
}

export { getIsoWeekKey, getPreviousIsoWeekKey };

export default {
  generateWeeklyPatternInsight,
  generateMonthlyPatternInsight,
  getWeeklyPatternInsight,
  getMonthlyPatternInsight,
  scheduleWeeklyPatternInsightJob,
  processWeeklyPatternInsightJobs,
  startWeeklyPatternInsightWorker,
  stopWeeklyPatternInsightWorker,
};
