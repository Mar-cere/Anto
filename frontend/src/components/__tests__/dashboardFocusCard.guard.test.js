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
    const card = readSrc('components/DashboardFocusCard.js');
    const rows = readSrc('utils/focusActionRows.js');
    expect(card).toMatch(/onOpenNextTask/);
    expect(rows).toMatch(/key: 'next-task'/);
    expect(rows).toMatch(/showChevron: true/);
    expect(card).toMatch(/displayedReminder\?\.kind === 'task'/);
    expect(card).toMatch(/buildFocusTaskOpenPayload/);
    expect(card).not.toMatch(/styles\.insetLabel\}>\{DASH\.FOCUS_NEXT_TASK\}/);
  });

  it('DashboardFocusCard usa fila accionable para próximo hábito', () => {
    const card = readSrc('components/DashboardFocusCard.js');
    const rows = readSrc('utils/focusActionRows.js');
    expect(card).toMatch(/onOpenNextHabit/);
    expect(rows).toMatch(/key: 'next-habit'/);
    expect(card).toMatch(/resolveFocusNextHabit/);
    expect(card).toMatch(/displayedReminder\?\.kind !== 'habit'/);
    expect(card).toMatch(/displayedReminder\?\.kind === 'habit'/);
    expect(card).toMatch(/buildFocusHabitOpenPayload/);
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
    const card = readSrc('components/DashboardFocusCard.js');
    const section = readSrc('components/dashboard/DashboardFocusCommitmentsSection.js');
    expect(card).toMatch(/filterDashboardCommitments/);
    expect(card).toMatch(/visibleCommitments/);
    expect(section).toMatch(/buildCommitmentFollowUpPrompt/);
    expect(section).toMatch(/visibleCommitments\.length === 0/);
    expect(card).toMatch(/isCommitmentFollowUpDue/);
    expect(card).toMatch(/followUpDue === true/);
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
    const section = readSrc('components/dashboard/DashboardFocusCommitmentsSection.js');
    expect(section).toMatch(/FOCUS_COMMITMENT_OPEN_A11Y/);
    expect(section).toMatch(/canOpenConversation/);
    expect(section).toMatch(/handleConv\(conversationId\)/);
    expect(section).toMatch(/chevron-forward/);
  });

  it('DashboardFocusCard edita customGoal en home (#161)', () => {
    const card = readSrc('components/DashboardFocusCard.js');
    const active = readSrc('components/dashboard/DashboardFocusActiveBlock.js');
    expect(card).toMatch(/onSaveCustomGoal/);
    expect(card).toMatch(/onOpenFocusOnboarding/);
    expect(active).toMatch(/normalizeCustomGoal/);
    expect(active).toMatch(/GOAL_EMPTY_CTA/);
    expect(active).toMatch(/GOAL_EDIT_HINT/);
    expect(active).toMatch(/editingGoal/);
  });

  it('guardar objetivo muestra spinner y avisa con toast si falla', () => {
    const src = readSrc('components/dashboard/DashboardFocusActiveBlock.js');
    expect(src).toMatch(/useToast/);
    expect(src).toMatch(/GOAL_SAVE_ERROR/);
    expect(src).toMatch(/type: 'error'/);
    expect(src).toMatch(/savingGoal \? \(\s*<ActivityIndicator/);
    expect(src).toMatch(/busy: savingGoal/);
    expect(src).toMatch(/GOAL_SAVING_A11Y/);
  });

  it('compromisos muestran toast si falla la acción', () => {
    const src = readSrc('components/DashboardFocusCard.js');
    expect(src).toMatch(/FOCUS_COMMITMENT_ACTION_ERROR/);
    expect(src).toMatch(/handleCommitmentAnswer/);
    expect(src).toMatch(/handleCommitmentOmit/);
    expect(src).toMatch(/handleCommitmentRenegotiate/);
    expect(src).toMatch(/handlePartialNoteSave/);
  });

  it('home enlaza a Mis compromisos y panel En parte', () => {
    const section = readSrc('components/dashboard/DashboardFocusCommitmentsSection.js');
    expect(section).toMatch(/FOCUS_COMMITMENTS_SEE_ALL/);
    expect(section).toMatch(/SESSION_COMMITMENTS/);
    expect(section).toMatch(/FOCUS_COMMITMENT_PARTIAL_HINT/);
    expect(section).toMatch(/handlePartialNoteSave/);
    expect(section).toMatch(/dismissWithoutNote/);
    expect(section).toMatch(/item\.partialNote == null/);
  });

  it('edición de objetivo se cierra si cambia el foco activo', () => {
    const src = readSrc('components/dashboard/DashboardFocusActiveBlock.js');
    expect(src).toMatch(/activeFocusKey/);
    expect(src).toMatch(/prevFocusKeyRef/);
  });

  it('usa claves i18n para paso de exposición y vencimiento de recordatorio', () => {
    const rows = readSrc('utils/focusActionRows.js');
    expect(rows).toMatch(/FOCUS_EXPOSURE_STEP_LABEL/);
    expect(rows).not.toMatch(/language === 'en' \? 'Step' : 'Paso'/);
    const normSrc = readSrc('utils/focusReminderNormalization.js');
    expect(normSrc).toMatch(/FOCUS_REMINDER_DUE_PREFIX/);
  });

  it('extrae normalización, filas y subcomponentes del bloque de foco', () => {
    const card = readSrc('components/DashboardFocusCard.js');
    expect(card).toMatch(/focusReminderNormalization/);
    expect(card).toMatch(/focusActionRows/);
    expect(card).toMatch(/DashboardFocusActiveBlock/);
    expect(card).toMatch(/DashboardFocusCommitmentsSection/);
    expect(card).toMatch(/FocusActionRow/);
    expect(card).not.toMatch(/function normalizeReminderForLanguage/);
    expect(card).not.toMatch(/const FocusActionRow = memo/);
  });

  it('focusCardTheme sin estilos legacy de filas sueltas', () => {
    const src = readSrc('styles/focusCardTheme.js');
    expect(src).not.toMatch(/reminderRow:/);
    expect(src).not.toMatch(/nextTaskLabel:/);
    expect(src).not.toMatch(/commitmentsBlock:/);
    expect(src).not.toMatch(/dashboardFocusStyles/);
  });

  it('compromisos exponen accessibilityLabel en chips de respuesta', () => {
    const src = readSrc('components/dashboard/DashboardFocusCommitmentsSection.js');
    expect(src).toMatch(/FOCUS_COMMITMENT_YES/);
    expect(src).toMatch(/accessibilityLabel=\{DASH\.FOCUS_COMMITMENT_YES\}/);
    expect(src).toMatch(/FOCUS_COMMITMENT_RENEGOTIATE_SAVE/);
    expect(src).toMatch(/FOCUS_COMMITMENT_PARTIAL/);
    expect(src).toMatch(/FOCUS_COMMITMENT_NO/);
    expect(src).toMatch(/FOCUS_COMMITMENT_OMIT/);
  });

  it('límite de follow-up compartido entre card y sección de compromisos', () => {
    const card = readSrc('components/DashboardFocusCard.js');
    const section = readSrc('components/dashboard/DashboardFocusCommitmentsSection.js');
    const constants = readSrc('utils/focusCardConstants.js');
    expect(card).toMatch(/MAX_FOCUS_COMMITMENT_FOLLOW_UP_ATTEMPTS/);
    expect(section).toMatch(/MAX_FOCUS_COMMITMENT_FOLLOW_UP_ATTEMPTS/);
    expect(constants).toMatch(/MAX_FOCUS_COMMITMENT_FOLLOW_UP_ATTEMPTS = 2/);
    expect(card).not.toMatch(/MAX_COMMITMENT_FOLLOW_UP_ATTEMPTS = 2/);
    expect(section).not.toMatch(/MAX_COMMITMENT_FOLLOW_UP_ATTEMPTS = 2/);
  });

  it('focusCardTheme conserva estilos activos del bloque de foco', () => {
    const src = readSrc('styles/focusCardTheme.js');
    const required = [
      'actionRow:',
      'groupedList:',
      'activeFocusContainer:',
      'commitmentRow:',
      'ctaSecondary:',
      'focusHero:',
      'protocolRow:',
    ];
    required.forEach((token) => expect(src).toMatch(new RegExp(token)));
  });

  it('utils de foco exportan builders y normalización', () => {
    const rows = readSrc('utils/focusActionRows.js');
    const norm = readSrc('utils/focusReminderNormalization.js');
    expect(rows).toMatch(/export function buildFocusActionRows/);
    expect(rows).toMatch(/export function buildFocusExposureCopy/);
    expect(norm).toMatch(/export function resolveDisplayedReminder/);
    expect(norm).toMatch(/export const FOCUS_COMPACT_WIDTH = 400/);
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
