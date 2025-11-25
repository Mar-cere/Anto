/**
 * Números de Emergencia por País
 * 
 * Este archivo contiene los números de emergencia y líneas de ayuda
 * organizados por código de país telefónico.
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
 * Formatea los números de emergencia para mostrar en un mensaje
 * @param {Object} emergencyInfo - Información de emergencia del país
 * @returns {string} Texto formateado con los números de emergencia
 */
export const formatEmergencyNumbers = (emergencyInfo) => {
  if (!emergencyInfo) {
    return '• Emergencias: 911\n• Línea de Prevención del Suicidio: 988 (Internacional)';
  }
  
  let text = `*Recursos de Emergencia (${emergencyInfo.country}):*\n`;
  
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
  
  // Si no hay línea de prevención del suicidio específica, agregar recursos internacionales
  if (!emergencyInfo.suicidePrevention) {
    text += `• Línea Internacional de Prevención del Suicidio: 988 (Estados Unidos)\n`;
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

