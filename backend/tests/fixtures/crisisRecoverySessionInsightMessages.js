/**
 * Fixture manual/QA: crisis HIGH a mitad de hilo → cierre en calma (session insight recovery).
 * Pasos: chatear crisis → estabilizar → cerrar chat → ver insight (headlineSource: crisis_recovered_rules).
 */
export function buildCrisisRecoverySessionMessages(now = Date.now()) {
  return [
    {
      role: 'user',
      content: 'Hola, hoy me siento muy mal con todo',
      metadata: {
        context: { emotional: { mainEmotion: 'tristeza', intensity: 6, topic: 'general' } },
      },
      createdAt: new Date(now - 360000),
    },
    {
      role: 'assistant',
      content: 'Te escucho',
      metadata: {
        context: { emotional: { mainEmotion: 'tristeza', intensity: 6, topic: 'general' } },
      },
      createdAt: new Date(now - 340000),
    },
    {
      role: 'user',
      content: 'Quiero morir y no aguanto más',
      metadata: { crisis: { riskLevel: 'HIGH' } },
      createdAt: new Date(now - 300000),
    },
    {
      role: 'assistant',
      content: 'Gracias por contármelo. Tu seguridad es lo primero.',
      metadata: {
        crisis: { riskLevel: 'HIGH' },
        context: { emotional: { mainEmotion: 'miedo', intensity: 9, topic: 'salud' } },
      },
      createdAt: new Date(now - 280000),
    },
    {
      role: 'user',
      content: 'Hablé con mi hermana y me siento un poco mejor',
      metadata: {},
      createdAt: new Date(now - 120000),
    },
    {
      role: 'assistant',
      content: 'Me alegra que hayas podido hablar con alguien',
      metadata: {
        context: { emotional: { mainEmotion: 'esperanza', intensity: 5, topic: 'relaciones' } },
      },
      createdAt: new Date(now - 100000),
    },
    {
      role: 'user',
      content: 'Ahora estoy mejor, solo un poco de ansiedad',
      metadata: {},
      createdAt: new Date(now - 60000),
    },
    {
      role: 'assistant',
      content: 'Gracias por contarme cómo estás ahora',
      metadata: {
        context: { emotional: { mainEmotion: 'ansiedad', intensity: 4, topic: 'general' } },
      },
      createdAt: new Date(now - 30000),
    },
  ];
}
