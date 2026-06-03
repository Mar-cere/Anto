/**
 * Sello de revisión clínica/editorial (#111).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { resolveClinicalReviewSeal } from '../utils/psychoeducationClinicalReview';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PsychoeducationClinicalReviewSeal = ({
  clinicalReview,
  texts,
  variant = 'module',
  accentColor,
}) => {
  const { colors } = useTheme();
  const seal = useMemo(() => resolveClinicalReviewSeal(clinicalReview, texts), [clinicalReview, texts]);
  const [open, setOpen] = useState(false);
  const tint = accentColor || colors.primary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        moduleWrap: {
          marginBottom: 16,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: colors.cardBackground ?? colors.card,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border ?? 'rgba(128,128,128,0.2)',
        },
        moduleRow: { flexDirection: 'row', alignItems: 'center' },
        moduleHeadline: {
          flex: 1,
          fontSize: 12,
          lineHeight: 17,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        moduleNote: {
          marginTop: 8,
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSecondary,
        },
        libraryPill: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: colors.accentLineSoft ?? 'rgba(128,128,128,0.12)',
          maxWidth: '100%',
        },
        libraryText: {
          fontSize: 11,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        chatRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: 10,
          gap: 6,
        },
        chatText: {
          flex: 1,
          fontSize: 11,
          lineHeight: 15,
          color: colors.textSecondary,
        },
      }),
    [colors],
  );

  if (!seal) return null;

  const isClinical = seal.status === 'clinical_review';
  const iconName = isClinical ? 'shield-check' : 'shield-edit-outline';
  const showNote = variant === 'module' && Boolean(seal.note);

  if (variant === 'library') {
    return (
      <View style={styles.libraryPill}>
        <MaterialCommunityIcons name={iconName} size={12} color={tint} style={{ marginRight: 4 }} />
        <Text style={styles.libraryText} numberOfLines={1}>
          {seal.shortLabel}
        </Text>
      </View>
    );
  }

  if (variant === 'chat') {
    return (
      <View style={styles.chatRow}>
        <MaterialCommunityIcons name={iconName} size={13} color={tint} />
        <Text style={styles.chatText} numberOfLines={2}>
          {seal.headline}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.moduleWrap}>
      <TouchableOpacity
        style={styles.moduleRow}
        onPress={
          showNote
            ? () => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setOpen((v) => !v);
              }
            : undefined
        }
        activeOpacity={showNote ? 0.75 : 1}
        disabled={!showNote}
        accessibilityRole={showNote ? 'button' : 'text'}
        accessibilityState={showNote ? { expanded: open } : undefined}
      >
        <MaterialCommunityIcons name={iconName} size={16} color={tint} style={{ marginRight: 8 }} />
        <Text style={styles.moduleHeadline}>{seal.headline}</Text>
        {showNote ? (
          <MaterialCommunityIcons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        ) : null}
      </TouchableOpacity>
      {showNote && open ? <Text style={styles.moduleNote}>{seal.note}</Text> : null}
    </View>
  );
};

export default PsychoeducationClinicalReviewSeal;
