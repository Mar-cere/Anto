/**
 * Insight de sesión post-chat: emoción, patrón cognitivo y paso sugerido.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ParticleBackground from '../components/ParticleBackground';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';
import {
  CHAT_BACK_TARGET,
  dispatchResetToMainTabsWithChat,
  dispatchRootReset,
  getResetToMainTabsWithInicioState,
} from '../navigation/navigationHelpers';
import { SPACING } from '../constants/ui';
import { recordInterventionClicked } from '../utils/recordInterventionCompleted';
import { setPendingTccLiteResume } from '../utils/chatTccLiteResume';
import chatService from '../services/chatService';
import { createSessionCommitment } from '../services/sessionCommitmentsService';
import { useToast } from '../context/ToastContext';

function IntensityBar({ value, colors, sx }) {
  const pct = Math.min(100, Math.max(0, (Number(value) || 0) * 10));
  return (
    <View style={sx.intensityTrack} accessibilityRole="progressbar" accessibilityValue={{ now: pct, min: 0, max: 100 }}>
      <View style={[sx.intensityFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

export default function SessionInsightScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { colors, statusBarStyle } = useTheme();
  const TEXTS = useSectionTranslations('SESSION_INSIGHT');
  const { showToast } = useToast();

  const routeInsight = route.params?.insight;
  const conversationId = route.params?.conversationId;
  const backTarget = route.params?.backTarget || CHAT_BACK_TARGET.DASH;
  const [insight, setInsight] = useState(routeInsight || null);
  const [loading, setLoading] = useState(
    route.params?.loading === true && !routeInsight?.eligible,
  );
  const [commitmentSaving, setCommitmentSaving] = useState(false);
  const [commitmentSaved, setCommitmentSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (routeInsight?.eligible) {
      setInsight(routeInsight);
      setLoading(false);
      return undefined;
    }
    if (!conversationId || route.params?.loading !== true) return undefined;
    (async () => {
      try {
        setLoading(true);
        const fetched = await chatService.fetchSessionInsight(conversationId);
        if (cancelled) return;
        if (fetched?.eligible) {
          setInsight(fetched);
        } else {
          setInsight(null);
        }
      } catch {
        if (!cancelled) setInsight(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, route.params?.loading, routeInsight]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0,
        },
        scroll: {
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          paddingBottom: insets.bottom + 24,
        },
        hero: {
          alignItems: 'center',
          paddingTop: 12,
          paddingBottom: 20,
        },
        heroEmoji: {
          fontSize: 44,
          marginBottom: 12,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          color: colors.primary,
          marginBottom: 8,
        },
        headline: {
          fontSize: 26,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          lineHeight: 32,
          marginBottom: 10,
        },
        reflection: {
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
          textAlign: 'center',
          paddingHorizontal: 8,
        },
        metaRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 16,
          marginTop: 14,
        },
        metaChip: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.glassFill,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
        },
        metaText: {
          fontSize: 12,
          color: colors.textSecondary,
          marginLeft: 6,
        },
        card: {
          backgroundColor: colors.chromeCard,
          borderRadius: 16,
          padding: SPACING.SCREEN_EDGE_INSET,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
          marginBottom: 14,
        },
        cardKicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: colors.primary,
          marginBottom: 10,
        },
        emotionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 10,
        },
        emotionLabel: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          flex: 1,
        },
        emotionIntensity: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        intensityTrack: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.glassFill,
          overflow: 'hidden',
        },
        intensityFill: {
          height: '100%',
          borderRadius: 4,
        },
        patternName: {
          fontSize: 17,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 6,
        },
        patternBody: {
          fontSize: 14,
          lineHeight: 21,
          color: colors.textSecondary,
          marginBottom: 10,
        },
        tipBox: {
          backgroundColor: colors.glassFill,
          borderRadius: 12,
          padding: 12,
          borderLeftWidth: 3,
          borderLeftColor: colors.primary,
        },
        tipText: {
          fontSize: 14,
          lineHeight: 20,
          color: colors.text,
          fontStyle: 'italic',
        },
        themesRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        themeChip: {
          backgroundColor: colors.glassFill,
          borderRadius: 20,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
        },
        themeText: {
          fontSize: 13,
          color: colors.text,
          fontWeight: '500',
        },
        stepCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.glassFill,
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: colors.chromeCardBorder,
        },
        stepIcon: {
          fontSize: 28,
          marginRight: 12,
        },
        stepTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
        },
        stepReason: {
          fontSize: 13,
          color: colors.textSecondary,
          marginTop: 4,
          lineHeight: 18,
        },
        ctaPrimary: {
          marginTop: 8,
          backgroundColor: colors.primary,
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: 'center',
        },
        ctaPrimaryText: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.white,
        },
        ctaSecondary: {
          marginTop: 12,
          paddingVertical: 12,
          alignItems: 'center',
        },
        ctaSecondaryText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        disclaimer: {
          fontSize: 11,
          lineHeight: 16,
          color: colors.textSecondary,
          textAlign: 'center',
          marginTop: 16,
          opacity: 0.85,
        },
      }),
    [colors, insets.top, insets.bottom],
  );

  const finish = useCallback(() => {
    if (backTarget === CHAT_BACK_TARGET.HOME) {
      dispatchRootReset(navigation, { index: 0, routes: [{ name: 'Home' }] });
      return;
    }
    dispatchRootReset(navigation, getResetToMainTabsWithInicioState());
  }, [navigation, backTarget]);

  const openSuggestedStep = useCallback(() => {
    const step = insight?.suggestedStep;
    if (!step?.screen) {
      finish();
      return;
    }
    recordInterventionClicked(step.id);
    navigation.navigate(step.screen, step.params || {});
  }, [insight, navigation, finish]);

  const saveCommitment = useCallback(async () => {
    const step = insight?.suggestedStep;
    const label = String(step?.label || insight?.headline || '').trim();
    if (!label || commitmentSaving || commitmentSaved) return;
    setCommitmentSaving(true);
    try {
      const saved = await createSessionCommitment({
        label,
        conversationId: conversationId || insight?.conversationId || null,
        source: 'session_insight',
        sourceMeta: step?.id ? { interventionId: step.id } : null,
      });
      if (saved) {
        setCommitmentSaved(true);
        showToast({ message: TEXTS.CTA_COMMITMENT_SAVED, type: 'success' });
      }
    } catch (err) {
      const apiMsg = String(err?.response?.data?.message || err?.message || '').trim();
      showToast({
        message: apiMsg || TEXTS.CTA_COMMITMENT_ERROR,
        type: 'warning',
      });
    } finally {
      setCommitmentSaving(false);
    }
  }, [
    insight,
    conversationId,
    commitmentSaving,
    commitmentSaved,
    showToast,
    TEXTS.CTA_COMMITMENT_SAVED,
    TEXTS.CTA_COMMITMENT_ERROR,
  ]);

  const openTccLiteInChat = useCallback(async () => {
    const resume = insight?.tccLiteResume;
    if (!resume?.eligible || !resume.distortionType) {
      finish();
      return;
    }
    await setPendingTccLiteResume(resume);
    const ok = dispatchResetToMainTabsWithChat(navigation, {
      chatBackTarget: backTarget === CHAT_BACK_TARGET.HOME ? CHAT_BACK_TARGET.HOME : CHAT_BACK_TARGET.DASH,
      resumeTccLite: resume,
    });
    if (!ok) finish();
  }, [insight, navigation, finish, backTarget]);

  useEffect(() => {
    if (!loading && !insight?.eligible) finish();
  }, [insight?.eligible, loading, finish]);

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle={statusBarStyle} />
        <ParticleBackground />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.reflection, { marginTop: 16, textAlign: 'center' }]}>
          {TEXTS.LOADING || 'Preparando resumen…'}
        </Text>
      </View>
    );
  }

  if (!insight?.eligible) return null;

  const emotion = insight.dominantEmotion;
  const pattern = insight.thoughtPattern;
  const themes = Array.isArray(insight.themes) ? insight.themes : [];
  const step = insight.suggestedStep;
  const tccLiteResume = insight.tccLiteResume;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={statusBarStyle} />
      <ParticleBackground />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>{TEXTS.KICKER}</Text>
          <Text style={styles.heroEmoji}>{emotion?.emoji || '✨'}</Text>
          <Text style={styles.headline}>{insight.headline}</Text>
          <Text style={styles.reflection}>{insight.reflection}</Text>
          {insight.intentionLine ? (
            <Text style={[styles.reflection, { marginTop: 6, fontSize: 14 }]}>{insight.intentionLine}</Text>
          ) : null}
          <View style={styles.metaRow}>
            {insight.userTurns ? (
              <View style={styles.metaChip}>
                <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {TEXTS.MESSAGES_COUNT.replace('{n}', String(insight.userTurns))}
                </Text>
              </View>
            ) : null}
            {insight.durationMinutes ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {TEXTS.DURATION_MIN.replace('{n}', String(insight.durationMinutes))}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>{TEXTS.EMOTION_TITLE}</Text>
          <View style={styles.emotionRow}>
            <Text style={styles.emotionLabel}>{emotion?.label}</Text>
            <Text style={styles.emotionIntensity}>{emotion?.intensity}/10</Text>
          </View>
          <IntensityBar value={emotion?.intensity} colors={colors} sx={styles} />
        </View>

        {pattern ? (
          <View style={styles.card}>
            <Text style={styles.cardKicker}>{TEXTS.PATTERN_TITLE}</Text>
            <Text style={styles.patternName}>{pattern.name}</Text>
            <Text style={styles.patternBody}>{pattern.description}</Text>
            {pattern.microTip ? (
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>{pattern.microTip}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {themes.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardKicker}>{TEXTS.THEMES_TITLE}</Text>
            <View style={styles.themesRow}>
              {themes.map((theme) => (
                <View key={theme} style={styles.themeChip}>
                  <Text style={styles.themeText}>{theme}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {step ? (
          <View style={styles.card}>
            <Text style={styles.cardKicker}>{TEXTS.STEP_TITLE}</Text>
            <TouchableOpacity
              style={styles.stepCard}
              onPress={openSuggestedStep}
              accessibilityRole="button"
              accessibilityLabel={step.label}
            >
              <Text style={styles.stepIcon}>{step.icon || '💡'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.label}</Text>
                <Text style={styles.stepReason}>{step.reason}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {tccLiteResume?.eligible ? (
          <View style={styles.card}>
            <Text style={styles.cardKicker}>{TEXTS.PATTERN_TITLE}</Text>
            <Text style={[styles.patternBody, { marginBottom: 10 }]}>
              {TEXTS.CTA_TCC_LITE_CHAT_HINT}
            </Text>
            <TouchableOpacity
              style={styles.stepCard}
              onPress={openTccLiteInChat}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.CTA_TCC_LITE_CHAT}
            >
              <Text style={styles.stepIcon}>🧠</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{TEXTS.CTA_TCC_LITE_CHAT}</Text>
                {tccLiteResume.distortionLabel ? (
                  <Text style={styles.stepReason}>{tccLiteResume.distortionLabel}</Text>
                ) : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {step ? (
          <TouchableOpacity
            style={[styles.ctaSecondary, commitmentSaved && { opacity: 0.6 }]}
            onPress={saveCommitment}
            disabled={commitmentSaving || commitmentSaved}
            accessibilityRole="button"
          >
            <Text style={styles.ctaSecondaryText}>
              {commitmentSaved
                ? TEXTS.CTA_COMMITMENT_SAVED
                : commitmentSaving
                  ? TEXTS.LOADING
                  : TEXTS.CTA_SAVE_COMMITMENT}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.ctaPrimary} onPress={finish} accessibilityRole="button">
          <Text style={styles.ctaPrimaryText}>{TEXTS.CTA_DONE}</Text>
        </TouchableOpacity>

        {step ? (
          <TouchableOpacity style={styles.ctaSecondary} onPress={finish} accessibilityRole="button">
            <Text style={styles.ctaSecondaryText}>{TEXTS.CTA_SKIP_STEP}</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.disclaimer}>{TEXTS.DISCLAIMER}</Text>
      </ScrollView>
    </View>
  );
}
