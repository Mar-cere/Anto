/**
 * Panel de recursos de crisis en el chat (líneas de ayuda + acciones).
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSectionTranslations } from '../../hooks/useTranslations';
import { SPACING } from '../../constants/ui';
import { pickLocalizedDefaults } from '../../utils/localizedFallback';
import { getFocusTheme } from '../../styles/focusCardTheme';
import { buildTelUri } from '../../utils/crisisResources';
import AiLimitInfoButton from '../common/AiLimitInfoButton';
import { AI_LIMIT_TOPIC } from '../../constants/aiCompetenceLimits';

const DEFAULT_TEXTS_BY_LANG = {
  es: {
    KICKER: 'Recursos de apoyo',
    TITLE: 'Ayuda humana ahora',
    CALL: 'Llamar',
    CONTACTS: 'Contactos de emergencia',
    CONTACTS_HINT: 'Configura o revisa a quién avisar',
    DISMISS_A11Y: 'Ocultar panel de recursos',
    COUNTRY_PREFIX: 'Para',
  },
  en: {
    KICKER: 'Support resources',
    TITLE: 'Human help now',
    CALL: 'Call',
    CONTACTS: 'Emergency contacts',
    CONTACTS_HINT: 'Set up or review who to alert',
    DISMISS_A11Y: 'Hide resources panel',
    COUNTRY_PREFIX: 'For',
  },
};

function fireLightHaptics() {
  try {
    const out = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (out && typeof out.then === 'function') out.catch(() => {});
  } catch {
    /* sin motor háptico */
  }
}

