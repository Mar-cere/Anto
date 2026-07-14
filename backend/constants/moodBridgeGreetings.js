/**
 * Copy canónico del puente mood→chat (fuente: frontend moodBridgeGreetings.data.json).
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const dataPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../frontend/src/constants/moodBridgeGreetings.data.json',
);
const moodBridgeData = require(dataPath);

/**
 * @param {'es'|'en'} language
 * @returns {Record<string, string[]>}
 */
export function getMoodBridgeGreetings(language = 'es') {
  const lang = language === 'en' ? 'en' : 'es';
  return moodBridgeData[lang];
}
