import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER as TEXTS } from '../../constants/translations';
import { colors } from '../../styles/globalStyles';
import { styles } from './registerScreenStyles';
import { ACTIVE_OPACITY, BUTTON_ACTIVE_OPACITY } from './registerScreenConstants';
import { URLS } from './registerScreenConstants';

const openUrl = async (url) => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
    else Alert.alert('Error', 'No se pudo abrir el enlace');
  } catch (e) {
    Alert.alert('Error', 'No se pudo abrir el enlace');
  }
};

export function TermsModal({ visible, onClose, onAccept }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{TEXTS.TERMS_ALERT_TITLE}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton} activeOpacity={ACTIVE_OPACITY} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator>
            <Text style={styles.modalMessage}>{TEXTS.TERMS_ALERT_MESSAGE}</Text>
            <View style={styles.modalLinksContainer}>
              <TouchableOpacity style={styles.modalLinkButton} onPress={() => openUrl(URLS.TERMS)} activeOpacity={BUTTON_ACTIVE_OPACITY}>
                <Text style={styles.modalLinkText}>{TEXTS.TERMS_FULL_LINK}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalLinkButton} onPress={() => openUrl(URLS.PRIVACY)} activeOpacity={BUTTON_ACTIVE_OPACITY}>
                <Text style={styles.modalLinkText}>{TEXTS.PRIVACY_LINK}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={onClose} activeOpacity={BUTTON_ACTIVE_OPACITY}>
              <Text style={styles.modalButtonTextSecondary}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={onAccept} activeOpacity={BUTTON_ACTIVE_OPACITY}>
              <Text style={styles.modalButtonText}>Aceptar Términos</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
