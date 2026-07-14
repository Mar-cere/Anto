/**
 * Guardrails del bloque de foco — filas accionables (tarea y hábito).
 */
import fs from 'fs';
import path from 'path';

const FRONTEND_SRC = path.resolve(__dirname, '..', '..');

function readSrc(relativePath) {
  return fs.readFileSync(path.join(FRONTEND_SRC, relativePath), 'utf8');
}

describe('dashboardFocusCard guard', () => {
  it('DashboardFocusCard usa fila accionable para próxima tarea', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/onOpenNextTask/);
    expect(src).toMatch(/key: 'next-task'/);
    expect(src).toMatch(/showChevron: true/);
    expect(src).toMatch(/displayedReminder\?\.kind === 'task'/);
    expect(src).toMatch(/buildFocusTaskOpenPayload/);
    expect(src).not.toMatch(/styles\.insetLabel\}>\{DASH\.FOCUS_NEXT_TASK\}/);
  });

  it('DashboardFocusCard usa fila accionable para próximo hábito', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/onOpenNextHabit/);
    expect(src).toMatch(/key: 'next-habit'/);
    expect(src).toMatch(/resolveFocusNextHabit/);
    expect(src).toMatch(/displayedReminder\?\.kind !== 'habit'/);
    expect(src).toMatch(/displayedReminder\?\.kind === 'habit'/);
    expect(src).toMatch(/buildFocusHabitOpenPayload/);
  });

  it('DashScreen navega a Tasks con buildFocusNextTaskNavParams', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/openNextTaskFromFocus/);
    expect(src).toMatch(/buildFocusNextTaskNavParams/);
    expect(src).toMatch(/onOpenNextTask=\{openNextTaskFromFocus\}/);
  });

  it('DashScreen navega a hábitos con buildFocusNextHabitNavParams', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/openNextHabitFromFocus/);
    expect(src).toMatch(/buildFocusNextHabitNavParams/);
    expect(src).toMatch(/onOpenNextHabit=\{openNextHabitFromFocus\}/);
  });

  it('focusNextHabitNavigation resuelve fallback desde candidatos', () => {
    const src = readSrc('utils/focusNextHabitNavigation.js');
    expect(src).toMatch(/resolveFocusNextHabit/);
    expect(src).toMatch(/reminder\?\.candidates/);
    expect(src).toMatch(/resolveFocusHabitId/);
  });

  it('focusNextTaskNavigation resuelve fallback desde candidatos', () => {
    const src = readSrc('utils/focusNextTaskNavigation.js');
    expect(src).toMatch(/resolveFocusNextTask/);
    expect(src).toMatch(/reminder\?\.candidates/);
    expect(src).toMatch(/resolveFocusTaskId/);
    expect(src).toMatch(/stripFocusTaskTitlePrefix/);
  });

  it('ctaSecondary separa el botón Ir al chat del bloque superior', () => {
    const src = readSrc('styles/focusCardTheme.js');
    expect(src).toMatch(/ctaSecondary:[\s\S]*marginTop:\s*SPACING\.md/);
  });

  it('no muestra enlace sparse de chat si ya hay fila o CTA al chat', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/hasAlternateChatEntry/);
    expect(src).toMatch(/showSparseChatLink/);
    expect(src).not.toMatch(/\{focus\?\.isSparseActivity \?/);
  });

  it('DashboardFocusCard resuelve próxima tarea con useMemo', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/resolveFocusNextTask\(data\)/);
    expect(src).toMatch(/useMemo\(\(\) => resolveFocusNextTask/);
  });

  it('DashboardFocusCard oculta compromisos BA duplicados cuando hay plan semanal', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/filterDashboardCommitments/);
    expect(src).toMatch(/visibleCommitments/);
    expect(src).toMatch(/buildCommitmentFollowUpPrompt/);
    expect(src).toMatch(/visibleCommitments\.length > 0/);
    expect(src).toMatch(/isCommitmentFollowUpDue/);
    expect(src).toMatch(/followUpDue === true/);
  });

  it('DashboardFocusCard no duplica continuidad del chat con compromiso pendiente del mismo hilo', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/hasChatContinuity/);
    expect(src).toMatch(/continuityConversationId/);
    expect(src).not.toMatch(/FOCUS_CHAT_CONTINUITY_PARKED_BADGE/);
    expect(src).not.toMatch(/continuityCommitmentHint/);
  });

  it('DashboardFocusCard registra telemetría follow_up_shown en dashboard', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/postCommitmentTelemetry/);
    expect(src).toMatch(/event: 'follow_up_shown'/);
    expect(src).toMatch(/surface: 'dashboard'/);
    expect(src).toMatch(/isCommitmentFollowUpDue/);
  });

  it('DashboardFocusCard abre el chat desde compromisos guardados', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/FOCUS_COMMITMENT_OPEN_A11Y/);
    expect(src).toMatch(/canOpenConversation/);
    expect(src).toMatch(/handleConv\(conversationId\)/);
    expect(src).toMatch(/chevron-forward/);
  });

  it('DashboardFocusCard edita customGoal en home (#161)', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/onSaveCustomGoal/);
    expect(src).toMatch(/onOpenFocusOnboarding/);
    expect(src).toMatch(/normalizeCustomGoal/);
    expect(src).toMatch(/GOAL_EMPTY_CTA/);
    expect(src).toMatch(/GOAL_EDIT_HINT/);
    expect(src).toMatch(/editingGoal/);
  });

  it('guardar objetivo muestra spinner y avisa con toast si falla', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/useToast/);
    expect(src).toMatch(/GOAL_SAVE_ERROR/);
    expect(src).toMatch(/type: 'error'/);
    expect(src).toMatch(/savingGoal \? \(\s*<ActivityIndicator/);
    expect(src).toMatch(/busy: savingGoal/);
    expect(src).toMatch(/GOAL_SAVING_A11Y/);
  });

  it('no reserva bloque "elegir foco" encima de Lo principal ahora si ya hay filas', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/showStartFocusCta/);
    expect(src).toMatch(/actionRows\.length === 0/);
    expect(src).toMatch(/activeFocusInlineLink/);
  });

  it('DashScreen cablea updateFocus para objetivo del foco', () => {
    const src = readSrc('screens/DashScreen.js');
    expect(src).toMatch(/handleSaveCustomGoal/);
    expect(src).toMatch(/onSaveCustomGoal=\{handleSaveCustomGoal\}/);
    expect(src).toMatch(/onOpenFocusOnboarding=\{openFocusOnboarding\}/);
    expect(src).toMatch(/updateFocus/);
    expect(src).toMatch(/normalizeCustomGoal/);
  });

  it('focusService usa rutas /api/focus', () => {
    const src = readSrc('services/focusService.js');
    expect(src).toMatch(/\/api\/focus/);
    expect(src).not.toMatch(/apiClient\.(get|post|patch)\('\/focus\//);
  });
});
