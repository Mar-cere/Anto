/**
 * Skeleton UI components (placeholders while loading)
 *
 * Uso:
 *   <SkeletonBlock height={16} width="60%" />
 *   <SkeletonBlock height={72} radius={14} />
 *
 * @author AntoApp Team
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '../styles/globalStyles';

const DEFAULT_DURATION = 900;
const MIN_OPACITY = 0.45;
const MAX_OPACITY = 1;

const baseColor = 'rgba(255,255,255,0.08)';
const highlightColor = 'rgba(255,255,255,0.12)';

export const SkeletonBlock = ({
  width = '100%',
  height = 16,
  radius = 10,
  style,
}) => {
  const opacity = useRef(new Animated.Value(MIN_OPACITY)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: MAX_OPACITY,
          duration: DEFAULT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: MIN_OPACITY,
          duration: DEFAULT_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard = ({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <SkeletonBlock width={40} height={40} radius={12} style={styles.icon} />
        <View style={styles.flex}>
          <SkeletonBlock width="65%" height={14} radius={8} />
          <SkeletonBlock width="45%" height={12} radius={8} style={styles.mt8} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={12} radius={8} style={styles.mt12} />
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    backgroundColor: baseColor,
    borderWidth: 1,
    borderColor: highlightColor,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  flex: {
    flex: 1,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
});

export default SkeletonBlock;

