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
import DashboardGroupedRow from '../dashboard/DashboardGroupedRow';
import { SPACING } from '../../constants/ui';
import { useTheme } from '../../context/ThemeContext';
import { createDashboardStyles } from '../../styles/dashboardTheme';
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
import { useSectionTranslations } from '../../hooks/useTranslations';
import {
  buildTechniqueCatalogRowSubtitle,
  createInitialCatalogExpanded,
  formatTechniqueCategoryCountA11y,
  hasTechniqueCatalogCategories,
  resolveTechniqueCatalogType,
  TECHNIQUE_TYPE_ICONS,
} from '../../utils/techniquesCatalogUtils';
import { openTechniquesHubScreen } from '../../utils/techniquesHubNavigation';

const DIRECT_PROTOCOL_SCREENS = new Set([
  'BehavioralActivation',
  'AbcRecord',
  'ExposureHierarchy',
  'AutomaticThoughtRecord',
]);

function HubIcon({ item, color }) {
  if (item.iconSet === 'mci') {
    return <MaterialCommunityIcons name={item.icon} size={22} color={color} />;
  }
  return null;
}

/**
 * @param {{
 *   catalog: ReturnType<import('../../screens/therapeuticTechniques/useTherapeuticTechniquesScreen').useTherapeuticTechniquesScreen>,
 *   embedded?: boolean,
 *   showListIntro?: boolean,
 *   showStatsButton?: boolean,
 *   focusTools?: Array<{ key: string, screen: string, icon: string, iconSet?: string, labelKey: string, hintKey: string }>,
 *   focusTexts?: Record<string, string>,
 * }} props
 */
