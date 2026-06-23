/**
 * Guardrails del onboarding: flujo, diseño, contenido y persistencia.
 */
import fs from 'fs';
import path from 'path';
import { ONBOARDING as ES_ONBOARDING } from '../../constants/translations/es';
import { ONBOARDING as EN_ONBOARDING } from '../../constants/translations/en';
import {
  ONBOARDING_HIGHLIGHT_ELEMENTS,
  ONBOARDING_STEP_COUNT,
  validateOnboardingContent,
} from '../../utils/onboardingValidation';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('onboarding guard', () => {
  it('contenido ES/EN valida estructura, beneficios y disclaimer', () => {
    expect(validateOnboardingContent(ES_ONBOARDING)).toEqual([]);
    expect(validateOnboardingContent(EN_ONBOARDING)).toEqual([]);
  });

  it('OnboardingTutorial cubre chat, técnicas, inicio y ajustes con beneficios', () => {
    const steps = readSrc('utils/onboardingSteps.js');
    expect(steps).toMatch(/highlightElement: 'chat'/);
    expect(steps).toMatch(/highlightElement: 'techniques'/);
    expect(steps).toMatch(/highlightElement: 'home-focus'/);
    expect(steps).toMatch(/highlightElement: 'settings'/);
    expect(steps).not.toMatch(/highlightElement: 'reminders'/);
    expect(steps).not.toMatch(/STEP_5_TITLE/);

    const tutorial = readSrc('components/OnboardingTutorial.js');
    expect(tutorial).toMatch(/OnboardingBrandShell/);
    expect(tutorial).toMatch(/OnboardingBenefitList/);
    expect(tutorial).toMatch(/buildOnboardingTutorialSteps/);
    expect(tutorial).toMatch(/TEXTS\.DISCLAIMER/);
    expect(tutorial).not.toMatch(/highlightElement: 'tasks-habits'/);
    expect(tutorial).not.toMatch(/Dashboard Principal/);
  });

  it('OnboardingBrandShell reutiliza backdrop y gradiente del dashboard', () => {
    const shell = readSrc('components/onboarding/OnboardingBrandShell.js');
    expect(shell).toMatch(/DashboardBrandBackdrop/);
    expect(shell).toMatch(/SheetBrandGradient/);
    expect(shell).toMatch(/resolveInsightsHeroGradient/);
    expect(shell).toMatch(/useSafeAreaInsets/);
  });

  it('highlights del recorrido coinciden con TutorialHighlight', () => {
    const highlight = readSrc('components/TutorialHighlight.js');
    for (const element of ONBOARDING_HIGHLIGHT_ELEMENTS) {
      if (element.includes('-')) {
        expect(highlight).toMatch(new RegExp(`'${element}'`));
      } else {
        expect(highlight).toMatch(new RegExp(`\\b${element}:`));
      }
    }
    expect(ONBOARDING_HIGHLIGHT_ELEMENTS).toHaveLength(ONBOARDING_STEP_COUNT);
  });

  it('TutorialHighlight resalta tabs de navbar y zona de foco del home', () => {
    const src = readSrc('components/TutorialHighlight.js');
    expect(src).toMatch(/'home-focus'/);
    expect(src).toMatch(/reminders:/);
    expect(src).toMatch(/techniques:/);
    expect(src).toMatch(/NAV_CENTER_WIDTH/);
    expect(src).not.toMatch(/height: 300/);
  });

  it('traducciones ES comunican beneficios y pasos orientados a valor', () => {
    const src = readSrc('constants/translations/es.js');
    expect(src).toMatch(/BENEFIT_1:/);
    expect(src).toMatch(/STEP_1_TITLE: 'Habla cuando lo necesites'/);
    expect(src).toMatch(/STEP_2_TITLE: 'Herramientas con respaldo'/);
    expect(src).toMatch(/STEP_3_TITLE: 'Tu día en un vistazo'/);
    expect(src).toMatch(/STEP_4_TITLE: 'Progreso y seguridad'/);
    expect(src).toMatch(/DISCLAIMER:/);
    expect(src).toMatch(/sustituye terapia profesional/i);
    expect(src).toMatch(/PHQ-9, GAD-7/);
    expect(src).toMatch(/foco del día/);
    expect(src).not.toMatch(/^\s+STEP_5_TITLE:/m);
  });

  it('traducciones EN mantienen paridad de pasos del tutorial', () => {
    const src = readSrc('constants/translations/en.js');
    expect(src).toMatch(/STEP_1_TITLE: 'Talk when you need to'/);
    expect(src).toMatch(/STEP_2_TITLE: 'Tools backed by evidence'/);
    expect(src).toMatch(/STEP_3_TITLE: 'Your day at a glance'/);
    expect(src).toMatch(/STEP_4_TITLE: 'Progress and safety'/);
    expect(src).not.toMatch(/^\s+STEP_5_TITLE:/m);
  });

  it('DashScreen muestra recorrido antes que preguntas de foco', () => {
    const src = readSrc('screens/DashScreen.js');
    const loadBlock = src.slice(
      src.indexOf('if (!tutorialCompleted)'),
      src.indexOf('setHasCheckedTutorial(true)'),
    );
    expect(loadBlock).toMatch(/setShowTutorial\(true\)/);
    expect(loadBlock).not.toMatch(/setShowOnboardingQuestions\(true\)/);

    const tutorialCompleteBlock = src.slice(
      src.indexOf('const handleTutorialComplete'),
      src.indexOf('const handleOnboardingQuestionsDismiss'),
    );
    expect(tutorialCompleteBlock).toMatch(/setShowOnboardingQuestions\(true\)/);
  });

  it('DashScreen persiste tutorial completado aunque falte userId', () => {
    const src = readSrc('screens/DashScreen.js');
    const completedBlock = src.slice(
      src.indexOf('const handleOnboardingQuestionsCompleted'),
      src.indexOf('const handleExploreAppTutorial'),
    );
    expect(completedBlock).toMatch(/await markTutorialCompleted\(userId\)/);
    expect(completedBlock).not.toMatch(/if \(!userId\) return/);

    const replayBlock = src.slice(
      src.indexOf('if (tutorialShouldOpenChatRef.current)'),
      src.indexOf('setTimeout(() => setShowOnboardingQuestions(true)'),
    );
    expect(replayBlock).toMatch(/await markTutorialCompleted\(userId\)/);
  });

  it('DashScreen bloquea modales intrusivos durante overlays de onboarding', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/onboardingOverlayStateRef/);
    expect(src).toMatch(/blocker\.showTutorial \|\| blocker\.showOnboardingQuestions/);
    expect(src).toMatch(/showTutorial \|\| showOnboardingQuestions \|\| showEmergencyContactsModal/);
  });

  it('OnboardingQuestions muestra beneficios antes del foco', () => {
    const es = readSrc('constants/translations/es.js');
    expect(es).toMatch(/QUESTIONS_BENEFITS_HEADING:/);
    expect(es).toMatch(/BENEFIT_2: 'Técnicas de TCC/);
    const questions = readSrc('components/OnboardingQuestions.js');
    expect(questions).toMatch(/OnboardingBenefitList/);
    expect(questions).toMatch(/OnboardingBrandShell/);
    expect(questions).toMatch(/buildOnboardingBenefits/);
    expect(questions).toMatch(/ENDPOINTS\.ONBOARDING_PREFERENCES/);
  });

  it('OnboardingTutorial no persiste completado; lo hace DashScreen al cerrar el flujo', () => {
    const tutorial = readSrc('components/OnboardingTutorial.js');
    expect(tutorial).not.toMatch(/markTutorialAsCompleted/);
    expect(tutorial).not.toMatch(/AsyncStorage\.setItem/);
    const dash = readSrc('screens/DashScreen.js');
    expect(dash).toMatch(/markTutorialCompleted/);
  });
});
