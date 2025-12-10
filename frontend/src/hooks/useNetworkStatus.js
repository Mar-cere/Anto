import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook personalizado para detectar el estado de la conexión de red
 * 
 * @returns {Object} Objeto con:
 *   - isConnected: boolean - true si hay conexión, false si está offline
 *   - isInternetReachable: boolean - true si internet es alcanzable
 *   - type: string - tipo de conexión (wifi, cellular, etc.)
 *   - details: Object - detalles adicionales de la conexión
 */
export const useNetworkStatus = () => {
  const [networkState, setNetworkState] = useState({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
    details: null
  });

  useEffect(() => {
    // Obtener estado inicial
    NetInfo.fetch().then(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state.details
      });
    });

    // Suscribirse a cambios de estado
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state.details
      });
    });

    // Limpiar suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
};

export default useNetworkStatus;

