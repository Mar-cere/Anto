/**
 * Sección de contactos de emergencia y enlaces (Crisis Dashboard, Historial de Alertas)
 */
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useProfileScreenStyles } from './profileScreenStyles';
import { ICON_SIZE, useProfileTexts } from './profileScreenConstants';
import { getEmergencyContactId } from '../../utils/emergencyContactUtils';
import AiLimitInfoButton from '../../components/common/AiLimitInfoButton';
import { AI_LIMIT_TOPIC } from '../../constants/aiCompetenceLimits';

function hapticLight() {
  if (Platform.OS === 'ios') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function ProfileEmergencySection({
  emergencyContacts,
  loadingContacts,
  onAddContacts,
  onEditContact,
  onDeleteContact,
  onOpenCrisisDashboard,
  onOpenAlertsHistory,
  onOpenEmergencyModal,
  onOpenAiLimitsLibrary,
}) {
  const TEXTS = useProfileTexts();
  const { styles, profileColors } = useProfileScreenStyles();
  return (
    <View style={styles.optionsContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.sectionTitle}>{TEXTS.EMERGENCY_CONTACTS}</Text>
        {onOpenAiLimitsLibrary ? (
          <AiLimitInfoButton
            topicId={AI_LIMIT_TOPIC.EMERGENCY_CONTACTS}
            size={20}
            color={profileColors.PRIMARY}
            onOpenFullLibrary={onOpenAiLimitsLibrary}
          />
        ) : null}
      </View>
      <View style={styles.emergencyContactsSection}>
        {loadingContacts ? (
          <Text style={styles.loadingText}>{TEXTS.LOADING_CONTACTS}</Text>
        ) : emergencyContacts.length === 0 ? (
          <Text style={styles.emptyText}>{TEXTS.NO_CONTACTS}</Text>
        ) : (
          <View style={styles.contactsList}>
            {emergencyContacts.map((contact, index) => (
              <View
                key={getEmergencyContactId(contact) || `contact-${index}`}
                style={styles.contactItem}
              >
                <View style={styles.contactMainContent}>
                  <View style={styles.contactHeader}>
                    <View style={styles.contactHeaderLeft}>
                      <View style={styles.contactTitleContainer}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        {contact.relationship && (
                          <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        onPress={() => {
                          hapticLight();
                          onEditContact(contact);
                        }}
                        style={styles.contactActionButton}
                        accessibilityLabel={TEXTS.EDIT_CONTACT}
                      >
                        <Ionicons name="pencil-outline" size={18} color={profileColors.PRIMARY} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDeleteContact(getEmergencyContactId(contact))}
                        style={[styles.contactActionButton, styles.contactActionButtonDelete]}
                        accessibilityLabel={TEXTS.DELETE_CONTACT}
                      >
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={18}
                          color={profileColors.ERROR}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.contactDetails}>
                    {contact.phone ? (
                      <View style={styles.contactDetailRow}>
                        <MaterialCommunityIcons
                          name="whatsapp"
                          size={16}
                          color={profileColors.PRIMARY}
                        />
                        <Text style={styles.contactDetailText}>{contact.phone}</Text>
                      </View>
                    ) : (
                      <View style={styles.contactDetailRow}>
                        <MaterialCommunityIcons
                          name="alert-outline"
                          size={16}
                          color={profileColors.ERROR}
                        />
                        <Text style={styles.contactDetailText}>
                          {TEXTS.MISSING_PHONE_ALERTS}
                        </Text>
                      </View>
                    )}
                    <View style={styles.contactDetailRow}>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={16}
                        color={profileColors.PRIMARY}
                      />
                      <Text style={styles.contactDetailText}>{contact.email}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      {emergencyContacts.length < 2 && (
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            hapticLight();
            onOpenEmergencyModal();
          }}
          accessibilityLabel={TEXTS.ADD_CONTACTS}
        >
          <MaterialCommunityIcons name="plus-circle" size={ICON_SIZE} color={profileColors.PRIMARY} />
          <Text style={styles.optionText}>{TEXTS.ADD_CONTACTS}</Text>
          <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => {
          hapticLight();
          onOpenCrisisDashboard();
        }}
        accessibilityLabel={TEXTS.CRISIS_DASHBOARD}
      >
        <MaterialCommunityIcons name="chart-line" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <View style={styles.optionContent}>
          <Text style={styles.optionText}>{TEXTS.CRISIS_DASHBOARD}</Text>
          <Text style={styles.optionSubtext}>{TEXTS.CRISIS_DASHBOARD_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => {
          hapticLight();
          onOpenAlertsHistory();
        }}
        accessibilityLabel={TEXTS.ALERTS_HISTORY}
      >
        <MaterialCommunityIcons name="history" size={ICON_SIZE} color={profileColors.PRIMARY} />
        <View style={styles.optionContent}>
          <Text style={styles.optionText}>{TEXTS.ALERTS_HISTORY}</Text>
          <Text style={styles.optionSubtext}>{TEXTS.ALERTS_HISTORY_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={profileColors.PRIMARY} />
      </TouchableOpacity>
    </View>
  );
}
