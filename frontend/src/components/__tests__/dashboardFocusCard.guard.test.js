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

  it('filterDashboardCommitments solo expone compromisos accionables', () => {
    const src = readSrc('utils/commitmentLabelUtils.js');
    expect(src).toMatch(/isDashboardCommitmentActionable/);
    expect(src).toMatch(/isConcreteCommitmentLabel\(commitment\.label\)/);
    expect(src).toMatch(/MAX_DASHBOARD_FOLLOW_UP_ATTEMPTS = 2/);
  });
});
