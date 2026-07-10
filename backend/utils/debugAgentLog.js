/**
 * Instrumentación de depuración (sesión agente). No registrar secretos ni PII.
 */
import fs from 'fs';
import path from 'path';

const SESSION_ID = 'e92f22';
const LOG_PATH = path.join(process.cwd(), '.cursor', `debug-${SESSION_ID}.log`);
const INGEST_URL = 'http://127.0.0.1:7668/ingest/64a2fca1-2412-43e9-b4f8-4d93df60a87d';

/**
 * @param {object} payload
 * @param {string} payload.location
 * @param {string} payload.message
 * @param {string} [payload.hypothesisId]
 * @param {string} [payload.runId]
 * @param {Record<string, unknown>} [payload.data]
 */
export function debugAgentLog(payload) {
  const entry = {
    sessionId: SESSION_ID,
    timestamp: Date.now(),
    ...payload,
  };
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`);
  } catch {
    /* ignore */
  }
  fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': SESSION_ID,
    },
    body: JSON.stringify(entry),
  }).catch(() => {});
}