export default function TechniquesCatalogPanel({
  catalog,
  embedded = false,
  showListIntro = false,
  showStatsButton = false,
  focusTools = [],
  focusTexts = {},
}) {
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const TEXTS = useTherapeuticTechniquesTexts();
  const TECHNIQUE_TEXTS = useSectionTranslations('TECHNIQUES');
  const styles = useTherapeuticTechniquesStyles();
  const dashStyles = useMemo(
    () => createDashboardStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );
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

  const [expandedSections, setExpandedSections] = useState(createInitialCatalogExpanded);
  const [emotionFilterOpen, setEmotionFilterOpen] = useState(false);
  const EMOTIONS = useMemo(() => createEmotionOptions(TEXTS), [TEXTS]);
  const CATEGORY_SHORT_LABEL = useMemo(() => createCategoryShortLabel(TEXTS), [TEXTS]);
  const CATEGORY_FULL_LABEL = useMemo(() => createCategoryFullLabel(TEXTS), [TEXTS]);
  const CATEGORY_HINT = useMemo(() => createCategoryHint(TEXTS), [TEXTS]);
  const categoryAccent = useMemo(() => createCategoryAccent(colors), [colors]);
  const stepLabels = useMemo(
    () => ({
      singular: TECHNIQUE_TEXTS?.TECHNIQUE_CARD_STEPS_SINGULAR || 'paso',
      plural: TECHNIQUE_TEXTS?.TECHNIQUE_CARD_STEPS_PLURAL || 'pasos',
    }),
    [TECHNIQUE_TEXTS],
  );
  const defaultTechniqueName = TECHNIQUE_TEXTS?.TECHNIQUE_CARD_DEFAULT_NAME || 'Técnica';

  const quickAccessLabel = focusTexts.QUICK_ACCESS || focusTexts.FOCUS_SECTION || 'Acceso rápido';
  const catalogSectionLabel = focusTexts.CATALOG_SECTION || focusTexts.GUIDED_SECTION || 'Catálogo';

  const selectedEmotionLabel = useMemo(() => {
    const found = EMOTIONS.find((e) => e.key === selectedEmotion);
    return found?.label ?? EMOTIONS[0].label;
  }, [selectedEmotion, EMOTIONS]);

  const quickAccessRows = useMemo(() => {
    const rows = [];
    focusTools.forEach((item) => {
      rows.push({
        key: item.key,
        iconNode: <HubIcon item={item} color={colors.primary} />,
        title: focusTexts[item.labelKey] || item.labelKey,
        subtitle: focusTexts[item.hintKey] || '',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          openTechniquesHubScreen(navigation, item.screen);
        },
      });
    });
    rows.push({
      key: 'psychoed',
      iconNode: <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.primary} />,
      title: TEXTS.PSYCHOED_LIBRARY,
      subtitle: TEXTS.PSYCHOED_LIBRARY_HINT,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        therapeuticSafeNavigate(navigation, 'PsychoeducationLibrary');
      },
    });
    rows.push({
      key: 'microguides',
      iconNode: <MaterialCommunityIcons name="compass-outline" size={22} color={colors.primary} />,
      title: TEXTS.MICRO_GUIDE_LIBRARY,
      subtitle: TEXTS.MICRO_GUIDE_LIBRARY_HINT,
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        therapeuticSafeNavigate(navigation, 'MicroGuideLibrary');
      },
    });
    return rows;
  }, [focusTools, focusTexts, colors.primary, navigation, TEXTS]);

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

  const renderQuickAccess = () => (
    <View style={dashStyles.section}>
      <Text style={[dashStyles.eyebrow, styles.sectionEyebrowEmbedded]} accessibilityRole="header">
        {quickAccessLabel.toUpperCase()}
      </Text>
      <View style={dashStyles.groupedList}>
        {quickAccessRows.map((row, index) => (
          <DashboardGroupedRow
            key={row.key}
            iconNode={row.iconNode}
            title={row.title}
            subtitle={row.subtitle}
            onPress={row.onPress}
            isLast={index === quickAccessRows.length - 1}
          />
        ))}
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
          style={[
            styles.categoryHeader,
            { borderLeftColor: accent },
            !expanded && styles.categoryHeaderCollapsed,
          ]}
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
                  accessibilityLabel={formatTechniqueCategoryCountA11y(list.length, TEXTS.CATEGORY_COUNT_A11Y)}
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
            {expanded && hint ? (
              <Text style={styles.categoryHint} numberOfLines={2}>
                {hint}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
        {expanded ? (
          <View style={[dashStyles.groupedList, styles.categoryCardsGrouped]}>
            {list.map((technique, index) => {
              const type = resolveTechniqueCatalogType(technique);
              const icon = TECHNIQUE_TYPE_ICONS[type] || 'book-open-variant';
              const accentColor = categoryAccent[type] || colors.primary;
              return (
                <DashboardGroupedRow
                  key={technique?.id != null ? String(technique.id) : `technique-${index}`}
                  iconNode={
                    <MaterialCommunityIcons name={icon} size={22} color={accentColor} />
                  }
                  title={
                    technique?.name != null && String(technique.name).trim() !== ''
                      ? String(technique.name)
                      : defaultTechniqueName
                  }
                  subtitle={buildTechniqueCatalogRowSubtitle(technique, stepLabels)}
                  onPress={() => handleTechniquePress(technique)}
                  isLast={index === list.length - 1}
                />
              );
            })}
          </View>
        ) : null}
      </View>
    );
  };

  const showEmotionTools = !loading && !error && techniques.length > 0;
  const hasCatalogCategories = hasTechniqueCatalogCategories(groupedTechniques, CATEGORY_ORDER);

  if (loading && !refreshing) {
    return (
      <View style={embedded ? undefined : styles.scrollContent}>
        {renderQuickAccess()}
        <View style={[styles.centerContainer, embedded && { minHeight: 120, paddingVertical: SPACING.HERO_INSET }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{TEXTS.LOADING}</Text>
        </View>
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <>
        {renderQuickAccess()}
        <View style={[styles.centerContainer, embedded && { minHeight: 120, paddingVertical: SPACING.HERO_INSET }]}>
          <MaterialCommunityIcons name="alert-circle" size={40} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadTechniques()}>
            <Text style={styles.retryButtonText}>{TEXTS.RETRY}</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (filteredTechniques.length === 0) {
    const isFilteredEmpty = techniques.length > 0;
    return (
      <View style={embedded ? undefined : styles.scrollContent}>
        {renderQuickAccess()}
        <View style={[styles.centerContainer, { paddingVertical: embedded ? SPACING.HERO_INSET : SPACING.lg }]}>
          <MaterialCommunityIcons
            name={isFilteredEmpty ? 'filter-off' : 'book-open-variant'}
            size={40}
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
      </View>
    );
  }

  return (
    <View style={embedded ? undefined : styles.scrollContent}>
      {showStatsButton ? (
        <View style={styles.topBarEmbedded}>
          <Text style={styles.subtitle} numberOfLines={2}>
            {TEXTS.SUBTITLE}
          </Text>
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

      {renderQuickAccess()}

      {showEmotionTools ? (
        <View style={dashStyles.section}>
          <View style={styles.emotionToggleRowEmbedded}>
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
        </View>
      ) : null}

      {showListIntro ? (
        <View style={styles.listIntro}>
          <MaterialCommunityIcons name="hand-pointing-right" size={18} color={colors.primary} />
          <Text style={styles.listIntroText}>{TEXTS.HOW_IT_WORKS}</Text>
        </View>
      ) : null}

      {hasCatalogCategories ? (
        <View style={dashStyles.section}>
          <Text style={[dashStyles.eyebrow, styles.sectionEyebrowEmbedded]} accessibilityRole="header">
            {catalogSectionLabel.toUpperCase()}
          </Text>
          {CATEGORY_ORDER.map((key) => renderCategorySection(key))}
        </View>
      ) : null}
    </View>
  );
}
