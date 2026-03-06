import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, MODAL_WIDTH, TEXTS } from '../../screens/settings/settingsScreenConstants';

export default function SettingsConfirmModal({
  visible,
  onRequestClose,
  title,
  message,
  confirmText = TEXTS.CONFIRM,
  cancelText = TEXTS.CANCEL,
  onConfirm,
  onCancel,
  destructive = false,
}) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onCancel}>
              <Text style={styles.modalButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, destructive ? styles.modalButtonDelete : styles.modalButtonConfirm]}
              onPress={onConfirm}
            >
              <Text style={[styles.modalButtonText, destructive && { color: COLORS.ERROR }]}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.MODAL_BACKGROUND,
    borderRadius: 12,
    padding: 24,
    width: MODAL_WIDTH,
    borderWidth: 1,
    borderColor: COLORS.ITEM_BORDER,
  },
  modalTitle: {
    color: COLORS.WHITE,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    color: COLORS.ACCENT,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  modalButtonCancel: {
    backgroundColor: COLORS.MODAL_BUTTON_CANCEL,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.PRIMARY,
  },
  modalButtonDelete: {
    backgroundColor: COLORS.MODAL_BUTTON_DELETE,
  },
  modalButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
  },
});
