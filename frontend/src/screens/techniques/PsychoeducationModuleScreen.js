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
  TouchableOpacity,
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
import { moduleContentEntries, sectionLabel } from './psychoeducationDisplay';
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

  const renderValue = (v) => {
    if (typeof v === 'string') return <Text style={styles.body}>{v}</Text>;
    if (Array.isArray(v)) {
      return (
        <View>
          {v.map((x, i) => (
            <Text key={`${i}`} style={styles.bullet}>
              • {String(x)}
            </Text>
          ))}
        </View>
      );
    }
    return null;
  };

  const sources = Array.isArray(module?.sources) ? module.sources : [];
  const reviewLine = formatReviewFooter(texts, module?.clinicalReview);

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

            {module.disclaimer ? (
              <View style={[styles.callout, styles.calloutDisclaimer]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={18}
                    color={colors.primary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.calloutTitle}>{texts.DISCLAIMER_TITLE}</Text>
                </View>
                <Text style={styles.calloutBody}>{module.disclaimer}</Text>
              </View>
            ) : null}

            {moduleContentEntries(module).map(([key, value]) => (
              <View key={key} style={styles.sectionBlock}>
                <Text style={styles.sectionTitle}>{sectionLabel(key, language)}</Text>
                {renderValue(value)}
              </View>
            ))}

            {sources.length > 0 ? (
              <View style={styles.sourcesPanel}>
                <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>{texts.SOURCES_TITLE}</Text>
                {sources.map((src, i) => (
                  <TouchableOpacity
                    key={`${src.url}-${i}`}
                    style={[styles.sourceRow, i === 0 && styles.sourceRowFirst]}
                    onPress={() => {
                      if (isSafeHttpsUrl(src?.url)) {
                        Linking.openURL(src.url.trim()).catch(() => {});
                      }
                    }}
                    accessibilityRole="link"
                  >
                    <MaterialCommunityIcons
                      name="link-variant"
                      size={18}
                      color={colors.primary}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.sourceLink} numberOfLines={2}>
                      {src.label || texts.OPEN_SOURCE}
                    </Text>
                    <MaterialCommunityIcons name="open-in-new" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {reviewLine ? <Text style={styles.reviewFooter}>{reviewLine}</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PsychoeducationModuleScreen;
