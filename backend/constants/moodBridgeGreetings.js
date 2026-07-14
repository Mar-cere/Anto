/**
 * Copy canónico del puente mood→chat (fuente: moodBridgeGreetings.data.js).
 */
import {
  MOOD_BRIDGE_GREETINGS_EN,
  MOOD_BRIDGE_GREETINGS_ES,
} from './moodBridgeGreetings.data.js';

/**
 * @param {'es'|'en'} language
 * @returns {Record<string, string[]>}
 */
export function getMoodBridgeGreetings(language = 'es') {
  const lang = language === 'en' ? 'en' : 'es';
  return lang === 'en' ? MOOD_BRIDGE_GREETINGS_EN : MOOD_BRIDGE_GREETINGS_ES;
}
