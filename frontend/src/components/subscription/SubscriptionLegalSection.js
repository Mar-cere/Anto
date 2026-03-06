import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../styles/globalStyles';
import { LEGAL_URLS, TEXTS } from '../../screens/subscription/subscriptionScreenConstants';

const openUrl = (url, fallbackMessage = 'No se pudo abrir el enlace') => {
  Linking.openURL(url).catch(() => Alert.alert('Error', fallbackMessage));
};

export default function SubscriptionLegalSection({ title = TEXTS.LEGAL_TITLE, compact = false }) {
  const iconSize = compact ? 18 : 20;
  const linkIconSize = compact ? 16 : 18;
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

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  sectionCompact: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(163, 184, 232, 0.2)',
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 12,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(29, 43, 95, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 221, 219, 0.1)',
    gap: 12,
  },
  legalLinkText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
