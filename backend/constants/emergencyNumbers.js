/**
 * Números de emergencia y líneas de ayuda (código telefónico internacional).
 *
 * Contexto del producto: la app solo está en **español** y, por ahora, la
 * audiencia principal es **Latinoamérica y España**. Los textos de respaldo
 * y los ejemplos están pensados para ese ámbito (no asumimos EE. UU. como defecto).
 *
 * @author AntoApp Team
 */
import {
  inferIsoCountryFromDeviceSignals
} from '../utils/emergencyRegionResolver.js';

/**
 * Mapeo de códigos de país a información de emergencia
 * Código de país: código telefónico internacional (sin el +)
 */
export const EMERGENCY_NUMBERS_BY_COUNTRY = {
  // Chile
  '56': {
    country: 'Chile',
    countryCode: 'CL',
    emergency: '133', // Carabineros
    medical: '131', // SAMU (Servicio de Atención Médica de Urgencia)
    fire: '132', // Bomberos
    suicidePrevention: '*4141', // Línea Prevención del Suicidio — MINSAL, 24 h
    suicidePreventionDial: '*4141',
    crisisText: null,
    notes:
      'En Chile, emergencias: 133 (Carabineros). Urgencias médicas: 131 (SAMU). Prevención del suicidio (24 h): *4141 desde móvil o fijo. Salud Responde: 600 360 7777.',
  },
  
  // Argentina
  '54': {
    country: 'Argentina',
    countryCode: 'AR',
    emergency: '911', // Emergencias generales
    medical: '107', // Emergencias médicas
    fire: '100', // Bomberos
    suicidePrevention: '135', // Línea de Prevención del Suicidio
    crisisText: null,
    notes: 'En Argentina, el número único de emergencias es 911. Para prevención del suicidio: 135.'
  },
  
  // Estados Unidos
  '1': {
    country: 'Estados Unidos',
    countryCode: 'US',
    emergency: '911',
    medical: '911',
    fire: '911',
    suicidePrevention: '988', // Línea Nacional de Prevención del Suicidio
    crisisText: '741741', // Crisis Text Line
    notes: 'En Estados Unidos, el número único de emergencias es 911. Para prevención del suicidio: 988 o texto a 741741.'
  },
  
  // México
  '52': {
    country: 'México',
    countryCode: 'MX',
    emergency: '911', // Emergencias generales
    medical: '911',
    fire: '911',
    suicidePrevention: '800 911 2000', // Línea de la Vida
    crisisText: null,
    notes: 'En México, el número único de emergencias es 911. Para prevención del suicidio: 800 911 2000.'
  },
  
  // Colombia
  '57': {
    country: 'Colombia',
    countryCode: 'CO',
    emergency: '123', // Emergencias generales
    medical: '125', // Emergencias médicas
    fire: '119', // Bomberos
    suicidePrevention: '106', // Línea de Prevención del Suicidio
    crisisText: null,
    notes: 'En Colombia, el número de emergencias es 123. Para prevención del suicidio: 106.'
  },
  
  // Perú
  '51': {
    country: 'Perú',
    countryCode: 'PE',
    emergency: '911', // Emergencias generales
    medical: '116', // SAMU
    fire: '116', // Bomberos
    suicidePrevention: '0800 10828', // Línea de Prevención del Suicidio
    crisisText: null,
    notes: 'En Perú, el número de emergencias es 911. Para prevención del suicidio: 0800 10828.'
  },
  
  // España
  '34': {
    country: 'España',
    countryCode: 'ES',
    emergency: '112', // Emergencias generales
    medical: '112',
    fire: '112',
    suicidePrevention: '024', // Línea de Prevención del Suicidio
    crisisText: null,
    notes: 'En España, el número único de emergencias es 112. Para prevención del suicidio: 024.'
  },
  
  // Brasil
  '55': {
    country: 'Brasil',
    countryCode: 'BR',
    emergency: '190', // Policía
    medical: '192', // SAMU
    fire: '193', // Bomberos
    suicidePrevention: '188', // Centro de Valorização da Vida (CVV)
    crisisText: null,
    notes: 'En Brasil, emergencias: 190 (policía), 192 (médico), 193 (bomberos). Para prevención del suicidio: 188.'
  },
  
  // Ecuador
  '593': {
    country: 'Ecuador',
    countryCode: 'EC',
    emergency: '911', // Emergencias generales
    medical: '911',
    fire: '102', // Bomberos
    suicidePrevention: '171', // Línea de Prevención del Suicidio
    crisisText: null,
    notes: 'En Ecuador, el número de emergencias es 911. Para prevención del suicidio: 171.'
  },
  
  // Uruguay
  '598': {
    country: 'Uruguay',
    countryCode: 'UY',
    emergency: '911', // Emergencias generales
    medical: '105', // Emergencias médicas
    fire: '104', // Bomberos
    suicidePrevention: '0800 0767', // Línea de Prevención del Suicidio
    crisisText: null,
    notes: 'En Uruguay, el número de emergencias es 911. Para prevención del suicidio: 0800 0767.'
  },
  
  // Paraguay
  '595': {
    country: 'Paraguay',
    countryCode: 'PY',
    emergency: '911', // Emergencias generales
    medical: '141', // Emergencias médicas
    fire: '132', // Bomberos
    suicidePrevention: null, // No hay línea nacional específica
    crisisText: null,
    notes: 'En Paraguay, el número de emergencias es 911.'
  },
  
  // Bolivia
  '591': {
    country: 'Bolivia',
    countryCode: 'BO',
    emergency: '110', // Policía
    medical: '118', // Emergencias médicas
    fire: '119', // Bomberos
    suicidePrevention: null,
    crisisText: null,
    notes: 'En Bolivia, emergencias: 110 (policía), 118 (médico), 119 (bomberos).'
  },
  
  // Venezuela
  '58': {
    country: 'Venezuela',
    countryCode: 'VE',
    emergency: '171', // Emergencias generales
    medical: '171',
    fire: '171',
    suicidePrevention: null,
    crisisText: null,
    notes: 'En Venezuela, el número de emergencias es 171.'
  },

  // Reino Unido
  '44': {
    country: 'Reino Unido',
    countryEn: 'United Kingdom',
    countryCode: 'GB',
    emergency: '999',
    medical: '999',
    fire: '999',
    suicidePrevention: '116 123',
    crisisText: '85258',
    notes: 'En el Reino Unido: emergencias 999 o 112; Samaritans 116 123; Shout texto 85258.'
  },

  // Australia
  '61': {
    country: 'Australia',
    countryEn: 'Australia',
    countryCode: 'AU',
    emergency: '000',
    medical: '000',
    fire: '000',
    suicidePrevention: '13 11 14',
    crisisText: null,
    notes: 'En Australia: emergencias 000; Lifeline 13 11 14.'
  },

  // Irlanda
  '353': {
    country: 'Irlanda',
    countryEn: 'Ireland',
    countryCode: 'IE',
    emergency: '112',
    medical: '112',
    fire: '112',
    suicidePrevention: '116 123',
    crisisText: null,
    notes: 'En Irlanda: emergencias 112; Samaritans 116 123.'
  },

  // Guatemala
  '502': {
    country: 'Guatemala',
    countryCode: 'GT',
    emergency: '110',
    medical: '128',
    fire: '122',
    suicidePrevention: '1502',
    crisisText: null,
    notes: 'En Guatemala: policía 110, bomberos 122, emergencias médicas 128; línea 1502.'
  },

  // Costa Rica
  '506': {
    country: 'Costa Rica',
    countryCode: 'CR',
    emergency: '911',
    medical: '911',
    fire: '118',
    suicidePrevention: '800-747-1234',
    crisisText: null,
    notes: 'En Costa Rica: emergencias 911; apoyo emocional 800-747-1234.'
  },

  // Panamá
  '507': {
    country: 'Panamá',
    countryCode: 'PA',
    emergency: '911',
    medical: '103',
    fire: '103',
    suicidePrevention: null,
    crisisText: null,
    notes: 'En Panamá: emergencias 911; urgencias médicas 103.'
  },

  // Nicaragua
  '505': {
    country: 'Nicaragua',
    countryCode: 'NI',
    emergency: '118',
    medical: '128',
    fire: '115',
    suicidePrevention: null,
    crisisText: null,
    notes: 'En Nicaragua: emergencias 118.'
  },

  // Honduras
  '504': {
    country: 'Honduras',
    countryCode: 'HN',
    emergency: '911',
    medical: '195',
    fire: '198',
    suicidePrevention: null,
    crisisText: null,
    notes: 'En Honduras: emergencias 911.'
  },

  // El Salvador
  '503': {
    country: 'El Salvador',
    countryCode: 'SV',
    emergency: '911',
    medical: '132',
    fire: '913',
    suicidePrevention: '126',
    crisisText: null,
    notes: 'En El Salvador: emergencias 911; línea 126.'
  }
};

