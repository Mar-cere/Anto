/**
 * Pantalla de Técnicas Terapéuticas — lista priorizada, acordeón por categoría y filtro de emoción opcional.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingNavBar from '../components/FloatingNavBar';
import Header from '../components/Header';
import ParticleBackground from '../components/ParticleBackground';
import TccProtocolsQuickCard from '../components/TccProtocolsQuickCard';
import TechniqueCard from '../components/therapeutic/TechniqueCard';
import { useTheme } from '../context/ThemeContext';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  createCategoryFullLabel,
  createCategoryHint,
  createCategoryShortLabel,
  createCategoryAccent,
  createEmotionOptions,
  SECTION_KEYS,
  useTherapeuticTechniquesTexts,
} from './therapeuticTechniques/therapeuticTechniquesConstants';
import { therapeuticSafeNavigate } from './therapeuticTechniques/therapeuticTechniquesNavigate';
import { SPACING } from '../constants/ui';
import { useTherapeuticTechniquesStyles } from './therapeuticTechniques/therapeuticTechniquesStyles';
import { useTherapeuticTechniquesScreen } from './therapeuticTechniques/useTherapeuticTechniquesScreen';

const initialExpanded = () => ({
  [CATEGORIES.IMMEDIATE]: true,
  [CATEGORIES.CBT]: false,
  [CATEGORIES.DBT]: false,
  [CATEGORIES.ACT]: false,
});

const TherapeuticTechniquesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const TEXTS = useTherapeuticTechniquesTexts();
  const styles = useTherapeuticTechniquesStyles();
  const {
    selectedEmotion,
    setSelectedEmotion,
    techniques,
    filteredTechniques,
    groupedTechniques,
    loading,
    refreshing,
    error,
    loadTechniques,
    handleRefresh,
  } = useTherapeuticTechniquesScreen();

  const [expandedSections, setExpandedSections] = useState(initialExpanded);
  const [emotionFilterOpen, setEmotionFilterOpen] = useState(false);
  const EMOTIONS = useMemo(() => createEmotionOptions(TEXTS), [TEXTS]);
  const CATEGORY_SHORT_LABEL = useMemo(
    () => createCategoryShortLabel(TEXTS),
    [TEXTS],
  );
  const CATEGORY_FULL_LABEL = useMemo(
    () => createCategoryFullLabel(TEXTS),
    [TEXTS],
  );
  const CATEGORY_HINT = useMemo(() => createCategoryHint(TEXTS), [TEXTS]);

  const selectedEmotionLabel = useMemo(() => {
    const found = EMOTIONS.find((e) => e.key === selectedEmotion);
    return found?.label ?? EMOTIONS[0].label;
  }, [selectedEmotion, EMOTIONS]);

  const categoryAccent = useMemo(() => createCategoryAccent(colors), [colors]);

  const clearEmotionFilter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedEmotion('all');
  }, [setSelectedEmotion]);

  const handleEmotionSelect = useCallback(
    (emotion) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSelectedEmotion(emotion);
    },
    [setSelectedEmotion]
  );

  const DIRECT_PROTOCOL_SCREENS = useMemo(
    () =>
      new Set([
        'BehavioralActivation',
        'AbcRecord',
        'ExposureHierarchy',
        'AutomaticThoughtRecord',
      ]),
    [],
  );

  const handleTechniquePress = useCallback(
    (technique) => {
      if (technique == null || typeof technique !== 'object') return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const linkedScreen =
        typeof technique.linkedScreen === 'string' ? technique.linkedScreen.trim() : '';
      if (linkedScreen && DIRECT_PROTOCOL_SCREENS.has(linkedScreen)) {
        therapeuticSafeNavigate(navigation, linkedScreen);
        return;
      }
      therapeuticSafeNavigate(navigation, 'TechniqueDetail', { technique });
    },
    [navigation, DIRECT_PROTOCOL_SCREENS],
  );

  const toggleSection = useCallback((categoryKey) => {
    if (!SECTION_KEYS.has(categoryKey)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpandedSections((prev) => ({
      ...prev,
      [categoryKey]: !prev[categoryKey],
    }));
  }, []);

  const renderEmotionChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.emotionFilter}
      contentContainerStyle={styles.emotionFilterContent}
      accessibilityRole="scrollbar"
      accessibilityLabel={TEXTS.EMOTION_FILTER_A11Y}
    >
      {EMOTIONS.map((emotion) => {
        const selected = selectedEmotion === emotion.key;
        return (
          <TouchableOpacity
            key={emotion.key}
            style={[styles.emotionButton, selected && styles.emotionButtonActive]}
            onPress={() => handleEmotionSelect(emotion.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={emotion.label}
          >
            <MaterialCommunityIcons
              name={emotion.icon}
              size={18}
              color={selected ? colors.textOnPrimary : colors.primary}
            />
            <Text
              style={[styles.emotionButtonText, selected && styles.emotionButtonTextActive]}
            >
              {emotion.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderCategorySection = (categoryKey) => {
    const list = groupedTechniques[categoryKey];
    if (!list || list.length === 0) return null;

    const expanded = expandedSections[categoryKey];
    const short = CATEGORY_SHORT_LABEL[categoryKey];
    const full = CATEGORY_FULL_LABEL[categoryKey];
    const hint = CATEGORY_HINT[categoryKey];
    const accent = categoryAccent[categoryKey] || colors.primary;

    return (
      <View style={styles.categorySection} key={categoryKey}>
        <TouchableOpacity
          style={[styles.categoryHeader, { borderLeftColor: accent }]}
          onPress={() => toggleSection(categoryKey)}
          accessibilityRole="button"
          accessibilityLabel={`${full}. ${hint}`}
          accessibilityHint={expanded ? TEXTS.SECTION_COLLAPSE : TEXTS.SECTION_EXPAND}
          accessibilityState={{ expanded }}
        >
          <View style={styles.categoryHeaderInner}>
            <View style={styles.categoryHeaderTop}>
              <View style={styles.categoryHeaderMain}>
                <Text style={styles.categoryTitleShort}>{short}</Text>
                <Text
                  style={styles.categoryCountBadge}
                  accessibilityLabel={`${list.length} en esta sección`}
                >
                  {list.length}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.textSecondary}
              />
            </View>
            {hint ? (
              <Text style={styles.categoryHint} numberOfLines={2}>
                {hint}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
        {expanded ? (
          <View style={styles.categoryCards}>
            {list.map((technique, index) => (
              <TechniqueCard
                key={technique?.id != null ? String(technique.id) : `technique-${index}`}
                technique={technique}
                variant="compact"
                onPress={() => handleTechniquePress(technique)}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      );
    }

    if (error && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadTechniques()}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredTechniques.length === 0) {
      const isFilteredEmpty = techniques.length > 0;
      return (
        <ScrollView
          contentContainerStyle={[
            styles.centerContainer,
            styles.scrollContent,
            { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA },
          ]}
        >
          <MaterialCommunityIcons
            name={isFilteredEmpty ? 'filter-off' : 'book-open-variant'}
            size={48}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>
            {isFilteredEmpty ? TEXTS.NO_MATCH_FILTER : TEXTS.NO_TECHNIQUES}
          </Text>
          {isFilteredEmpty ? (
            <TouchableOpacity style={styles.retryButton} onPress={clearEmotionFilter}>
              <Text style={styles.retryButtonText}>{TEXTS.CLEAR_EMOTION_FILTER}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.psychoedCard, { marginTop: 20, width: '100%' }]}
            testID="psychoed-entry-library"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              therapeuticSafeNavigate(navigation, 'PsychoeducationLibrary');
            }}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.PSYCHOED_LIBRARY}
          >
            <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.primary} />
            <View style={styles.psychoedCardText}>
              <Text style={styles.psychoedCardTitle}>{TEXTS.PSYCHOED_LIBRARY}</Text>
              <Text style={styles.psychoedCardHint}>{TEXTS.PSYCHOED_LIBRARY_HINT}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.FLOATING_NAV_SCROLL_BOTTOM_EXTRA },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.listIntro}>
          <MaterialCommunityIcons name="hand-pointing-right" size={18} color={colors.primary} />
          <Text style={styles.listIntroText}>{TEXTS.HOW_IT_WORKS}</Text>
        </View>
        <TccProtocolsQuickCard />
        <TouchableOpacity
          style={styles.psychoedCard}
          testID="psychoed-entry-library"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            therapeuticSafeNavigate(navigation, 'PsychoeducationLibrary');
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.PSYCHOED_LIBRARY}
          accessibilityHint={TEXTS.PSYCHOED_LIBRARY_HINT}
        >
          <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.primary} />
          <View style={styles.psychoedCardText}>
            <Text style={styles.psychoedCardTitle}>{TEXTS.PSYCHOED_LIBRARY}</Text>
            <Text style={styles.psychoedCardHint}>{TEXTS.PSYCHOED_LIBRARY_HINT}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        {CATEGORY_ORDER.map((key) => renderCategorySection(key))}
      </ScrollView>
    );
  };

  const showEmotionTools = !loading && !error && techniques.length > 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={TEXTS.TITLE} showBackButton />

      <View style={styles.topBar}>
        <View style={styles.topBarTextBlock}>
          {loading ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {TEXTS.LOADING}
            </Text>
          ) : error ? null : (
            <Text style={styles.subtitle} numberOfLines={3}>
              {TEXTS.SUBTITLE}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.statsButtonIcon}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            therapeuticSafeNavigate(navigation, 'TherapeuticTechniquesStats');
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={TEXTS.STATS}
          accessibilityHint={TEXTS.STATS_HINT}
        >
          <MaterialCommunityIcons name="chart-line" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.topBarDivider} />

      {showEmotionTools ? (
        <>
          <View style={styles.emotionToggleRow}>
            <TouchableOpacity
              style={styles.emotionToggleMain}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setEmotionFilterOpen((o) => !o);
              }}
              accessibilityRole="button"
              accessibilityLabel={
                emotionFilterOpen ? TEXTS.EMOTION_FILTER_TOGGLE_HIDE : TEXTS.EMOTION_FILTER_TOGGLE_SHOW
              }
              accessibilityState={{ expanded: emotionFilterOpen }}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color={colors.primary} />
              <Text style={styles.emotionToggleLabel}>{TEXTS.FILTER_BY_EMOTION}</Text>
              <Text style={styles.emotionToggleValue} numberOfLines={1}>
                {selectedEmotionLabel}
              </Text>
              <MaterialCommunityIcons
                name={emotionFilterOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            {selectedEmotion !== 'all' ? (
              <TouchableOpacity
                onPress={clearEmotionFilter}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={TEXTS.CLEAR_EMOTION_FILTER}
              >
                <Text style={styles.clearFilterLink}>{TEXTS.CLEAR_EMOTION_FILTER}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {emotionFilterOpen ? renderEmotionChips() : null}
        </>
      ) : null}

      {renderContent()}

      <FloatingNavBar />
    </SafeAreaView>
  );
};

export default TherapeuticTechniquesScreen;
