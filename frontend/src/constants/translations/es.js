/**
 * Traducciones en español
 * 
 * Contiene todos los textos de la aplicación en español.
 * Estructurado por pantalla para facilitar el mantenimiento.
 * 
 * @author AntoApp Team
 */

export const HOME = {
  WELCOME: '¡Bienvenido!',
  SUBTITLE: 'Nos alegra verte aquí.',
  SIGN_IN: 'Iniciar Sesión',
  REGISTER: 'Crear cuenta',
  FAQ: 'Preguntas Frecuentes',
  SIGN_IN_HINT: 'Toca para ir a la pantalla de inicio de sesión',
  REGISTER_HINT: 'Toca para ir a la pantalla de registro',
};

export const REGISTER = {
  TITLE: 'Crear Cuenta',
  SUBTITLE: 'Por favor, llena los campos para registrarte.',
  NAME_PLACEHOLDER: 'Nombre real (opcional)',
  NAME_INFO_LINK: '¿Es necesario mi nombre real?',
  NAME_INFO_MODAL_TITLE: '¿Es necesario mi nombre real?',
  NAME_INFO_MODAL_MESSAGE: 'Tu nombre real es opcional, pero puede ser útil en el futuro para:\n\n• Generar programas personalizados de bienestar\n• Crear diagnósticos y reportes detallados\n• Compartir información con tus profesionales de salud (solo si tú lo solicitas)\n\n🔒 Todos tus datos, incluyendo tu nombre, son completamente privados y están cifrados. Solo tú decides con quién compartirlos.',
  USERNAME_PLACEHOLDER: 'Nombre de usuario',
  EMAIL_PLACEHOLDER: 'Correo Electrónico',
  PASSWORD_PLACEHOLDER: 'Contraseña',
  CONFIRM_PASSWORD_PLACEHOLDER: 'Confirma tu Contraseña',
  TERMS_TEXT: 'Acepto los ',
  TERMS_LINK: 'términos y condiciones',
  TERMS_ALERT_TITLE: 'Términos y Condiciones',
  TERMS_ALERT_MESSAGE: '1. ACEPTACIÓN DE TÉRMINOS\n\nAl crear una cuenta en Anto, aceptas estos términos y condiciones. Si no estás de acuerdo, no uses nuestros servicios.\n\n2. USO DEL SERVICIO\n\nAnto es una aplicación de asistente terapéutico que proporciona herramientas de bienestar mental y emocional. El servicio está diseñado para complementar, no reemplazar, el tratamiento profesional de salud mental.\n\n3. PRIVACIDAD Y DATOS\n\n• Todos tus datos personales están cifrados y protegidos\n• Solo tú decides qué información compartir\n• No vendemos ni compartimos tus datos con terceros\n• Puedes solicitar la eliminación de tus datos en cualquier momento\n\n4. RESPONSABILIDAD\n\n• Anto no sustituye el diagnóstico o tratamiento médico profesional\n• En caso de emergencia, contacta inmediatamente a servicios de emergencia\n• Eres responsable del uso que hagas de la aplicación\n\n5. PROPIEDAD INTELECTUAL\n\nTodo el contenido de Anto, incluyendo textos, gráficos y software, es propiedad de AntoApp Team y está protegido por derechos de autor.\n\n6. MODIFICACIONES\n\nNos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la aplicación.\n\n7. CONTACTO\n\nPara preguntas sobre estos términos, contacta a nuestro equipo de soporte a través de la aplicación.\n\nAl aceptar, confirmas que has leído, entendido y aceptas estos términos y condiciones.',
  REGISTER_BUTTON: 'Registrarse',
  SIGN_IN_LINK: '¿Ya tienes una cuenta? Inicia Sesión',
  ERROR_TITLE: 'Error en el registro',
  MODAL_CLOSE: 'Entendido',
  // Mensajes de error
  ERRORS: {
    NAME_MIN: 'El nombre debe tener al menos 2 caracteres',
    NAME_MAX: 'El nombre debe tener máximo 50 caracteres',
    USERNAME_REQUIRED: 'El nombre de usuario es obligatorio',
    USERNAME_MIN: 'El nombre de usuario debe tener al menos 3 caracteres',
    USERNAME_MAX: 'El nombre de usuario debe tener máximo 20 caracteres',
    USERNAME_MIN_SHORT: 'Mínimo 3 caracteres',
    USERNAME_MAX_SHORT: 'Máximo 20 caracteres',
    EMAIL_REQUIRED: 'El correo es obligatorio',
    EMAIL_INVALID: 'Introduce un correo válido',
    PASSWORD_REQUIRED: 'La contraseña es obligatoria',
    PASSWORD_MIN: 'La contraseña debe tener al menos 8 caracteres',
    CONFIRM_PASSWORD_REQUIRED: 'Debes confirmar la contraseña',
    PASSWORDS_MISMATCH: 'Las contraseñas no coinciden',
    TERMS_REQUIRED: 'Debes aceptar los términos y condiciones',
    CONNECTION_ERROR: 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.',
    SERVER_ERROR: 'No se pudo establecer conexión con el servidor. Por favor:\n\n1. Verifica tu conexión a internet\n2. Espera unos minutos y vuelve a intentar\n3. Si el problema persiste, contacta al soporte',
    NETWORK_ERROR: 'Error de conexión. Por favor:\n\n1. Verifica tu conexión a internet\n2. Intenta nuevamente en unos momentos\n3. Si el problema persiste, contacta al soporte',
    ALREADY_EXISTS: 'El email o nombre de usuario ya está registrado',
    INVALID_DATA: 'Por favor, verifica que todos los campos sean correctos',
    TOO_MANY_ATTEMPTS: 'Demasiados intentos de registro. Por favor, espera un momento',
    NO_TOKEN: 'No se recibió token de autenticación',
    GENERIC_ERROR: 'Ocurrió un error durante el registro',
  },
};

export const DASH = {
  LOADING: 'Cargando tu panel...',
  RETRY: 'Reintentar',
  DISMISS: 'Descartar',
  ERROR_PREFIX: '⚠️ ',
  ERROR_USER: 'No se pudo cargar usuario. Intenta de nuevo.',
  ERROR_TASKS: 'No se pudo cargar tareas. Intenta de nuevo.',
  ERROR_HABITS: 'No se pudo cargar hábitos. Intenta de nuevo.',
  ERROR_GENERIC: 'Error al cargar los datos',
  TASKS_LABEL: 'Lista de tareas',
  HABITS_LABEL: 'Lista de hábitos',
  POMODORO_LABEL: 'Pomodoro',
  NAVBAR_LABEL: 'Barra de navegación',
};

// Exportar todas las traducciones agrupadas
export default {
  HOME,
  REGISTER,
  DASH,
};

