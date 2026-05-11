import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEGAL_URLS, TEXTS } from '../../screens/subscription/subscriptionScreenConstants';
import { useTheme } from '../../context/ThemeContext';
import { SPACING } from '../../constants/ui';

const openUrl = (url, fallbackMessage = 'No se pudo abrir el enlace') => {
  Linking.openURL(url).catch(() => Alert.alert('Error', fallbackMessage));
};

export default function SubscriptionLegalSection({
  title = TEXTS.LEGAL_TITLE,
  compact = false,
  /** Dentro de un contenedor con fondo settingsSectionSurface (p. ej. SubscriptionContent). */
  inShell = false,
}) {
  const { colors } = useTheme();
  const iconSize = compact ? 18 : 20;
  const linkIconSize = compact ? 16 : 18;
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: inShell ? 0 : 20,
          paddingVertical: inShell ? 0 : 16,
          paddingHorizontal: inShell ? 0 : 4,
        },
        sectionCompact: {
          marginTop: inShell ? 0 : 24,
          paddingTop: inShell ? 0 : 20,
          borderTopWidth: inShell ? 0 : 1,
          borderTopColor: colors.border,
          marginBottom: 0,
        },
        sectionTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.text,
          marginBottom: 12,
        },
        legalLink: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: SPACING.SCREEN_EDGE_INSET,
          marginBottom: 8,
          backgroundColor: colors.chromeCard,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 12,
        },
        legalLinkText: {
          flex: 1,
          fontSize: 14,
          color: colors.primary,
          fontWeight: '500',
        },
      }),
    [colors, inShell],
  );

  return (
    <View style={[styles.section, compact && styles.sectionCompact]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.legalLink}
        onPress={() => openUrl(LEGAL_URLS.TERMS_EULA)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="file-document-outline" size={iconSize} color={colors.primary} />
        <Text style={styles.legalLinkText}>{TEXTS.TERMS_EULA_LABEL}</Text>
        <MaterialCommunityIcons name="open-in-new" size={linkIconSize} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.legalLink}
        onPress={() => openUrl(LEGAL_URLS.PRIVACY)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="shield-lock-outline" size={iconSize} color={colors.primary} />
        <Text style={styles.legalLinkText}>{TEXTS.PRIVACY_LABEL}</Text>
        <MaterialCommunityIcons name="open-in-new" size={linkIconSize} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}
