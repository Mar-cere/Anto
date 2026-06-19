import React, { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HabitsTodayProgressRing({
  completed = 0,
  total = 0,
  radius = 34,
  strokeWidth = 5,
  color,
}) {
  const { colors } = useTheme();
  const ringColor = color || colors.success;
  const trackStroke = colors.border || colors.chromeCardBorder;
  const labelFill = colors.text;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = total > 0 ? completed / total : 0;
  const [animatedProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const animatedStrokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        svg: {
          width: radius * 2,
          height: radius * 2,
        },
      }),
    [radius],
  );

  return (
    <Svg height={radius * 2} width={radius * 2} style={styles.svg}>
      <Circle
        stroke={trackStroke}
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <AnimatedCircle
        stroke={ringColor}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={animatedStrokeDashoffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        rotation="-90"
        origin={`${radius}, ${radius}`}
      />
      <SvgText
        x={radius}
        y={radius + 5}
        textAnchor="middle"
        fill={labelFill}
        fontSize="13"
        fontWeight="600"
      >
        {`${completed}/${total || 0}`}
      </SvgText>
    </Svg>
  );
}
