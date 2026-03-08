import React, { useRef, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useToast } from '../context/ToastContext';

/**
 * Muestra un toast "Conexión restaurada" cuando la conexión vuelve después de estar offline.
 * Debe renderizarse dentro de ToastProvider.
 */
const ConnectionRestoredListener = () => {
  const { showToast } = useToast();
  const prevOffline = useRef(false);

  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (prevOffline.current && !isOffline) {
      showToast({ message: 'Conexión restaurada', type: 'success', duration: 2500 });
    }
    prevOffline.current = isOffline;
  }, [isOffline, showToast]);

  return null;
};

export default ConnectionRestoredListener;
