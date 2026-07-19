import {
  filterDashboardCommitments,
  formatCommitmentFollowUpPrompt,
  isConcreteCommitmentLabel,
  isDashboardCommitmentActionable,
  isSoftResumeCommitmentLabel,
  isUsableCommitmentFollowUpLabel,
  looksLikeChatBubbleCommitmentLabel,
  shouldHideDashboardCommitmentFollowUp,
} from '../commitmentLabelUtils';

describe('commitmentLabelUtils', () => {
  it('rechaza labels genéricos o iguales al paso sugerido', () => {
    expect(isConcreteCommitmentLabel('Caminar 10 minutos', 'Activación conductual')).toBe(true);
    expect(isConcreteCommitmentLabel('Activación conductual', 'Activación conductual')).toBe(false);
    expect(isConcreteCommitmentLabel('Activación conductual')).toBe(false);
    expect(isConcreteCommitmentLabel('a')).toBe(false);
  });

  it('detecta eco de burbuja del chat como etiqueta inválida para editar', () => {
    expect(
      looksLikeChatBubbleCommitmentLabel(
        'Está bien no saberlo ahora; a veces solo se siente la carga sin poder nombrarla. Si quieres, seguimos.',
      ),
    ).toBe(true);
    expect(looksLikeChatBubbleCommitmentLabel('Retomar este tramo cuando te venga bien')).toBe(
      false,
    );
  });

  it('solo permite follow-up de chat con acción concreta', () => {
    expect(isSoftResumeCommitmentLabel('Volver a este tema cuando te venga bien')).toBe(true);
    expect(isUsableCommitmentFollowUpLabel('Salir a caminar 10 minutos')).toBe(true);
    expect(
      isUsableCommitmentFollowUpLabel(
        'Está bien no saberlo ahora; a veces solo se siente la carga sin poder nombrarla.',
      ),
    ).toBe(false);
    expect(isUsableCommitmentFollowUpLabel('Volver a este tema cuando te venga bien')).toBe(false);
    expect(isUsableCommitmentFollowUpLabel('Activación conductual')).toBe(false);
  });

  it('oculta compromiso BA cuando hay fila de plan semanal', () => {
    const commitment = {
      id: '1',
      label: 'Activación conductual',
      status: 'active',
      followUpAnswer: 'pending',
      followUpDue: true,
      interventionId: 'behavioral_activation',
    };
    expect(shouldHideDashboardCommitmentFollowUp(commitment, { hasBaWeekRow: true })).toBe(true);
    expect(shouldHideDashboardCommitmentFollowUp(commitment, { hasBaWeekRow: false })).toBe(true);
  });

  it('filtra compromisos genéricos y duplicados de BA en dashboard', () => {
    const items = [
      { id: '1', label: 'Activación conductual', status: 'active', followUpAnswer: 'pending', followUpDue: true, interventionId: 'behavioral_activation' },
      { id: '2', label: 'Respirar antes de dormir', status: 'active', followUpAnswer: 'pending', followUpDue: true },
    ];
    expect(filterDashboardCommitments(items, { hasBaWeekRow: true })).toHaveLength(1);
    expect(filterDashboardCommitments(items, { hasBaWeekRow: false })).toHaveLength(1);
    expect(filterDashboardCommitments(items, { hasBaWeekRow: false })[0].id).toBe('2');
  });

  it('oculta compromisos sin seguimiento accionable en dashboard', () => {
    const ghost = {
      id: 'ghost',
      label: '',
      status: 'active',
      followUpAnswer: 'pending',
      followUpDue: false,
    };
    const answered = {
      id: 'done',
      label: 'Caminar 10 minutos',
      status: 'active',
      followUpAnswer: 'yes',
      followUpDue: false,
    };
    const actionable = {
      id: 'due',
      label: 'Caminar 10 minutos',
      status: 'active',
      followUpAnswer: 'pending',
      followUpDue: true,
    };
    expect(isDashboardCommitmentActionable(ghost)).toBe(false);
    expect(isDashboardCommitmentActionable(answered)).toBe(false);
    expect(isDashboardCommitmentActionable(actionable)).toBe(true);
    expect(filterDashboardCommitments([ghost, answered, actionable])).toEqual([actionable]);
  });

  it('muestra compromisos recién guardados aunque el follow-up aún no venza', () => {
    const freshlySaved = {
      id: 'fresh',
      label: 'Volver a este tema cuando te venga bien',
      status: 'active',
      followUpAnswer: 'pending',
      followUpDue: false,
      source: 'chat_proposed',
    };
    expect(isDashboardCommitmentActionable(freshlySaved)).toBe(true);
  });

  it('con continuidad del chat, oculta el compromiso pendiente que solo invita a retomar el hilo', () => {
    const parked = {
      id: 'parked',
      label: 'Retomar este tramo cuando te venga bien',
      status: 'active',
      followUpAnswer: 'pending',
      followUpDue: false,
      conversationId: 'conv-1',
      source: 'chat_proposed',
    };
    const dueCheckIn = {
      id: 'due',
      label: 'Probar 5 minutos de respiración',
      status: 'active',
      followUpAnswer: 'pending',
      followUpDue: true,
      conversationId: 'conv-1',
    };
    expect(
      isDashboardCommitmentActionable(parked, {
        hasChatContinuity: true,
        continuityConversationId: 'conv-1',
      }),
    ).toBe(false);
    expect(
      isDashboardCommitmentActionable(dueCheckIn, {
        hasChatContinuity: true,
        continuityConversationId: 'conv-1',
      }),
    ).toBe(true);
    expect(
      filterDashboardCommitments([parked, dueCheckIn], {
        hasChatContinuity: true,
        continuityConversationId: 'conv-1',
      }).map((c) => c.id),
    ).toEqual(['due']);
  });

  it('oculta compromisos que son eco de burbuja del chat', () => {
    const bubbleEcho = {
      id: 'bubble',
      label:
        'Está bien no saberlo ahora; a veces solo se siente la carga sin poder nombrarla. Si quieres, seguimos.',
      status: 'active',
      followUpAnswer: 'pending',
      followUpDue: false,
      source: 'chat_proposed',
    };
    expect(looksLikeChatBubbleCommitmentLabel(bubbleEcho.label)).toBe(true);
    expect(isDashboardCommitmentActionable(bubbleEcho)).toBe(false);
  });

  it('muestra renegociación tras responder no', () => {
    const item = {
      id: 'reneg',
      label: 'Caminar 10 minutos',
      status: 'active',
      followUpAnswer: 'no',
      followUpAttempts: 1,
      followUpDue: false,
    };
    expect(isDashboardCommitmentActionable(item)).toBe(true);
  });

  it('oculta compromisos completados, omitidos o agotados', () => {
    expect(
      isDashboardCommitmentActionable({
        id: '1',
        label: 'X',
        status: 'completed',
        followUpAnswer: 'yes',
        followUpDue: true,
      }),
    ).toBe(false);
    expect(
      isDashboardCommitmentActionable({
        id: '2',
        label: 'X',
        status: 'skipped',
        followUpAnswer: 'pending',
        followUpDue: true,
      }),
    ).toBe(false);
    expect(
      isDashboardCommitmentActionable({
        id: '3',
        label: 'X',
        status: 'active',
        followUpAnswer: 'partial',
        followUpDue: true,
      }),
    ).toBe(false);
    expect(
      isDashboardCommitmentActionable({
        id: '5',
        label: 'X',
        status: 'active',
        followUpAnswer: 'pending',
        followUpDue: true,
        followUpAttempts: 2,
      }),
    ).toBe(false);
  });

  it('inserta el label en el prompt de seguimiento', () => {
    expect(formatCommitmentFollowUpPrompt('¿Pudiste con «{label}»?', 'Caminar 10 min')).toBe(
      '¿Pudiste con «Caminar 10 min»?',
    );
  });
});
