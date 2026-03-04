/**
 * Contexto de Toast / Snackbar
 *
 * Proporciona un sistema global de feedback no intrusivo.
 * Uso: const { showToast } = useToast(); showToast({ message: 'Guardado', type: 'success' });
 *
 * @author AntoApp Team
 */

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const DEFAULT_DURATION_MS = 3500;

/**
 * @typedef {'success' | 'error' | 'warning' | 'info' | 'default'} ToastType
 *
 * @typedef {Object} ToastAction
 * @property {string} label - Texto del botón
 * @property {function(): void} onPress - Callback al pulsar
 *
 * @typedef {Object} ToastOptions
 * @property {string} message - Mensaje a mostrar
 * @property {ToastType} [type='default'] - Tipo visual (success, error, warning, info, default)
 * @property {number} [duration] - Ms hasta auto-ocultar (0 = no auto-ocultar)
 * @property {ToastAction} [action] - Botón opcional (ej. "Deshacer")
 */

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const hideTimeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (options) => {
      if (!options || typeof options.message !== 'string') return;

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const duration =
        options.duration !== undefined ? options.duration : DEFAULT_DURATION_MS;

      setToast({
        message: options.message,
        type: options.type || 'default',
        action: options.action || null,
      });

      if (duration > 0) {
        hideTimeoutRef.current = setTimeout(hideToast, duration);
      }
    },
    [hideToast]
  );

  const value = {
    toast,
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

export default ToastContext;
