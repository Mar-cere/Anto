/**
 * Wrapper sobre express-rate-limit: en NODE_ENV=test no aplica límites para evitar
 * contaminación entre archivos de test que comparten la misma instancia de Express en memoria.
 */
import rateLimit from 'express-rate-limit';

export function createRateLimiter(options) {
  const { skip: userSkip, ...rest } = options;
  return rateLimit({
    ...rest,
    skip: (req, reply) => {
      if (process.env.NODE_ENV === 'test') {
        return true;
      }
      return typeof userSkip === 'function' ? userSkip(req, reply) : false;
    },
  });
}
