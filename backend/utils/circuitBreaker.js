/**
 * Circuit Breaker simple (in-process).
 *
 * Estados:
 * - CLOSED: opera normal, acumula fallos consecutivos
 * - OPEN: rechaza rápido hasta que pase el cooldown
 * - HALF_OPEN: permite 1 intento; si sale bien -> CLOSED, si falla -> OPEN
 *
 * Ideal para servicios externos (OpenAI, pagos, mail, etc.) cuando queremos:
 * - fallback rápido
 * - evitar tormentas de requests y cascadas de latencia
 *
 * Limitación: estado en memoria-proceso (se resetea con reinicios).
 */

export class CircuitBreakerOpenError extends Error {
  constructor(message = 'Circuit breaker abierto') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
    this.code = 'CIRCUIT_BREAKER_OPEN';
    this.statusCode = 503;
  }
}

export class CircuitBreaker {
  /**
   * @param {{
   *   name: string,
   *   failureThreshold?: number,
   *   successThreshold?: number,
   *   cooldownMs?: number,
   *   requestTimeoutMs?: number,
   *   shouldCountFailure?: (err: any) => boolean
   * }} options
   */
  constructor(options) {
    this.name = options.name;
    this.failureThreshold = Math.max(1, options.failureThreshold ?? 5);
    this.successThreshold = Math.max(1, options.successThreshold ?? 1);
    this.cooldownMs = Math.max(250, options.cooldownMs ?? 15000);
    this.requestTimeoutMs = options.requestTimeoutMs ?? null;
    this.shouldCountFailure =
      options.shouldCountFailure ||
      (() => true);

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptAt = 0;
    this.halfOpenInFlight = false;
  }

  snapshot() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptAt: this.nextAttemptAt
    };
  }

  _now() {
    return Date.now();
  }

  _open() {
    this.state = 'OPEN';
    this.nextAttemptAt = this._now() + this.cooldownMs;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenInFlight = false;
  }

  _close() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptAt = 0;
    this.halfOpenInFlight = false;
  }

  _halfOpen() {
    this.state = 'HALF_OPEN';
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenInFlight = false;
  }

  _canPass() {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'OPEN') {
      if (this._now() >= this.nextAttemptAt) {
        this._halfOpen();
        return true;
      }
      return false;
    }
    // HALF_OPEN: permitir un solo request concurrente
    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenInFlight) return false;
      return true;
    }
    return true;
  }

  /**
   * Ejecuta la operación con circuit breaker.
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async exec(fn) {
    if (!this._canPass()) {
      throw new CircuitBreakerOpenError(`${this.name}: circuit breaker OPEN`);
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenInFlight = true;
    }

    try {
      const result = await fn();

      if (this.state === 'HALF_OPEN') {
        this.successCount += 1;
        if (this.successCount >= this.successThreshold) {
          this._close();
        }
      } else {
        // CLOSED: resetear fallos consecutivos en éxito
        this.failureCount = 0;
      }

      return result;
    } catch (err) {
      const count = this.shouldCountFailure(err);

      if (count) {
        if (this.state === 'HALF_OPEN') {
          this._open();
        } else {
          this.failureCount += 1;
          if (this.failureCount >= this.failureThreshold) {
            this._open();
          }
        }
      }

      throw err;
    } finally {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenInFlight = false;
      }
    }
  }
}

