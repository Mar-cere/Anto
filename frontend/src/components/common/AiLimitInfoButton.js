/**
 * Botón (i) que abre un tema contextual de límites IA (#194).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { AI_LIMIT_TOPIC, isValidAiLimitTopicId } from '../../constants/aiCompetenceLimits';
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
  const resolvedTopicId = isValidAiLimitTopicId(topicId)
    ? topicId
    : AI_LIMIT_TOPIC.GENERAL;
  const topic = useAiLimitTopic(resolvedTopicId);
  const a11yLabel = topic.title ? `${topic.hintA11y}: ${topic.title}` : topic.hintA11y;

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
        accessibilityLabel={a11yLabel}
        accessibilityHint={topic.sheetOpenLibrary}
      >
        <MaterialCommunityIcons
          name="information-outline"
          size={size}
          color={color}
        />
      </TouchableOpacity>
      <AiLimitHintSheet
        visible={open}
        topicId={resolvedTopicId}
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
