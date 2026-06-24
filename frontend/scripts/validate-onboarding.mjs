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

const dismiss = dash.slice(
  dash.indexOf('const handleOnboardingQuestionsDismiss'),
  dash.indexOf('const handleOnboardingQuestionsCompleted'),
);
if (dismiss.includes('setShowFirstSessionHint(true)') && !dismiss.includes('goToChatFromOnboarding')) {
  pass('post-onboarding: hint en lugar de chat directo');
} else {
  fail('post-onboarding: hint en lugar de chat directo');
}

if (dash.includes('canAttemptChatAccess') && dash.includes("navigate('Subscription')")) {
  pass('chat: valida acceso antes de navegar');
} else {
  fail('chat: valida acceso antes de navegar');
}

const steps = read('src/utils/onboardingSteps.js');
const brand = read('src/utils/onboardingBrand.js');
if (
  steps.includes('resolveOnboardingBrandAccent') &&
  brand.includes('colors.primary') &&
  !steps.includes('accentSecondary') &&
  !steps.includes('colors.success')
) {
  pass('onboarding: acento único de marca');
} else {
  fail('onboarding: acento único de marca');
}

const tutorial = read('src/components/OnboardingTutorial.js');
if (
  tutorial.includes('OnboardingBrandOrb') &&
  tutorial.includes('OnboardingBenefitCard') &&
  tutorial.includes('OnboardingGradientButton')
) {
  pass('onboarding: orb, tarjeta beneficio y CTA gradiente');
} else {
  fail('onboarding: orb, tarjeta beneficio y CTA gradiente');
}

const orb = read('src/components/onboarding/OnboardingBrandOrb.js');
if (
  orb.includes('welcomeTheme.logo') &&
  orb.includes('styles.chip') &&
  !orb.includes('ambientGlow')
) {
  pass('onboarding: orb con logo de marca y chip del paso');
} else {
  fail('onboarding: orb con logo de marca y chip del paso');
}

if (
  tutorial.includes('TEXTS.BENEFITS_HEADING') &&
  tutorial.includes('OnboardingBenefitCard text={currentStepData.benefit}') &&
  tutorial.includes('OnboardingStepHighlights') &&
  !tutorial.includes('colors.warning') &&
  !tutorial.includes('colors.success')
) {
  pass('onboarding: eyebrow unificado, beneficio y highlights por paso');
} else {
  fail('onboarding: eyebrow unificado, beneficio y highlights por paso');
}

if (brand.includes('accentWarm')) {
  pass('onboarding: gradientes con rosa de marca (accentWarm)');
} else {
  fail('onboarding: gradientes con rosa de marca (accentWarm)');
}

const backendSub = fs.readFileSync(
  path.resolve(root, '../backend/middleware/checkSubscription.js'),
  'utf8',
);
if (backendSub.includes("req.path === '/tcc-continuity'")) {
  pass('backend: gracia en tcc-continuity');
} else {
  fail('backend: gracia en tcc-continuity');
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
