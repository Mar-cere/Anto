import React, { useRef, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useToast } from '../context/ToastContext';

/**
 * En desarrollo, muestra un toast "Conexión restaurada" cuando la conexión vuelve tras estar offline.
 * En producción no se muestra (feedback poco necesario para el usuario final).
 * Debe renderizarse dentro de ToastProvider.
 */
const ConnectionRestoredListener = () => {
  const { showToast } = useToast();
  const prevOffline = useRef(false);

  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (prevOffline.current && !isOffline && __DEV__) {
      showToast({ message: 'Conexión restaurada', type: 'default', duration: 2800 });
    }
    prevOffline.current = isOffline;
  }, [isOffline, showToast]);

  return null;
};

export default ConnectionRestoredListener;
