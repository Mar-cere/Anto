const COPY = {
  es: {
    rateLimit: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
    labelRequired: 'El compromiso debe tener al menos 2 caracteres.',
    labelTooLong: 'El compromiso no puede exceder 240 caracteres.',
    labelClinical: 'Ese texto no encaja como compromiso de bienestar. Prueba con una acción concreta.',
    labelGeneric:
      'Describe una acción concreta (por ejemplo, «caminar 10 minutos»), no solo el nombre de la técnica.',
    tooManyActive: 'Ya tienes varios compromisos activos. Completa o archiva alguno antes de añadir otro.',
    notFound: 'Compromiso no encontrado.',
    invalidStatus: 'Estado no válido.',
    invalidFollowUp: 'Respuesta de seguimiento no válida.',
    invalidProductLink: 'El vínculo con tarea u hábito no es válido.',
    listError: 'No se pudieron cargar los compromisos.',
    createError: 'No se pudo guardar el compromiso.',
    updateError: 'No se pudo actualizar el compromiso.',
  },
  en: {
    rateLimit: 'Too many requests. Try again in a few minutes.',
    labelRequired: 'Commitment must be at least 2 characters.',
    labelTooLong: 'Commitment cannot exceed 240 characters.',
    labelClinical: 'That text does not fit as a wellbeing commitment. Try a concrete action.',
    labelGeneric:
      'Describe a concrete action (for example, "walk for 10 minutes"), not just the technique name.',
    tooManyActive: 'You already have several active commitments. Complete or archive one before adding another.',
    notFound: 'Commitment not found.',
    invalidStatus: 'Invalid status.',
    invalidFollowUp: 'Invalid follow-up answer.',
    invalidProductLink: 'The task or habit link is not valid.',
    listError: 'Could not load commitments.',
    createError: 'Could not save commitment.',
    updateError: 'Could not update commitment.',
  },
};

export function sessionCommitmentApiCopy(language = 'es') {
  return COPY[language === 'en' ? 'en' : 'es'];
}
