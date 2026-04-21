/**
 * Números de emergencia y líneas de ayuda (código telefónico internacional).
 *
 * Contexto del producto: la app solo está en **español** y, por ahora, la
 * audiencia principal es **Latinoamérica y España**. Los textos de respaldo
 * y los ejemplos están pensados para ese ámbito (no asumimos EE. UU. como defecto).
 *
 * @author AntoApp Team
 */

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
    suicidePrevention: '600 360 7777', // Línea de Prevención del Suicidio
    crisisText: null, // No hay servicio de texto de crisis en Chile
    notes: 'En Chile, el número único de emergencias es 133 (Carabineros). Para emergencias médicas: 131 (SAMU).'
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
  }
};

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
  DO: '1'
};

/**
 * Resuelve el bloque de emergencia a partir de preferencias (country) o teléfono del usuario.
 * Pensado para usuarios en **España y Latinoamérica**; si no hay datos,
 * `formatEmergencyNumbers(null)` devuelve el texto regional en español.
 *
 * @param {Object|null} prefs - preferences del perfil o del usuario
 * @param {string|null} [phone] - teléfono opcional (User.phone, etc.)
 * @returns {Object|null} Misma forma que getEmergencyNumbers
 */
export const resolveEmergencyInfoFromPreferences = (prefs, phone = null) => {
  const p = prefs || {};
  const raw = p.country != null ? String(p.country).trim() : '';
  if (raw) {
    if (/^\d{1,3}$/.test(raw)) {
      const info = getEmergencyNumbers(raw);
      if (info) return info;
    }
    const iso = raw.toUpperCase();
    if (ISO_COUNTRY_TO_DIAL_PREFIX[iso]) {
      return getEmergencyNumbers(ISO_COUNTRY_TO_DIAL_PREFIX[iso]);
    }
  }
  if (phone) return getEmergencyNumbersFromPhone(phone);
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

/**
 * Texto de respaldo cuando no conocemos el país del usuario (app en español, foco España + LATAM).
 * Incluye ejemplos reales sin sustituir al número oficial de cada país.
 */
export const formatRegionalEmergencyFallbackEs = () =>
  [
    'Anto está en español y orienta el apoyo a **España y Latinoamérica**. Si no tenemos tu país guardado:',
    '• **España:** emergencias **112**; apoyo emocional / crisis **024**.',
    '• **Latinoamérica:** el número depende del país (p. ej. **911** en Argentina o México, **133** en Chile, **123** en Colombia). Comprueba el número oficial en tu región.',
    '• **Apoyo emocional:** busca «línea de crisis», «línea de la vida» o salud mental en tu país; también puedes acudir a urgencias o un centro de salud cercano.'
  ].join('\n');

/**
 * Formatea los números de emergencia para mostrar en un mensaje
 * @param {Object} emergencyInfo - Información de emergencia del país
 * @returns {string} Texto formateado con los números de emergencia
 */
export const formatEmergencyNumbers = (emergencyInfo) => {
  if (!emergencyInfo) {
    return formatRegionalEmergencyFallbackEs();
  }

  let text = `*Recursos de emergencia (${emergencyInfo.country}):*\n`;
  
  if (emergencyInfo.emergency) {
    text += `• Emergencias: ${emergencyInfo.emergency}\n`;
  }
  
  if (emergencyInfo.medical && emergencyInfo.medical !== emergencyInfo.emergency) {
    text += `• Emergencias Médicas: ${emergencyInfo.medical}\n`;
  }
  
  if (emergencyInfo.fire && emergencyInfo.fire !== emergencyInfo.emergency) {
    text += `• Bomberos: ${emergencyInfo.fire}\n`;
  }
  
  if (emergencyInfo.suicidePrevention) {
    text += `• Línea de Prevención del Suicidio: ${emergencyInfo.suicidePrevention}\n`;
  }
  
  if (emergencyInfo.crisisText) {
    text += `• Texto de Crisis: ${emergencyInfo.crisisText}\n`;
  }
  
  // Si no hay línea de prevención del suicidio específica, no inventar números de otro país
  if (!emergencyInfo.suicidePrevention) {
    text +=
      '• Apoyo emocional: busca una línea de crisis o salud mental local (tu hospital o centro de salud puede orientarte).\n';
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

