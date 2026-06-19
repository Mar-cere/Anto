/**
 * Utilidades para el panel de recursos de crisis en chat.
 */

const PANEL_RISK_LEVELS = new Set(['WARNING', 'MEDIUM', 'HIGH']);
const MAX_ITEMS = 8;
const MAX_LABEL_LEN = 120;
const MAX_VALUE_LEN = 240;
const MAX_DISCLAIMER_LEN = 500;
const MIN_DIAL_LEN = 3;
const MAX_DIAL_LEN = 15;

export function sanitizeDial(dial) {
  const digits = String(dial || '').replace(/\D/g, '');
  if (digits.length < MIN_DIAL_LEN || digits.length > MAX_DIAL_LEN) return null;
  return digits;
}

function clipText(value, maxLen) {
  return String(value || '').trim().slice(0, maxLen);
}

export function normalizeCrisisResourcesPayload(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((item) => item && item.label && item.value)
        .slice(0, MAX_ITEMS)
        .map((item) => {
          const dial = item.dial ? sanitizeDial(item.dial) : null;
          return {
            id: clipText(item.id || item.label, 40),
            label: clipText(item.label, MAX_LABEL_LEN),
            value: clipText(item.value, MAX_VALUE_LEN),
            ...(dial ? { dial } : {}),
          };
        })
    : [];
  if (items.length === 0) return null;
  return {
    countryIso: raw.countryIso ? clipText(raw.countryIso, 2).toUpperCase() : null,
    countryLabel: raw.countryLabel ? clipText(raw.countryLabel, 80) : null,
    riskLevel: raw.riskLevel ? clipText(raw.riskLevel, 16).toUpperCase() : null,
    hardStop: raw.hardStop === true,
    items,
    disclaimer: raw.disclaimer ? clipText(raw.disclaimer, MAX_DISCLAIMER_LEN) : '',
    appLimits: raw.appLimits ? clipText(raw.appLimits, MAX_DISCLAIMER_LEN) : '',
  };
}

export function shouldShowCrisisResourcesPanel({ riskLevel, hardStop = false } = {}) {
  if (hardStop === true) return true;
  const level = String(riskLevel || 'LOW').toUpperCase();
  return PANEL_RISK_LEVELS.has(level);
}

/**
 * Busca el contexto de crisis más reciente en mensajes cargados.
 * @param {Array} messages
 */
export function findLatestCrisisContextFromMessages(messages) {
  if (!Array.isArray(messages)) return null;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role !== 'assistant') continue;
    const crisis = message?.metadata?.crisis;
    if (!crisis) continue;
    const riskLevel = crisis.riskLevel ? String(crisis.riskLevel).toUpperCase() : null;
    const hardStop = crisis.hardStop === true;
    if (shouldShowCrisisResourcesPanel({ riskLevel, hardStop })) {
      return { riskLevel, hardStop };
    }
  }
  return null;
}

export function buildTelUri(dial) {
  const digits = sanitizeDial(dial);
  return digits ? `tel:${digits}` : null;
}
