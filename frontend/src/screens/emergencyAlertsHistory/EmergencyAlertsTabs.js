import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS, TABS } from './emergencyAlertsHistoryConstants';

/** null = sin badge; número finito >= 0 para pill y a11y */
function normalizeTabCount(count) {
  if (count == null || typeof count !== 'number') return null;
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.floor(count));
}

function formatBadgeFromNormalized(n) {
  if (n > 99) return '99+';
  return String(n);
}

export function EmergencyAlertsTabs({
  activeTab,
  onTabChange,
  statsTabError = false,
  patternsTabError = false,
  historyCount,
  statsCount,
  patternsCount,
}) {
  const onPress = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (typeof onTabChange === 'function') {
      onTabChange(tab);
    }
  };

  const renderTab = (tab, label, hasError, count) => {
    const selected = activeTab === tab;
    const normalized = normalizeTabCount(count);
    const badgeText = normalized != null ? formatBadgeFromNormalized(normalized) : null;

    let a11ySuffix = '';
    if (normalized != null) {
      if (normalized > 99) a11ySuffix = ', más de 99 alertas';
      else if (normalized === 1) a11ySuffix = ', una alerta';
      else if (normalized === 0) a11ySuffix = ', sin alertas';
      else a11ySuffix = `, ${normalized} alertas`;
    }
    const a11yLabel = `${label}${a11ySuffix}`;

    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tab, selected && styles.tabActive]}
        onPress={() => onPress(tab)}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={a11yLabel}
        accessibilityHint={hasError ? TEXTS.TAB_ERROR_HINT : undefined}
      >
        <View style={styles.tabLabelRow}>
          <Text
            style={[styles.tabText, selected && styles.tabTextActive]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {label}
          </Text>
          {badgeText != null ? (
            <View
              style={[
                styles.tabCountBadge,
                selected && styles.tabCountBadgeActive,
              ]}
              accessible={false}
            >
              <Text
                style={[
                  styles.tabCountBadgeText,
                  selected && styles.tabCountBadgeTextActive,
                ]}
              >
                {badgeText}
              </Text>
            </View>
          ) : null}
          {hasError ? <View style={styles.tabErrorDot} accessible={false} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {renderTab(TABS.HISTORY, TEXTS.TAB_HISTORY, false, historyCount)}
      {renderTab(TABS.STATS, TEXTS.TAB_STATS, statsTabError, statsCount)}
      {renderTab(TABS.PATTERNS, TEXTS.TAB_PATTERNS, patternsTabError, patternsCount)}
    </View>
  );
}
