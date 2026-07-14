import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

const FocusActionRow = memo(({
  icon,
  title,
  subtitle,
  badge,
  onPress,
  a11yLabel,
  styles,
  iconColor,
  chevronColor,
  showChevron,
  subtitleLines = 2,
}) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      styles.actionRow,
      pressed && onPress && { opacity: 0.88 },
    ]}
    accessibilityRole={onPress ? 'button' : 'text'}
    accessibilityLabel={a11yLabel}
  >
    <View style={styles.actionIconWrap}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
    <View style={styles.actionCopy}>
      <Text style={styles.actionTitle} numberOfLines={2}>
        {title}
      </Text>
      {badge ? <Text style={styles.lastSessionBadge}>{badge}</Text> : null}
      {subtitle ? (
        <Text style={styles.actionMeta} numberOfLines={subtitleLines}>
          {subtitle}
        </Text>
      ) : null}
    </View>
    {showChevron ? (
      <Ionicons name="chevron-forward" size={18} color={chevronColor} style={styles.actionChevron} />
    ) : null}
  </Pressable>
));
FocusActionRow.displayName = 'FocusActionRow';

export default FocusActionRow;
