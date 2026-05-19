/**
 * Pantalla de Historial de Alertas de Emergencia
 * Refactor: hook + constantes + subcomponentes en screens/emergencyAlertsHistory/
 */
import React from 'react';
import { SafeAreaView, ScrollView, FlatList, RefreshControl, StatusBar, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useEmergencyAlertsHistoryScreen } from './emergencyAlertsHistory/useEmergencyAlertsHistoryScreen';
import { EmergencyAlertsHeader } from './emergencyAlertsHistory/EmergencyAlertsHeader';
import { EmergencyAlertsTabs } from './emergencyAlertsHistory/EmergencyAlertsTabs';
import { HistoryItem } from './emergencyAlertsHistory/HistoryItem';
import { EmergencyAlertsEmptyState } from './emergencyAlertsHistory/EmergencyAlertsEmptyState';
import { EmergencyAlertsLoadingView } from './emergencyAlertsHistory/EmergencyAlertsLoadingView';
import { EmergencyAlertsErrorView } from './emergencyAlertsHistory/EmergencyAlertsErrorView';
import { EmergencyAlertsTabError } from './emergencyAlertsHistory/EmergencyAlertsTabError';
import { StatsTab } from './emergencyAlertsHistory/StatsTab';
import { PatternsTab } from './emergencyAlertsHistory/PatternsTab';
import { useEmergencyAlertsHistoryStyles } from './emergencyAlertsHistory/emergencyAlertsHistoryStyles';
import {
  TABS,
  FLATLIST,
  useEmergencyAlertsHistoryTexts,
} from './emergencyAlertsHistory/emergencyAlertsHistoryConstants';
import { crisisSafeGoBack, crisisSafeNavigate } from './crisisDashboard/crisisDashboardNavigate';
import {
  countPatternPeriodAlerts,
  safeHistoryLength,
  safeNonNegativeInt,
} from './emergencyAlertsHistory/emergencyAlertsHistoryUtils';

const EmergencyAlertsHistoryScreen = () => {
  const navigation = useNavigation();
  const { colors, statusBarStyle } = useTheme();
  const styles = useEmergencyAlertsHistoryStyles();
  const TEXTS = useEmergencyAlertsHistoryTexts();
  const {
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    error,
    history,
    stats,
    patterns,
    statsError,
    patternsError,
    loadData,
    retryStats,
    retryPatterns,
    onRefresh,
    formatDate,
    formatRiskLevelData,
    formatStatusData,
    formatChannelData,
    formatDayData,
  } = useEmergencyAlertsHistoryScreen();

  const goToProfile = () => {
    crisisSafeNavigate(navigation, 'MainTabs', { screen: 'Perfil' });
  };

  if (loading && !refreshing) return <EmergencyAlertsLoadingView />;
  if (error && !refreshing) {
    return (
      <EmergencyAlertsErrorView onRetry={() => loadData()} detail={error} />
    );
  }

  const renderHistoryItem = ({ item }) => <HistoryItem item={item} formatDate={formatDate} />;

  const hasStatsForSummary = stats != null && !statsError;
  const summaryHint = hasStatsForSummary ? TEXTS.SUMMARY_HINT_WITH_STATS : TEXTS.SUMMARY_HINT_LIST_ONLY;
  const summaryTotal = hasStatsForSummary ? safeNonNegativeInt(stats.total) : safeHistoryLength(history);

  const listHeader = (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{TEXTS.TOTAL_ALERTS}</Text>
      <Text style={styles.summaryValue}>{summaryTotal}</Text>
      <Text style={styles.summaryHint}>{summaryHint}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <EmergencyAlertsHeader onBack={() => crisisSafeGoBack(navigation)} />
      <EmergencyAlertsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        statsTabError={!!statsError}
        patternsTabError={!!patternsError}
        historyCount={safeHistoryLength(history)}
        statsCount={stats != null && !statsError ? safeNonNegativeInt(stats.total) : undefined}
        patternsCount={
          patterns != null && !patternsError ? countPatternPeriodAlerts(patterns) : undefined
        }
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {activeTab === TABS.HISTORY && (
          <View style={styles.tabContent}>
            {safeHistoryLength(history) === 0 ? (
              <>
                {listHeader}
                <EmergencyAlertsEmptyState onConfigureContacts={goToProfile} />
              </>
            ) : (
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => {
                  if (item != null && item._id != null && String(item._id) !== '') {
                    return String(item._id);
                  }
                  return `history-${index}`;
                }}
                scrollEnabled={false}
                initialNumToRender={FLATLIST.INITIAL_NUM_TO_RENDER}
                windowSize={FLATLIST.WINDOW_SIZE}
                maxToRenderPerBatch={FLATLIST.MAX_TO_RENDER_PER_BATCH}
                ListHeaderComponent={listHeader}
              />
            )}
          </View>
        )}
        {activeTab === TABS.STATS && (
          <View style={styles.tabContent}>
            {statsError ? (
              <EmergencyAlertsTabError message={statsError} onRetry={retryStats} />
            ) : stats ? (
              <StatsTab
                stats={stats}
                formatRiskLevelData={formatRiskLevelData}
                formatStatusData={formatStatusData}
                formatChannelData={formatChannelData}
                formatDayData={formatDayData}
              />
            ) : null}
          </View>
        )}
        {activeTab === TABS.PATTERNS && (
          <View style={styles.tabContent}>
            {patternsError ? (
              <EmergencyAlertsTabError message={patternsError} onRetry={retryPatterns} />
            ) : patterns ? (
              <PatternsTab patterns={patterns} />
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmergencyAlertsHistoryScreen;
