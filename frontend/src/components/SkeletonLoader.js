import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// Componente de esqueleto para carga
const SkeletonLoader = ({ width, height, style }) => {
  const { colors } = useTheme();
  const opacity = useState(new Animated.Value(0.3))[0];
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    animation.start();
    
    return () => animation.stop();
  }, [opacity]);
  
  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: colors.chromeInput,
          borderRadius: 5,
          opacity,
        },
        style,
      ]}
    />
  );
};

export default SkeletonLoader; 