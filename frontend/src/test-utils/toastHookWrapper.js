/**
 * Wrapper para renderHook cuando el hook usa useToast().
 */
import React from 'react';
import { ToastProvider } from '../context/ToastContext';

export function toastHookWrapper({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
