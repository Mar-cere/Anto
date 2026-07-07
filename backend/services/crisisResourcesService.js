/**
 * Payload estructurado de recursos de crisis para el cliente (panel en chat).
 */
import {
  resolveEmergencyInfoFromPreferences,
  resolveIsoCountryFromPreferences,
} from '../constants/emergencyNumbers.js';
import { normalizeApiLanguage } from '../utils/apiLanguage.js';
import { KNOWN_ISO_COUNTRIES } from '../utils/emergencyRegionResolver.js';
import { buildCrisisProtocolTransparency } from '../constants/crisisProtocolCopy.js';

const PANEL_RISK_LEVELS = new Set(['WARNING', 'MEDIUM', 'HIGH']);
const MAX_RESOURCE_ITEMS = 8;
const MAX_RESOURCE_TEXT_LEN = 240;
const MIN_DIAL_LEN = 3;
const MAX_DIAL_LEN = 15;

export function sanitizeDialableNumber(raw) {
  if (raw == null) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < MIN_DIAL_LEN || digits.length > MAX_DIAL_LEN) return null;
  return digits;
}

export function parseCrisisResourcesCountryQuery(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const upper = String(raw).trim().toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  if (!KNOWN_ISO_COUNTRIES.has(upper)) return null;
  return upper;
}

export function shouldExposeCrisisResourcesPanel({
  riskLevel,
  hardStop = false,
  isCrisis = false,
  hasBatterySignal = false,
  crisisProtocolActive = false,
} = {}) {
  if (hardStop === true) return true;
  const level = String(riskLevel || 'LOW').toUpperCase();
  if (level === 'WARNING') {
    return hasBatterySignal === true || crisisProtocolActive === true;
  }
  if (PANEL_RISK_LEVELS.has(level)) return true;
  return isCrisis === true && PANEL_RISK_LEVELS.has(level);
}

/**
 * Extrae un número marcable (solo dígitos) del texto mostrado al usuario.
 * @param {string|null|undefined} raw
 * @returns {string|null}
 */
export function extractDialableNumber(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const text = String(raw).trim().slice(0, MAX_RESOURCE_TEXT_LEN);
  const match = text.match(/\+?\d[\d\s\-().]{3,}\d|\b\d{3,8}\b/);
  if (!match) return null;
  return sanitizeDialableNumber(match[0]);
}

function clipResourceText(value, maxLen = MAX_RESOURCE_TEXT_LEN) {
  return String(value || '').trim().slice(0, maxLen);
}

/**
 * Resuelve número marcable, incluyendo códigos cortos con asterisco (p. ej. *4141 en Chile).
 */
export function resolveCrisisResourceDial(value, dialOverride = null) {
  const tryStarCode = (raw) => {
    const trimmed = String(raw || '').trim();
    if (!trimmed.startsWith('*')) return null;
    const code = trimmed.slice(1).replace(/\D/g, '');
    if (code.length < MIN_DIAL_LEN || code.length > MAX_DIAL_LEN) return null;
    return `*${code}`;
  };

  if (dialOverride != null && String(dialOverride).trim()) {
    return tryStarCode(dialOverride) || sanitizeDialableNumber(dialOverride);
  }

  const starFromValue = tryStarCode(value);
  if (starFromValue) return starFromValue;

  return sanitizeDialableNumber(extractDialableNumber(value));
}

function buildResourceItem(id, label, value, dialOverride = null) {
  if (value == null || String(value).trim() === '') return null;
  const safeLabel = clipResourceText(label, 120);
  const safeValue = clipResourceText(value);
  const dial = resolveCrisisResourceDial(safeValue, dialOverride);
  return {
    id: clipResourceText(id, 40),
    label: safeLabel,
    value: safeValue,
    ...(dial ? { dial } : {}),
  };
}

/**
 * @param {{
 *   preferences?: object|null,
 *   phone?: string|null,
 *   language?: string,
 *   riskLevel?: string|null,
 *   hardStop?: boolean,
 * }} [opts]
 */
