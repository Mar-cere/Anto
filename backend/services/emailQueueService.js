/**
 * Cola simple de emails (in-process).
 *
 * Objetivos:
 * - No bloquear requests con I/O externo (Gmail API / SendGrid / SMTP)
 * - Reintentos con backoff + jitter
 * - Concurrencia controlada (default 1) para no saturar proveedores
 *
 * Limitación:
 * - Es memoria-proceso: si el server reinicia, la cola se pierde.
 *   (Paso siguiente si queremos “nivel máximo”: BullMQ + Redis.)
 */
import logger from '../utils/logger.js';
import { nanoid } from 'nanoid';

const ENABLED = process.env.EMAIL_QUEUE_ENABLED !== 'false';
const CONCURRENCY = Math.max(1, parseInt(process.env.EMAIL_QUEUE_CONCURRENCY || '1', 10) || 1);
const MAX_ATTEMPTS = Math.max(1, parseInt(process.env.EMAIL_QUEUE_MAX_ATTEMPTS || '3', 10) || 3);
const BASE_BACKOFF_MS = Math.max(250, parseInt(process.env.EMAIL_QUEUE_BASE_BACKOFF_MS || '750', 10) || 750);
const MAX_BACKOFF_MS = Math.max(BASE_BACKOFF_MS, parseInt(process.env.EMAIL_QUEUE_MAX_BACKOFF_MS || '30000', 10) || 30000);

/** @typedef {{ id: string, type: string, to?: string, attempt: number, maxAttempts: number, runAt: number, createdAt: number, lastError?: string, task: () => Promise<boolean> }} EmailJob */

/** @type {EmailJob[]} */
const queue = [];
let running = 0;
let started = false;

const stats = {
  enqueued: 0,
  started: 0,
  succeeded: 0,
  failed: 0,
  retried: 0,
  dropped: 0
};

function now() {
  return Date.now();
}

function computeBackoffMs(attempt) {
  // Exponencial suave con jitter (p.ej. 0.75s, 1.5s, 3s…)
  const exp = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, Math.max(0, attempt - 1)));
  const jitter = Math.floor(Math.random() * Math.min(5000, exp * 0.25));
  return Math.min(MAX_BACKOFF_MS, exp + jitter);
}

function sortQueue() {
  queue.sort((a, b) => a.runAt - b.runAt);
}

function schedulePumpSoon() {
  // No queremos timers grandes: tick frecuente con costo bajo.
  setTimeout(pump, 200).unref?.();
}

async function runJob(job) {
  stats.started++;
  try {
    const ok = await job.task();
    if (ok) {
      stats.succeeded++;
      logger.info('[EmailQueue] ✅ Email enviado', { jobId: job.id, type: job.type, to: job.to, attempt: job.attempt });
      return;
    }
    throw new Error('send returned false');
  } catch (err) {
    const msg = String(err?.message || err);
    job.lastError = msg;

    if (job.attempt < job.maxAttempts) {
      job.attempt += 1;
      const delay = computeBackoffMs(job.attempt);
      job.runAt = now() + delay;
      stats.retried++;
      queue.push(job);
      sortQueue();
      logger.warn('[EmailQueue] ⚠️ Reintentando email', {
        jobId: job.id,
        type: job.type,
        to: job.to,
        attempt: job.attempt,
        maxAttempts: job.maxAttempts,
        retryInMs: delay,
        error: msg
      });
      return;
    }

    stats.failed++;
    logger.error('[EmailQueue] ❌ Email falló (sin más reintentos)', {
      jobId: job.id,
      type: job.type,
      to: job.to,
      attempt: job.attempt,
      error: msg
    });
  }
}

export function startEmailQueue() {
  if (!ENABLED) {
    logger.warn('[EmailQueue] Deshabilitada (EMAIL_QUEUE_ENABLED=false)');
    return;
  }
  if (started) return;
  started = true;
  logger.info('[EmailQueue] Iniciada', { concurrency: CONCURRENCY, maxAttempts: MAX_ATTEMPTS });
  schedulePumpSoon();
}

export function getEmailQueueStats() {
  return {
    enabled: ENABLED,
    started,
    concurrency: CONCURRENCY,
    maxAttempts: MAX_ATTEMPTS,
    running,
    queued: queue.length,
    stats: { ...stats }
  };
}

/**
 * Encola un envío de email.
 * @param {() => Promise<boolean>} task
 * @param {{ type: string, to?: string, maxAttempts?: number }} meta
 * @returns {{ accepted: boolean, jobId?: string }}
 */
export function enqueueEmail(task, meta) {
  if (!ENABLED) {
    return { accepted: false };
  }
  if (!started) startEmailQueue();

  const job = {
    id: nanoid(10),
    type: meta?.type || 'email',
    to: meta?.to,
    attempt: 1,
    maxAttempts: Math.max(1, meta?.maxAttempts || MAX_ATTEMPTS),
    runAt: now(),
    createdAt: now(),
    task
  };

  stats.enqueued++;
  queue.push(job);
  sortQueue();
  schedulePumpSoon();
  return { accepted: true, jobId: job.id };
}

export async function drainEmailQueueForTests(timeoutMs = 5000) {
  const start = now();
  while (now() - start < timeoutMs) {
    if (queue.length === 0 && running === 0) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}

export async function pump() {
  if (!ENABLED || !started) return;
  if (running >= CONCURRENCY) return;

  sortQueue();
  const next = queue[0];
  if (!next) return;
  if (next.runAt > now()) {
    schedulePumpSoon();
    return;
  }

  // Dequeue
  queue.shift();
  running += 1;

  try {
    await runJob(next);
  } finally {
    running -= 1;
    // Continuar drenando sin esperar demasiado.
    if (queue.length > 0) schedulePumpSoon();
  }
}

// Auto-start (producción) para evitar olvidos.
if (ENABLED && process.env.NODE_ENV !== 'test') {
  startEmailQueue();
}

