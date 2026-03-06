/**
 * Indicador de “Anto está escribiendo…” con puntos animados.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import {
  CHAT_COLORS,
  LAYOUT,
  TYPING_ANIMATION_DELAYS,
  TYPING_ANIMATION_DURATION,
  TYPING_ANIMATION_TO_VALUE,
  TYPING_TRANSLATE_Y,
} from '../../screens/chat/chatScreenConstants';

const ANTO_AVATAR = require('../../images/Anto.png');

const styles = StyleSheet.create({
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: LAYOUT.TYPING_CONTAINER_MARGIN_BOTTOM,
  },
  typingAvatar: {
    width: LAYOUT.HEADER_AVATAR_SIZE,
    height: LAYOUT.HEADER_AVATAR_SIZE,
    borderRadius: 15,
    marginRight: 8,
  },
  typingBubble: {
    backgroundColor: CHAT_COLORS.TYPING_BUBBLE_BACKGROUND,
    borderRadius: LAYOUT.MESSAGE_BUBBLE_BORDER_RADIUS,
    borderBottomLeftRadius: LAYOUT.MESSAGE_BUBBLE_CORNER_RADIUS,
    padding: LAYOUT.MESSAGE_BUBBLE_PADDING,
    maxWidth: LAYOUT.TYPING_BUBBLE_MAX_WIDTH,
  },
  typingDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: LAYOUT.TYPING_DOTS_CONTAINER_HEIGHT,
  },
  typingDot: {
    width: LAYOUT.TYPING_DOT_SIZE,
    height: LAYOUT.TYPING_DOT_SIZE,
    borderRadius: LAYOUT.TYPING_DOT_BORDER_RADIUS,
    backgroundColor: CHAT_COLORS.TYPING_DOT,
    marginHorizontal: LAYOUT.TYPING_DOT_MARGIN_HORIZONTAL,
  },
});

function TypingDot({ delay }) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: TYPING_ANIMATION_TO_VALUE,
          duration: TYPING_ANIMATION_DURATION,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: TYPING_ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animation, delay]);

  return (
    <Animated.View
      style={[
        styles.typingDot,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, TYPING_TRANSLATE_Y],
              }),
            },
          ],
        },
      ]}
    />
  );
}

export default function ChatTypingIndicator() {
  return (
    <View style={styles.typingContainer}>
      <Image source={ANTO_AVATAR} style={styles.typingAvatar} />
      <View style={styles.typingBubble}>
        <View style={styles.typingDotsContainer}>
          {TYPING_ANIMATION_DELAYS.map((delay, index) => (
            <TypingDot key={index} delay={delay} />
          ))}
        </View>
      </View>
    </View>
  );
}