export function buildCrisisResourcesClientPayload({
  preferences = null,
  phone = null,
  language = 'es',
  riskLevel = null,
  hardStop = false,
  showContactAlertNotice = false,
} = {}) {
  const lang = normalizeApiLanguage(language);
  const en = lang === 'en';
  const emergencyInfo = resolveEmergencyInfoFromPreferences(preferences, phone);
  const countryIso =
    resolveIsoCountryFromPreferences(preferences, phone) || emergencyInfo?.countryCode || null;

  const countryLabel = emergencyInfo
    ? en && emergencyInfo.countryEn
      ? emergencyInfo.countryEn
      : emergencyInfo.country
    : null;

  const items = [
    buildResourceItem('emergency', en ? 'Emergency' : 'Emergencias', emergencyInfo?.emergency),
    buildResourceItem(
      'suicide_prevention',
      countryIso === 'CL'
        ? en
          ? 'Suicide prevention (24 h)'
          : 'Prevención del suicidio (24 h)'
        : en
          ? 'Crisis / suicide prevention'
          : 'Línea de crisis / prevención',
      emergencyInfo?.suicidePrevention,
      emergencyInfo?.suicidePreventionDial,
    ),
    buildResourceItem(
      'crisis_text',
      en ? 'Crisis text line' : 'Línea de texto de crisis',
      emergencyInfo?.crisisText,
    ),
    emergencyInfo?.medical && emergencyInfo.medical !== emergencyInfo.emergency
      ? buildResourceItem(
          'medical',
          en ? 'Medical emergency' : 'Urgencias médicas',
          emergencyInfo.medical,
        )
      : null,
  ].filter(Boolean);

  const safeItems = items.slice(0, MAX_RESOURCE_ITEMS);

  if (safeItems.length === 0) {
    safeItems.push(
      buildResourceItem(
        'emergency',
        en ? 'Emergency' : 'Emergencias',
        en
          ? '112 (EU) / 911 (Americas) — use your local emergency number'
          : '112 en España; 911 en varios países de América — usa el número oficial de tu país',
      ),
      buildResourceItem(
        'suicide_prevention',
        en ? 'Crisis line' : 'Línea de crisis',
        en
          ? 'Look up your local crisis or mental health line'
          : '024 en España; busca la línea pública de crisis de tu país',
      ),
    );
  }

  return {
    countryIso: countryIso ? String(countryIso).slice(0, 2).toUpperCase() : null,
    countryLabel: countryLabel ? clipResourceText(countryLabel, 80) : null,
    riskLevel: riskLevel ? String(riskLevel).toUpperCase().slice(0, 16) : null,
    hardStop: hardStop === true,
    items: safeItems,
    disclaimer: en
      ? 'Anto is not emergency services. If there is immediate danger, call emergency numbers now.'
      : 'Anto no es un servicio de emergencias. Si hay peligro inmediato, llama ahora a los números de emergencia.',
    appLimits: en
      ? 'Anto cannot place calls or send alerts on your behalf unless you configured emergency contacts and alerts are activated.'
      : 'Anto no puede llamar ni enviar avisos por ti salvo que hayas configurado contactos de emergencia y se activen las alertas.',
    transparency: buildCrisisProtocolTransparency({
      language: lang,
      showContactAlertNotice: showContactAlertNotice === true,
    }),
  };
}

/**
 * Devuelve el payload o null si no aplica mostrar el panel.
 */
export function crisisResourcesForTurn({
  riskLevel,
  hardStop = false,
  isCrisis = false,
  hasBatterySignal = false,
  crisisProtocolActive = false,
  preferences = null,
  phone = null,
  language = 'es',
  showContactAlertNotice = false,
} = {}) {
  if (
    !shouldExposeCrisisResourcesPanel({
      riskLevel,
      hardStop,
      isCrisis,
      hasBatterySignal,
      crisisProtocolActive,
    })
  ) {
    return null;
  }
  return buildCrisisResourcesClientPayload({
    preferences,
    phone,
    language,
    riskLevel,
    hardStop,
    showContactAlertNotice,
  });
}

export default {
  shouldExposeCrisisResourcesPanel,
  extractDialableNumber,
  sanitizeDialableNumber,
  resolveCrisisResourceDial,
  parseCrisisResourcesCountryQuery,
  buildCrisisResourcesClientPayload,
  crisisResourcesForTurn,
};
