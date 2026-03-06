/**
 * Modal de confirmación para borrar la conversación.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CHAT_COLORS, LAYOUT, MODAL_WIDTH_REF, TEXTS } from '../../screens/chat/chatScreenConstants';

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CHAT_COLORS.MODAL_OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: MODAL_WIDTH_REF * LAYOUT.MODAL_WIDTH_PERCENT,
    backgroundColor: CHAT_COLORS.MODAL_BACKGROUND,
    borderRadius: LAYOUT.MODAL_BORDER_RADIUS,
    padding: LAYOUT.MODAL_PADDING,
    borderWidth: 1,
    borderColor: CHAT_COLORS.MODAL_BORDER,
  },
  modalTitle: {
    color: CHAT_COLORS.WHITE,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: LAYOUT.MODAL_TITLE_MARGIN_BOTTOM,
  },
  modalText: {
    color: CHAT_COLORS.ACCENT,
    fontSize: 16,
    marginBottom: LAYOUT.MODAL_TEXT_MARGIN_BOTTOM,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: LAYOUT.MODAL_BUTTON_PADDING_HORIZONTAL,
    paddingVertical: LAYOUT.MODAL_BUTTON_PADDING_VERTICAL,
    borderRadius: LAYOUT.MODAL_BUTTON_BORDER_RADIUS,
    marginLeft: LAYOUT.MODAL_BUTTON_MARGIN_LEFT,
  },
  modalCancelButton: {
    backgroundColor: CHAT_COLORS.MODAL_CANCEL_BACKGROUND,
  },
  modalConfirmButton: {
    backgroundColor: CHAT_COLORS.MODAL_CONFIRM_BACKGROUND,
    borderWidth: 1,
    borderColor: CHAT_COLORS.MODAL_CONFIRM_BORDER,
  },
  modalButtonText: {
    color: CHAT_COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmButtonText: {
    color: CHAT_COLORS.ERROR,
  },
});

export default function ClearConversationModal({ visible, onConfirm, onCancel }) {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>{TEXTS.MODAL_TITLE}</Text>
        <Text style={styles.modalText}>{TEXTS.MODAL_MESSAGE}</Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalCancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.modalButtonText}>{TEXTS.CANCEL}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.modalConfirmButton]}
            onPress={onConfirm}
          >
            <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>
              {TEXTS.DELETE}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
