/**
 * Hoja contextual con un tema de la biblioteca de límites IA (#194).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { useAiLimitTopic } from '../../hooks/useAiLimitTopic';

export default function AiLimitHintSheet({
  visible,
  topicId,
  onClose,
  onOpenFullLibrary,
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const topic = useAiLimitTopic(topicId);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.45)',
        },
        sheetWrap: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        sheet: {
          maxHeight: '78%',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: colors.chromeCard || colors.background,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          paddingTop: SPACING.HERO_INSET,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        handle: {
          alignSelf: 'center',
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          marginBottom: 12,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.sm,
          marginBottom: 10,
        },
        title: {
          flex: 1,
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
          lineHeight: 22,
        },
        body: {
          fontSize: 14,
          lineHeight: 21,
          color: colors.textSecondary,
          marginBottom: 8,
        },
        bulletRow: {
          flexDirection: 'row',
          marginBottom: 6,
          paddingRight: SPACING.xs,
        },
        bulletDot: {
          color: colors.primary,
          marginRight: 8,
          fontSize: 14,
          lineHeight: 20,
        },
        bulletText: {
          flex: 1,
          fontSize: 14,
          lineHeight: 20,
          color: colors.textSecondary,
        },
        actions: {
          marginTop: 14,
          gap: SPACING.sm,
        },
        primaryBtn: {
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accentLine || colors.border,
          backgroundColor: colors.accentLineSoft,
          paddingVertical: SPACING.CHIP_INSET,
          alignItems: 'center',
        },
        primaryBtnText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '700',
        },
        ghostBtn: {
          borderRadius: 10,
          paddingVertical: SPACING.CHIP_INSET_COMPACT,
          alignItems: 'center',
        },
        ghostBtnText: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  if (!topic.hasContent) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <View style={styles.sheetWrap}>
          <View style={[styles.sheet, { paddingBottom: SPACING.HERO_INSET + insets.bottom }]}>
            <View style={styles.handle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.titleRow}>
                <MaterialCommunityIcons
                  name="shield-alert-outline"
                  size={22}
                  color={colors.primary}
                />
                <Text style={styles.title} accessibilityRole="header">
                  {topic.title}
                </Text>
              </View>
              <Text style={styles.body}>{topic.body}</Text>
              {topic.bullets.map((line) => (
                <View key={line} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={styles.actions}>
              {onOpenFullLibrary ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={onOpenFullLibrary}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryBtnText}>{topic.sheetOpenLibrary}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.ghostBtn} onPress={onClose} accessibilityRole="button">
                <Text style={styles.ghostBtnText}>{topic.sheetClose}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
