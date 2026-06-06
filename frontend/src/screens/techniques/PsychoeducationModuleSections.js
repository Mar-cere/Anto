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

export function PsychoeducationHighlightSection({
  label,
  value,
  icon,
  accentColor,
  styles,
  highlightLayout,
  supportGroup,
  testID,
}) {
  return (
    <View
      testID={testID}
      style={[
        styles.highlightCard,
        accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : null,
      ]}
    >
      <View style={styles.highlightHeader}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={accentColor || styles.accentFallback}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.highlightTitle}>{label}</Text>
      </View>
      {highlightLayout === 'supportGroup' && supportGroup ? (
        <View>
          <View style={styles.highlightSubheader}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={15}
              color={accentColor || styles.accentFallback}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.highlightSubtitle}>{supportGroup.worryLabel}</Text>
          </View>
          <SectionBody value={supportGroup.worryItems} styles={styles} />
          {supportGroup.seekHelpText ? (
            <>
              <View style={styles.highlightDivider} />
              <Text style={styles.highlightSeekText}>{supportGroup.seekHelpText}</Text>
            </>
          ) : null}
        </View>
      ) : (
        <SectionBody value={value} styles={styles} />
      )}
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
    <>
      <TouchableOpacity
        style={styles.footerRow}
        onPress={() => {
          animateLayout();
          setOpen((o) => !o);
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <MaterialCommunityIcons name="information-outline" size={17} color={styles.footerIconColor} />
        <View style={styles.footerRowText}>
          <Text style={styles.footerRowTitle}>{title}</Text>
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={styles.chevronColor}
        />
      </TouchableOpacity>
      {open ? <Text style={styles.footerBody}>{body}</Text> : null}
    </>
  );
}

export function PsychoeducationSourcesFold({
  title,
  sources,
  onOpenSource,
  openSourceLabel,
  sourcesCountLabel,
  styles,
}) {
  const [open, setOpen] = useState(false);
  if (!sources?.length) return null;

  const countLabel = sourcesCountLabel.replace('{n}', String(sources.length));

  return (
    <>
      <TouchableOpacity
        style={styles.footerRow}
        onPress={() => {
          animateLayout();
          setOpen((o) => !o);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <MaterialCommunityIcons name="book-open-variant" size={17} color={styles.footerIconColor} />
        <View style={styles.footerRowText}>
          <Text style={styles.footerRowTitle}>{title}</Text>
          {!open ? <Text style={styles.footerRowMeta}>{countLabel}</Text> : null}
        </View>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={styles.chevronColor}
        />
      </TouchableOpacity>
      {open ? (
        <View style={styles.footerLinks}>
          {sources.map((src, i) => (
            <TouchableOpacity
              key={`${src.url}-${i}`}
              style={styles.footerLinkRow}
              onPress={() => onOpenSource(src)}
              accessibilityRole="link"
            >
              <Text style={styles.footerLinkText} numberOfLines={2}>
                {src.label || openSourceLabel}
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={14} color={styles.chevronColor} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </>
  );
}

export function PsychoeducationModuleFooter({
  sourcesTitle,
  sources,
  onOpenSource,
  openSourceLabel,
  sourcesCountLabel,
  disclaimerTitle,
  disclaimerBody,
  styles,
}) {
  const hasSources = sources?.length > 0;
  const hasDisclaimer = Boolean(disclaimerBody);
  if (!hasSources && !hasDisclaimer) return null;

  return (
    <View style={styles.footerPanel}>
      {hasSources ? (
        <PsychoeducationSourcesFold
          title={sourcesTitle}
          sources={sources}
          onOpenSource={onOpenSource}
          openSourceLabel={openSourceLabel}
          sourcesCountLabel={sourcesCountLabel}
          styles={styles}
        />
      ) : null}
      {hasSources && hasDisclaimer ? <View style={styles.footerDivider} /> : null}
      {hasDisclaimer ? (
        <PsychoeducationDisclaimerFold
          title={disclaimerTitle}
          body={disclaimerBody}
          styles={styles}
        />
      ) : null}
    </View>
  );
}
