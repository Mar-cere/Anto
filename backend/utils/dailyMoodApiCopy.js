const COPY = {
  es: {
    rateLimit: 'Demasiados intentos. Espera un momento.',
    todayError: 'No se pudo cargar el check-in de hoy.',
    saveError: 'No se pudo guardar cómo te sentís hoy.',
    invalidMood: 'Estado de ánimo no válido.',
  },
  en: {
    rateLimit: 'Too many attempts. Please wait a moment.',
    todayError: 'Could not load today’s check-in.',
    saveError: 'Could not save how you feel today.',
    invalidMood: 'Invalid mood value.',
  },
};

export function dailyMoodApiCopy(language = 'es') {
  return COPY[language === 'en' ? 'en' : 'es'];
}
