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
import EditEmergencyContactModal from '../components/EditEmergencyContactModal';
import EmergencyContactsModal from '../components/EmergencyContactsModal';
import { useProfileScreen } from './profileScreen/useProfileScreen';
import { ProfileHeader } from './profileScreen/ProfileHeader';
import { ProfileLoadingView } from './profileScreen/ProfileLoadingView';
import { ProfileSubscription } from './profileScreen/ProfileSubscription';
import { ProfileStats } from './profileScreen/ProfileStats';
import { ProfileOptions } from './profileScreen/ProfileOptions';
import { ProfileEmergencySection } from './profileScreen/ProfileEmergencySection';
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
    emergencyContacts,
    loadingContacts,
    subscriptionStatus,
    lastSessionSummary,
    openChatFromLastSession,
    showEmergencyContactsModal,
    setShowEmergencyContactsModal,
    showEditContactModal,
    selectedContact,
    handleRefresh,
    handleDeleteContact,
    handleEmergencyContactsSaved,
    handleLogout,
    openEditContact,
    closeEditContact,
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

        <View style={styles.sectionBlock}>
          <ProfileEmergencySection
            emergencyContacts={emergencyContacts}
            loadingContacts={loadingContacts}
            onOpenEmergencyModal={() => setShowEmergencyContactsModal(true)}
            onEditContact={openEditContact}
            onDeleteContact={handleDeleteContact}
            onOpenCrisisDashboard={() => navigation.navigate('CrisisDashboard')}
            onOpenAlertsHistory={() => navigation.navigate('EmergencyAlertsHistory')}
          />
        </View>

        <ProfileLogoutButton onLogout={handleLogout} />
      </ScrollView>

      <EmergencyContactsModal
        visible={showEmergencyContactsModal}
        onClose={() => setShowEmergencyContactsModal(false)}
        onSave={handleEmergencyContactsSaved}
        existingContacts={emergencyContacts}
      />

      <EditEmergencyContactModal
        visible={showEditContactModal}
        onClose={closeEditContact}
        onSave={handleEmergencyContactsSaved}
        contact={selectedContact}
      />
    </SafeAreaView>
  );
}