export default function CrisisResourcesStrip({
  resources,
  onDismiss,
  onOpenEmergencyContacts,
  onOpenAiLimitsLibrary,
  contactAlertNotice = null,
  style,
}) {
  const { colors, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const translated = useSectionTranslations('CHAT');
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const TEXTS = useMemo(() => {
    const defaults = pickLocalizedDefaults(language, DEFAULT_TEXTS_BY_LANG);
    return {
      KICKER: translated?.CRISIS_RESOURCES_KICKER || defaults.KICKER,
      TITLE: translated?.CRISIS_RESOURCES_TITLE || defaults.TITLE,
      CALL: translated?.CRISIS_RESOURCES_CALL || defaults.CALL,
      CONTACTS: translated?.CRISIS_RESOURCES_CONTACTS || defaults.CONTACTS,
      CONTACTS_HINT: translated?.CRISIS_RESOURCES_CONTACTS_HINT || defaults.CONTACTS_HINT,
      DISMISS_A11Y: translated?.CRISIS_RESOURCES_DISMISS_A11Y || defaults.DISMISS_A11Y,
      COUNTRY_PREFIX: translated?.CRISIS_RESOURCES_COUNTRY_PREFIX || defaults.COUNTRY_PREFIX,
    };
  }, [language, translated]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginBottom: SPACING.sm,
        },
        panel: {
          ...t.FOCUS_PANEL,
          borderColor: colors.warningBorder || colors.warning || t.FOCUS_BORDER_SUBTLE,
          borderWidth: 1,
          padding: SPACING.md,
          gap: SPACING.sm,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.sm,
        },
        headerBody: { flex: 1 },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: colors.warning || t.FOCUS_KICKER_COLOR,
        },
        title: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
          marginTop: 2,
          lineHeight: 21,
        },
        country: {
          fontSize: 13,
          color: t.FOCUS_META,
          marginTop: 2,
        },
        dismissBtn: {
          padding: 4,
        },
        item: {
          ...t.FOCUS_INNER_ROW,
          alignItems: 'center',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.FOCUS_BORDER_SUBTLE,
        },
        itemBody: { flex: 1, paddingRight: SPACING.sm },
        itemLabel: {
          fontSize: 12,
          fontWeight: '600',
          color: t.FOCUS_META,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        },
        itemValue: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          marginTop: 2,
          lineHeight: 20,
        },
        callBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderRadius: 10,
          backgroundColor: colors.warningSoft || colors.accentLineSoft,
        },
        callText: {
          fontSize: 13,
          fontWeight: '700',
          color: colors.warning || colors.primary,
        },
        transparencyBlock: {
          fontSize: 13,
          lineHeight: 18,
          color: colors.text,
          marginBottom: 4,
        },
        transparencySection: {
          gap: 6,
          marginBottom: SPACING.xs,
        },
        disclaimer: {
          fontSize: 12,
          lineHeight: 17,
          color: t.FOCUS_META,
        },
        contactsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          paddingTop: 2,
        },
        contactsText: { flex: 1 },
        contactsTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text,
        },
        contactsHint: {
          fontSize: 12,
          color: t.FOCUS_META,
          marginTop: 1,
        },
      }),
    [colors, t],
  );

  if (!resources?.items?.length) return null;

  const handleCall = (dial) => {
    const uri = buildTelUri(dial);
    if (!uri) return;
    fireLightHaptics();
    Linking.openURL(uri).catch(() => {});
  };

  return (
    <View style={[styles.wrap, style]} accessibilityRole="summary">
      <View style={styles.panel}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons
            name="lifebuoy"
            size={22}
            color={colors.warning || colors.primary}
          />
          <View style={styles.headerBody}>
            <Text style={styles.kicker}>{TEXTS.KICKER}</Text>
            <Text style={styles.title}>{TEXTS.TITLE}</Text>
            {resources.countryLabel ? (
              <Text style={styles.country}>
                {TEXTS.COUNTRY_PREFIX} {resources.countryLabel}
              </Text>
            ) : null}
          </View>
          {onOpenAiLimitsLibrary ? (
            <AiLimitInfoButton
              topicId={AI_LIMIT_TOPIC.CRISIS}
              size={20}
              color={colors.textSecondary}
              onOpenFullLibrary={onOpenAiLimitsLibrary}
            />
          ) : null}
          {onDismiss ? (
            <TouchableOpacity
              onPress={() => {
                fireLightHaptics();
                onDismiss();
              }}
              style={styles.dismissBtn}
              accessibilityRole="button"
              accessibilityLabel={TEXTS.DISMISS_A11Y}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {contactAlertNotice ? (
          <Text style={styles.transparencyBlock}>{contactAlertNotice}</Text>
        ) : null}

        {Array.isArray(resources.transparency) && resources.transparency.length > 0 ? (
          <View style={styles.transparencySection}>
            {resources.transparency.map((block) => (
              <Text key={block.id} style={styles.transparencyBlock}>
                {block.text}
              </Text>
            ))}
          </View>
        ) : null}

        {resources.items.map((item) => {
          const dial = item.dial || null;
          return (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemBody}>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemValue}>{item.value}</Text>
              </View>
              {dial ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(dial)}
                  accessibilityRole="button"
                  accessibilityLabel={`${TEXTS.CALL} ${item.label}`}
                >
                  <Ionicons name="call" size={14} color={colors.warning || colors.primary} />
                  <Text style={styles.callText}>{TEXTS.CALL}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}

        {resources.disclaimer ? (
          <Text style={styles.disclaimer}>{resources.disclaimer}</Text>
        ) : null}
        {resources.appLimits ? (
          <Text style={styles.disclaimer}>{resources.appLimits}</Text>
        ) : null}

        {onOpenEmergencyContacts ? (
          <TouchableOpacity
            style={styles.contactsRow}
            onPress={() => {
              fireLightHaptics();
              onOpenEmergencyContacts();
            }}
            accessibilityRole="button"
            accessibilityLabel={TEXTS.CONTACTS}
          >
            <MaterialCommunityIcons name="account-heart" size={22} color={colors.primary} />
            <View style={styles.contactsText}>
              <Text style={styles.contactsTitle}>{TEXTS.CONTACTS}</Text>
              <Text style={styles.contactsHint}>{TEXTS.CONTACTS_HINT}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
