import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Componente que muestra un banner cuando el dispositivo está offline
 * Se muestra automáticamente cuando no hay conexión a internet
 */
const OfflineBanner = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  
  // Mostrar banner si no hay conexión o internet no es alcanzable
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        ⚠️ Sin conexión a internet. Algunas funciones pueden no estar disponibles.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default OfflineBanner;

