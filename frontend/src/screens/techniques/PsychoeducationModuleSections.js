/**
 * Contenido del módulo: acordeón y listas compactas (#85).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Text, TouchableOpacity, UIManager, View } from 'react-native';
import { useSectionTranslations } from '../../hooks/useTranslations';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animateLayout() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}

function SectionBody({ value, styles }) {
  if (typeof value === 'string') {
    return <Text style={styles.accordionBody}>{value}</Text>;
  }
  if (!Array.isArray(value)) return null;
  return (
    <View style={styles.bulletList}>
      {value.map((line, i) => (
        <View key={`${i}`} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: styles.bulletDotColor }]} />
          <Text style={styles.bulletText}>{String(line)}</Text>
        </View>
      ))}
    </View>
  );
}

function collapsedPreview(value, itemsPreviewLabel) {
  if (typeof value === 'string') {
    const t = value.trim();
    return t.length > 80 ? `${t.slice(0, 80).trim()}…` : t;
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = String(value[0]).trim();
    const countLabel = itemsPreviewLabel.replace('{n}', String(value.length));
    const snippet = first.length > 56 ? `${first.slice(0, 56).trim()}…` : first;
    return `${countLabel} · ${snippet}`;
  }
  return '';
}

export function PsychoeducationHighlightSection({ label, value, icon, accentColor, styles }) {
  return (
    <View
      style={[
        styles.highlightCard,
        accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={accentColor || styles.accentFallback}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.highlightTitle}>{label}</Text>
      </View>
      <SectionBody value={value} styles={styles} />
    </View>
  );
}

export function PsychoeducationSectionAccordion({
  label,
  value,
  icon,
  defaultExpanded = false,
  accentColor,
  styles,
  itemsPreviewLabel = '{n} items',
}) {
  const [open, setOpen] = useState(defaultExpanded);
  const translated = useSectionTranslations('TECHNIQUES');
  const a11yExpand = translated?.THERAPEUTIC_TECHNIQUES_SECTION_EXPAND || 'Abrir sección';
  const a11yCollapse = translated?.THERAPEUTIC_TECHNIQUES_SECTION_COLLAPSE || 'Cerrar sección';

  const toggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    animateLayout();
    setOpen((o) => !o);
  }, []);

  const preview = useMemo(
    () => (open ? '' : collapsedPreview(value, itemsPreviewLabel)),
    [open, value, itemsPreviewLabel],
  );

  return (
    <View style={styles.accordionWrap}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={toggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? a11yCollapse : a11yExpand}
      >
        <View style={[styles.accordionIcon, { backgroundColor: styles.accordionIconBg }]}>
          <MaterialCommunityIcons name={icon} size={20} color={accentColor || styles.accentFallback} />
        </View>
        <View style={styles.accordionHeaderText}>
          <Text style={styles.accordionTitle}>{label}</Text>
          {preview ? (
            <Text style={styles.accordionPreview} numberOfLines={2}>
              {preview}
            </Text>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={styles.chevronColor}
        />
      </TouchableOpacity>
      {open ? (
        <View style={styles.accordionContent}>
          <SectionBody value={value} styles={styles} />
        </View>
      ) : null}
    </View>
  );
}

export function PsychoeducationDisclaimerFold({ title, body, styles }) {
  const [open, setOpen] = useState(false);
  if (!body) return null;
  return (
    <TouchableOpacity
      style={styles.disclaimerFold}
      onPress={() => {
        animateLayout();
        setOpen((o) => !o);
      }}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={styles.disclaimerFoldHeader}>
        <MaterialCommunityIcons name="information-outline" size={16} color={styles.disclaimerIconColor} />
        <Text style={styles.disclaimerFoldTitle}>{title}</Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={styles.chevronColor}
        />
      </View>
      {open ? <Text style={styles.disclaimerFoldBody}>{body}</Text> : null}
    </TouchableOpacity>
  );
}

export function PsychoeducationSourcesFold({ title, sources, onOpenSource, openSourceLabel, styles }) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;

  return (
    <View style={styles.sourcesFold}>
      <TouchableOpacity
        style={styles.accordionWrap}
        onPress={() => {
          animateLayout();
          setOpen((o) => !o);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.accordionHeader}>
          <View style={[styles.accordionIcon, { backgroundColor: styles.accordionIconBg }]}>
            <MaterialCommunityIcons
              name="book-open-variant"
              size={20}
              color={styles.accentFallback}
            />
          </View>
          <View style={styles.accordionHeaderText}>
            <Text style={styles.accordionTitle}>{title}</Text>
            {!open ? (
              <Text style={styles.accordionPreview} numberOfLines={1}>
                {sources.length}
              </Text>
            ) : null}
          </View>
          <MaterialCommunityIcons
            name={open ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={styles.chevronColor}
          />
        </View>
      </TouchableOpacity>
      {open ? (
        <View style={styles.sourcesList}>
          {sources.map((src, i) => (
            <TouchableOpacity
              key={`${src.url}-${i}`}
              style={[styles.sourceRow, i === 0 && styles.sourceRowFirst]}
              onPress={() => onOpenSource(src)}
              accessibilityRole="link"
            >
              <MaterialCommunityIcons
                name="link-variant"
                size={18}
                color={styles.accentFallback}
                style={{ marginRight: 10 }}
              />
              <Text style={styles.sourceLink} numberOfLines={2}>
                {src.label || openSourceLabel}
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={styles.chevronColor} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}
