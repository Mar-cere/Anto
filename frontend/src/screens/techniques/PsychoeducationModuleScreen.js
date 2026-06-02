/**
 * Pantalla simple de módulo de psicoeducación.
 * Fuente: backend /api/therapeutic-techniques/psychoeducation/:topic
 */

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import ParticleBackground from '../../components/ParticleBackground';
import { api } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';
import { createInterventionCompletedRecorder } from '../../utils/recordInterventionCompleted';

const TOPIC_TO_INTERVENTION_ID = {
  anxiety: 'psychoeducation_anxiety',
  depression: 'psychoeducation_depression',
  stress: 'psychoeducation_stress',
};

const DEFAULT_TITLE = 'Psicoeducación';

function safeTopic(raw) {
  const t = String(raw || '').trim().toLowerCase();
  return t || null;
}

const PsychoeducationModuleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: SPACING.SCREEN_EDGE_INSET, paddingBottom: 60 },
        title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 10 },
        sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
        body: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
        bullet: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginBottom: 6 },
        error: { color: colors.error, fontSize: 14, lineHeight: 20 },
      }),
    [colors],
  );

  const topic = safeTopic(route?.params?.topic);
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
          setError('No se indicó un tema.');
          return;
        }
        const res = await api.get(`/api/therapeutic-techniques/psychoeducation/${encodeURIComponent(topic)}`);
        if (!mounted) return;
        if (res?.data?.success === false) {
          setError(res?.data?.error || 'No se encontró el módulo.');
          return;
        }
        const loaded = res?.data?.data || null;
        setModule(loaded);
        if (loaded) {
          const interventionId = TOPIC_TO_INTERVENTION_ID[topic];
          if (interventionId) recordCompletedOnce(interventionId);
        }
      } catch (e) {
        if (!mounted) return;
        setError('No se pudo cargar el módulo.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [topic]);

  const title = useMemo(() => {
    if (!topic) return DEFAULT_TITLE;
    if (topic === 'anxiety') return 'Ansiedad';
    if (topic === 'depression') return 'Depresión';
    if (topic === 'stress') return 'Estrés';
    return DEFAULT_TITLE;
  }, [topic]);

  const renderValue = (v) => {
    if (typeof v === 'string') return <Text style={styles.body}>{v}</Text>;
    if (Array.isArray(v)) {
      return (
        <View>
          {v.map((x, i) => (
            <Text key={`${i}`} style={styles.bullet}>
              - {String(x)}
            </Text>
          ))}
        </View>
      );
    }
    if (v && typeof v === 'object') {
      const entries = Object.entries(v);
      return (
        <View>
          {entries.map(([k, val]) => (
            <View key={k} style={{ marginBottom: 10 }}>
              <Text style={styles.sectionTitle}>{k}</Text>
              {renderValue(val)}
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.background} />
      <ParticleBackground />
      <Header title={title} showBackButton onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {loading ? <Text style={styles.body}>Cargando…</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && module ? renderValue(module) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PsychoeducationModuleScreen;

