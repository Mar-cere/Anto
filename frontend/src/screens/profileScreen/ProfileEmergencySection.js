/**
 * Sección de contactos de emergencia y enlaces (Crisis Dashboard, Historial de Alertas)
 */
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { styles } from './profileScreenStyles';
import { COLORS, TEXTS, ICON_SIZE } from './profileScreenConstants';

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
}) {
  return (
    <View style={styles.optionsContainer}>
      <Text style={styles.sectionTitle}>{TEXTS.EMERGENCY_CONTACTS}</Text>
      <View style={styles.emergencyContactsSection}>
        {loadingContacts ? (
          <Text style={styles.loadingText}>{TEXTS.LOADING_CONTACTS}</Text>
        ) : emergencyContacts.length === 0 ? (
          <Text style={styles.emptyText}>{TEXTS.NO_CONTACTS}</Text>
        ) : (
          <View style={styles.contactsList}>
            {emergencyContacts.map((contact) => (
              <View key={contact._id} style={styles.contactItem}>
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
                        accessibilityLabel="Editar contacto"
                      >
                        <Ionicons name="pencil-outline" size={18} color={COLORS.PRIMARY} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDeleteContact(contact._id)}
                        style={[styles.contactActionButton, styles.contactActionButtonDelete]}
                        accessibilityLabel={TEXTS.DELETE_CONTACT}
                      >
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={18}
                          color={COLORS.ERROR}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.contactDetails}>
                    <View style={styles.contactDetailRow}>
                      <MaterialCommunityIcons
                        name="email-outline"
                        size={16}
                        color={COLORS.ACCENT}
                      />
                      <Text style={styles.contactDetailText}>{contact.email}</Text>
                    </View>
                    {contact.phone && (
                      <View style={styles.contactDetailRow}>
                        <MaterialCommunityIcons
                          name="phone-outline"
                          size={16}
                          color={COLORS.ACCENT}
                        />
                        <Text style={styles.contactDetailText}>{contact.phone}</Text>
                      </View>
                    )}
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
          <MaterialCommunityIcons name="plus-circle" size={ICON_SIZE} color={COLORS.PRIMARY} />
          <Text style={styles.optionText}>{TEXTS.ADD_CONTACTS}</Text>
          <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={COLORS.ACCENT} />
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
        <MaterialCommunityIcons name="chart-line" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.optionContent}>
          <Text style={styles.optionText}>{TEXTS.CRISIS_DASHBOARD}</Text>
          <Text style={styles.optionSubtext}>{TEXTS.CRISIS_DASHBOARD_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={COLORS.ACCENT} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => {
          hapticLight();
          onOpenAlertsHistory();
        }}
        accessibilityLabel={TEXTS.ALERTS_HISTORY}
      >
        <MaterialCommunityIcons name="history" size={ICON_SIZE} color={COLORS.PRIMARY} />
        <View style={styles.optionContent}>
          <Text style={styles.optionText}>{TEXTS.ALERTS_HISTORY}</Text>
          <Text style={styles.optionSubtext}>{TEXTS.ALERTS_HISTORY_DESC}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={ICON_SIZE} color={COLORS.ACCENT} />
      </TouchableOpacity>
    </View>
  );
}
