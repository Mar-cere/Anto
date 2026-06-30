/**
 * Botón (i) que abre un tema contextual de límites IA (#194).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AI_LIMIT_TOPIC } from '../../constants/aiCompetenceLimits';
import { useAiLimitTopic } from '../../hooks/useAiLimitTopic';
import AiLimitHintSheet from './AiLimitHintSheet';

export default function AiLimitInfoButton({
  topicId = AI_LIMIT_TOPIC.GENERAL,
  size = 20,
  color,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
  style,
  onOpenFullLibrary,
}) {
  const [open, setOpen] = useState(false);
  const topic = useAiLimitTopic(topicId);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  if (!topic.hasContent) return null;

  return (
    <>
      <TouchableOpacity
        onPress={handleOpen}
        hitSlop={hitSlop}
        style={style}
        accessibilityRole="button"
        accessibilityLabel={topic.hintA11y}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={size}
          color={color}
        />
      </TouchableOpacity>
      <AiLimitHintSheet
        visible={open}
        topicId={topicId}
        onClose={handleClose}
        onOpenFullLibrary={
          onOpenFullLibrary
            ? () => {
                setOpen(false);
                onOpenFullLibrary();
              }
            : undefined
        }
      />
    </>
  );
}
