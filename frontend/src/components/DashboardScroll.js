import React from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../constants/ui';
import { getFloatingNavScrollBottomInset } from '../utils/floatingNavInsets';

const DashboardScroll = ({
  children,
  refreshing,
  onRefresh,
  contentContainerStyle,
  bottomInset,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollBottomInset =
    typeof bottomInset === 'number' && Number.isFinite(bottomInset)
      ? bottomInset
      : getFloatingNavScrollBottomInset(insets.bottom);

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
        },
        navSpacer: {
          height: scrollBottomInset,
        },
      }),
    [scrollBottomInset],
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
        <View style={styles.navSpacer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </ScrollView>
    </View>
  );
};

export default DashboardScroll;
