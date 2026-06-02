/**
 * Biblioteca de módulos de psicoeducación (#85).
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
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
import { normalizePsychoeducationTopic } from '../../utils/psychoeducationTopic';
import { usePsychoeducationTexts } from './psychoeducationTexts';

const PsychoeducationLibraryScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const { language } = useLanguage();
  const texts = usePsychoeducationTexts();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: SPACING.SCREEN_EDGE_INSET, paddingBottom: 48 },
        subtitle: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginBottom: 16 },
        card: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 14,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: colors.border,
        },
        cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
        cardSummary: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
        error: { color: colors.error, fontSize: 14, marginBottom: 12 },
        retry: { color: colors.primary, fontWeight: '600', fontSize: 14 },
      }),
    [colors],
  );

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const res = await api.get('/api/therapeutic-techniques/psychoeducation', {
        headers: { 'X-App-Language': language },
      });
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setModules(
        list.filter((item) => item?.topic && normalizePsychoeducationTopic(item.topic)),
      );
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
      try {
        navigation.navigate('PsychoeducationModule', { topic });
      } catch (e) {
        if (__DEV__) console.warn('[PsychoeducationLibrary] navigate failed', e);
      }
    },
    [navigation],
  );

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={texts.LIBRARY_TITLE} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
      >
        <Text style={styles.subtitle}>{texts.LIBRARY_SUBTITLE}</Text>
        {loading && !refreshing ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {error ? (
          <View>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity onPress={() => load()}>
              <Text style={styles.retry}>{texts.RETRY}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {!loading &&
          !error &&
          modules.map((item) => (
            <TouchableOpacity
              key={item.topic}
              style={styles.card}
              onPress={() => openModule(item.topic)}
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSummary}>{item.summary}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PsychoeducationLibraryScreen;
