/**
 * Constantes de validación
 * 
 * Centraliza las reglas de validación utilizadas en formularios
 * para mantener consistencia en toda la aplicación.
 * 
 * @author AntoApp Team
 */

// Longitudes mínimas y máximas
export const VALIDATION_LENGTHS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
};

// Expresiones regulares
export const VALIDATION_REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-z0-9_]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, // Al menos una minúscula, una mayúscula y un número
};

