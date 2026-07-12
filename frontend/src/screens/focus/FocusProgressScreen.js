/**
 * Pantalla de progreso del foco de acompañamiento (#2).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { createGlobalStyles } from '../../styles/globalStyles';
import { updateFocus, completeFocus } from '../../services/focusService';

const FocusProgressScreen = ({ navigation, route }) => {
  const { colors, resolvedScheme } = useTheme();
  const FOCUS_PROGRESS = useSectionTranslations('FOCUS_PROGRESS');

  const [focus, setFocus] = useState(route.params?.focus || null);
  const [updating, setUpdating] = useState(false);

  const styles = useMemo(
    () => createStyles(colors, resolvedScheme),
    [colors, resolvedScheme]
  );
  const globalStyles = useMemo(() => createGlobalStyles(colors), [colors]);

  const handlePause = useCallback(async () => {
    if (!focus) return;

    Alert.alert(
      FOCUS_PROGRESS.PAUSE_FOCUS,
      '¿Seguro que quieres pausar tu proceso? Podrás reanudarlo cuando quieras.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pausar',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              await updateFocus({ status: 'paused' });
              navigation.goBack();
              if (route.params?.onUpdate) {
                route.params.onUpdate();
              }
            } catch (error) {
              console.error('Error pausing focus:', error);
              Alert.alert('Error', 'No se pudo pausar el foco');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  }, [focus, navigation, route, FOCUS_PROGRESS]);

  const handleComplete = useCallback(async () => {
    if (!focus) return;

    Alert.alert(
      FOCUS_PROGRESS.COMPLETE_FOCUS,
      '¿Ya completaste este proceso de acompañamiento? Podrás iniciar uno nuevo después.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar',
          onPress: async () => {
            setUpdating(true);
            try {
              await completeFocus();
              navigation.goBack();
              if (route.params?.onUpdate) {
                route.params.onUpdate();
              }
            } catch (error) {
              console.error('Error completing focus:', error);
              Alert.alert('Error', 'No se pudo completar el foco');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  }, [focus, navigation, route, FOCUS_PROGRESS]);

  if (!focus) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['top']}>
        <Text style={styles.errorText}>No hay foco activo</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name={focus.icon || 'flag-outline'} size={32} color={colors.primary} />
          </View>
          <Text style={styles.themeName}>{focus.themeName}</Text>
          <Text style={styles.themeDescription}>{focus.themeDescription}</Text>
        </View>

        {focus.customGoal ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{FOCUS_PROGRESS.CUSTOM_GOAL}</Text>
            <Text style={styles.goalText}>{focus.customGoal}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {FOCUS_PROGRESS.WEEK_LABEL
              .replace('{current}', String(focus.weekNumber))
              .replace('{total}', String(focus.durationWeeks))}
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${focus.progress || 0}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {FOCUS_PROGRESS.PROGRESS_LABEL.replace('{progress}', String(focus.progress || 0))}
            </Text>
          </View>
        </View>

        {focus.suggestedInterventions && focus.suggestedInterventions.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{FOCUS_PROGRESS.SUGGESTED_INTERVENTIONS}</Text>
            <View style={styles.interventionsList}>
              {focus.suggestedInterventions.map((intervention, index) => (
                <View key={index} style={styles.interventionItem}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.interventionText}>{intervention}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={handleComplete}
            disabled={updating}
            style={({ pressed }) => [
              globalStyles.modernButton,
              styles.completeButton,
              updating && styles.buttonDisabled,
              pressed && !updating && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={FOCUS_PROGRESS.COMPLETE_FOCUS}
          >
            {updating ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={[globalStyles.modernButtonText, styles.buttonText]}>
                {FOCUS_PROGRESS.COMPLETE_FOCUS}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handlePause}
            disabled={updating}
            style={({ pressed }) => [
              styles.pauseButton,
              updating && styles.buttonDisabled,
              pressed && !updating && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={FOCUS_PROGRESS.PAUSE_FOCUS}
          >
            <Text style={styles.pauseButtonText}>{FOCUS_PROGRESS.PAUSE_FOCUS}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(colors, resolvedScheme) {
  return {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
      paddingVertical: SPACING.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: colors.accentLineSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.md,
    },
    themeName: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
      marginBottom: SPACING.xs,
      textAlign: 'center',
    },
    themeDescription: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
    },
    section: {
      marginBottom: SPACING.xl,
    },
    sectionLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: SPACING.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    goalText: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      fontStyle: 'italic',
    },
    progressContainer: {
      gap: SPACING.sm,
    },
    progressTrack: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressLabel: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    interventionsList: {
      gap: SPACING.sm,
    },
    interventionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    interventionText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    actions: {
      gap: SPACING.md,
      marginTop: SPACING.lg,
      marginBottom: SPACING.xxl,
    },
    completeButton: {
      minHeight: 52,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '600',
    },
    pauseButton: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    pauseButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    errorText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
  };
}

export default FocusProgressScreen;
