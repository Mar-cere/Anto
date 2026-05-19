import { useRef, useEffect, useMemo } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useToast } from '../context/ToastContext';
import { useSectionTranslations } from '../hooks/useTranslations';

const DEFAULT_TEXTS = {
  CONNECTION_RESTORED: 'Conexion restaurada',
};

/**
 * En desarrollo, muestra un toast "Conexión restaurada" cuando la conexión vuelve tras estar offline.
 * En producción no se muestra (feedback poco necesario para el usuario final).
 * Debe renderizarse dentro de ToastProvider.
 */
const ConnectionRestoredListener = () => {
  const { showToast } = useToast();
  const translated = useSectionTranslations('SETTINGS');
  const TEXTS = useMemo(
    () => ({
      CONNECTION_RESTORED:
        translated?.CONNECTION_RESTORED || DEFAULT_TEXTS.CONNECTION_RESTORED,
    }),
    [translated],
  );
  const prevOffline = useRef(false);

  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (prevOffline.current && !isOffline && __DEV__) {
      showToast({
        message: TEXTS.CONNECTION_RESTORED,
        type: 'default',
        duration: 2800,
      });
    }
    prevOffline.current = isOffline;
  }, [isOffline, showToast, TEXTS.CONNECTION_RESTORED]);

  return null;
};

export default ConnectionRestoredListener;
