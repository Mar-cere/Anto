import React, { useMemo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  buildSettingsCOLORS,
  MODAL_WIDTH,
  useSettingsTexts,
} from '../../screens/settings/settingsScreenConstants';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

export default function SettingsConfirmModal({
  visible,
  onRequestClose,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  destructive = false,
}) {
  const TEXTS = useSettingsTexts();
  const safeConfirmText = confirmText || TEXTS.CONFIRM;
  const safeCancelText = cancelText || TEXTS.CANCEL;
  const { colors: palette } = useTheme();
  const COLORS = useMemo(() => buildSettingsCOLORS(palette), [palette]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          color: palette.text,
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 12,
        },
        modalText: {
          color: palette.textSecondary,
          fontSize: 16,
          marginBottom: 24,
        },
        modalButtons: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
        modalButton: {
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
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
      }),
    [COLORS, palette],
  );

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onRequestClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={onCancel}>
              <Text style={{ color: palette.text, fontSize: 16 }}>{safeCancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, destructive ? styles.modalButtonDelete : styles.modalButtonConfirm]}
              onPress={onConfirm}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: destructive ? palette.error : palette.textOnPrimary,
                }}
              >
                {safeConfirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