/** Prefijos +1 comparten varios países; resolver con señal de región antes que solo teléfono */
const AMBIGUOUS_DIAL_PREFIXES = new Set(['1']);

/** Entradas solo por ISO (p. ej. Canadá y República Dominicana comparten +1 con EE. UU.) */
export const EMERGENCY_BY_ISO_EXTRA = {
  CA: {
    country: 'Canadá',
    countryEn: 'Canada',
    countryCode: 'CA',
    emergency: '911',
    medical: '911',
    fire: '911',
    suicidePrevention: '988',
    crisisText: '686868',
    notes: 'En Canadá: emergencias 911; línea 988; texto de crisis 686868.'
  },
  DO: {
    country: 'República Dominicana',
    countryEn: 'Dominican Republic',
    countryCode: 'DO',
    emergency: '911',
    medical: '911',
    fire: '911',
    suicidePrevention: '809-200-0723',
    crisisText: null,
    notes: 'En República Dominicana: emergencias 911.'
  }
};

/** ISO alpha-2 → bloque de emergencia */
export const EMERGENCY_BY_ISO = (() => {
  const map = { ...EMERGENCY_BY_ISO_EXTRA };
  for (const entry of Object.values(EMERGENCY_NUMBERS_BY_COUNTRY)) {
    if (entry.countryCode) map[entry.countryCode] = entry;
  }
  return map;
})();

