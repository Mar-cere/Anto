/**
 * Re-export de la ventana post-crisis 48 h (#225).
 * Preferir `postCrisisWindowGuard.js` en código nuevo.
 */
export {
  getPostCrisisWindow,
  isUserInPostCrisisWindow,
  isUserInPostCrisisCommitmentCooldown,
  POST_CRISIS_WINDOW_MS,
  POST_CRISIS_COOLDOWN_MS,
  CRISIS_COOLDOWN_METRIC_TYPES,
} from './postCrisisWindowGuard.js';

export { default } from './postCrisisWindowGuard.js';
