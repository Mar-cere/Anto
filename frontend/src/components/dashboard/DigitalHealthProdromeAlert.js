/**
 * Alerta educativa de pródromos en Inicio (#216).
 *
 * Muestra un patrón suave y observacional de salud digital (sueño en descenso,
 * menos movimiento) que el backend ya detectó. Tono no diagnóstico: "notarlo
 * con suavidad". Se puede ocultar por el día en curso (persistente por
 * kind+día), reaparece otro día solo si el patrón persiste.
 */
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SPACING } from '../../constants/ui';
import { pickLocalizedDefaults } from '../../utils/localizedFallback';
import { getFocusTheme } from '../../styles/focusCardTheme';

// Clave única (sin sufijo por día) para evitar acumulación en AsyncStorage:
// guardamos el último dismiss como "<kind>:<día>" y comparamos contra el actual.
const DISMISS_KEY = 'digitalHealthAlertDismissed';

const COPY_BY_LANG = {
  es: {
    KICKER: 'Hábitos del dispositivo',
    DISMISS_A11Y: 'Ocultar por hoy',
    KINDS: {
      sleep_prodrome: {
        title: 'Tu sueño viene en descenso',
        body: 'Notamos noches algo más cortas estos días (agregado del teléfono). Solo para tenerlo presente con suavidad — no es un diagnóstico.',
      },
      sleep_decline: {
        title: 'Menos horas de sueño esta semana',
        body: 'El descanso bajó respecto al inicio de la semana. Quizá quieras notar cómo te sientes hoy.',
      },
      low_movement: {
        title: 'Una semana de menos movimiento',
        body: 'Hubo menos actividad física que al inicio del periodo. Un paseo breve puede ayudar, si te encaja.',
      },
    },
  },
  en: {
    KICKER: 'Device habits',
    DISMISS_A11Y: 'Hide for today',
    KINDS: {
      sleep_prodrome: {
        title: 'Your sleep has been trending shorter',
        body: 'We noticed slightly shorter nights these days (aggregated from your phone). Just something to hold gently — not a diagnosis.',
      },
      sleep_decline: {
        title: 'Fewer hours of sleep this week',
        body: 'Rest dipped compared to earlier this week. You might notice how you feel today.',
      },
      low_movement: {
        title: 'A quieter week for movement',
        body: 'There was less physical activity than earlier in the period. A short walk may help, if it fits.',
      },
    },
  },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function DigitalHealthProdromeAlert({ alert, style }) {
  const { colors, resolvedScheme } = useTheme();
  const { language } = useLanguage();
  const t = useMemo(() => getFocusTheme(colors, resolvedScheme), [colors, resolvedScheme]);

  const kind = alert?.kind || null;
  const dismissToken = kind ? `${kind}:${todayKey()}` : null;

  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!dismissToken) {
      setHydrated(true);
      return undefined;
    }
    setHydrated(false);
    setDismissed(false);
    AsyncStorage.getItem(DISMISS_KEY)
      .then((value) => {
        if (active) setDismissed(value === dismissToken);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
    };
  }, [dismissToken]);

  const handleDismiss = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setDismissed(true);
    if (dismissToken) {
      AsyncStorage.setItem(DISMISS_KEY, dismissToken).catch(() => {});
    }
  }, [dismissToken]);

  const texts = useMemo(() => pickLocalizedDefaults(language, COPY_BY_LANG), [language]);
  const copy = kind ? texts.KINDS[kind] : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: SPACING.sm,
        },
        panel: {
          ...t.FOCUS_PANEL,
          padding: SPACING.HERO_INSET,
          gap: SPACING.xs,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        },
        kickerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          flex: 1,
        },
        kicker: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: t.FOCUS_KICKER_COLOR,
        },
        title: {
          fontSize: 15,
          fontWeight: '700',
          color: colors.text,
          lineHeight: 20,
        },
        body: {
          fontSize: 13,
          lineHeight: 19,
          color: t.FOCUS_META,
        },
      }),
    [colors, t],
  );

  if (!kind || !copy || !hydrated || dismissed) return null;

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.panel} accessibilityRole="summary">
        <View style={styles.headerRow}>
          <View style={styles.kickerRow}>
            <MaterialCommunityIcons name="heart-pulse" size={16} color={colors.primary} />
            <Text style={styles.kicker} numberOfLines={1}>
              {texts.KICKER}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel={texts.DISMISS_A11Y}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>
    </View>
  );
}
