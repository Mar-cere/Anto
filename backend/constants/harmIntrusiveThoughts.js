/**
 * Detección y copy para angustia por pensamientos intrusivos de daño.
 * Distinto del protocolo de crisis suicida: la persona suele rechazar la intención
 * y necesita validación + psicoeducación + derivación prudente, no alarma de riesgo alto.
 */

const HARM_THOUGHT_PATTERN =
  /(?:pensamientos?\s+intrusivos?|im[aá]genes?\s+mentales?|me\s+da\s+miedo\s+pensar|temo\s+pensar|miedo\s+a\s+pensar)/i;

const HARM_TARGET_PATTERN =
  /(?:hacer(le)?\s+da[nñ]o|lastimar|herir).{0,48}(?:familia|seres?\s+queridos?|gente\s+que\s+amo|lo[s]?\s+que\s+(?:m[aá]s\s+)?quiero|mi\s+(?:mam[aá]|pap[aá]|pareja|hij))/i;

const LOSS_OF_CONTROL_PATTERN =
  /(?:volv(?:er|erme)\s+loc[oa]|perder(?:é|e)?\s+el\s+control|dej(?:ar|e)\s+de\s+importarme|alg[uú]n\s+d[ií]a\s+(?:har[eé]|act[uú]e|deje\s+de))/i;

const EGO_DYSTONIC_PATTERN =
  /(?:no\s+quiero\s+(?:hacer(le)?\s+da[nñ]o|lastimar|herir)|jam[aá]s\s+tuve|lo\s+[uú]ltimo\s+que\s+quiero)/i;

const SHOULD_START_PROTOCOL_PATTERN =
  /(?:pensamientos?\s+intrusivos?|hacer(le)?\s+da[nñ]o|volv(?:er|erme)\s+loc[oa]|perder(?:é|e)?\s+el\s+control|dej(?:ar|e)\s+de\s+importarme|toc|obsesiv)/i;

/** Ideación suicida explícita: no mezclar con este sub-protocolo. */
const EXPLICIT_SUICIDE_IDEATION_PATTERN =
  /(?:suicid|quiero\s+morir|acabar\s+con\s+mi\s+vida|me\s+voy\s+a\s+matar|no\s+quiero\s+seguir\s+viviendo|terminar\s+con\s+todo)/i;

/** Intención declarada de daño a otros (sin rechazo): no aplicar copy tranquilizador. */
const EXPLICIT_HARM_INTENT_PATTERN =
  /(?<!no\s)(?:quiero|voy)\s+a\s+(?:hacer(le)?\s+da[nñ]o|lastimar|matar)|(?<!no\s)tengo\s+ganas\s+de\s+(?:hacer(le)?\s+da[nñ]o|lastimar)/i;

export const HARM_INTRUSIVE_DISTRESS_THEME = 'harm_intrusive_thoughts';

/**
 * @param {unknown} value
 * @returns {number}
 */
export function clampEmotionalIntensity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(10, Math.max(0, Math.round(parsed)));
}

/**
 * @param {string} content
 * @returns {boolean}
 */
export function hasExplicitSuicideIdeation(content) {
  return Boolean(content && typeof content === 'string' && EXPLICIT_SUICIDE_IDEATION_PATTERN.test(content));
}

/**
 * @param {string} content
 * @returns {{ detected: boolean, level: 'moderate'|'elevated'|null, rejectedIntent: boolean }}
 */
export function detectHarmIntrusiveThoughtDistress(content) {
  if (!content || typeof content !== 'string') {
    return { detected: false, level: null, rejectedIntent: false };
  }

  if (hasExplicitSuicideIdeation(content) || EXPLICIT_HARM_INTENT_PATTERN.test(content)) {
    return { detected: false, level: null, rejectedIntent: false };
  }

  const text = content.toLowerCase();
  const hasHarmThought =
    HARM_THOUGHT_PATTERN.test(text) ||
    (HARM_TARGET_PATTERN.test(text) && /(?:miedo|ansiedad|intrusiv)/i.test(text));
  const hasLossOfControlFear = LOSS_OF_CONTROL_PATTERN.test(text);

  if (!hasHarmThought && !hasLossOfControlFear) {
    return { detected: false, level: null, rejectedIntent: false };
  }

  const rejectedIntent = EGO_DYSTONIC_PATTERN.test(text);
  return {
    detected: true,
    level: rejectedIntent ? 'moderate' : 'elevated',
    rejectedIntent
  };
}

