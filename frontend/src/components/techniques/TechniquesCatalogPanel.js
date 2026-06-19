/**
 * Catálogo de técnicas terapéuticas (API + acordeón por categoría).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TechniqueCard from '../therapeutic/TechniqueCard';
import { useTheme } from '../../context/ThemeContext';
import {
  CATEGORIES,
  CATEGORY_ORDER,
  createCategoryAccent,
  createCategoryFullLabel,
  createCategoryHint,
  createCategoryShortLabel,
  createEmotionOptions,
  SECTION_KEYS,
  useTherapeuticTechniquesTexts,
} from '../../screens/therapeuticTechniques/therapeuticTechniquesConstants';
import { therapeuticSafeNavigate } from '../../screens/therapeuticTechniques/therapeuticTechniquesNavigate';
import { useTherapeuticTechniquesStyles } from '../../screens/therapeuticTechniques/therapeuticTechniquesStyles';

const DIRECT_PROTOCOL_SCREENS = new Set([
  'BehavioralActivation',
  'AbcRecord',
  'ExposureHierarchy',
  'AutomaticThoughtRecord',
]);

const initialExpanded = () => ({
  [CATEGORIES.IMMEDIATE]: true,
  [CATEGORIES.CBT]: false,
  [CATEGORIES.DBT]: false,
  [CATEGORIES.ACT]: false,
});

function LibraryEntryCard({ styles, colors, icon, title, hint, testID, onPress }) {
  return (
    <TouchableOpacity
      style={styles.psychoedCard}
      testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
    >
      <MaterialCommunityIcons name={icon} size={22} color={colors.primary} />
      <View style={styles.psychoedCardText}>
        <Text style={styles.psychoedCardTitle}>{title}</Text>
        <Text style={styles.psychoedCardHint}>{hint}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

/**
 * @param {{
 *   catalog: ReturnType<import('../../screens/therapeuticTechniques/useTherapeuticTechniquesScreen').useTherapeuticTechniquesScreen>,
 *   embedded?: boolean,
 *   showListIntro?: boolean,
 *   showStatsButton?: boolean,
 * }} props
 */
export default function TechniquesCatalogPanel({
  catalog,
  embedded = false,
  showListIntro = false,
  showStatsButton = false,
}) {
  const navigation = useNavigation();
  const { colors } = useTheme();
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
  } = catalog;

  const [expandedSections, setExpandedSections] = useState(initialExpanded);
  const [emotionFilterOpen, setEmotionFilterOpen] = useState(false);
  const EMOTIONS = useMemo(() => createEmotionOptions(TEXTS), [TEXTS]);
  const CATEGORY_SHORT_LABEL = useMemo(() => createCategoryShortLabel(TEXTS), [TEXTS]);
  const CATEGORY_FULL_LABEL = useMemo(() => createCategoryFullLabel(TEXTS), [TEXTS]);
  const CATEGORY_HINT = useMemo(() => createCategoryHint(TEXTS), [TEXTS]);
  const categoryAccent = useMemo(() => createCategoryAccent(colors), [colors]);

  const selectedEmotionLabel = useMemo(() => {
    const found = EMOTIONS.find((e) => e.key === selectedEmotion);
    return found?.label ?? EMOTIONS[0].label;
  }, [selectedEmotion, EMOTIONS]);

  const clearEmotionFilter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedEmotion('all');
  }, [setSelectedEmotion]);

  const handleEmotionSelect = useCallback(
    (emotion) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setSelectedEmotion(emotion);
    },
    [setSelectedEmotion],
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
    [navigation],
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
    <View style={styles.emotionFilter} accessibilityRole="scrollbar" accessibilityLabel={TEXTS.EMOTION_FILTER_A11Y}>
      <View style={styles.emotionFilterContent}>
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
              <Text style={[styles.emotionButtonText, selected && styles.emotionButtonTextActive]}>
                {emotion.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
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

  const renderLibraryEntries = () => (
    <>
      <LibraryEntryCard
        styles={styles}
        colors={colors}
        icon="book-open-page-variant"
        title={TEXTS.PSYCHOED_LIBRARY}
        hint={TEXTS.PSYCHOED_LIBRARY_HINT}
        testID="psychoed-entry-library"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          therapeuticSafeNavigate(navigation, 'PsychoeducationLibrary');
        }}
      />
      <LibraryEntryCard
        styles={styles}
        colors={colors}
        icon="compass-outline"
        title={TEXTS.MICRO_GUIDE_LIBRARY}
        hint={TEXTS.MICRO_GUIDE_LIBRARY_HINT}
        testID="microguide-entry-library"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          therapeuticSafeNavigate(navigation, 'MicroGuideLibrary');
        }}
      />
    </>
  );

  const showEmotionTools = !loading && !error && techniques.length > 0;

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, embedded && { minHeight: 160, paddingVertical: 24 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.centerContainer, embedded && { minHeight: 160, paddingVertical: 24 }]}>
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
      <View style={embedded ? undefined : styles.scrollContent}>
        <View style={[styles.centerContainer, { paddingVertical: embedded ? 16 : 32 }]}>
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
        </View>
        {renderLibraryEntries()}
      </View>
    );
  }

  return (
    <View style={embedded ? undefined : styles.scrollContent}>
      {showStatsButton ? (
        <View style={styles.topBar}>
          <View style={styles.topBarTextBlock}>
            <Text style={styles.subtitle} numberOfLines={3}>
              {TEXTS.SUBTITLE}
            </Text>
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
      ) : null}

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

      {showListIntro ? (
        <View style={styles.listIntro}>
          <MaterialCommunityIcons name="hand-pointing-right" size={18} color={colors.primary} />
          <Text style={styles.listIntroText}>{TEXTS.HOW_IT_WORKS}</Text>
        </View>
      ) : null}

      {renderLibraryEntries()}
      {CATEGORY_ORDER.map((key) => renderCategorySection(key))}
    </View>
  );
}
