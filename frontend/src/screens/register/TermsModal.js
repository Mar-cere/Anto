import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useRegisterScreenStyles } from './registerScreenStyles';
import { ACTIVE_OPACITY, BUTTON_ACTIVE_OPACITY, URLS } from './registerScreenConstants';

const DEFAULT_TEXTS = {
  ERROR_TITLE: 'Error',
  LINK_OPEN_ERROR: 'No se pudo abrir el enlace',
  TERMS_MODAL_CLOSE: 'Cerrar',
  TERMS_MODAL_ACCEPT: 'Aceptar términos',
};

const openUrl = async (url, texts) => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
    else Alert.alert(texts.ERROR_TITLE, texts.LINK_OPEN_ERROR);
  } catch (_error) {
    Alert.alert(texts.ERROR_TITLE, texts.LINK_OPEN_ERROR);
  }
};

export function TermsModal({ visible, onClose, onAccept }) {
  const translated = useSectionTranslations('REGISTER');
  const TEXTS = useMemo(
    () => ({
      ...DEFAULT_TEXTS,
      ...(translated || {}),
    }),
    [translated],
  );
  const { colors } = useTheme();
  const styles = useRegisterScreenStyles();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{TEXTS.TERMS_ALERT_TITLE}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton} activeOpacity={ACTIVE_OPACITY} accessibilityLabel={TEXTS.TERMS_MODAL_CLOSE}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator>
            <Text style={styles.modalMessage}>{TEXTS.TERMS_ALERT_MESSAGE}</Text>
            <View style={styles.modalLinksContainer}>
              <TouchableOpacity style={styles.modalLinkButton} onPress={() => openUrl(URLS.TERMS, TEXTS)} activeOpacity={BUTTON_ACTIVE_OPACITY}>
                <Text style={styles.modalLinkText}>{TEXTS.TERMS_FULL_LINK}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalLinkButton} onPress={() => openUrl(URLS.PRIVACY, TEXTS)} activeOpacity={BUTTON_ACTIVE_OPACITY}>
                <Text style={styles.modalLinkText}>{TEXTS.PRIVACY_LINK}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonSecondary]} onPress={onClose} activeOpacity={BUTTON_ACTIVE_OPACITY}>
              <Text style={styles.modalButtonTextSecondary}>{TEXTS.TERMS_MODAL_CLOSE}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={onAccept} activeOpacity={BUTTON_ACTIVE_OPACITY}>
              <Text style={styles.modalButtonText}>{TEXTS.TERMS_MODAL_ACCEPT}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
