/**
 * Orden y metadatos de secciones del módulo (#85).
 */
import { hasContentSectionLabel, moduleContentEntries, sectionLabel } from './psychoeducationDisplay';

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
  'whenWorry',
  'whenToSeekHelp',
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

export function sectionHasContent(value) {
  if (value == null) return false;
  if (typeof value === 'string') return Boolean(value.trim());
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

export function getModuleLeadText(module) {
  const text = module?.[LEAD_KEY];
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

function mergeSupportHighlights(sections, language = 'es') {
  const worryIdx = sections.findIndex((s) => s.key === 'whenWorry');
  const seekIdx = sections.findIndex((s) => s.key === 'whenToSeekHelp');
  if (worryIdx === -1 || seekIdx === -1) return sections;

  const worry = sections[worryIdx];
  const seek = sections[seekIdx];
  const seekHelpText = typeof seek.value === 'string' ? seek.value.trim() : '';
  const worryItems = Array.isArray(worry.value) ? worry.value : [];

  const merged = {
    key: 'whenToSeekHelp',
    label: sectionLabel('whenToSeekHelp', language),
    value: seek.value,
    icon: SECTION_ICONS.whenToSeekHelp,
    defaultExpanded: false,
    isHighlight: true,
    highlightLayout: 'supportGroup',
    supportGroup: {
      worryLabel: sectionLabel('whenWorry', language),
      worryItems,
      seekHelpText,
    },
  };

  const without = sections.filter((s) => s.key !== 'whenWorry' && s.key !== 'whenToSeekHelp');
  const insertAt = Math.min(worryIdx, seekIdx);
  without.splice(insertAt, 0, merged);
  return without;
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
    if (!sectionHasContent(value)) return;

    const isHighlight = key === 'whenToSeekHelp' || key === 'whenWorry';
    const shouldExpand = !expandedAssigned && !isHighlight;
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
    if (!hasContentSectionLabel(key, language)) return;
    if (!sectionHasContent(value)) return;
    ordered.push({
      key,
      label: sectionLabel(key, language),
      value,
      icon: SECTION_ICONS[key] || 'text-box-outline',
      defaultExpanded: false,
      isHighlight: false,
    });
  });

  return mergeSupportHighlights(ordered, language);
}
