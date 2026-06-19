import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { getHaloLayers } from '../../utils/dashboardBrandBackdropUtils';

const DashboardBrandBackdrop = memo(() => {
  const { colors, resolvedScheme } = useTheme();
  const layers = useMemo(
    () => getHaloLayers(resolvedScheme, colors),
    [resolvedScheme, colors],
  );

  return (
    <View style={styles.root} pointerEvents="none">
      {layers.map((layer) => (
        <View key={layer.key} style={[styles.layer, layer.style]} />
      ))}
    </View>
  );
});

DashboardBrandBackdrop.displayName = 'DashboardBrandBackdrop';

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  layer: {
    position: 'absolute',
  },
});

export default DashboardBrandBackdrop;
