import { Ionicons } from '@expo/vector-icons';
import React, { memo, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { createDashboardStyles } from '../../styles/dashboardTheme';
import { getFocusTheme } from '../../styles/focusCardTheme';

const DashboardGroupedRow = memo(({
  icon,
  iconNode,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  showChevron = true,
  isLast = false,
  titleStyle,
}) => {
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
  const focus = useMemo(
    () => getFocusTheme(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const content = (
    <>
      <View style={styles.rowIcon}>
        {iconNode || (
          <Ionicons name={icon || 'ellipse-outline'} size={22} color={colors.primary} />
        )}
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, titleStyle]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowMeta} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showChevron && onPress ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={focus.FOCUS_CHEVRON_MUTED}
          style={styles.rowChevron}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.groupedRow, !isLast && styles.groupedRowBorder]}>
        {content}
      </View>
    );
  }

  return (
    <View style={!isLast ? styles.groupedRowBorder : undefined}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.groupedRow, pressed && { opacity: 0.88 }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </Pressable>
    </View>
  );
});

DashboardGroupedRow.displayName = 'DashboardGroupedRow';

export default DashboardGroupedRow;
