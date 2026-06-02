/**
 * Orden y metadatos de secciones del módulo (#85).
 */
import { moduleContentEntries, sectionLabel } from './psychoeducationDisplay';

const SECTION_ORDER = [
  'symptoms',
  'signs',
  'causes',
  'triggers',
  'whatHelps',
  'treatment',
  'management',
  'hygiene',
  'skills',
  'techniques',
  'benefits',
  'types',
  'whenToSeekHelp',
  'whenWorry',
];

const LEAD_KEY = 'whatIs';

const SECTION_ICONS = {
  symptoms: 'eye-outline',
  signs: 'eye-outline',
  causes: 'chart-timeline-variant',
  triggers: 'flash-outline',
  whatHelps: 'hand-heart-outline',
  treatment: 'hand-heart-outline',
  management: 'calendar-check-outline',
  hygiene: 'bed-outline',
  skills: 'head-lightbulb-outline',
  techniques: 'toolbox-outline',
  benefits: 'star-four-points-outline',
  types: 'shape-outline',
  whenToSeekHelp: 'account-heart-outline',
  whenWorry: 'alert-circle-outline',
};

const DEFAULT_EXPAND_KEYS = new Set(['symptoms', 'signs', 'whatHelps', 'treatment']);

export function getModuleLeadText(module) {
  const text = module?.[LEAD_KEY];
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

/**
 * @returns {{ key, label, value, icon, defaultExpanded, isHighlight }[]}
 */
export function buildModuleSections(module, language = 'es') {
  if (!module) return [];
  const entries = new Map(moduleContentEntries(module));
  const ordered = [];

  let expandedAssigned = false;

  SECTION_ORDER.forEach((key) => {
    if (!entries.has(key)) return;
    const value = entries.get(key);
    if (value == null) return;
    if (typeof value === 'string' && !value.trim()) return;
    if (Array.isArray(value) && value.length === 0) return;

    const isHighlight = key === 'whenToSeekHelp' || key === 'whenWorry';
    const shouldExpand =
      !expandedAssigned && !isHighlight && DEFAULT_EXPAND_KEYS.has(key);
    if (shouldExpand) expandedAssigned = true;

    ordered.push({
      key,
      label: sectionLabel(key, language),
      value,
      icon: SECTION_ICONS[key] || 'text-box-outline',
      defaultExpanded: shouldExpand,
      isHighlight,
    });
    entries.delete(key);
  });

  entries.forEach((value, key) => {
    if (key === LEAD_KEY) return;
    ordered.push({
      key,
      label: sectionLabel(key, language),
      value,
      icon: SECTION_ICONS[key] || 'text-box-outline',
      defaultExpanded: false,
      isHighlight: false,
    });
  });

  return ordered;
}
