/**
 * Pantalla de Dashboard de Crisis
 * Refactor: hook + subcomponentes en ./crisisDashboard/
 */
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { RefreshControl, SafeAreaView, ScrollView, StatusBar, View } from 'react-native';
import { colors } from '../styles/globalStyles';
import { useCrisisDashboardScreen } from './crisisDashboard/useCrisisDashboardScreen';
import { CrisisDashboardHeader } from './crisisDashboard/CrisisDashboardHeader';
import { CrisisDashboardLoadingView } from './crisisDashboard/CrisisDashboardLoadingView';
import { CrisisDashboardErrorView } from './crisisDashboard/CrisisDashboardErrorView';
import { CrisisDashboardSummary } from './crisisDashboard/CrisisDashboardSummary';
import { CrisisDashboardTrends } from './crisisDashboard/CrisisDashboardTrends';
import { CrisisDashboardMonthlyChart } from './crisisDashboard/CrisisDashboardMonthlyChart';
import { CrisisDashboardEmotionPie } from './crisisDashboard/CrisisDashboardEmotionPie';
import { CrisisDashboardHistory } from './crisisDashboard/CrisisDashboardHistory';
import { CrisisDashboardEmpty } from './crisisDashboard/CrisisDashboardEmpty';
import { styles } from './crisisDashboard/crisisDashboardStyles';

export default function CrisisDashboardScreen() {
  const navigation = useNavigation();
  const {
    loading,
    refreshing,
    error,
    summary,
    trends,
    crisisByMonth,
    emotionDistribution,
    history,
    trendPeriod,
    loadData,
    onRefresh,
    setTrendPeriod,
    formatTrendData,
    formatMonthlyData,
    formatEmotionDistribution,
    getRiskLevelColor,
    getRiskLevelText,
    formatDate,
    getTrendLabel,
    getTrendIcon,
    getTrendIconColor,
  } = useCrisisDashboardScreen();

  if (loading) {
    return <CrisisDashboardLoadingView />;
  }

  if (error) {
    return <CrisisDashboardErrorView error={error} onRetry={loadData} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <CrisisDashboardHeader onBack={() => navigation.goBack()} />

        <CrisisDashboardSummary
          summary={summary}
          getRiskLevelColor={getRiskLevelColor}
          getRiskLevelText={getRiskLevelText}
        />

        <CrisisDashboardTrends
          trendPeriod={trendPeriod}
          setTrendPeriod={setTrendPeriod}
          formatTrendData={formatTrendData}
          trends={trends}
          getTrendLabel={getTrendLabel}
          getTrendIcon={getTrendIcon}
          getTrendIconColor={getTrendIconColor}
        />

        <CrisisDashboardMonthlyChart
          crisisByMonth={crisisByMonth}
          formatMonthlyData={formatMonthlyData}
        />

        <CrisisDashboardEmotionPie
          emotionDistribution={emotionDistribution}
          formatEmotionDistribution={formatEmotionDistribution}
        />

        <CrisisDashboardHistory
          history={history}
          formatDate={formatDate}
          getRiskLevelColor={getRiskLevelColor}
          getRiskLevelText={getRiskLevelText}
          onViewAll={() => {}}
        />

        {summary && summary.totalCrises === 0 && <CrisisDashboardEmpty />}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}
