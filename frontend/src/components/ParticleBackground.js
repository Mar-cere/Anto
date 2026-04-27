import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';

const PARTICLE_COUNT = 10;

const ParticleBackground = () => {
  const particlesRef = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      key: i,
      initialPosX: Math.random() * Dimensions.get('window').width,
      initialPosY: Math.random() * Dimensions.get('window').height,
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(Math.random() * 0.5 + 0.1),
      size: Math.random() * 4 + 2,
    }))
  );

  useEffect(() => {
    particlesRef.current.forEach((particle) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.5 + 0.1,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: Math.random() * 0.3 + 0.05,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(particle.translateX, {
            toValue: Math.random() * 50 - 25,
            duration: 8000 + Math.random() * 7000,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: Math.random() * 50 - 25,
            duration: 8000 + Math.random() * 7000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  const particles = particlesRef.current.map((particle) => {
    return (
      <Animated.View
        key={particle.key}
        style={{
          position: 'absolute',
          left: particle.initialPosX,
          top: particle.initialPosY,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          backgroundColor: '#1ADDDB',
          opacity: particle.opacity,
          transform: [
            { translateX: particle.translateX },
            { translateY: particle.translateY },
          ]
        }}
      />
    );
  });

  return <View style={{ position: 'absolute', width: '100%', height: '100%' }}>{particles}</View>;
};

export default ParticleBackground; 