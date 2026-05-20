/**
 * Adjunta idioma y copy localizado al request según dominio.
 */
import { resolveRequestLanguage } from '../utils/apiLanguage.js';

export function attachApiCopy(copyFactory, propertyName = 'apiCopy') {
  return (req, _res, next) => {
    const language = resolveRequestLanguage(req);
    req.appLanguage = language;
    req[propertyName] = copyFactory(language);
    next();
  };
}