/**
 * Resuelve si el hilo debe mantener el sub-protocolo de angustia (turno actual o persistido).
 * @param {Object} params
 * @param {string} [params.content]
 * @param {string|null} [params.persistedDistressTheme]
 * @param {string} [params.riskLevel='LOW']
 * @param {{ rejectedIntent?: boolean, level?: string }|null} [params.persistedDistress]
 * @returns {{ active: boolean, detectedNow: boolean, distress: { theme: string, level: string, rejectedIntent: boolean }|null }}
 */
export function resolveHarmIntrusiveDistressContext({
  content = '',
  persistedDistressTheme = null,
  riskLevel = 'LOW',
  persistedDistress = null
} = {}) {
  const risk = String(riskLevel || '').toUpperCase();
  if (risk === 'MEDIUM' || risk === 'HIGH') {
    return { active: false, detectedNow: false, distress: null };
  }

  const current = detectHarmIntrusiveThoughtDistress(content);
  const themeActive =
    current.detected || persistedDistressTheme === HARM_INTRUSIVE_DISTRESS_THEME;

  if (!themeActive) {
    return { active: false, detectedNow: current.detected, distress: null };
  }

  if (current.detected) {
    return {
      active: true,
      detectedNow: true,
      distress: {
        theme: HARM_INTRUSIVE_DISTRESS_THEME,
        level: current.level || 'moderate',
        rejectedIntent: current.rejectedIntent
      }
    };
  }

  return {
    active: true,
    detectedNow: false,
    distress: {
      theme: HARM_INTRUSIVE_DISTRESS_THEME,
      level: persistedDistress?.level || 'moderate',
      rejectedIntent: persistedDistress?.rejectedIntent !== false
    }
  };
}

/**
 * @param {string} content
 * @returns {boolean}
 */
export function shouldStartHarmIntrusiveThoughtsProtocol(content) {
  if (!content || typeof content !== 'string') return false;
  if (hasExplicitSuicideIdeation(content) || EXPLICIT_HARM_INTENT_PATTERN.test(content)) {
    return false;
  }
  return SHOULD_START_PROTOCOL_PATTERN.test(content);
}

/**
 * @param {string} [language='es']
 * @param {{ rejectedIntent?: boolean, protocolStep?: string|null }} [opts]
 * @returns {string}
 */
export function buildHarmIntrusiveThoughtsDistressSnippet(language = 'es', opts = {}) {
  const rejectedIntent = opts.rejectedIntent !== false;
  const protocolStep = opts.protocolStep || null;

  if (language === 'en') {
    let snippet = `DISTRESS THEME (harm intrusive thoughts — NOT suicide crisis):
- The user fears horrible intrusive thoughts about harming loved ones; distinguish thought vs intent.
- ${rejectedIntent ? 'They explicitly reject harming anyone — treat as ego-dystonic anxiety/OCD-spectrum, not hidden intent.' : 'Explore gently; if there is real intent or a plan, follow crisis protocol.'}
- Do NOT imply they are dangerous; validate how horrifying the thoughts feel.
- Starting an SSRI or benzodiazepine can temporarily worsen anxiety or intrusive thoughts for a few days — mention contacting their psychiatrist if it worsens.
- Finish safety conditionals completely; never end on "especially if..." or similar dangling clauses.`;
    if (protocolStep) snippet += `\n- Active protocol step focus: ${protocolStep}`;
    return snippet;
  }

  let snippet = `TEMA DE ANGUSTIA (pensamientos intrusivos de daño — NO es crisis suicida):
- La persona teme pensamientos horribles/intrusivos sobre hacer daño a seres queridos; diferencia pensamiento vs intención.
- ${rejectedIntent ? 'Rechaza explícitamente hacer daño — tratar como ansiedad/TOC-spectrum ego-distónico, no como intención oculta.' : 'Explora con cuidado; si hay intención real o plan, activa protocolo de crisis.'}
- NO impliques que es peligrosa; valida que le horrorizan esos pensamientos.
- Al iniciar sertralina u otro fármaco puede empeorar ansiedad o intrusividad unos días — menciona avisar al psiquiatra si empeora.
- Completa condicionales de seguridad; nunca termines en "sobre todo si..." ni frases a medias.`;
  if (protocolStep) snippet += `\n- Foco del paso activo del protocolo: ${protocolStep}`;
  return snippet;
}
