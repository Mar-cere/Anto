import React from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';

const DashboardScroll = ({
  children, 
  refreshing, 
  onRefresh,
  contentContainerStyle,
}) => {
  const { colors } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        scrollView: {
          flex: 1,
          backgroundColor: 'transparent',
        },
        contentContainer: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingTop: 8,
          paddingBottom: 100,
        },
      }),
    [],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {children}
      </ScrollView>
    </View>
  );
};

export default DashboardScroll;
