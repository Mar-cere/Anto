import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingNavBar from '../components/FloatingNavBar';
import TasksAndHabitsHeader from '../components/tasksAndHabits/TasksAndHabitsHeader';
import HabitsScreen from './HabitsScreen';
import TaskScreen from './TaskScreen';
import { SPACING } from '../constants/ui';
import { useTheme } from '../context/ThemeContext';

function resolveInitialTab(route) {
  if (route?.name === 'Habits') return 'habits';
  if (route?.params?.tab === 'habits') return 'habits';
  return 'tasks';
}

export default function TasksAndHabitsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(() => resolveInitialTab(route));
  const [searchQuery, setSearchQuery] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeArea: {
          flex: 1,
        },
        panel: {
          flex: 1,
        },
        hidden: {
          display: 'none',
        },
      }),
    [colors.background],
  );

  useEffect(() => {
    const nextTab = route?.params?.tab;
    if (nextTab === 'habits' || nextTab === 'tasks') {
      setActiveTab(nextTab);
    }
  }, [route?.params?.tab]);

  useEffect(() => {
    if (route?.params?.openModal && route?.params?.tab !== 'tasks') {
      setActiveTab('habits');
    }
  }, [route?.params?.openModal, route?.params?.tab]);

  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      navigation.setParams({ tab });
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <TasksAndHabitsHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <View style={[styles.panel, activeTab !== 'tasks' && styles.hidden]}>
          <TaskScreen
            route={route}
            embedded
            unifiedView
            externalSearchQuery={searchQuery}
            contentBottomInset={insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA}
          />
        </View>
        <View style={[styles.panel, activeTab !== 'habits' && styles.hidden]}>
          <HabitsScreen
            route={route}
            navigation={navigation}
            embedded
            externalSearchQuery={searchQuery}
            contentBottomInset={insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA}
          />
        </View>
      </SafeAreaView>
      <FloatingNavBar activeTab="calendar" />
    </View>
  );
}
