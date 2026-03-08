/**
 * Pantalla de perfil de usuario
 * Refactor: hook + subcomponentes en ./profileScreen/
 */
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  ImageBackground,
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
import { styles } from './profileScreen/profileScreenStyles';
import { COLORS, SCROLL_PADDING_BOTTOM, BACKGROUND_IMAGE } from './profileScreen/profileScreenConstants';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const {
    loading,
    refreshing,
    userData,
    detailedStats,
    emergencyContacts,
    loadingContacts,
    subscriptionStatus,
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
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.PRIMARY}
              colors={[COLORS.PRIMARY]}
              progressBackgroundColor={COLORS.REFRESH_PROGRESS_BACKGROUND}
            />
          }
          contentContainerStyle={{ paddingBottom: SCROLL_PADDING_BOTTOM }}
        >
          <ProfileHeader navigation={navigation} />

          <View style={styles.profileSection}>
            <Text style={styles.userName}>{userData.username}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
          </View>

          <ProfileSubscription subscriptionStatus={subscriptionStatus} />
          <ProfileStats userData={userData} detailedStats={detailedStats} />
          <ProfileOptions navigation={navigation} />

          <View style={styles.separator} />

          <ProfileEmergencySection
            emergencyContacts={emergencyContacts}
            loadingContacts={loadingContacts}
            onOpenEmergencyModal={() => setShowEmergencyContactsModal(true)}
            onEditContact={openEditContact}
            onDeleteContact={handleDeleteContact}
            onOpenCrisisDashboard={() => navigation.navigate('CrisisDashboard')}
            onOpenAlertsHistory={() => navigation.navigate('EmergencyAlertsHistory')}
          />

          <ProfileLogoutButton onLogout={handleLogout} />
        </ScrollView>
      </ImageBackground>

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
