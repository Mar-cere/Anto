import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function BrandGradientFab({
  onPress,
  bottom,
  accessibilityLabel,
  icon = 'add',
  iconSize = 28,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          position: 'absolute',
          right: 16,
          bottom,
          width: 56,
          height: 56,
          borderRadius: 28,
          zIndex: 4,
        },
        glow: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: 28,
          backgroundColor: colors.accentLine,
          opacity: 0.35,
          transform: [{ scale: 1.08 }],
        },
        shell: {
          flex: 1,
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: 'rgba(255,255,255,0.22)',
          elevation: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        },
        gradientTop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.primary,
        },
        gradientBottom: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '55%',
          backgroundColor: colors.accentLine,
          opacity: 0.88,
        },
        pressable: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [colors, bottom],
  );

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.glow} pointerEvents="none" />
      <View style={styles.shell}>
        <View style={styles.gradientTop} pointerEvents="none" />
        <View style={styles.gradientBottom} pointerEvents="none" />
        <Pressable
          style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.9 }]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Ionicons name={icon} size={iconSize} color={colors.textOnPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
