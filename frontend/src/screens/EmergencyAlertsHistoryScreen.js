/**
 * Pantalla de Historial de Alertas de Emergencia
 * Refactor: hook + constantes + subcomponentes en screens/emergencyAlertsHistory/
 */
import React from 'react';
import { SafeAreaView, ScrollView, FlatList, RefreshControl, StatusBar, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/globalStyles';
import { useEmergencyAlertsHistoryScreen } from './emergencyAlertsHistory/useEmergencyAlertsHistoryScreen';
import { EmergencyAlertsHeader } from './emergencyAlertsHistory/EmergencyAlertsHeader';
import { EmergencyAlertsTabs } from './emergencyAlertsHistory/EmergencyAlertsTabs';
import { HistoryItem } from './emergencyAlertsHistory/HistoryItem';
import { EmergencyAlertsEmptyState } from './emergencyAlertsHistory/EmergencyAlertsEmptyState';
import { EmergencyAlertsLoadingView } from './emergencyAlertsHistory/EmergencyAlertsLoadingView';
import { EmergencyAlertsErrorView } from './emergencyAlertsHistory/EmergencyAlertsErrorView';
import { StatsTab } from './emergencyAlertsHistory/StatsTab';
import { PatternsTab } from './emergencyAlertsHistory/PatternsTab';
import { styles } from './emergencyAlertsHistory/emergencyAlertsHistoryStyles';
import { TEXTS, TABS } from './emergencyAlertsHistory/emergencyAlertsHistoryConstants';
import { FLATLIST } from './emergencyAlertsHistory/emergencyAlertsHistoryConstants';

const EmergencyAlertsHistoryScreen = () => {
  const navigation = useNavigation();
  const {
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    error,
    history,
    stats,
    patterns,
    loadData,
    onRefresh,
    formatDate,
    formatRiskLevelData,
    formatStatusData,
    formatChannelData,
    formatDayData,
  } = useEmergencyAlertsHistoryScreen();

  const goToProfile = () => navigation.navigate('MainTabs', { screen: 'Perfil' });

  if (loading && !refreshing) return <EmergencyAlertsLoadingView />;
  if (error && !refreshing) return <EmergencyAlertsErrorView onRetry={loadData} />;

  const renderHistoryItem = ({ item }) => <HistoryItem item={item} formatDate={formatDate} />;

  const listHeader = (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{TEXTS.TOTAL_ALERTS}</Text>
      <Text style={styles.summaryValue}>{stats?.total ?? history.length}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <EmergencyAlertsHeader onBack={() => navigation.goBack()} />
      <EmergencyAlertsTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {activeTab === TABS.HISTORY && (
          <View style={styles.tabContent}>
            {history.length === 0 ? (
              <EmergencyAlertsEmptyState onConfigureContacts={goToProfile} />
            ) : (
              <FlatList
                data={history}
                renderItem={renderHistoryItem}
                keyExtractor={(item, index) => item._id || index.toString()}
                scrollEnabled={false}
                initialNumToRender={FLATLIST.INITIAL_NUM_TO_RENDER}
                windowSize={FLATLIST.WINDOW_SIZE}
                maxToRenderPerBatch={FLATLIST.MAX_TO_RENDER_PER_BATCH}
                ListHeaderComponent={listHeader}
              />
            )}
          </View>
        )}
        {activeTab === TABS.STATS && stats && (
          <StatsTab
            stats={stats}
            formatRiskLevelData={formatRiskLevelData}
            formatStatusData={formatStatusData}
            formatChannelData={formatChannelData}
            formatDayData={formatDayData}
          />
        )}
        {activeTab === TABS.PATTERNS && patterns && <PatternsTab patterns={patterns} />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmergencyAlertsHistoryScreen;
