/**
 * Modal para crear o editar hechos biográficos del usuario (#63 grounding).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ModalKeyboardScroll from '../../components/common/ModalKeyboardScroll';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { useModalKeyboardVisible } from '../../hooks/useModalKeyboardVisible';
import { SPACING } from '../../constants/ui';
import {
  focusModalTextInput,
  MODAL_SHEET_MAX_HEIGHT,
  runModalScrollHint,
  syncModalKeyboardWithVisibility,
} from '../../utils/modalKeyboardUtils';
import { createUserFact, updateUserFact } from '../../services/userFactsService';

const CATEGORIES = [
  { value: 'work', icon: 'briefcase-outline' },
  { value: 'family', icon: 'account-group-outline' },
  { value: 'study', icon: 'school-outline' },
  { value: 'health', icon: 'heart-pulse' },
  { value: 'relationships', icon: 'account-heart-outline' },
  { value: 'commitment', icon: 'calendar-check-outline' },
  { value: 'other', icon: 'tag-outline' },
];

const UserFactModal = ({ visible, onClose, onSaved, editingFact = null }) => {
  const { language } = useLanguage();
  const translated = useSectionTranslations('USER_FACTS');
  const T = useMemo(
    () => ({
      CREATE_TITLE: translated?.MODAL_CREATE_TITLE || 'Nuevo hecho sobre mí',
      EDIT_TITLE: translated?.MODAL_EDIT_TITLE || 'Editar hecho',
      DONE: translated?.MODAL_DONE || 'Listo',
      CANCEL: translated?.MODAL_CANCEL || 'Cancelar',
      SAVE: translated?.MODAL_SAVE || 'Guardar',
      SAVING: translated?.MODAL_SAVING || 'Guardando…',
      FACT_LABEL: translated?.MODAL_FACT_LABEL || '¿Qué quieres que recuerde?',
      FACT_PLACEHOLDER:
        translated?.MODAL_FACT_PLACEHOLDER || 'Ejemplo: Trabajo como diseñador gráfico',
      FACT_HINT:
        translated?.MODAL_FACT_HINT ||
        'Escribe un hecho concreto sobre ti (trabajo, familia, estudios, salud…)',
      CATEGORY_LABEL: translated?.MODAL_CATEGORY_LABEL || 'Categoría',
      ERROR_TITLE: translated?.MODAL_ERROR_TITLE || 'Error',
      ERROR_TOO_SHORT:
        translated?.MODAL_ERROR_TOO_SHORT || 'El hecho debe tener al menos 5 caracteres',
      ERROR_TOO_LONG:
        translated?.MODAL_ERROR_TOO_LONG || 'El hecho no puede exceder 150 caracteres',
      ERROR_EMPTY: translated?.MODAL_ERROR_EMPTY || 'Por favor ingresa un hecho',
      TOAST_SAVED: translated?.TOAST_SAVED || 'Hecho guardado',
      TOAST_ERROR: translated?.TOAST_ERROR || 'No se pudo completar. Intenta de nuevo.',
      CATEGORY_WORK: translated?.CATEGORY_WORK || 'Trabajo',
      CATEGORY_FAMILY: translated?.CATEGORY_FAMILY || 'Familia',
      CATEGORY_STUDY: translated?.CATEGORY_STUDY || 'Estudios',
      CATEGORY_HEALTH: translated?.CATEGORY_HEALTH || 'Salud',
      CATEGORY_RELATIONSHIPS: translated?.CATEGORY_RELATIONSHIPS || 'Relaciones',
      CATEGORY_COMMITMENT: translated?.CATEGORY_COMMITMENT || 'Compromisos',
      CATEGORY_OTHER: translated?.CATEGORY_OTHER || 'Otro',
    }),
    [translated]
  );

  const { colors, resolvedScheme } = useTheme();
  const { showToast } = useToast();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const [fact, setFact] = useState('');
  const [category, setCategory] = useState('other');
  const [saving, setSaving] = useState(false);

  const factInputRef = useRef(null);
  const { isKeyboardVisible, keyboardHeight } = useModalKeyboardVisible(visible);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalContainer: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        overlay: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
        },
        modalContent: {
          backgroundColor: colors.background,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          maxHeight: MODAL_SHEET_MAX_HEIGHT,
          minHeight: '48%',
          flexShrink: 1,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
        },
        sheetGrabber: {
          alignSelf: 'center',
          width: 36,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.glassFill,
          marginTop: 10,
          marginBottom: 6,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          marginTop: 6,
        },
        modalTitle: {
          fontSize: 17,
          fontWeight: '600',
          color: colors.text,
          letterSpacing: -0.2,
        },
        headerActions: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        },
        keyboardDismissBtn: {
          paddingVertical: 8,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          borderRadius: 12,
          backgroundColor: colors.accentLineSoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_ACCENT_BORDER,
        },
        keyboardDismissText: {
          color: colors.primary,
          fontSize: 14,
          fontWeight: '600',
        },
        closeButton: {
          padding: 8,
          borderRadius: 12,
          backgroundColor: colors.glassFill,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        keyboardContainer: {
          flex: 1,
        },
        inputLabel: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          letterSpacing: -0.1,
          marginBottom: 8,
        },
        input: {
          backgroundColor: colors.chromeInput,
          borderRadius: 14,
          padding: 14,
          color: colors.text,
          fontSize: 16,
          marginBottom: 8,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
          minHeight: 80,
          textAlignVertical: 'top',
        },
        inputHint: {
          fontSize: 13,
          color: colors.textMuted,
          marginBottom: SPACING.md,
        },
        sectionContainer: {
          marginBottom: SPACING.md,
        },
        categoriesGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: SPACING.xs,
          marginTop: SPACING.xs,
        },
        categoryChip: {
          paddingVertical: SPACING.xs,
          paddingHorizontal: SPACING.sm,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        categoryChipSelected: {
          backgroundColor: colors.accentLineSoft,
          borderColor: colors.primary,
        },
        categoryChipText: {
          fontSize: 14,
          color: colors.textSecondary,
        },
        categoryChipTextSelected: {
          color: colors.primary,
          fontWeight: '600',
        },
        saveButton: {
          backgroundColor: colors.primary,
          paddingVertical: SPACING.md,
          borderRadius: 999,
          alignItems: 'center',
          marginTop: SPACING.md,
          marginBottom: SPACING.lg,
        },
        saveButtonDisabled: {
          opacity: 0.5,
        },
        saveButtonText: {
          color: colors.textOnPrimary,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors, resolvedScheme, t]
  );

  // Sync modal state with editingFact
  useEffect(() => {
    if (visible) {
      if (editingFact) {
        setFact(editingFact.fact || '');
        setCategory(editingFact.category || 'other');
      } else {
        setFact('');
        setCategory('other');
      }
    }
  }, [visible, editingFact]);

  useEffect(() => {
    syncModalKeyboardWithVisibility(visible, isKeyboardVisible, factInputRef);
  }, [visible, isKeyboardVisible]);

  const getCategoryLabel = useCallback(
    (categoryValue) => {
      const categoryMap = {
        work: T.CATEGORY_WORK,
        family: T.CATEGORY_FAMILY,
        study: T.CATEGORY_STUDY,
        health: T.CATEGORY_HEALTH,
        relationships: T.CATEGORY_RELATIONSHIPS,
        commitment: T.CATEGORY_COMMITMENT,
        other: T.CATEGORY_OTHER,
      };
      return categoryMap[categoryValue] || T.CATEGORY_OTHER;
    },
    [T]
  );

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    setSaving(false);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(async () => {
    const trimmedFact = fact.trim();

    if (!trimmedFact) {
      Alert.alert(T.ERROR_TITLE, T.ERROR_EMPTY);
      return;
    }

    if (trimmedFact.length < 5) {
      Alert.alert(T.ERROR_TITLE, T.ERROR_TOO_SHORT);
      return;
    }

    if (trimmedFact.length > 150) {
      Alert.alert(T.ERROR_TITLE, T.ERROR_TOO_LONG);
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (editingFact) {
        await updateUserFact(editingFact._id, {
          fact: trimmedFact,
          category,
        });
      } else {
        await createUserFact({
          fact: trimmedFact,
          category,
          source: 'user',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(T.TOAST_SAVED);
      handleClose();
      onSaved();
    } catch (err) {
      console.error('[UserFactModal] Error saving fact:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(T.TOAST_ERROR);
    } finally {
      setSaving(false);
    }
  }, [fact, category, editingFact, T, showToast, handleClose, onSaved]);

  const handleCategorySelect = useCallback((categoryValue) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(categoryValue);
  }, []);

  const handleKeyboardDismiss = useCallback(() => {
    Keyboard.dismiss();
    runModalScrollHint();
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.overlay} onPress={handleClose} activeOpacity={1} />
        <View style={styles.modalContent}>
          <View style={styles.sheetGrabber} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingFact ? T.EDIT_TITLE : T.CREATE_TITLE}
            </Text>
            <View style={styles.headerActions}>
              {isKeyboardVisible && (
                <TouchableOpacity
                  style={styles.keyboardDismissBtn}
                  onPress={handleKeyboardDismiss}
                  activeOpacity={0.7}>
                  <Text style={styles.keyboardDismissText}>{T.DONE}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ModalKeyboardScroll
            keyboardHeight={keyboardHeight}
            isKeyboardVisible={isKeyboardVisible}
            contentContainerStyle={styles.keyboardContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.inputLabel}>{T.FACT_LABEL}</Text>
              <TextInput
                ref={factInputRef}
                style={styles.input}
                value={fact}
                onChangeText={setFact}
                placeholder={T.FACT_PLACEHOLDER}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={150}
                autoCapitalize="sentences"
                onFocus={() => focusModalTextInput(factInputRef)}
                editable={!saving}
              />
              <Text style={styles.inputHint}>{T.FACT_HINT}</Text>
            </View>

            <View style={styles.sectionContainer}>
              <Text style={styles.inputLabel}>{T.CATEGORY_LABEL}</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      category === cat.value && styles.categoryChipSelected,
                    ]}
                    onPress={() => handleCategorySelect(cat.value)}
                    activeOpacity={0.7}
                    disabled={saving}>
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={16}
                      color={category === cat.value ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat.value && styles.categoryChipTextSelected,
                      ]}>
                      {getCategoryLabel(cat.value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? T.SAVING : T.SAVE}</Text>
            </TouchableOpacity>
          </ModalKeyboardScroll>
        </View>
      </View>
    </Modal>
  );
};

export default UserFactModal;
