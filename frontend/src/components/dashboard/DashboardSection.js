import React, { memo, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { createDashboardStyles } from '../../styles/dashboardTheme';

const DashboardSection = memo(({
  title,
  viewAllLabel,
  onViewAll,
  hint,
  footerLabel,
  onFooterPress,
  children,
  accessibilityLabel,
}) => {
  const { colors, resolvedScheme } = useTheme();
  const styles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  return (
    <View style={styles.section} accessibilityRole="summary" accessibilityLabel={accessibilityLabel}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {viewAllLabel && onViewAll ? (
          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel={viewAllLabel}
          >
            <Text style={styles.sectionLink}>{viewAllLabel}</Text>
          </Pressable>
        ) : null}
      </View>

      {hint ? (
        <Text style={[styles.sectionHint, { marginBottom: 10, paddingHorizontal: 2 }]}>
          {hint}
        </Text>
      ) : null}

      {children}

      {footerLabel && onFooterPress ? (
        <Pressable
          onPress={onFooterPress}
          style={styles.sectionFooterLink}
          accessibilityRole="button"
          accessibilityLabel={footerLabel}
        >
          <Text style={styles.sectionFooterLinkText}>{footerLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
});

DashboardSection.displayName = 'DashboardSection';

export default DashboardSection;
