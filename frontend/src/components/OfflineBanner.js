import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSectionTranslations } from '../hooks/useTranslations';
import { SPACING } from '../constants/ui';
/**
 * Componente que muestra un banner cuando el dispositivo está offline.
 * Mensaje en lenguaje claro y accesible para VoiceOver/TalkBack.
 */
const OfflineBanner = () => {
  const translated = useSectionTranslations('DASH');
  const a11yText =
    translated?.OFFLINE_BANNER_A11Y ||
    'Sin conexión a internet. Algunas funciones pueden no estar disponibles. Revisa tu conexión.';
  const visibleText =
    translated?.OFFLINE_BANNER_TEXT ||
    'No se pudo conectar. Revisa tu internet y vuelve a intentar.';
  const { isConnected, isInternetReachable } = useNetworkStatus();

  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={a11yText}
    >
      <Text style={styles.text}>
        {visibleText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 107, 107, 0.14)',
    paddingVertical: SPACING.CHIP_INSET,
    paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 107, 107, 0.38)',
  },
  text: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default OfflineBanner;
