const COPY = {
  es: {
    rateLimit: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.',
    featureDisabled: 'La memoria del proceso no está disponible en este momento.',
    consentRequired:
      'Activa el consentimiento de memoria del proceso en Privacidad e IA para usar esta función.',
    statementRequired: 'El patrón debe tener al menos 5 caracteres.',
    statementTooLong: 'El patrón no puede exceder 160 caracteres.',
    statementClinical:
      'Ese texto no encaja como recuerdo de proceso. Prueba con una observación más suave y concreta.',
    invalidCategory: 'Categoría no válida.',
    invalidStatus: 'Estado no válido.',
    invalidFollowUpStatus: 'Respuesta de seguimiento no válida.',
    tooManyActive:
      'Ya tienes varios patrones activos. Archiva alguno antes de añadir otro.',
    duplicateActive: 'Ya hay un patrón similar activo en tu memoria del proceso.',
    notFound: 'Patrón no encontrado.',
    listError: 'No se pudieron cargar los patrones del proceso.',
    createError: 'No se pudo guardar el patrón.',
    updateError: 'No se pudo actualizar el patrón.',
    deleteError: 'No se pudo archivar el patrón.',
    consentError: 'No se pudo actualizar el consentimiento.',
    consentUpdated: 'Consentimiento actualizado.',
  },
  en: {
    rateLimit: 'Too many requests. Try again in a few minutes.',
    featureDisabled: 'Process memory is not available right now.',
    consentRequired:
      'Enable process-memory consent in Privacy & AI to use this feature.',
    statementRequired: 'The pattern must be at least 5 characters.',
    statementTooLong: 'The pattern cannot exceed 160 characters.',
    statementClinical:
      'That text does not fit as process memory. Try a gentler, more concrete observation.',
    invalidCategory: 'Invalid category.',
    invalidStatus: 'Invalid status.',
    invalidFollowUpStatus: 'Invalid follow-up status.',
    tooManyActive: 'You already have several active patterns. Archive one before adding another.',
    duplicateActive: 'A similar active pattern already exists in your process memory.',
    notFound: 'Pattern not found.',
    listError: 'Could not load process patterns.',
    createError: 'Could not save the pattern.',
    updateError: 'Could not update the pattern.',
    deleteError: 'Could not archive the pattern.',
    consentError: 'Could not update consent.',
    consentUpdated: 'Consent updated.',
  },
};

export function experientialPatternsApiCopy(language = 'es') {
  return COPY[language === 'en' ? 'en' : 'es'];
}
