#!/usr/bin/env node
/**
 * Smoke #85: valida los 7 módulos listos para prueba en dispositivo.
 * Uso: node scripts/smoke-psychoeducation-device.mjs
 */
import {
  getAvailableTopics,
  getPsychoeducationModule,
} from '../constants/psychoeducation.js';
import {
  PSYCHOEDUCATION_CONTENT_KEY_SET,
  PSYCHOEDUCATION_META_KEY_SET,
  psychoeducationBodyKeys,
} from '../constants/psychoeducationContentKeys.js';
import emotionalAnalyzer from '../services/emotionalAnalyzer.js';
import actionSuggestionService from '../services/actionSuggestionService.js';
import { CHAT_PSYCHOEDUCATION_SMOKE_CASES } from '../tests/fixtures/chatPsychoeducationSmokeMessages.js';

const PRIORITY = new Set(['sleep', 'stress', 'emotionRegulation']);
const LANGUAGES = ['es', 'en'];

const SECTION_ORDER = [
  'symptoms', 'signs', 'causes', 'triggers', 'whatHelps', 'treatment',
  'management', 'hygiene', 'skills', 'techniques', 'benefits', 'types',
  'whenWorry', 'whenToSeekHelp',
];

function sectionHasContent(value) {
  if (value == null) return false;
  if (typeof value === 'string') return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/** Réplica mínima de buildModuleSections para smoke. */
function buildSections(mod) {
  const skip = new Set([...PSYCHOEDUCATION_META_KEY_SET, 'whatIs']);
  const entries = new Map(
    Object.entries(mod).filter(([k]) => !skip.has(k)),
  );
  const ordered = [];
  let expandedAssigned = false;

  for (const key of SECTION_ORDER) {
    if (!entries.has(key)) continue;
    const value = entries.get(key);
    if (!sectionHasContent(value)) continue;
    const isHighlight = key === 'whenToSeekHelp' || key === 'whenWorry';
    const defaultExpanded = !expandedAssigned && !isHighlight;
    if (defaultExpanded) expandedAssigned = true;
    ordered.push({ key, isHighlight, defaultExpanded });
    entries.delete(key);
  }

  const worryIdx = ordered.findIndex((s) => s.key === 'whenWorry');
  const seekIdx = ordered.findIndex((s) => s.key === 'whenToSeekHelp');
  if (worryIdx !== -1 && seekIdx !== -1) {
    const without = ordered.filter((s) => s.key !== 'whenWorry' && s.key !== 'whenToSeekHelp');
    const insertAt = Math.min(worryIdx, seekIdx);
    without.splice(insertAt, 0, {
      key: 'whenToSeekHelp',
      isHighlight: true,
      defaultExpanded: false,
      supportGroup: true,
    });
    return without;
  }

  return ordered;
}

function checkModule(topic, language) {
  const mod = getPsychoeducationModule(topic, language);
  const errors = [];
  const warnings = [];

  if (!mod) {
    errors.push('módulo null');
    return { ok: false, errors, warnings, sections: [] };
  }

  if (!mod.whatIs?.trim()) errors.push('falta whatIs');
  if (!mod.title?.trim()) errors.push('falta title (hero)');
  if (!mod.mechanismLine?.trim()) errors.push('falta mechanismLine');
  if (!mod.disclaimer?.trim()) errors.push('falta disclaimer');
  if (!mod.whenToSeekHelp?.trim()) errors.push('falta whenToSeekHelp');

  psychoeducationBodyKeys(mod).forEach((key) => {
    if (!PSYCHOEDUCATION_CONTENT_KEY_SET.has(key)) {
      errors.push(`clave de cuerpo desconocida: ${key}`);
    }
  });

  [...PSYCHOEDUCATION_META_KEY_SET].forEach((meta) => {
    if (meta === 'tags' || meta === 'summary' || meta === 'estimatedMinutes') return;
    if (meta === 'cardVariant' || meta === 'previewTitle' || meta === 'previewSummary') return;
    if (mod[meta] == null || mod[meta] === '') {
      warnings.push(`metadato vacío: ${meta}`);
    }
  });

  if (!Array.isArray(mod.sources) || mod.sources.length === 0) {
    errors.push('sin fuentes');
  } else {
    mod.sources.forEach((s, i) => {
      if (!/^https:\/\//i.test(String(s?.url || ''))) {
        errors.push(`fuente[${i}] sin https`);
      }
    });
  }

  if (topic === 'sleep') {
    if (!Array.isArray(mod.whenWorry) || mod.whenWorry.length < 2) {
      errors.push('sleep: whenWorry debe tener ≥2 ítems');
    }
  }

  const sections = buildSections(mod);
  if (sections.length === 0) errors.push('sin secciones renderizables');

  const expanded = sections.filter((s) => s.defaultExpanded);
  if (expanded.length !== 1) {
    errors.push(`esperada 1 sección abierta por defecto, hay ${expanded.length}`);
  }

  if (topic === 'sleep') {
    const merged = sections.find((s) => s.supportGroup);
    if (!merged) errors.push('sleep: falta tarjeta fusionada whenWorry+whenToSeekHelp');
  }

  if (PRIORITY.has(topic)) {
    const firstKey = sections.find((s) => !s.isHighlight)?.key;
    const expectedFirst = {
      sleep: 'hygiene',
      stress: 'symptoms',
      emotionRegulation: 'skills',
    }[topic];
    if (firstKey !== expectedFirst) {
      errors.push(`primera sección esperada ${expectedFirst}, got ${firstKey}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings, sections };
}

const topics = getAvailableTopics('es');
let failed = 0;

console.log('\n=== Smoke psicoeducación (#85) — 7 módulos ===\n');

for (const language of LANGUAGES) {
  console.log(`--- ${language.toUpperCase()} ---`);
  for (const topic of topics) {
    const { ok, errors, warnings, sections } = checkModule(topic, language);
    const tag = PRIORITY.has(topic) ? ' ★' : '';
    const status = ok ? 'OK' : 'FAIL';
    const sectionSummary = sections
      .map((s) => (s.supportGroup ? 'whenToSeekHelp(merged)' : s.key))
      .join(', ');
    console.log(`  [${status}] ${topic}${tag} → ${sectionSummary}`);
    if (errors.length) {
      errors.forEach((e) => console.log(`         ✗ ${e}`));
      failed += 1;
    }
    if (warnings.length && process.env.SMOKE_VERBOSE) {
      warnings.forEach((w) => console.log(`         ⚠ ${w}`));
    }
  }
  console.log('');
}

console.log('Prioridad manual en dispositivo: sleep, stress, emotionRegulation');
console.log('Ruta: Ajustes → Técnicas terapéuticas → Módulos de psicoeducación\n');

console.log('--- Chat: análisis + sugerencias (mensajes canónicos) ---');
let chatFailed = 0;
for (const {
  id,
  message,
  expectedPsycho,
  allowedEmotions,
  minIntensity,
  minSuggestions,
} of CHAT_PSYCHOEDUCATION_SMOKE_CASES) {
  const analysis = await emotionalAnalyzer.analyzeEmotion(message);
  const suggestions = actionSuggestionService.generateSuggestions(analysis, {}, {
    userContent: message,
  });
  const missingPsycho = expectedPsycho.filter((p) => !suggestions.includes(p));
  const emotionOk = allowedEmotions.includes(analysis.mainEmotion);
  const intensityOk = analysis.intensity >= minIntensity;
  const countOk = suggestions.length >= minSuggestions;
  const ok =
    missingPsycho.length === 0 && emotionOk && intensityOk && countOk;
  const status = ok ? 'OK' : 'FAIL';
  console.log(
    `  [${status}] ${id} → ${analysis.mainEmotion} ${analysis.intensity} | ${suggestions.join(', ')}`,
  );
  if (!ok) {
    if (missingPsycho.length) {
      console.log(`         ✗ falta psicoed: ${missingPsycho.join(', ')}`);
    }
    if (!emotionOk) {
      console.log(
        `         ✗ emoción ${analysis.mainEmotion} no está en ${allowedEmotions.join(', ')}`,
      );
    }
    if (!intensityOk) {
      console.log(`         ✗ intensidad ${analysis.intensity} < ${minIntensity}`);
    }
    if (!countOk) {
      console.log(`         ✗ sugerencias vacías o insuficientes`);
    }
    chatFailed += 1;
  }
}
console.log('');

if (failed > 0 || chatFailed > 0) {
  const total = failed + chatFailed;
  console.error(`❌ ${total} comprobación(es) fallida(s)\n`);
  process.exit(1);
}

console.log('✅ Smoke de datos OK — listo para prueba en dispositivo\n');
process.exit(0);
