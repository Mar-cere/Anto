#!/usr/bin/env node
/**
 * Smoke estático — onboarding (contenido, pasos, flujo DashScreen).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ONBOARDING as ES_ONBOARDING } from '../src/constants/translations/es.js';
import { ONBOARDING as EN_ONBOARDING } from '../src/constants/translations/en.js';
import { validateOnboardingContent } from '../src/utils/onboardingValidation.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const esErrors = validateOnboardingContent(ES_ONBOARDING);
if (esErrors.length === 0) {
  pass('traducciones ES válidas');
} else {
  fail('traducciones ES válidas', esErrors.join(', '));
}

const enErrors = validateOnboardingContent(EN_ONBOARDING);
if (enErrors.length === 0) {
  pass('traducciones EN válidas');
} else {
  fail('traducciones EN válidas', enErrors.join(', '));
}

const dash = read('src/screens/DashScreen.js');
if (
  dash.includes('setShowTutorial(true)') &&
  !dash.slice(dash.indexOf('if (!tutorialCompleted)'), dash.indexOf('setHasCheckedTutorial(true)')).includes('setShowOnboardingQuestions(true)')
) {
  pass('flujo: recorrido antes que preguntas');
} else {
  fail('flujo: recorrido antes que preguntas');
}

if (
  dash.includes('await markTutorialCompleted(userId)') &&
  !dash.slice(dash.indexOf('const handleOnboardingQuestionsCompleted'), dash.indexOf('const handleExploreAppTutorial')).includes('if (!userId) return')
) {
  pass('persistencia tutorial sin bloquear por userId');
} else {
  fail('persistencia tutorial sin bloquear por userId');
}

const shell = read('src/components/onboarding/OnboardingBrandShell.js');
if (shell.includes('DashboardBrandBackdrop') && shell.includes('resolveInsightsHeroGradient')) {
  pass('shell visual alineado al dashboard');
} else {
  fail('shell visual alineado al dashboard');
}

const failed = checks.filter((c) => !c.ok);
for (const check of checks) {
  const mark = check.ok ? '✓' : '✗';
  const detail = check.detail ? ` — ${check.detail}` : '';
  console.log(`${mark} ${check.name}${detail}`);
}

if (failed.length > 0) {
  console.error(`\nOnboarding smoke: ${failed.length} fallo(s)`);
  process.exit(1);
}

console.log(`\nOnboarding smoke: ${checks.length} comprobaciones OK`);
