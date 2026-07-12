/**
 * Pantalla de onboarding para seleccionar foco de acompañamiento (#2).
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { createGlobalStyles } from '../../styles/globalStyles';
import { getFocusThemes, startFocus } from '../../services/focusService';

const FocusOnboardingScreen = ({ navigation, route }) => {
  const { colors, resolvedScheme } = useTheme();
  const FOCUS_THEMES = useSectionTranslations('FOCUS_THEMES');
  const FOCUS_ONBOARDING = useSectionTranslations('FOCUS_ONBOARDING');
  const { width } = useWindowDimensions();

  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState(null);
  const [customGoal, setCustomGoal] = useState('');
  const [starting, setStarting] = useState(false);

  const styles = useMemo(
    () => createStyles(colors, resolvedScheme, width),
    [colors, resolvedScheme, width]
  );
  const globalStyles = useMemo(() => createGlobalStyles(colors), [colors]);

  React.useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = useCallback(async () => {
    try {
      const response = await getFocusThemes();
      setThemes(response.data || []);
    } catch (error) {
      console.error('Error loading focus themes:', error);
      Alert.alert('Error', 'No se pudieron cargar los temas de foco');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedThemeId) return;

    setStarting(true);
    try {
      await startFocus({
        themeId: selectedThemeId,
        customGoal: customGoal.trim() || null,
      });

      navigation.goBack();
      
      if (route.params?.onComplete) {
        route.params.onComplete();
      }
    } catch (error) {
      console.error('Error starting focus:', error);
      const message =
        error.response?.data?.message ||
        'No se pudo iniciar el foco. Intenta de nuevo';
      Alert.alert('Error', message);
    } finally {
      setStarting(false);
    }
  }, [selectedThemeId, customGoal, navigation, route]);

  const handleSkip = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
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
          <Text style={styles.title}>{FOCUS_ONBOARDING.TITLE}</Text>
          <Text style={styles.subtitle}>{FOCUS_ONBOARDING.SUBTITLE}</Text>
        </View>

        <View style={styles.themesContainer}>
          {themes.map((theme) => {
            const isSelected = theme.id === selectedThemeId;
            return (
              <Pressable
                key={theme.id}
                onPress={() => setSelectedThemeId(theme.id)}
                style={({ pressed }) => [
                  styles.themeCard,
                  isSelected && styles.themeCardSelected,
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${theme.name}. ${theme.description}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.themeHeader}>
                  <View
                    style={[
                      styles.themeIconWrap,
                      isSelected && styles.themeIconWrapSelected,
                    ]}
                  >
                    <Ionicons
                      name={theme.icon || 'flag-outline'}
                      size={24}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.themeTitleRow}>
                    <Text style={[styles.themeName, isSelected && styles.themeNameSelected]}>
                      {theme.name}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    ) : null}
                  </View>
                </View>
                <Text style={styles.themeDescription}>{theme.description}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedThemeId ? (
          <View style={styles.goalContainer}>
            <Text style={styles.goalLabel}>{FOCUS_ONBOARDING.CUSTOM_GOAL_LABEL}</Text>
            <TextInput
              style={[globalStyles.inputContainer, styles.goalInput]}
              placeholder={FOCUS_ONBOARDING.CUSTOM_GOAL_PLACEHOLDER}
              placeholderTextColor={colors.textMuted}
              value={customGoal}
              onChangeText={setCustomGoal}
              maxLength={200}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={handleStart}
            disabled={!selectedThemeId || starting}
            style={({ pressed }) => [
              globalStyles.modernButton,
              styles.startButton,
              (!selectedThemeId || starting) && styles.startButtonDisabled,
              pressed && selectedThemeId && !starting && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={FOCUS_ONBOARDING.START_FOCUS}
            accessibilityState={{ disabled: !selectedThemeId || starting }}
          >
            {starting ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Text style={[globalStyles.modernButtonText, styles.startButtonText]}>
                {FOCUS_ONBOARDING.START_FOCUS}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleSkip}
            disabled={starting}
            style={({ pressed }) => [
              styles.skipButton,
              pressed && !starting && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={FOCUS_ONBOARDING.SKIP_FOR_NOW}
          >
            <Text style={styles.skipButtonText}>{FOCUS_ONBOARDING.SKIP_FOR_NOW}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(colors, resolvedScheme, width) {
  const isCompact = width < 600;
  
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
      marginBottom: SPACING.xl,
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 36,
      marginBottom: SPACING.sm,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
    },
    themesContainer: {
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    },
    themeCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      padding: SPACING.lg,
    },
    themeCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.chromeInput,
    },
    themeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    themeIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.accentLineSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md,
    },
    themeIconWrapSelected: {
      backgroundColor: colors.primaryBright + '20',
    },
    themeTitleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeName: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    themeNameSelected: {
      color: colors.primary,
    },
    themeDescription: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    goalContainer: {
      marginBottom: SPACING.xl,
    },
    goalLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: SPACING.sm,
    },
    goalInput: {
      minHeight: 80,
      paddingTop: SPACING.md,
    },
    actions: {
      gap: SPACING.md,
      marginBottom: SPACING.xl,
    },
    startButton: {
      minHeight: 52,
    },
    startButtonDisabled: {
      opacity: 0.5,
    },
    startButtonText: {
      fontSize: 17,
      fontWeight: '600',
    },
    skipButton: {
      paddingVertical: SPACING.md,
      alignItems: 'center',
    },
    skipButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
  };
}

export default FocusOnboardingScreen;
