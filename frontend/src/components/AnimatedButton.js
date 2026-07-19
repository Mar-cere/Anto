import React, { useMemo } from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';

const hexToRgba = (hex, alpha) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const AnimatedButton = ({
  title,
  onPress,
  style,
  textStyle,
  buttonScale,
  buttonOpacity,
  accessibilityLabel,
  accessibilityHint,
  isPrimary = true,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        mainButton: {
          backgroundColor: hexToRgba(colors.primary, 0.85),
          paddingVertical: SPACING.HERO_INSET_COMPACT,
          paddingHorizontal: SPACING.HERO_INSET,
          borderRadius: 30,
          marginBottom: 20,
          width: '80%',
          alignItems: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 8,
        },
        mainButtonText: {
          color: colors.textOnPrimary,
          fontSize: 20,
          fontWeight: 'bold',
        },
        secondaryButton: {
          backgroundColor: colors.glassFill,
          paddingVertical: SPACING.HERO_INSET_COMPACT,
          paddingHorizontal: SPACING.HERO_INSET,
          borderRadius: 30,
          width: '80%',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.accentLine,
        },
        secondaryButtonText: {
          color: colors.primary,
          fontSize: 20,
          fontWeight: 'bold',
        },
      }),
    [colors],
  );

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onPress) onPress();
    });
  };

  return (
    <TouchableOpacity
      testID={testID}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint || `Toca para ${title}`}
      accessibilityRole="button"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        isPrimary ? styles.mainButton : styles.secondaryButton,
        { transform: [{ scale: buttonScale }], opacity: buttonOpacity },
        style,
      ]}
    >
      <Text style={[isPrimary ? styles.mainButtonText : styles.secondaryButtonText, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default AnimatedButton;
