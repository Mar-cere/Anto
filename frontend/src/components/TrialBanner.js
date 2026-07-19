/**
 * Banner de trial: franja fina (default / chat) o chip compacto (dashboard).
 */

import React, { useMemo } from 'react';
import { SPACING } from '../constants/ui';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { useSectionTranslations } from '../hooks/useTranslations';

const DEFAULT_TEXTS = {
  TRIAL_ACTIVE: 'Trial activo',
  SUBSCRIBE: 'Suscribirse',
  TRIAL_EXPIRING_SOON: 'Tu trial expira pronto',
  TRIAL_DAY_REMAINING: 'día restante',
  TRIAL_DAYS_REMAINING: 'días restantes',
  TRIAL_HOUR_REMAINING: 'hora restante',
  TRIAL_HOURS_REMAINING: 'horas restantes',
  TRIAL_BANNER_CLOSE_A11Y: 'Cerrar aviso de trial',
};

const TrialBanner = ({
  daysRemaining,
  hoursRemaining,
  onDismiss,
  dismissed = false,
  variant = 'default',
}) => {
  const translated = useSectionTranslations('SETTINGS');
  const TEXTS = useMemo(
    () => ({
      TRIAL_ACTIVE:
        translated?.TRIAL_BANNER_ACTIVE || DEFAULT_TEXTS.TRIAL_ACTIVE,
      SUBSCRIBE: translated?.TRIAL_BANNER_SUBSCRIBE || DEFAULT_TEXTS.SUBSCRIBE,
      TRIAL_EXPIRING_SOON:
        translated?.TRIAL_BANNER_EXPIRING_SOON ||
        DEFAULT_TEXTS.TRIAL_EXPIRING_SOON,
      TRIAL_DAY_REMAINING:
        translated?.TRIAL_BANNER_DAY_REMAINING || DEFAULT_TEXTS.TRIAL_DAY_REMAINING,
      TRIAL_DAYS_REMAINING:
        translated?.TRIAL_BANNER_DAYS_REMAINING || DEFAULT_TEXTS.TRIAL_DAYS_REMAINING,
      TRIAL_HOUR_REMAINING:
        translated?.TRIAL_BANNER_HOUR_REMAINING || DEFAULT_TEXTS.TRIAL_HOUR_REMAINING,
      TRIAL_HOURS_REMAINING:
        translated?.TRIAL_BANNER_HOURS_REMAINING || DEFAULT_TEXTS.TRIAL_HOURS_REMAINING,
      CLOSE_A11Y:
        translated?.TRIAL_BANNER_CLOSE_A11Y || DEFAULT_TEXTS.TRIAL_BANNER_CLOSE_A11Y,
      VIEW_PLANS: translated?.TRIAL_BANNER_VIEW_PLANS || 'Ver planes',
      COMPACT_ENDS_TODAY: translated?.TRIAL_BANNER_COMPACT_ENDS_TODAY || 'termina hoy',
      COMPACT_DAYS:
        translated?.TRIAL_BANNER_COMPACT_DAYS || 'quedan {days} días',
    }),
    [translated],
  );
  const navigation = useNavigation();
  const { colors, resolvedScheme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const dark = resolvedScheme === 'dark';

  const hexToRgba = (hex, alpha) => {
    const h = String(hex || '').replace('#', '');
    if (h.length < 6) return colors.glassFill;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        /** Franja fina bajo el header del chat (no card beige). */
        strip: {
          flexDirection: 'row',
          alignItems: 'center',
          marginHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginTop: SPACING.xs,
          marginBottom: SPACING.sm,
          paddingVertical: SPACING.sm,
          paddingLeft: SPACING.CARD_INNER_INSET,
          paddingRight: SPACING.xs,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          gap: SPACING.sm,
        },
        stripIcon: {
          flexShrink: 0,
        },
        stripCopy: {
          flex: 1,
          minWidth: 0,
          gap: 1,
        },
        stripTitle: {
          fontSize: 13,
          fontWeight: '600',
          lineHeight: 17,
          color: colors.text,
        },
        stripSubtitle: {
          fontSize: 12,
          fontWeight: '400',
          lineHeight: 16,
          color: colors.textSecondary,
        },
        stripCta: {
          flexShrink: 0,
          paddingVertical: SPACING.xs,
          paddingHorizontal: SPACING.xs,
        },
        stripCtaText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
        },
        stripDismiss: {
          flexShrink: 0,
          padding: SPACING.sm,
        },
        compactContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: SPACING.CHIP_INSET,
          paddingHorizontal: SPACING.CARD_INNER_INSET,
          marginBottom: 12,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          backgroundColor: colors.accentLineSoft,
          borderColor: colors.accentLine,
        },
        compactLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          gap: SPACING.sm,
        },
        compactDot: {
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: colors.primaryBright,
        },
        compactText: {
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
          color: colors.text,
          lineHeight: 18,
        },
        compactLink: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
          marginLeft: 10,
          flexShrink: 0,
        },
      }),
    [colors],
  );

  React.useEffect(() => {
    if (!dismissed) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [dismissed, fadeAnim]);

  if (dismissed || !daysRemaining || daysRemaining <= 0) {
    return null;
  }

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Subscription');
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDismiss) {
      onDismiss();
    }
  };

  const isExpiringSoon = daysRemaining <= 1;
  const showHours =
    daysRemaining <= 1 &&
    typeof hoursRemaining === 'number' &&
    hoursRemaining > 0 &&
    hoursRemaining < 24;
  const daysLabel =
    daysRemaining === 1 ? TEXTS.TRIAL_DAY_REMAINING : TEXTS.TRIAL_DAYS_REMAINING;
  const remainingLabel = showHours
    ? `${hoursRemaining} ${
        hoursRemaining === 1 ? TEXTS.TRIAL_HOUR_REMAINING : TEXTS.TRIAL_HOURS_REMAINING
      }`
    : `${daysRemaining} ${daysLabel}`;
  const headline = isExpiringSoon ? TEXTS.TRIAL_EXPIRING_SOON : TEXTS.TRIAL_ACTIVE;
  const accentColor = isExpiringSoon ? colors.warning : colors.primary;
  const stripBg = isExpiringSoon
    ? hexToRgba(colors.warning, dark ? 0.14 : 0.1)
    : dark
      ? colors.glassFill
      : hexToRgba(colors.primary, 0.08);
  const stripBorder = isExpiringSoon
    ? hexToRgba(colors.warning, dark ? 0.35 : 0.28)
    : colors.glassOutline ?? colors.border;

  if (variant === 'compact') {
    const endsCopy =
      daysRemaining <= 1
        ? TEXTS.COMPACT_ENDS_TODAY
        : TEXTS.COMPACT_DAYS.replace('{days}', String(daysRemaining));

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.compactContainer}
          onPress={handleSubscribe}
          onLongPress={handleDismiss}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`${TEXTS.TRIAL_ACTIVE}. ${endsCopy}. ${TEXTS.VIEW_PLANS}`}
          accessibilityHint={TEXTS.CLOSE_A11Y}
        >
          <View style={styles.compactLeft}>
            <View style={styles.compactDot} />
            <Text style={styles.compactText} numberOfLines={1}>
              {TEXTS.TRIAL_ACTIVE} · {endsCopy}
            </Text>
          </View>
          <Text style={styles.compactLink}>{TEXTS.VIEW_PLANS} →</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.strip,
        {
          opacity: fadeAnim,
          backgroundColor: stripBg,
          borderColor: stripBorder,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`${headline}. ${remainingLabel}. ${TEXTS.SUBSCRIBE}`}
    >
      <MaterialCommunityIcons
        name={isExpiringSoon ? 'alert-circle-outline' : 'clock-outline'}
        size={18}
        color={accentColor}
        style={styles.stripIcon}
      />
      <View style={styles.stripCopy}>
        <Text style={[styles.stripTitle, { color: accentColor }]} numberOfLines={2}>
          {headline}
        </Text>
        <Text style={styles.stripSubtitle} numberOfLines={1}>
          {remainingLabel}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.stripCta}
        onPress={handleSubscribe}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.SUBSCRIBE}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      >
        <Text style={[styles.stripCtaText, isExpiringSoon && { color: accentColor }]}>
          {TEXTS.SUBSCRIBE}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.stripDismiss}
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel={TEXTS.CLOSE_A11Y}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="close" size={18} color={colors.textMuted ?? colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TrialBanner;
