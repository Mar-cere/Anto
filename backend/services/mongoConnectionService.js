/**
 * Ciclo de vida de conexión MongoDB: connect con backoff y reintentos en background.
 * El HTTP puede arrancar aunque el primer connect falle; este módulo sigue intentando.
 */
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const DEFAULT_CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority',
};

/** @type {ReturnType<typeof setTimeout>|null} */
let reconnectTimer = null;
let connecting = false;
let listenersBound = false;
let shuttingDown = false;
let ensureIndexesFn = null;
/** @type {string|null} */
let activeUri = null;
/** @type {object|null} */
let activeOptions = null;
let consecutiveFailures = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} uri
 * @returns {string}
 */
export function normalizeMongoUri(uri) {
  const mongoUri = String(uri || '').trim();
  if (!mongoUri) return mongoUri;

  const withoutProtocol = mongoUri.replace(/^mongodb(\+srv)?:\/\//i, '');
  const pathAndQuery = withoutProtocol.includes('/')
    ? withoutProtocol.slice(withoutProtocol.indexOf('/') + 1)
    : '';
  const dbPath = pathAndQuery.split('?')[0].replace(/\/+$/, '');
  if (dbPath) {
    return mongoUri;
  }

  if (/\/\?/.test(mongoUri)) {
    // mongodb+srv://host/?opts → mongodb+srv://host/anto?opts
    return mongoUri.replace(/\/\?/, '/anto?');
  }
  if (mongoUri.includes('?')) {
    return mongoUri.replace('?', '/anto?');
  }
  return `${mongoUri.replace(/\/+$/, '')}/anto`;
}

/**
 * @param {number} attemptZeroBased
 * @param {{ baseMs?: number, maxMs?: number }} [opts]
 */
export function computeReconnectDelayMs(attemptZeroBased, opts = {}) {
  const baseMs = Number.isFinite(opts.baseMs) ? opts.baseMs : 2000;
  const maxMs = Number.isFinite(opts.maxMs) ? opts.maxMs : 60000;
  const exp = Math.min(Math.max(0, attemptZeroBased), 5);
  return Math.min(maxMs, baseMs * 2 ** exp);
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function bindConnectionListeners() {
  if (listenersBound) return;
  listenersBound = true;

  mongoose.connection.on('error', (err) => {
    logger.error('❌ Error en la conexión de MongoDB', { error: err?.message });
    logger.critical('Error crítico de base de datos', { error: err });
  });

  mongoose.connection.on('disconnected', () => {
    if (shuttingDown) return;
    logger.warn('⚠️ MongoDB desconectado. Programando reintento de conexión...');
    scheduleReconnect();
  });

  mongoose.connection.on('reconnected', () => {
    consecutiveFailures = 0;
    logger.info('✅ MongoDB reconectado');
  });

  mongoose.connection.on('connected', () => {
    consecutiveFailures = 0;
  });
}

async function runEnsureIndexes() {
  if (typeof ensureIndexesFn !== 'function') return;
  try {
    await ensureIndexesFn();
  } catch (error) {
    logger.warn('Error al crear índices:', { error: error?.message });
  }
}

/**
 * Un intento de connect (no programa reintentos).
 * @returns {Promise<boolean>} true si quedó connected
 */
export async function connectMongoOnce(uri, options = DEFAULT_CONNECT_OPTIONS) {
  if (shuttingDown) return false;
  if (mongoose.connection.readyState === 1) return true;
  if (connecting) return false;

  connecting = true;
  try {
    await mongoose.connect(uri, options);
    consecutiveFailures = 0;
    clearReconnectTimer();
    bindConnectionListeners();
    await runEnsureIndexes();
    logger.info('✅ Conexión exitosa a MongoDB');
    logger.info(`📊 Base de datos: ${mongoose.connection.name || 'default'}`);
    return true;
  } finally {
    connecting = false;
  }
}

export function scheduleReconnect() {
  if (shuttingDown || !activeUri) return;
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }
  if (reconnectTimer || connecting) return;

  const delay = computeReconnectDelayMs(consecutiveFailures);
  logger.warn('⏳ Reintento MongoDB programado', {
    delayMs: delay,
    consecutiveFailures,
    readyState: mongoose.connection.readyState,
  });

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void (async () => {
      if (shuttingDown || !activeUri) return;
      try {
        const ok = await connectMongoOnce(activeUri, activeOptions || DEFAULT_CONNECT_OPTIONS);
        if (!ok && mongoose.connection.readyState !== 1) {
          consecutiveFailures += 1;
          scheduleReconnect();
        }
      } catch (err) {
        consecutiveFailures += 1;
        logger.error('❌ Error reconectando a MongoDB', { error: err?.message });
        scheduleReconnect();
      }
    })();
  }, delay);

  if (typeof reconnectTimer.unref === 'function' && process.env.NODE_ENV === 'test') {
    reconnectTimer.unref();
  }
}

