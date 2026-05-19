/**
 * Consumo incremental de respuestas SSE (formato `data: JSON` + línea en blanco).
 * Pensado para React Native: XMLHttpRequest con responseText creciente.
 */

const DEFAULT_STREAM_TIMEOUT_MS = 120_000;

function deriveErrorCodeFromResponse(status, data) {
  const backendCode = typeof data?.code === 'string' ? data.code.trim() : '';
  if (backendCode) return backendCode.toUpperCase();
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return data?.requiresSubscription ? 'SUBSCRIPTION_REQUIRED' : 'FORBIDDEN';
  if (status === 429) return 'RATE_LIMIT';
  if (status >= 500) return 'SERVER_ERROR';
  return 'HTTP_ERROR';
}

/**
 * Heurística defensiva para aceptar cierres sin evento `done` solo si el texto
 * parece completo (evita guardar respuestas truncadas por corte de stream).
 * @param {string} text
 * @returns {boolean}
 */
function looksLikeCompleteAssistantText(text) {
  const v = String(text || '').trim();
  if (!v) return false;
  // Permitir respuestas cortas completas sin puntuación final.
  if (v.length <= 24) return true;
  // Cierre típico: punto, interrogación/exclamación, comillas/paréntesis o elipsis.
  return /(?:[.!?…]|[)"'»])$/.test(v);
}

/**
 * @param {string} prevBuffer
 * @param {string} chunk
 * @returns {{ buffer: string, payloads: object[] }}
 */
export function consumeSseDelta(prevBuffer, chunk) {
  // Unificar fin de evento SSE aunque el proxy use CRLF.
  let buf = ((prevBuffer || '') + (chunk || '')).replace(/\r\n/g, '\n');
  const payloads = [];
  while (true) {
    const idx = buf.indexOf('\n\n');
    if (idx === -1) {
      return { buffer: buf, payloads };
    }
    const block = buf.slice(0, idx);
    buf = buf.slice(idx + 2);
    const lines = block.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !/^data:/i.test(line)) continue;
      const jsonStr = line.replace(/^data:\s*/i, '').trim();
      if (!jsonStr) continue;
      try {
        payloads.push(JSON.parse(jsonStr));
      } catch (_) {
        // bloque mal formado: se ignora
      }
    }
  }
}

/**
 * @param {object[]} payloads
 * @param {{ onChunk?: (s: string) => void, onDone?: (p: object) => void }} handlers
 * @returns {boolean} true si hubo evento done
 */
export function dispatchSsePayloads(payloads, { onChunk, onDone }) {
  for (const payload of payloads) {
    if (payload?.error) {
      const msg = typeof payload.error === 'string' ? payload.error : 'Error en el stream';
      const err = new Error(msg);
      if (typeof payload.code === 'string' && payload.code.trim()) {
        err.code = payload.code.trim().toUpperCase();
      }
      throw err;
    }
    if (payload?.done === true) {
      if (onDone) onDone(payload);
      return true;
    }
    if (typeof payload?.content === 'string' && onChunk) {
      onChunk(payload.content);
    }
  }
  return false;
}

/**
 * POST SSE en entornos nativos (XHR + onreadystatechange / progreso de responseText).
 *
 * @param {object} opts
 * @param {string} opts.url
 * @param {Record<string, string>} opts.headers
 * @param {string} opts.body
 * @param {(s: string) => void} [opts.onChunk]
 * @param {(p: object) => void} [opts.onDone]
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<void>}
 */
export function postChatSseWithXHR({
  url,
  headers,
  body,
  onChunk,
  onDone,
  timeoutMs = DEFAULT_STREAM_TIMEOUT_MS,
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let sseBuf = '';
    let lastLen = 0;
    let finished = false;
    let sawDone = false;
    let accumulated = '';

    const wrapChunk =
      onChunk != null
        ? (c) => {
            if (typeof c === 'string') accumulated += c;
            onChunk(c);
          }
        : undefined;

    const wrapDone = (p) => {
      sawDone = true;
      if (onDone) onDone(p);
    };

    const fail = (err) => {
      if (finished) return;
      finished = true;
      reject(err);
    };

    const ok = () => {
      if (finished) return;
      finished = true;
      resolve();
    };

    const flushDelta = () => {
      if (finished) return;
      const full = xhr.responseText || '';
      const delta = full.slice(lastLen);
      lastLen = full.length;
      const { buffer, payloads } = consumeSseDelta(sseBuf, delta);
      sseBuf = buffer;
      try {
        if (dispatchSsePayloads(payloads, { onChunk: wrapChunk, onDone: wrapDone })) {
          ok();
        }
      } catch (e) {
        fail(e);
      }
    };

    const flushTail = () => {
      if (!sseBuf.trim()) return;
      const lines = sseBuf.split(/\r?\n/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || !/^data:/i.test(line)) continue;
        try {
          const p = JSON.parse(line.replace(/^data:\s*/i, '').trim());
          if (dispatchSsePayloads([p], { onChunk: wrapChunk, onDone: wrapDone })) {
            ok();
            return;
          }
        } catch (_) {
          // ignorar
        }
      }
    };

    xhr.open('POST', url);
    Object.entries(headers || {}).forEach(([k, v]) => {
      if (v != null && v !== '') xhr.setRequestHeader(k, String(v));
    });
    xhr.timeout = timeoutMs;

    xhr.ontimeout = () => {
      fail(Object.assign(new Error('Tiempo de espera agotado (stream)'), { code: 'ETIMEDOUT' }));
    };
    xhr.onerror = () => {
      fail(Object.assign(new Error('Error de red (stream)'), { code: 'NETWORK_ERROR' }));
    };
    xhr.onabort = () => {
      fail(Object.assign(new Error('Cancelado'), { code: 'ABORTED' }));
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState < XMLHttpRequest.LOADING) return;
      flushDelta();
    };

    xhr.onload = () => {
      if (finished) return;
      flushDelta();
      if (finished) return;
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = xhr.statusText || 'Error';
        let data;
        try {
          data = JSON.parse(xhr.responseText || '{}');
          msg = data.message || data.error || data.code || msg;
        } catch (_) {
          /* usar statusText */
        }
        const err = new Error(msg);
        err.code = deriveErrorCodeFromResponse(xhr.status, data);
        err.response = { status: xhr.status, data };
        fail(err);
        return;
      }
      flushTail();
      if (finished) return;
      if (!sawDone) {
        if (accumulated && onDone && looksLikeCompleteAssistantText(accumulated)) {
          onDone({
            done: true,
            content: accumulated,
            messageId: null,
            suggestions: [],
            inferredDone: true,
          });
        } else {
          const err = new Error('Respuesta del servidor incompleta (stream)');
          err.code = 'STREAM_INCOMPLETE';
          err.partialContent = accumulated || '';
          err.response = { status: xhr.status };
          fail(err);
          return;
        }
      }
      ok();
    };

    xhr.send(body);
  });
}

