import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REGISTER as TEXTS } from '../../constants/translations';
import { colors } from '../../styles/globalStyles';
import { styles } from './registerScreenStyles';
import { ACTIVE_OPACITY, BUTTON_ACTIVE_OPACITY } from './registerScreenConstants';

export function NameInfoModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{TEXTS.NAME_INFO_MODAL_TITLE}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton} activeOpacity={ACTIVE_OPACITY} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalMessage}>{TEXTS.NAME_INFO_MODAL_MESSAGE}</Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose} activeOpacity={BUTTON_ACTIVE_OPACITY}>
            <Text style={styles.modalButtonText}>{TEXTS.MODAL_CLOSE}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
