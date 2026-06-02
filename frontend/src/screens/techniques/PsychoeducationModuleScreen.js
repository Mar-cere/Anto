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
  PsychoeducationDisclaimerFold,
  PsychoeducationHighlightSection,
  PsychoeducationSectionAccordion,
  PsychoeducationSourcesFold,
} from './PsychoeducationModuleSections';
import { createPsychoeducationModuleStyles } from './psychoeducationScreenStyles';
import { getTopicVisual } from './psychoeducationTopicVisuals';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { formatReviewFooter, resolveModuleTitle, usePsychoeducationTexts } from './psychoeducationTexts';

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
      disclaimerIconColor: colors.textSecondary,
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
  const reviewLine = formatReviewFooter(texts, module?.clinicalReview);

  const openSource = (src) => {
    if (isSafeHttpsUrl(src?.url)) {
      Linking.openURL(src.url.trim()).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={headerTitle} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && module ? (
          <>
            <View style={styles.hero}>
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
                    label={section.label}
                    value={section.value}
                    icon={section.icon}
                    accentColor={visual.accent}
                    styles={sectionStyles}
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

            <PsychoeducationSourcesFold
              title={texts.SOURCES_TITLE}
              sources={sources}
              onOpenSource={openSource}
              openSourceLabel={texts.OPEN_SOURCE}
              styles={sectionStyles}
            />

            <PsychoeducationDisclaimerFold
              title={texts.DISCLAIMER_TITLE}
              body={module.disclaimer}
              styles={sectionStyles}
            />

            {reviewLine ? <Text style={styles.reviewFooter}>{reviewLine}</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PsychoeducationModuleScreen;
