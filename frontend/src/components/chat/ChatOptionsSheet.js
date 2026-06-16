/**
 * Hoja inferior de opciones del chat (menú ⋮): desplazamiento, ajustes, privacidad, borrado.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { useChatColors, useChatTexts } from '../../screens/chat/chatScreenConstants';

function fireLightHaptics() {
  try {
    const out = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (out && typeof out.then === 'function') out.catch(() => {});
  } catch {
    /* sin motor háptico */
  }
}

export default function ChatOptionsSheet({
  visible,
  onClose,
  onScrollToBottom,
  onOpenCustomization,
  onOpenPrivacy,
  onOpenAiInfo,
  onRequestClearConversation,
  immersiveMode = false,
  onToggleImmersiveMode,
}) {
  const TEXTS = useChatTexts();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const chatColors = useChatColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: chatColors.MODAL_OVERLAY,
        },
        sheetWrap: {
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        sheet: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 14,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          backgroundColor: chatColors.MODAL_BACKGROUND,
          borderWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: 0,
          borderColor: chatColors.MODAL_BORDER,
        },
        title: {
          fontSize: 16,
          fontWeight: '700',
          color: chatColors.BOT_TEXT,
          marginBottom: 12,
          textAlign: 'center',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 4,
          borderRadius: 14,
        },
        rowIcon: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accentLineSoft,
        },
        rowLabel: {
          flex: 1,
          fontSize: 16,
          fontWeight: '500',
          color: chatColors.BOT_TEXT,
        },
        rowLabelDanger: {
          color: colors.error,
          fontWeight: '600',
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: chatColors.MODAL_BORDER,
          marginVertical: 4,
        },
        cancelBtn: {
          marginTop: 8,
          paddingVertical: 14,
          alignItems: 'center',
          borderRadius: 14,
          backgroundColor: colors.accentLineSoft,
        },
        cancelText: {
          fontSize: 16,
          fontWeight: '600',
          color: chatColors.BOT_TEXT,
        },
      }),
    [chatColors, colors.accentLineSoft, colors.error],
  );

  const wrap = (fn) => () => {
    fireLightHaptics();
    onClose();
    fn?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={TEXTS.CHAT_OPTIONS_CANCEL} />
        <View style={styles.sheetWrap} pointerEvents="box-none">
          <View
            style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}
            accessibilityViewIsModal
          >
            <Text style={styles.title}>{TEXTS.CHAT_OPTIONS_TITLE}</Text>

            <TouchableOpacity
              style={styles.row}
              onPress={wrap(onScrollToBottom)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.CHAT_OPTIONS_LAST_MESSAGE}
            >
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="arrow-down-circle-outline" size={22} color={chatColors.PRIMARY} />
              </View>
              <Text style={styles.rowLabel}>{TEXTS.CHAT_OPTIONS_LAST_MESSAGE}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={wrap(onOpenCustomization)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.CHAT_OPTIONS_CUSTOMIZE}
            >
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="tune-variant" size={22} color={chatColors.PRIMARY} />
              </View>
              <Text style={styles.rowLabel}>{TEXTS.CHAT_OPTIONS_CUSTOMIZE}</Text>
            </TouchableOpacity>

            {onToggleImmersiveMode ? (
              <TouchableOpacity
                style={styles.row}
                onPress={wrap(onToggleImmersiveMode)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={
                  immersiveMode ? TEXTS.CHAT_OPTIONS_IMMERSIVE_OFF : TEXTS.CHAT_OPTIONS_IMMERSIVE_ON
                }
              >
                <View style={styles.rowIcon}>
                  <MaterialCommunityIcons
                    name={immersiveMode ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color={chatColors.PRIMARY}
                  />
                </View>
                <Text style={styles.rowLabel}>
                  {immersiveMode ? TEXTS.CHAT_OPTIONS_IMMERSIVE_OFF : TEXTS.CHAT_OPTIONS_IMMERSIVE_ON}
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.row}
              onPress={wrap(onOpenPrivacy)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.CHAT_OPTIONS_AI_PRIVACY}
            >
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="shield-account-outline" size={22} color={chatColors.PRIMARY} />
              </View>
              <Text style={styles.rowLabel}>{TEXTS.CHAT_OPTIONS_AI_PRIVACY}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={wrap(onOpenAiInfo)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.CHAT_OPTIONS_AI_INFO}
            >
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="information-outline" size={22} color={chatColors.PRIMARY} />
              </View>
              <Text style={styles.rowLabel}>{TEXTS.CHAT_OPTIONS_AI_INFO}</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity
              style={styles.row}
              onPress={wrap(onRequestClearConversation)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.CHAT_OPTIONS_CLEAR}
            >
              <View style={[styles.rowIcon, { backgroundColor: colors.dangerSoft ?? 'rgba(255, 107, 107, 0.12)' }]}>
                <MaterialCommunityIcons name="delete-outline" size={22} color={colors.error} />
              </View>
              <Text style={[styles.rowLabel, styles.rowLabelDanger]}>{TEXTS.CHAT_OPTIONS_CLEAR}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>{TEXTS.CHAT_OPTIONS_CANCEL}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
