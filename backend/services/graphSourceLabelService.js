/**
 * Etiquetas de visualización para el grafo de intervenciones (#218).
 * Parafraseo determinístico + LLM opcional con caché.
 */
import crypto from 'crypto';
import cacheService from './cacheService.js';
import openaiService from './openaiService.js';
import {
  pickClusterDisplayLabel,
  summarizeGraphSourceLabel,
} from '../utils/graphSourceLabel.js';

const CACHE_TTL_SEC = 7 * 24 * 60 * 60;
const LLM_BATCH_SIZE = 12;

function isGraphLabelLlmEnabled() {
  return (
    process.env.INTERVENTION_GRAPH_LABEL_LLM_ENABLED === 'true' &&
    Boolean(process.env.OPENAI_API_KEY)
  );
}

function cacheKeyForText(text, language) {
  const hash = crypto.createHash('sha256').update(`${language}:${text}`).digest('hex').slice(0, 24);
  return cacheService.generateKey('graph_source_label_v1', { hash, language });
}

function parseNumberedLabels(raw, expectedCount) {
  const lines = String(raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const map = new Map();
  for (const line of lines) {
    const match = line.match(/^(\d+)\s*[.:)\-–—]\s*(.+)$/);
    if (!match) continue;
    const idx = Number(match[1]);
    const label = String(match[2]).trim().replace(/^["'«]|["'»]$/g, '');
    if (idx >= 1 && idx <= expectedCount && label) {
      map.set(idx, label.slice(0, 80));
    }
  }
  return map;
}

async function llmParaphraseBatch(texts, language = 'es') {
  if (!texts.length || !isGraphLabelLlmEnabled()) {
    return new Map();
  }

  const lang = language === 'en' ? 'en' : 'es';
  const result = new Map();
  const pending = [];

  for (const text of texts) {
    const cached = await cacheService.get(cacheKeyForText(text, lang));
    if (cached?.label) {
      result.set(text, String(cached.label).slice(0, 80));
    } else {
      pending.push(text);
    }
  }

  for (let offset = 0; offset < pending.length; offset += LLM_BATCH_SIZE) {
    const batch = pending.slice(offset, offset + LLM_BATCH_SIZE);
    const numbered = batch.map((t, i) => `${i + 1}. ${t}`).join('\n');
    const system =
      lang === 'en'
        ? 'You write neutral 3–7 word theme labels for a mental wellness app graph. No diagnosis. Avoid explicit wording; use abstract emotional themes. Do not quote the user verbatim. Reply ONLY with numbered lines: N. label'
        : 'Escribes etiquetas neutras de 3–7 palabras para un mapa de bienestar emocional. Sin diagnóstico. Evita lenguaje explícito; usa temas emocionales abstractos. No cites al usuario literalmente. Responde SOLO con líneas numeradas: N. etiqueta';

    try {
      const model = process.env.INTERVENTION_GRAPH_LABEL_MODEL || 'gpt-4o-mini';
      const completion = await openaiService.createChatCompletionResilient({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: numbered },
        ],
        max_completion_tokens: 220,
        temperature: 0.35,
      });
      const raw = completion?.choices?.[0]?.message?.content || '';
      const parsed = parseNumberedLabels(raw, batch.length);
      batch.forEach((text, index) => {
        const label = parsed.get(index + 1) || summarizeGraphSourceLabel(text, lang);
        result.set(text, label);
        void cacheService.set(cacheKeyForText(text, lang), { label }, CACHE_TTL_SEC);
      });
    } catch {
      batch.forEach((text) => {
        result.set(text, summarizeGraphSourceLabel(text, lang));
      });
    }
  }

  return result;
}

/**
 * @param {Array} topicFreeEdges
 * @param {Array} conceptNodes
 * @param {'es'|'en'} language
 */
export async function enrichInterventionGraphLabels({
  topicFreeEdges = [],
  conceptNodes = [],
  language = 'es',
}) {
  const lang = language === 'en' ? 'en' : 'es';

  const uniqueTexts = new Set();
  for (const edge of topicFreeEdges) {
    const t = String(edge?.topicFree || '').trim();
    if (t) uniqueTexts.add(t);
  }
  for (const node of conceptNodes) {
    const label = String(node?.label || '').trim();
    if (label) uniqueTexts.add(label);
    for (const sample of node?.samples || []) {
      const s = String(sample || '').trim();
      if (s) uniqueTexts.add(s);
    }
  }

  const llmMap = await llmParaphraseBatch([...uniqueTexts], lang);

  const resolveLabel = (raw, samples = []) => {
    const text = String(raw || '').trim();
    if (!text && samples.length) {
      return pickClusterDisplayLabel(samples, lang);
    }
    return llmMap.get(text) || summarizeGraphSourceLabel(text, lang);
  };

  const enrichedEdges = (topicFreeEdges || []).map((edge) => {
    const topicFree = String(edge?.topicFree || '').trim();
    return {
      ...edge,
      displayLabel: resolveLabel(topicFree),
    };
  });

  const enrichedNodes = (conceptNodes || []).map((node) => {
    const samples = Array.isArray(node?.samples) ? node.samples : [];
    const rawLabel = String(node?.label || '').trim();
    const displayLabel = resolveLabel(rawLabel, samples);
    return {
      ...node,
      rawLabel: rawLabel || null,
      displayLabel,
      label: displayLabel,
    };
  });

  return {
    topicFreeEdges: enrichedEdges,
    conceptNodes: enrichedNodes,
  };
}

export default {
  enrichInterventionGraphLabels,
  summarizeGraphSourceLabel,
};
