/**
 * Biblioteca de módulos de psicoeducación (#85).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import Header from '../../components/Header';
import PsychoeducationClinicalReviewSeal from '../../components/PsychoeducationClinicalReviewSeal';
import ParticleBackground from '../../components/ParticleBackground';
import { api } from '../../config/api';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { createPsychoeducationLibraryStyles } from './psychoeducationScreenStyles';
import { getTopicVisual } from './psychoeducationTopicVisuals';
import { usePsychoeducationTexts } from './psychoeducationTexts';
import { normalizePsychoeducationTopic, parsePsychoeducationBrowseResponse } from '../../utils/psychoeducationTopic';

const READ_MINUTES = 2;

const PsychoeducationLibraryScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const texts = usePsychoeducationTexts();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const styles = useMemo(
    () => createPsychoeducationLibraryStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const countLabel = useMemo(
    () => texts.MODULE_COUNT.replace('{n}', String(modules.length)),
    [texts.MODULE_COUNT, modules.length],
  );

  const readLabel = useMemo(
    () => texts.READ_TIME.replace('{n}', String(READ_MINUTES)),
    [texts.READ_TIME],
  );

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await api.get('/api/therapeutic-techniques/psychoeducation');
      if (res && typeof res === 'object' && res.success === false) {
        setError(res.error || texts.ERROR);
        setModules([]);
        return;
      }
      const list = parsePsychoeducationBrowseResponse(res);
      setModules(list);
    } catch {
      setError(texts.ERROR);
      setModules([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [language, texts.ERROR]);

  useEffect(() => {
    load();
  }, [load]);

  const openModule = useCallback(
    (rawTopic) => {
      const topic = normalizePsychoeducationTopic(rawTopic);
      if (!topic) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      try {
        navigation.navigate('PsychoeducationModule', { topic });
      } catch (e) {
        if (__DEV__) console.warn('[PsychoeducationLibrary] navigate failed', e);
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} testID="psychoed-library-screen">
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={texts.LIBRARY_TITLE} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconWrap}>
              <MaterialCommunityIcons name="book-open-variant" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroKicker}>{texts.HERO_KICKER}</Text>
              <Text style={styles.heroTitle}>{texts.LIBRARY_SUBTITLE}</Text>
            </View>
          </View>
          {!loading && !error && modules.length > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{countLabel}</Text>
            </View>
          ) : null}
        </View>

        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.centerBox}>
            <MaterialCommunityIcons name="cloud-off-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.errorText, { marginTop: 12 }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { marginTop: 16 }]} onPress={() => load()}>
              <Text style={styles.retryText}>{texts.RETRY}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && modules.length === 0 ? (
          <Text style={styles.emptyText}>{texts.EMPTY_LIST}</Text>
        ) : null}

        {!loading &&
          !error &&
          modules.map((item) => {
            const topic = normalizePsychoeducationTopic(item.topic);
            const visual = getTopicVisual(topic, colors);
            return (
              <TouchableOpacity
                key={item.topic}
                testID={`psychoed-library-card-${topic}`}
                style={[styles.moduleCard, { borderLeftColor: visual.borderLeft }]}
                onPress={() => openModule(item.topic)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.moduleRow}>
                  <View style={[styles.iconTile, { backgroundColor: visual.iconBg }]}>
                    <MaterialCommunityIcons name={visual.icon} size={26} color={visual.accent} />
                  </View>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{item.title}</Text>
                    {item.summary ? (
                      <Text style={styles.moduleSummary} numberOfLines={2}>
                        {item.summary}
                      </Text>
                    ) : null}
                    <View style={styles.metaRow}>
                      <View style={styles.readPill}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.readPillText}>{readLabel}</Text>
                      </View>
                      {item.clinicalReview ? (
                        <PsychoeducationClinicalReviewSeal
                          clinicalReview={item.clinicalReview}
                          texts={texts}
                          variant="library"
                          accentColor={visual.accent}
                        />
                      ) : null}
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PsychoeducationLibraryScreen;
