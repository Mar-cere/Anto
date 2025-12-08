/**
 * Mock para isomorphic-dompurify
 * 
 * Evita problemas con ES modules en Jest
 */

export default {
  sanitize: (input, config = {}) => {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Simulación simple de sanitización
    // En tests, solo removemos tags HTML básicos
    let sanitized = input;
    
    // Remover tags HTML si no están permitidos
    if (!config.ALLOWED_TAGS || config.ALLOWED_TAGS.length === 0) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    } else {
      // Si hay tags permitidos, mantener solo esos
      const allowedTags = config.ALLOWED_TAGS.join('|');
      const regex = new RegExp(`<(?!\/?(?:${allowedTags})(?:\s|>))[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }
    
    return sanitized;
  }
};

