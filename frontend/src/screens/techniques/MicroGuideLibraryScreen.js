/**
 * Biblioteca de micro-guías (#90–#99 / catálogo #127).
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
import { usePsychoeducationTexts } from './psychoeducationTexts';
import { createPsychoeducationLibraryStyles } from './psychoeducationScreenStyles';
import { parseMicroGuideBrowseResponse, useMicroGuideTexts } from './microGuideTexts';

const MicroGuideLibraryScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const texts = useMicroGuideTexts();
  const sealTexts = usePsychoeducationTexts();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const styles = useMemo(
    () => createPsychoeducationLibraryStyles(colors, resolvedScheme),
    [colors, resolvedScheme],
  );

  const countLabel = useMemo(
    () => texts.GUIDE_COUNT.replace('{n}', String(guides.length)),
    [texts.GUIDE_COUNT, guides.length],
  );

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const res = await api.get('/api/therapeutic-techniques/micro-guides');
        if (res && typeof res === 'object' && res.success === false) {
          setError(res.error || texts.ERROR);
          setGuides([]);
          return;
        }
        setGuides(parseMicroGuideBrowseResponse(res));
      } catch {
        setError(texts.ERROR);
        setGuides([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [language, texts.ERROR],
  );

  useEffect(() => {
    load();
  }, [load]);

  const openGuide = useCallback(
    (guideId) => {
      const id = String(guideId || '').trim();
      if (!id) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      navigation.navigate('MicroGuide', { guideId: id });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]} testID="microguide-library-screen">
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
              <MaterialCommunityIcons name="compass-outline" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroKicker}>{texts.HERO_KICKER}</Text>
              <Text style={styles.heroTitle}>{texts.LIBRARY_SUBTITLE}</Text>
            </View>
          </View>
          {!loading && !error && guides.length > 0 ? (
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

        {!loading && !error && guides.length === 0 ? (
          <Text style={styles.emptyText}>{texts.EMPTY_LIST}</Text>
        ) : null}

        {!loading &&
          !error &&
          guides.map((item) => {
            const guideId = String(item.guideId || item.interventionId || '').trim();
            const readLabel = texts.READ_TIME.replace('{n}', String(item.estimatedMinutes || 2));
            const stepsLabel = texts.STEP_COUNT.replace('{n}', String(item.stepCount || 0));
            return (
              <TouchableOpacity
                key={guideId}
                testID={`microguide-library-card-${guideId}`}
                style={[styles.moduleCard, { borderLeftColor: colors.primary }]}
                onPress={() => openGuide(guideId)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.moduleRow}>
                  <View style={[styles.iconTile, { backgroundColor: colors.accentLineSoft }]}>
                    <Text style={{ fontSize: 24 }}>{item.icon || '📘'}</Text>
                  </View>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle}>{item.title}</Text>
                    {item.intro ? (
                      <Text style={styles.moduleSummary} numberOfLines={2}>
                        {item.intro}
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
                      <View style={styles.readPill}>
                        <MaterialCommunityIcons
                          name="format-list-numbered"
                          size={13}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.readPillText}>{stepsLabel}</Text>
                      </View>
                      {item.clinicalReview ? (
                        <PsychoeducationClinicalReviewSeal
                          clinicalReview={item.clinicalReview}
                          texts={sealTexts}
                          variant="library"
                          accentColor={colors.primary}
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

export default MicroGuideLibraryScreen;