/**
 * @param {string|null|undefined} iso
 * @returns {Object|null}
 */
export function getEmergencyInfoByIso(iso) {
  if (!iso) return null;
  return EMERGENCY_BY_ISO[String(iso).trim().toUpperCase()] || null;
}

/**
 * Detecta el código de país desde un número de teléfono
 * @param {string} phone - Número de teléfono (puede tener varios formatos)
 * @returns {string|null} Código de país (sin el +) o null si no se puede detectar
 */
export const detectCountryCode = (phone) => {
  if (!phone) return null;
  
  // Remover espacios, guiones, paréntesis y el prefijo "whatsapp:"
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').replace(/^whatsapp:/i, '');
  
  // Si empieza con +, removerlo
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Intentar detectar códigos de país comunes (ordenados por longitud descendente)
  const countryCodes = Object.keys(EMERGENCY_NUMBERS_BY_COUNTRY).sort((a, b) => b.length - a.length);
  
  for (const code of countryCodes) {
    if (cleaned.startsWith(code)) {
      return code;
    }
  }
  
  return null;
};

/**
 * Obtiene los números de emergencia para un país específico
 * @param {string} countryCode - Código de país telefónico (sin el +)
 * @returns {Object|null} Objeto con números de emergencia o null si no se encuentra
 */
export const getEmergencyNumbers = (countryCode) => {
  if (!countryCode) return null;
  return EMERGENCY_NUMBERS_BY_COUNTRY[countryCode] || null;
};

/** ISO 3166-1 alpha-2 → prefijo telefónico internacional (sin +) según EMERGENCY_NUMBERS_BY_COUNTRY */
export const ISO_COUNTRY_TO_DIAL_PREFIX = {
  CL: '56',
  AR: '54',
  MX: '52',
  CO: '57',
  PE: '51',
  ES: '34',
  US: '1',
  EC: '593',
  UY: '598',
  PY: '595',
  BR: '55',
  GT: '502',
  BO: '591',
  CR: '506',
  PA: '507',
  NI: '505',
  HN: '504',
  SV: '503',
  VE: '58',
  DO: '1',
  GB: '44',
  CA: '1',
  AU: '61',
  IE: '353'
};

/**
 * Resuelve ISO alpha-2 desde preferencias y teléfono (prioridad: país explícito → señales dispositivo → teléfono).
 * @param {Object|null} prefs
 * @param {string|null} [phone]
 * @returns {string|null}
 */
export function resolveIsoCountryFromPreferences(prefs, phone = null) {
  const p = prefs || {};
  const raw = p.country != null ? String(p.country).trim() : '';
  if (raw) {
    const upper = raw.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(LEGACY_REGION_TO_ISO, upper)) {
      const iso = LEGACY_REGION_TO_ISO[upper];
      if (!iso) return inferIsoCountryFromDeviceSignals(p) || null;
      return iso;
    }
    if (/^\d{1,3}$/.test(raw)) {
      const info = getEmergencyNumbers(raw);
      if (info?.countryCode) return info.countryCode;
    }
    if (ISO_COUNTRY_TO_DIAL_PREFIX[upper]) return upper;
  }

  const fromDevice = inferIsoCountryFromDeviceSignals(p);
  if (fromDevice) return fromDevice;

  if (phone) {
    const prefix = detectCountryCode(phone);
    if (!prefix) return null;
    if (AMBIGUOUS_DIAL_PREFIXES.has(prefix)) return 'US';
    const info = getEmergencyNumbers(prefix);
    return info?.countryCode || null;
  }
  return null;
}

/**
 * Resuelve el bloque de emergencia a partir de preferencias (country, regionCountry, timezone) o teléfono.
 * Pensado para usuarios en **España y Latinoamérica**; si no hay datos,
 * `formatEmergencyNumbers(null)` devuelve el texto regional en español.
 *
 * @param {Object|null} prefs - preferences del perfil o del usuario
 * @param {string|null} [phone] - teléfono opcional (User.phone, etc.)
 * @returns {Object|null} Misma forma que getEmergencyNumbers
 */
export const resolveEmergencyInfoFromPreferences = (prefs, phone = null) => {
  const iso = resolveIsoCountryFromPreferences(prefs, phone);
  if (iso) {
    const byIso = getEmergencyInfoByIso(iso);
    if (byIso) return byIso;
  }

  if (phone) {
    const prefix = detectCountryCode(phone);
    if (prefix && !AMBIGUOUS_DIAL_PREFIXES.has(prefix)) {
      return getEmergencyNumbersFromPhone(phone);
    }
    const hint = inferIsoCountryFromDeviceSignals(prefs);
    if (hint && ISO_COUNTRY_TO_DIAL_PREFIX[hint] === '1') {
      return getEmergencyInfoByIso(hint);
    }
    if (prefix === '1') return getEmergencyInfoByIso('US');
  }
  return null;
};

/**
 * Obtiene los números de emergencia desde un número de teléfono
 * @param {string} phone - Número de teléfono
 * @returns {Object|null} Objeto con números de emergencia o null si no se puede detectar
 */
export const getEmergencyNumbersFromPhone = (phone) => {
  const countryCode = detectCountryCode(phone);
  if (!countryCode) return null;
  return getEmergencyNumbers(countryCode);
};

/** Nombres legacy de `crisis.js` / perfil → ISO alpha-2 */
export const LEGACY_REGION_TO_ISO = {
  ESPANA: 'ES',
  SPAIN: 'ES',
  ARGENTINA: 'AR',
  MEXICO: 'MX',
  COLOMBIA: 'CO',
  CHILE: 'CL',
  PERU: 'PE',
  GENERAL: '',
};

/** Formato legacy usado por `generateCrisisMessage` / prompts de crisis en `crisis.js` */
export const GENERAL_CRISIS_LINES = {
  EMERGENCY:
    'el número oficial de tu país (112 en España; 911 en varios países de América Latina; 133 en Chile; 123 en Colombia)',
  SUICIDE_PREVENTION:
    'la línea pública de tu país (024 en España; 135 en Argentina; 800 911 2000 en México; 106 en Colombia; *4141 en Chile)',
  MENTAL_HEALTH: 'urgencias o salud mental del país donde te encuentres',
  CRISIS_TEXT: null,
};

/**
 * Convierte bloque de emergencia a líneas legacy { EMERGENCY, SUICIDE_PREVENTION, ... }.
 * @param {Object|null} emergencyInfo
 * @returns {typeof GENERAL_CRISIS_LINES}
 */
export function emergencyInfoToCrisisLines(emergencyInfo) {
  if (!emergencyInfo) return GENERAL_CRISIS_LINES;

  const mental =
    emergencyInfo.medical && emergencyInfo.medical !== emergencyInfo.emergency
      ? emergencyInfo.medical
      : emergencyInfo.suicidePrevention || null;

  return {
    EMERGENCY: emergencyInfo.emergency || GENERAL_CRISIS_LINES.EMERGENCY,
    SUICIDE_PREVENTION:
      emergencyInfo.suicidePrevention || GENERAL_CRISIS_LINES.SUICIDE_PREVENTION,
    MENTAL_HEALTH: mental,
    CRISIS_TEXT: emergencyInfo.crisisText || null,
  };
}

