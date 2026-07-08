/**
 * Blindaje: cierre de onboarding → chat solo con acceso válido (flujo de 6 superficies).
 */
import fs from 'fs';
import path from 'path';
import { FIRST_SESSION_GRACE_MS } from '../utils/chatAccessGate';

const FRONTEND_SRC = path.resolve(__dirname, '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('postOnboardingChat guard', () => {
  it('ventana de gracia alineada con backend (24 h)', () => {
    expect(FIRST_SESSION_GRACE_MS).toBe(24 * 60 * 60 * 1000);
    const backend = fs.readFileSync(
      path.resolve(FRONTEND_SRC, '../../backend/middleware/checkSubscription.js'),
      'utf8',
    );
    expect(backend).toMatch(/FIRST_SESSION_GRACE_WINDOW_MS = 24 \* 60 \* 60 \* 1000/);
    expect(backend).toMatch(/req\.path === '\/tcc-continuity'/);
  });

  it('onboarding usa acento único de marca (primary), no warning ni success', () => {
    const steps = readSrc('utils/onboardingSteps.js');
    const brand = readSrc('utils/onboardingBrand.js');
    expect(steps).toMatch(/resolveOnboardingBrandAccent/);
    expect(brand).toMatch(/colors\.primary/);
    expect(steps).not.toMatch(/accentSecondary/);
    expect(steps).not.toMatch(/colors\.warning/);
    expect(steps).not.toMatch(/colors\.success/);
  });

  it('DashScreen no abre chat al cerrar preguntas; valida antes de navegar', () => {
    const dash = readSrc('screens/DashScreen.js');
    const dismiss = dash.slice(
      dash.indexOf('const handleOnboardingQuestionsDismiss'),
      dash.indexOf('const handleOnboardingQuestionsCompleted'),
    );
    expect(dismiss).toMatch(/setShowOnboardingQuestions\(false\)/);
    expect(dismiss).not.toMatch(/goToChatFromOnboarding/);
    expect(dismiss).not.toMatch(/FirstSessionHint/);
    expect(dismiss).not.toMatch(/setShowFirstSessionHint/);

    const goChat = dash.slice(
      dash.indexOf('const goToChatFromOnboarding'),
      dash.indexOf('const openBehavioralActivationFromFocus'),
    );
    expect(goChat).toMatch(/canAttemptChatAccess/);
    expect(goChat).toMatch(/SUBSCRIPTION_REQUIRED/);
    expect(goChat).toMatch(/navigate\('Subscription'\)/);
  });

  it('DashScreen no monta FirstSessionHint (eliminado del flujo)', () => {
    const dash = readSrc('screens/DashScreen.js');
    expect(dash).not.toMatch(/import FirstSessionHint/);
    expect(dash).not.toMatch(/<FirstSessionHint/);
    expect(dash).not.toMatch(/showFirstSessionHint/);
    expect(dash).not.toMatch(/firstSessionHintStorage/);
  });

  it('useChatScreen valida acceso al cargar (gate en la pestaña Chat)', () => {
    const hook = readSrc('hooks/useChatScreen.js');
    expect(hook).toMatch(/canAttemptChatAccess/);
    expect(hook).toMatch(/SUBSCRIPTION_REQUIRED_TITLE/);
    expect(hook).toMatch(/navigate\('Subscription'\)/);
  });

  it('VerifyEmailScreen continúa sin Alert bloqueante tras verificar', () => {
    const verify = readSrc('screens/VerifyEmailScreen.js');
    expect(verify).not.toMatch(/Alert\.alert/);
    expect(verify).not.toMatch(/import\s*\{[^}]*Alert/);
    expect(verify).toMatch(/showToast\(\{/);
    expect(verify).toMatch(/navigation\.reset\(\{/);
    expect(verify).toMatch(/ROUTES\.MAIN_TABS/);
  });

  it('handleOnboardingQuestionsCompleted persiste tutorial sin hint', () => {
    const dash = readSrc('screens/DashScreen.js');
    const block = dash.slice(
      dash.indexOf('const handleOnboardingQuestionsCompleted'),
      dash.indexOf('const handleExploreAppTutorial'),
    );
    expect(block).toMatch(/markTutorialCompleted/);
    expect(block).not.toMatch(/setFirstSessionHintDismissed/);
    expect(block).not.toMatch(/setShowFirstSessionHint/);
  });
});
