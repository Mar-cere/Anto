import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { styles } from './emergencyAlertsHistoryStyles';
import { TEXTS, TABS } from './emergencyAlertsHistoryConstants';

export function EmergencyAlertsTabs({ activeTab, onTabChange }) {
  const onPress = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabChange(tab);
  };

  return (
    <View style={styles.tabs}>
      <TouchableOpacity
        style={[styles.tab, activeTab === TABS.HISTORY && styles.tabActive]}
        onPress={() => onPress(TABS.HISTORY)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === TABS.HISTORY }}
        accessibilityLabel={TEXTS.TAB_HISTORY}
      >
        <Text style={[styles.tabText, activeTab === TABS.HISTORY && styles.tabTextActive]}>{TEXTS.TAB_HISTORY}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === TABS.STATS && styles.tabActive]}
        onPress={() => onPress(TABS.STATS)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === TABS.STATS }}
        accessibilityLabel={TEXTS.TAB_STATS}
      >
        <Text style={[styles.tabText, activeTab === TABS.STATS && styles.tabTextActive]}>{TEXTS.TAB_STATS}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === TABS.PATTERNS && styles.tabActive]}
        onPress={() => onPress(TABS.PATTERNS)}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === TABS.PATTERNS }}
        accessibilityLabel={TEXTS.TAB_PATTERNS}
      >
        <Text style={[styles.tabText, activeTab === TABS.PATTERNS && styles.tabTextActive]}>{TEXTS.TAB_PATTERNS}</Text>
      </TouchableOpacity>
    </View>
  );
}
