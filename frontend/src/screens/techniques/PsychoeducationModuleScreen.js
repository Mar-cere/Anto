/**
 * Módulo de psicoeducación (#85).
 * Fuente: GET /api/therapeutic-techniques/psychoeducation/:topic
 */

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
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
import { SPACING } from '../../constants/ui';
import { createInterventionCompletedRecorder } from '../../utils/recordInterventionCompleted';
import { isSafeHttpsUrl, normalizePsychoeducationTopic } from '../../utils/psychoeducationTopic';
import { moduleContentEntries, sectionLabel } from './psychoeducationDisplay';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { formatReviewFooter, resolveModuleTitle, usePsychoeducationTexts } from './psychoeducationTexts';

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
  const { colors, statusBarStyle } = useTheme();
  const { language } = useLanguage();
  const texts = usePsychoeducationTexts();
  const techniquesI18n = useSectionTranslations('TECHNIQUES');
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: SPACING.SCREEN_EDGE_INSET, paddingBottom: 60 },
        title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10 },
        disclaimerBox: {
          backgroundColor: colors.card,
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        disclaimerTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
        sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
        body: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
        bullet: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginBottom: 6 },
        sourceLink: { fontSize: 14, lineHeight: 20, color: colors.primary, marginBottom: 8 },
        error: { color: colors.error, fontSize: 14, lineHeight: 20 },
        reviewFooter: {
          fontSize: 11,
          lineHeight: 16,
          color: colors.textSecondary,
          marginTop: 24,
          fontStyle: 'italic',
        },
        mechanismBox: {
          backgroundColor: colors.card,
          borderRadius: 10,
          padding: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
      }),
    [colors],
  );

  const topic = normalizePsychoeducationTopic(route?.params?.topic);
  const recordCompletedOnce = useMemo(() => createInterventionCompletedRecorder(), []);
  const [loading, setLoading] = useState(true);
  const [module, setModule] = useState(null);
  const [error, setError] = useState(null);

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
          { headers: { 'X-App-Language': language } },
        );
        if (!mounted) return;
        if (res?.data?.success === false) {
          setError(res?.data?.error || texts.MODULE_NOT_FOUND);
          return;
        }
        const loaded = res?.data?.data || null;
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

  const title = resolveModuleTitle(texts, topic, module, techniquesI18n);

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
      <Header title={title} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {resolveModuleTitle(texts, topic, module, techniquesI18n)}
        </Text>
        {loading ? <Text style={styles.body}>{texts.LOADING}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && module ? (
          <>
            {module.disclaimer ? (
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerTitle}>{texts.DISCLAIMER_TITLE}</Text>
                <Text style={styles.body}>{module.disclaimer}</Text>
              </View>
            ) : null}
            {module.mechanismLine ? (
              <View style={styles.mechanismBox}>
                <Text style={styles.disclaimerTitle}>{texts.MECHANISM_TITLE}</Text>
                <Text style={styles.body}>{module.mechanismLine}</Text>
              </View>
            ) : null}
            {moduleContentEntries(module).map(([key, value]) => (
              <View key={key}>
                <Text style={styles.sectionTitle}>{sectionLabel(key, language)}</Text>
                {renderValue(value)}
              </View>
            ))}
            {sources.length > 0 ? (
              <View>
                <Text style={styles.sectionTitle}>{texts.SOURCES_TITLE}</Text>
                {sources.map((src, i) => (
                  <TouchableOpacity
                    key={`${src.url}-${i}`}
                    onPress={() => {
                      if (isSafeHttpsUrl(src?.url)) {
                        Linking.openURL(src.url.trim()).catch(() => {});
                      }
                    }}
                    accessibilityRole="link"
                  >
                    <Text style={styles.sourceLink}>
                      {src.label || texts.OPEN_SOURCE} ↗
                    </Text>
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