/**
 * Arranca el ciclo: varios intentos iniciales + reintentos en background si fallan.
 * @param {{
 *   uri?: string,
 *   ensureIndexes?: Function,
 *   connectOptions?: object,
 *   initialMaxAttempts?: number,
 *   initialRetryBaseMs?: number,
 * }} [opts]
 */
export async function startMongoConnection(opts = {}) {
  shuttingDown = false;
  ensureIndexesFn = opts.ensureIndexes || null;

  const rawUri = opts.uri;
  if (!rawUri) {
    logger.warn('⚠️ MONGO_URI no está definida en las variables de entorno');
    return { started: false, reason: 'missing_uri' };
  }
  if (!rawUri.startsWith('mongodb://') && !rawUri.startsWith('mongodb+srv://')) {
    logger.warn('⚠️ MONGO_URI debe comenzar con mongodb:// o mongodb+srv://');
    return { started: false, reason: 'invalid_uri' };
  }

  activeUri = normalizeMongoUri(rawUri);
  activeOptions = { ...DEFAULT_CONNECT_OPTIONS, ...(opts.connectOptions || {}) };

  const initialMaxAttempts = Number.isFinite(opts.initialMaxAttempts)
    ? opts.initialMaxAttempts
    : Number.parseInt(process.env.MONGO_CONNECT_MAX_ATTEMPTS || '5', 10) || 5;
  const initialRetryBaseMs = Number.isFinite(opts.initialRetryBaseMs)
    ? opts.initialRetryBaseMs
    : Number.parseInt(process.env.MONGO_CONNECT_RETRY_MS || '2000', 10) || 2000;

  for (let attempt = 1; attempt <= initialMaxAttempts; attempt += 1) {
    if (shuttingDown) return { started: false, reason: 'shutdown' };
    try {
      const ok = await connectMongoOnce(activeUri, activeOptions);
      if (ok) {
        return { started: true, connected: true, attempts: attempt };
      }
    } catch (err) {
      consecutiveFailures += 1;
      logger.error('❌ Error conectando a MongoDB', {
        error: err?.message,
        attempt,
        maxAttempts: initialMaxAttempts,
      });
      if (attempt < initialMaxAttempts) {
        const wait = computeReconnectDelayMs(attempt - 1, { baseMs: initialRetryBaseMs });
        await sleep(wait);
      }
    }
  }

  logger.warn(
    '⚠️ MongoDB no disponible tras intentos iniciales. El servidor sigue; reintentos en background.',
    { initialMaxAttempts },
  );
  scheduleReconnect();
  return { started: true, connected: false, attempts: initialMaxAttempts };
}

/** Detiene reintentos (shutdown / tests). */
export function stopMongoConnectionRetries() {
  shuttingDown = true;
  clearReconnectTimer();
}

/** Solo tests: reset de estado interno. */
export function __resetMongoConnectionServiceForTests() {
  stopMongoConnectionRetries();
  connecting = false;
  listenersBound = false;
  ensureIndexesFn = null;
  activeUri = null;
  activeOptions = null;
  consecutiveFailures = 0;
  shuttingDown = false;
}