/**
 * Resuelve fuente de emergencia desde objeto crisis del contexto (preferencias o legacy).
 * @param {Object|null|undefined} crisis
 * @returns {string|{ preferences: Object|null, phone: string|null }}
 */
export function resolveCrisisEmergencySource(crisis) {
  if (!crisis) return 'GENERAL';
  if (crisis.preferences != null || crisis.phone != null) {
    return {
      preferences: crisis.preferences ?? null,
      phone: crisis.phone ?? null,
    };
  }
  return crisis.country || 'GENERAL';
}

/**
 * Líneas de emergencia unificadas (sustituye el antiguo `EMERGENCY_LINES` de crisis.js).
 *
 * @param {string|{ preferences?: Object|null, phone?: string|null, prefs?: Object|null }} [source='GENERAL']
 * @returns {typeof GENERAL_CRISIS_LINES}
 */
export function getEmergencyLines(source = 'GENERAL') {
  if (source && typeof source === 'object') {
    const prefs = source.preferences ?? source.prefs ?? null;
    const phone = source.phone ?? null;
    return emergencyInfoToCrisisLines(resolveEmergencyInfoFromPreferences(prefs, phone));
  }

  const raw = String(source || 'GENERAL').trim();
  if (!raw || raw.toUpperCase() === 'GENERAL') {
    return GENERAL_CRISIS_LINES;
  }

  const upper = raw.toUpperCase();
  if (Object.prototype.hasOwnProperty.call(LEGACY_REGION_TO_ISO, upper)) {
    const iso = LEGACY_REGION_TO_ISO[upper];
    if (!iso) return GENERAL_CRISIS_LINES;
    return emergencyInfoToCrisisLines(getEmergencyInfoByIso(iso));
  }

  if (ISO_COUNTRY_TO_DIAL_PREFIX[upper]) {
    return emergencyInfoToCrisisLines(getEmergencyInfoByIso(upper));
  }

  if (/^\d{1,3}$/.test(raw)) {
    return emergencyInfoToCrisisLines(getEmergencyNumbers(raw));
  }

  return GENERAL_CRISIS_LINES;
}

/**
 * Texto de respaldo cuando no conocemos el país del usuario (app en español, foco España + LATAM).
 * Incluye ejemplos reales sin sustituir al número oficial de cada país.
 */
export const formatRegionalEmergencyFallbackEs = () =>
  [
    'Anto está en español y orienta el apoyo a **España y Latinoamérica**. Si no tenemos tu país guardado:',
    '• **España:** emergencias **112**; apoyo emocional / crisis **024**.',
    '• **Latinoamérica:** el número depende del país (p. ej. **911** en Argentina o México, **133** en Chile, **123** en Colombia). Comprueba el número oficial en tu región.',
    '• **Estados Unidos:** emergencias **911**; línea 988; texto de crisis **741741**.',
    '• **Apoyo emocional:** busca «línea de crisis», «línea de la vida» o salud mental en tu país; también puedes acudir a urgencias o un centro de salud cercano.'
  ].join('\n');

/**
 * Fallback en inglés (misma cobertura; no asume solo EE. UU.).
 */
export const formatRegionalEmergencyFallbackEn = () =>
  [
    'If we do not have your country on file, use local official numbers. Common examples:',
    '• **Spain:** emergency **112**; emotional crisis line **024**.',
    '• **Latin America:** varies by country (e.g. **911** in Argentina or Mexico, **133** in Chile, **123** in Colombia).',
    '• **United States:** emergency **911**; **988** Suicide & Crisis Lifeline; Crisis Text Line: text **741741**.',
    '• **Emotional support:** search for a local crisis or mental health line, or go to the nearest emergency department.'
  ].join('\n');

/**
 * Bloque plano de recursos para hard-stop y chat (sin markdown pesado).
 * @param {Object|null} emergencyInfo
 * @param {'es'|'en'} [language='es']
 */
