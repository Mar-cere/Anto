/**
 * Módulo de psicoeducación (#85).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { api } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createInterventionCompletedRecorder } from '../../utils/recordInterventionCompleted';
import { isSafeHttpsUrl, normalizePsychoeducationTopic } from '../../utils/psychoeducationTopic';
import { buildModuleSections, getModuleLeadText } from './psychoeducationContentLayout';
import {
  PsychoeducationHighlightSection,
  PsychoeducationModuleFooter,
  PsychoeducationSectionAccordion,
} from './PsychoeducationModuleSections';
import { createPsychoeducationModuleStyles } from './psychoeducationScreenStyles';
import { getTopicVisual } from './psychoeducationTopicVisuals';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { resolveModuleTitle, usePsychoeducationTexts } from './psychoeducationTexts';

const READ_MINUTES = 2;

const TOPIC_TO_INTERVENTION_ID = {
  anxiety: 'psychoeducation_anxiety',
  depression: 'psychoeducation_depression',
  stress: 'psychoeducation_stress',
  anger: 'psychoeducation_anger',
  sleep: 'psychoeducation_sleep',
  emotionRegulation: 'psychoeducation_emotion_regulation',
  trauma: 'psychoeducation_trauma',
};

const PsychoeducationModuleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const texts = usePsychoeducationTexts();
  const techniquesI18n = useSectionTranslations('TECHNIQUES');
  const styles = useMemo(
    () => createPsychoeducationModuleStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const topic = normalizePsychoeducationTopic(route?.params?.topic);
  const visual = useMemo(() => getTopicVisual(topic, colors), [topic, colors]);
  const recordCompletedOnce = useMemo(() => createInterventionCompletedRecorder(), []);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [error, setError] = useState(null);

  const headerTitle = useMemo(
    () => resolveModuleTitle(texts, topic, module, techniquesI18n),
    [texts, topic, module, techniquesI18n],
  );

  const readLabel = useMemo(
    () => texts.READ_TIME.replace('{n}', String(READ_MINUTES)),
    [texts.READ_TIME],
  );

  const leadText = useMemo(() => getModuleLeadText(module), [module]);

  const sections = useMemo(
    () => buildModuleSections(module, language),
    [module, language],
  );

  const sectionStyles = useMemo(
    () => ({
      ...styles,
      bulletDotColor: visual.accent,
      accordionIconBg: visual.iconBg,
      accentFallback: colors.primary,
      chevronColor: colors.textSecondary,
      footerIconColor: colors.textSecondary,
    }),
    [styles, visual, colors],
  );

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setModule(null);
        if (!topic) {
          setError(texts.NO_TOPIC);
          return;
        }
        const res = await api.get(
          `/api/therapeutic-techniques/psychoeducation/${encodeURIComponent(topic)}`,
        );
        if (!mounted) return;
        if (res && typeof res === 'object' && res.success === false) {
          setError(res.error || texts.MODULE_NOT_FOUND);
          return;
        }
        const loaded = res?.data || null;
        setModule(loaded);
        if (loaded) {
          const interventionId = TOPIC_TO_INTERVENTION_ID[topic];
          if (interventionId) recordCompletedOnce(interventionId);
        }
      } catch {
        if (!mounted) return;
        setError(texts.LOAD_MODULE_ERROR);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [topic, language, texts, recordCompletedOnce]);

  const sources = Array.isArray(module?.sources) ? module.sources : [];

  const openSource = (src) => {
    if (isSafeHttpsUrl(src?.url)) {
      Linking.openURL(src.url.trim()).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} testID={`psychoed-module-${topic || 'unknown'}`}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={headerTitle} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} testID="psychoed-module-scroll">
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && module ? (
          <>
            <View style={styles.hero} testID="psychoed-module-hero">
              <View style={[styles.heroIcon, { backgroundColor: visual.iconBg }]}>
                <MaterialCommunityIcons name={visual.icon} size={30} color={visual.accent} />
              </View>
              <Text style={styles.heroTitle}>{headerTitle}</Text>
              <Text style={styles.heroMinutes}>{readLabel}</Text>
              {leadText ? <Text style={styles.heroLead}>{leadText}</Text> : null}
            </View>

            {module.mechanismLine ? (
              <View
                style={[
                  styles.callout,
                  styles.calloutMechanism,
                  { borderLeftColor: visual.borderLeft },
                ]}
              >
                <Text style={styles.calloutTitle}>{texts.MECHANISM_TITLE}</Text>
                <Text style={styles.calloutBody}>{module.mechanismLine}</Text>
              </View>
            ) : null}

            <View style={styles.sectionsStack}>
              {sections.map((section) =>
                section.isHighlight ? (
                  <PsychoeducationHighlightSection
                    key={section.key}
                    testID={
                      section.highlightLayout === 'supportGroup'
                        ? 'psychoed-module-support-group'
                        : `psychoed-module-highlight-${section.key}`
                    }
                    label={section.label}
                    value={section.value}
                    icon={section.icon}
                    accentColor={visual.accent}
                    styles={sectionStyles}
                    highlightLayout={section.highlightLayout}
                    supportGroup={section.supportGroup}
                  />
                ) : (
                  <PsychoeducationSectionAccordion
                    key={section.key}
                    label={section.label}
                    value={section.value}
                    icon={section.icon}
                    defaultExpanded={section.defaultExpanded}
                    accentColor={visual.accent}
                    styles={sectionStyles}
                    itemsPreviewLabel={texts.SECTION_ITEMS_PREVIEW}
                  />
                ),
              )}
            </View>

            <PsychoeducationModuleFooter
              sourcesTitle={texts.SOURCES_TITLE}
              sources={sources}
              onOpenSource={openSource}
              openSourceLabel={texts.OPEN_SOURCE}
              sourcesCountLabel={texts.SOURCES_COUNT}
              disclaimerTitle={texts.DISCLAIMER_TITLE}
              disclaimerBody={module.disclaimer}
              styles={sectionStyles}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PsychoeducationModuleScreen;
