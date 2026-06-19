/**
 * Pantalla de perfil de usuario
 * Refactor: hook + subcomponentes en ./profileScreen/
 */
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useProfileScreen } from './profileScreen/useProfileScreen';
import { ProfileHeader } from './profileScreen/ProfileHeader';
import { ProfileLoadingView } from './profileScreen/ProfileLoadingView';
import { ProfileSubscription } from './profileScreen/ProfileSubscription';
import { ProfileStats } from './profileScreen/ProfileStats';
import { ProfileOptions } from './profileScreen/ProfileOptions';
import { ProfileLogoutButton } from './profileScreen/ProfileLogoutButton';
import { LastSessionSummaryCard } from '../components/LastSessionSummaryCard';
import { useProfileScreenStyles } from './profileScreen/profileScreenStyles';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { styles, profileColors } = useProfileScreenStyles();
  const navigation = useNavigation();
  const {
    loading,
    refreshing,
    userData,
    detailedStats,
    subscriptionStatus,
    lastSessionSummary,
    openChatFromLastSession,
    handleRefresh,
    handleLogout,
  } = useProfileScreen(navigation);

  if (loading) {
    return <ProfileLoadingView />;
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ProfileHeader navigation={navigation} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={profileColors.PRIMARY}
            colors={[profileColors.PRIMARY]}
            progressBackgroundColor={profileColors.REFRESH_PROGRESS_BACKGROUND}
          />
        }
      >
        <View style={styles.sectionBlock}>
          <View style={styles.profileSection}>
            <Text style={styles.userName}>{userData.username}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
          </View>
          <ProfileSubscription
            subscriptionStatus={subscriptionStatus}
            nestedAfterProfile
          />
        </View>

        {lastSessionSummary ? (
          <View style={styles.sectionBlock}>
            <LastSessionSummaryCard
              summary={lastSessionSummary}
              flushWithParentGutter
              onOpenChat={() => openChatFromLastSession(lastSessionSummary?.conversationId)}
            />
          </View>
        ) : null}

        <View style={styles.sectionBlock}>
          <ProfileStats userData={userData} detailedStats={detailedStats} />
        </View>

        <View style={styles.sectionBlock}>
          <ProfileOptions navigation={navigation} />
        </View>

        <ProfileLogoutButton onLogout={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}
