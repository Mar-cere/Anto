/**
 * Catálogo de técnicas terapéuticas por idioma (es/en).
 */
import {
  IMMEDIATE_TECHNIQUES,
  CBT_TECHNIQUES,
  DBT_TECHNIQUES,
  ACT_TECHNIQUES,
} from './therapeuticTechniques.js';
import {
  IMMEDIATE_TECHNIQUES_EN,
  CBT_TECHNIQUES_EN,
  DBT_TECHNIQUES_EN,
  ACT_TECHNIQUES_EN,
} from './therapeuticTechniques.en.js';

export function normalizeTechniqueLanguage(language) {
  return language === 'en' ? 'en' : 'es';
}

export function getTechniqueCatalog(language = 'es') {
  const lang = normalizeTechniqueLanguage(language);
  if (lang === 'en') {
    return {
      IMMEDIATE: IMMEDIATE_TECHNIQUES_EN,
      CBT: CBT_TECHNIQUES_EN,
      DBT: DBT_TECHNIQUES_EN,
      ACT: ACT_TECHNIQUES_EN,
    };
  }
  return {
    IMMEDIATE: IMMEDIATE_TECHNIQUES,
    CBT: CBT_TECHNIQUES,
    DBT: DBT_TECHNIQUES,
    ACT: ACT_TECHNIQUES,
  };
}

function isHighIntensityRegulation(technique) {
  return (
    technique.type === 'DBT' ||
    technique.regulationPriority === true
  );
}

export function getImmediateTechniquesForLanguage(emotion, intensity = 5, language = 'es') {
  const { IMMEDIATE } = getTechniqueCatalog(language);
  const techniques = IMMEDIATE[emotion] || [];
  if (intensity >= 8) {
    return techniques.filter(isHighIntensityRegulation);
  }
  return techniques;
}

export function getCBTTechniquesForLanguage(emotion, language = 'es') {
  const { CBT } = getTechniqueCatalog(language);
  return Object.values(CBT).filter(
    (technique) => technique.emotions && technique.emotions.includes(emotion),
  );
}

export function getDBTTechniquesForLanguage(emotion, language = 'es') {
  const { DBT } = getTechniqueCatalog(language);
  return Object.values(DBT).filter(
    (technique) => technique.emotions && technique.emotions.includes(emotion),
  );
}

export function getACTTechniquesForLanguage(emotion, language = 'es') {
  const { ACT } = getTechniqueCatalog(language);
  return Object.values(ACT).filter(
    (technique) => technique.emotions && technique.emotions.includes(emotion),
  );
}

/**
 * Lista plana para API (ids estables por clave de catálogo).
 */
export function buildAllTechniquesList(language = 'es') {
  const { IMMEDIATE, CBT, DBT, ACT } = getTechniqueCatalog(language);
  const allTechniques = [];

  Object.entries(IMMEDIATE).forEach(([emotion, techniques]) => {
    techniques.forEach((technique, index) => {
      allTechniques.push({
        ...technique,
        id: `immediate-${emotion}-${index}`,
        category: 'immediate',
        emotion,
        emotions: [emotion],
      });
    });
  });

  Object.entries(CBT).forEach(([key, technique]) => {
    allTechniques.push({
      ...technique,
      id: `cbt-${key}`,
      category: 'CBT',
      type: 'CBT',
    });
  });

  Object.entries(DBT).forEach(([key, technique]) => {
    allTechniques.push({
      ...technique,
      id: `dbt-${key}`,
      category: 'DBT',
      type: 'DBT',
    });
  });

  Object.entries(ACT).forEach(([key, technique]) => {
    allTechniques.push({
      ...technique,
      id: `act-${key}`,
      category: 'ACT',
      type: 'ACT',
    });
  });

  return allTechniques;
}

export function buildTechniquesForEmotion(emotion, language = 'es') {
  const techniques = [];
  const lang = normalizeTechniqueLanguage(language);

  getImmediateTechniquesForLanguage(emotion, 5, lang).forEach((technique, index) => {
    techniques.push({
      ...technique,
      id: `immediate-${emotion}-${index}`,
      category: 'immediate',
      emotion,
      emotions: [emotion],
    });
  });

  getCBTTechniquesForLanguage(emotion, lang).forEach((technique, index) => {
    techniques.push({
      ...technique,
      id: `cbt-${emotion}-${index}`,
      category: 'CBT',
      type: 'CBT',
    });
  });

  getDBTTechniquesForLanguage(emotion, lang).forEach((technique, index) => {
    techniques.push({
      ...technique,
      id: `dbt-${emotion}-${index}`,
      category: 'DBT',
      type: 'DBT',
    });
  });

  getACTTechniquesForLanguage(emotion, lang).forEach((technique, index) => {
    techniques.push({
      ...technique,
      id: `act-${emotion}-${index}`,
      category: 'ACT',
      type: 'ACT',
    });
  });

  return techniques;
}