/**
 * POST SSE con fetch (navegador / entornos con body.getReader).
 */
export async function streamChatSseWithFetch({
  url,
  headers,
  body,
  onChunk,
  onDone,
  timeoutMs = DEFAULT_STREAM_TIMEOUT_MS,
}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      const err = new Error('Tiempo de espera agotado (stream)');
      err.code = 'ETIMEDOUT';
      throw err;
    }
    const err = e instanceof Error ? e : new Error(String(e || 'Error de red'));
    if (!err.code) err.code = 'NETWORK_ERROR';
    throw err;
  } finally {
    clearTimeout(tid);
  }

  if (!response.ok) {
    let errMsg = response.statusText;
    let data;
    try {
      data = await response.json();
      errMsg = data.message || data.error || data.code || errMsg;
    } catch (_) {
      try {
        const t = await response.text();
        if (t) {
          try {
            data = JSON.parse(t);
            errMsg = data.message || data.error || data.code || errMsg;
          } catch (_) {
            errMsg = t.slice(0, 200);
          }
        }
      } catch (_) {
        /* noop */
      }
    }
    const err = new Error(errMsg);
    err.code = deriveErrorCodeFromResponse(response.status, data);
    err.response = { status: response.status, data };
    throw err;
  }

  let sawDone = false;
  let accumulated = '';
  const wrapChunk =
    onChunk != null
      ? (c) => {
          if (typeof c === 'string') accumulated += c;
          onChunk(c);
        }
      : undefined;
  const wrapDone = (p) => {
    sawDone = true;
    if (onDone) onDone(p);
  };

  const reader = response.body?.getReader?.();
  if (!reader) {
    const rawText = await response.text();
    let sseBuf = '';
    const { buffer, payloads } = consumeSseDelta(sseBuf, rawText);
    sseBuf = buffer;
    if (dispatchSsePayloads(payloads, { onChunk: wrapChunk, onDone: wrapDone })) return;
    if (sseBuf.trim()) {
      flushPartialSseTail(sseBuf, { onChunk: wrapChunk, onDone: wrapDone });
    }
    if (!sawDone) {
      if (accumulated && onDone && looksLikeCompleteAssistantText(accumulated)) {
        onDone({ done: true, content: accumulated, messageId: null, suggestions: [], inferredDone: true });
      } else {
        const err = new Error('Respuesta del servidor incompleta (stream)');
        err.code = 'STREAM_INCOMPLETE';
        err.partialContent = accumulated || '';
        err.response = { status: response.status };
        throw err;
      }
    }
    return;
  }

  const decoder = new TextDecoder();
  let sseBuf = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const { buffer, payloads } = consumeSseDelta(sseBuf, chunk);
      sseBuf = buffer;
      if (dispatchSsePayloads(payloads, { onChunk: wrapChunk, onDone: wrapDone })) {
        return;
      }
    }
    if (sseBuf.trim().startsWith('data:')) {
      try {
        const payload = JSON.parse(sseBuf.trim().replace(/^data:\s*/i, ''));
        dispatchSsePayloads([payload], { onChunk: wrapChunk, onDone: wrapDone });
      } catch (_) {
        /* noop */
      }
    }
    if (!sawDone) {
      if (accumulated && onDone && looksLikeCompleteAssistantText(accumulated)) {
        onDone({ done: true, content: accumulated, messageId: null, suggestions: [], inferredDone: true });
      } else {
        const err = new Error('Respuesta del servidor incompleta (stream)');
        err.code = 'STREAM_INCOMPLETE';
        err.partialContent = accumulated || '';
        err.response = { status: response.status };
        throw err;
      }
    }
  } finally {
    reader.releaseLock?.();
  }
}

function flushPartialSseTail(sseBuf, handlers) {
  const tailBlocks = sseBuf.split(/\n\n/);
  for (const block of tailBlocks) {
    const lines = block.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !/^data:/i.test(line)) continue;
      try {
        const p = JSON.parse(line.replace(/^data:\s*/i, '').trim());
        if (dispatchSsePayloads([p], handlers)) return;
      } catch (_) {
        /* noop */
      }
    }
  }
}
