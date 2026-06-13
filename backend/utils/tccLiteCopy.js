/**
 * Copy para marco TCC lite in-chat (#201 MVP): pensamiento → evidencia → alternativa.
 */
import { normalizeApiLanguage } from './apiLanguage.js';

const STEPS = ['capture_thought', 'check_evidence', 'build_alternative', 'wrap_up'];

const COPY = {
  es: {
    steps: {
      capture_thought: { label: 'Pensamiento', short: 'Nombrar la idea' },
      check_evidence: { label: 'Evidencia', short: 'Revisar hechos' },
      build_alternative: { label: 'Alternativa', short: 'Otra lectura posible' },
      wrap_up: { label: 'Cierre', short: 'Qué te llevas' },
    },
    kicker: 'Explorando tu pensamiento',
    promptKicker: 'Marco TCC',
    distortionPrefix: 'Patrón detectado',
    disclaimer:
      'Esto es apoyo basado en TCC, no sustituye terapia profesional. Puedes parar cuando quieras.',
    prompts: {
      capture_thought: `MARCO TCC LITE (paso 1 — pensamiento automático):
- El usuario muestra un patrón de pensamiento rígido o una distorsión cognitiva.
- En 2–3 oraciones: refleja lo que dijo con precisión (sin juzgar) y ayúdale a **nombrar en una frase** el pensamiento que más pesa ahora.
- Si encaja, menciona suavemente el patrón ({distortionLabel}) sin sermón clínico.
- Cierra con **una sola pregunta** concreta: «¿Cuál es la frase exacta que te repites?» o similar.
- No des consejos genéricos ni listas. No propongas salir del chat a wizards.`,
      check_evidence: `MARCO TCC LITE (paso 2 — evidencia):
- Ya nombraron (o insinuaron) un pensamiento difícil. No repitas el paso 1.
- Invita a separar **hechos** de **interpretaciones** con tono conversacional (no interrogatorio).
- Pide **un dato a favor** y **un dato en contra** del pensamiento, o qué diría un amigo imparcial.
- Una sola pregunta de seguimiento. Máximo 3 oraciones antes de la pregunta.`,
      build_alternative: `MARCO TCC LITE (paso 3 — pensamiento alternativo):
- Con lo que compartió, co-construye **una frase alternativa más equilibrada** (realista, no positivismo tóxico).
- Ofrece un borrador breve («¿Te resuena algo como…?») y pide que lo ajuste con sus palabras.
- Una pregunta: qué tan creíble se siente del 0 al 10, o qué parte sí encaja.`,
      wrap_up: `MARCO TCC LITE (paso 4 — cierre):
- Resume en 1–2 frases el pensamiento original, la evidencia y la alternativa que emergió.
- Valida el esfuerzo sin exagerar.
- Ofrece **un** micro-paso opcional para las próximas horas (no obligatorio).
- Pregunta si quiere seguir hablando del tema o cerrar este ejercicio.`,
    },
  },
  en: {
    steps: {
      capture_thought: { label: 'Thought', short: 'Name the idea' },
      check_evidence: { label: 'Evidence', short: 'Check the facts' },
      build_alternative: { label: 'Alternative', short: 'Another reading' },
      wrap_up: { label: 'Wrap-up', short: 'What you take away' },
    },
    kicker: 'Working through this thought',
    promptKicker: 'CBT frame',
    distortionPrefix: 'Pattern detected',
    disclaimer:
      'This is CBT-informed support, not a substitute for professional care. You can stop anytime.',
    prompts: {
      capture_thought: `TCC LITE FRAME (step 1 — automatic thought):
- The user shows rigid thinking or a cognitive distortion pattern.
- In 2–3 sentences: reflect what they said accurately (no judgment) and help them **name in one sentence** the thought that weighs most now.
- If it fits, gently name the pattern ({distortionLabel}) without clinical lecturing.
- End with **one concrete question**: "What's the exact sentence you keep telling yourself?" or similar.
- No generic advice or lists. Do not push them to external wizards.`,
      check_evidence: `TCC LITE FRAME (step 2 — evidence):
- They already named (or hinted at) a difficult thought. Do not repeat step 1.
- Invite them to separate **facts** from **interpretations** conversationally (not an interrogation).
- Ask for **one piece of evidence for** and **one against** the thought, or what a fair friend would say.
- One follow-up question. Max 3 sentences before the question.`,
      build_alternative: `TCC LITE FRAME (step 3 — alternative thought):
- From what they shared, co-build **one more balanced sentence** (realistic, not toxic positivity).
- Offer a short draft ("Does something like… resonate?") and invite them to adjust it in their words.
- One question: how believable it feels 0–10, or which part fits.`,
      wrap_up: `TCC LITE FRAME (step 4 — wrap-up):
- Summarize in 1–2 sentences the original thought, evidence, and alternative that emerged.
- Acknowledge the effort without overdoing it.
- Offer **one** optional micro-step for the next few hours (not mandatory).
- Ask if they want to keep talking about the topic or close this exercise.`,
    },
  },
};

export function tccLiteCopy(language = 'es') {
  const lang = normalizeApiLanguage(language);
  return COPY[lang] || COPY.es;
}

export function tccLiteStepOrder() {
  return [...STEPS];
}

export function tccLiteStepIndex(step) {
  const idx = STEPS.indexOf(String(step || '').trim());
  return idx >= 0 ? idx : 0;
}
