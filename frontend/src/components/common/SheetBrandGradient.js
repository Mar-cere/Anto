import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Gradiente diagonal suave para sheets (racha, héroes).
 */
function SheetBrandGradient({ topColor, bottomColor, style }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const gradId = useMemo(
    () => `sheetBrandGrad-${topColor}-${bottomColor}`.replace(/[^a-zA-Z0-9_-]/g, ''),
    [topColor, bottomColor],
  );

  return (
    <View
      style={[styles.fill, style]}
      pointerEvents="none"
      onLayout={({ nativeEvent }) => {
        const { width, height } = nativeEvent.layout;
        if (width !== size.width || height !== size.height) {
          setSize({ width, height });
        }
      }}
    >
      {size.width > 0 && size.height > 0 ? (
        <Svg width={size.width} height={size.height}>
          <Defs>
            <LinearGradient
              id={gradId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={topColor} />
              <Stop offset="42%" stopColor={topColor} />
              <Stop offset="100%" stopColor={bottomColor} />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={`url(#${gradId})`}
          />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default memo(SheetBrandGradient);
