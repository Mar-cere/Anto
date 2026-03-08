import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/**
 * Componente que muestra un banner cuando el dispositivo está offline.
 * Mensaje en lenguaje claro y accesible para VoiceOver/TalkBack.
 */
const OfflineBanner = () => {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View 
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel="Sin conexión a internet. Algunas funciones pueden no estar disponibles. Revisa tu conexión."
    >
      <Text style={styles.text}>
        No se pudo conectar. Revisa tu internet y vuelve a intentar.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default OfflineBanner;