export function formatCrisisEmergencyResources(emergencyInfo, language = 'es') {
  const en = String(language || 'es').toLowerCase() === 'en';
  if (!emergencyInfo) {
    return en ? formatRegionalEmergencyFallbackEn() : formatRegionalEmergencyFallbackEs();
  }

  const countryLabel = en && emergencyInfo.countryEn ? emergencyInfo.countryEn : emergencyInfo.country;
  const lines = [
    en ? `Resources (${countryLabel}):` : `Recursos (${countryLabel}):`,
  ];

  if (emergencyInfo.emergency) {
    lines.push(
      en ? `• Emergency: ${emergencyInfo.emergency}` : `• Emergencias: ${emergencyInfo.emergency}`,
    );
  }
  if (emergencyInfo.suicidePrevention) {
    lines.push(
      en
        ? `• Crisis / suicide prevention: ${emergencyInfo.suicidePrevention}`
        : `• Línea de crisis / prevención: ${emergencyInfo.suicidePrevention}`,
    );
  }
  if (emergencyInfo.crisisText) {
    lines.push(
      en
        ? `• Crisis text line: ${emergencyInfo.crisisText}`
        : `• Línea de texto de crisis: ${emergencyInfo.crisisText}`,
    );
  }
  if (emergencyInfo.medical && emergencyInfo.medical !== emergencyInfo.emergency) {
    lines.push(
      en
        ? `• Medical emergency: ${emergencyInfo.medical}`
        : `• Urgencias médicas: ${emergencyInfo.medical}`,
    );
  }
  if (!emergencyInfo.suicidePrevention) {
    lines.push(
      en
        ? '• Emotional support: look for a local crisis or mental health line.'
        : '• Apoyo emocional: busca una línea de crisis o salud mental local.',
    );
  }

  return lines.join('\n');
}

/**
 * Formatea los números de emergencia para mostrar en un mensaje
 * @param {Object} emergencyInfo - Información de emergencia del país
 * @param {'es'|'en'} [language='es']
 * @returns {string} Texto formateado con los números de emergencia
 */
export const formatEmergencyNumbers = (emergencyInfo, language = 'es') => {
  const en = String(language || 'es').toLowerCase() === 'en';
  if (!emergencyInfo) {
    return en ? formatRegionalEmergencyFallbackEn() : formatRegionalEmergencyFallbackEs();
  }

  const countryLabel = en && emergencyInfo.countryEn ? emergencyInfo.countryEn : emergencyInfo.country;
  let text = en
    ? `*Emergency resources (${countryLabel}):*\n`
    : `*Recursos de emergencia (${countryLabel}):*\n`;
  
  if (emergencyInfo.emergency) {
    text += en
      ? `• Emergency: ${emergencyInfo.emergency}\n`
      : `• Emergencias: ${emergencyInfo.emergency}\n`;
  }
  
  if (emergencyInfo.medical && emergencyInfo.medical !== emergencyInfo.emergency) {
    text += en
      ? `• Medical emergency: ${emergencyInfo.medical}\n`
      : `• Emergencias médicas: ${emergencyInfo.medical}\n`;
  }
  
  if (emergencyInfo.fire && emergencyInfo.fire !== emergencyInfo.emergency) {
    text += en ? `• Fire: ${emergencyInfo.fire}\n` : `• Bomberos: ${emergencyInfo.fire}\n`;
  }
  
  if (emergencyInfo.suicidePrevention) {
    text += en
      ? `• Suicide & crisis line: ${emergencyInfo.suicidePrevention}\n`
      : `• Línea de prevención del suicidio: ${emergencyInfo.suicidePrevention}\n`;
  }
  
  if (emergencyInfo.crisisText) {
    text += en
      ? `• Crisis text line: ${emergencyInfo.crisisText}\n`
      : `• Texto de crisis: ${emergencyInfo.crisisText}\n`;
  }
  
  if (!emergencyInfo.suicidePrevention) {
    text += en
      ? '• Emotional support: look for a local crisis or mental health line (your hospital or clinic can guide you).\n'
      : '• Apoyo emocional: busca una línea de crisis o salud mental local (tu hospital o centro de salud puede orientarte).\n';
  }
  
  return text.trim();
};

/**
 * Obtiene números de emergencia formateados desde un número de teléfono
 * @param {string} phone - Número de teléfono
 * @returns {string} Texto formateado con los números de emergencia
 */
export const getFormattedEmergencyNumbers = (phone) => {
  const emergencyInfo = getEmergencyNumbersFromPhone(phone);
  return formatEmergencyNumbers(emergencyInfo);
};

