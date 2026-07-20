/**
 * Instrucciones de prompt cuando el soft check-in #19 está activo.
 */

/**
 * @param {'es'|'en'} language
 * @param {{ active?: boolean }} [opts]
 * @returns {string}
 */
export function buildSoftCrisisCheckInPromptSnippet(language = 'es', opts = {}) {
  if (opts.active !== true) return '';

  if (language === 'en') {
    return `

### Soft check-in mode (#19)
This turn is a **soft check-in**, not full crisis protocol #93.
- Brief validation + gentle regulation invitation (breathing/grounding) if it fits.
- Do **not** escalate to emergency panels, contact alerts, or hard crisis scripts unless new explicit high-risk signals appear.
- Do **not** propose tasks, habits, CBT homework, or heavy technique menus.
- Keep one calm question max; prioritize presence.`;
  }

  return `

### Modo check-in suave (#19)
Este turno es un **check-in suave**, no el protocolo de crisis completo #93.
- Validación breve + invitación suave a regulación (respiración/grounding) si encaja.
- **No** escales a panel de emergencia, alerta a contactos ni guion duro de crisis salvo señales nuevas explícitas de alto riesgo.
- **No** propongas tareas, hábitos, deberes TCC ni menús pesados de técnicas.
- Como máximo una pregunta calmada; prioriza presencia.`;
}
