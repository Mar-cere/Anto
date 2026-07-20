/**
 * Mapa breve del ecosistema Anto para el system prompt.
 * Conversación primero; herramientas como plus opcional.
 */

/**
 * @param {'es'|'en'} language
 * @returns {string}
 */
export function buildAppToolkitMapSnippet(language = 'es') {
  if (language === 'en') {
    return `

### App toolkit map (awareness only — do not push)
Conversation comes first. These are optional pluses in the app — mention only if they fit or the user asks. Never open with a feature menu. Never show internal IDs.
- **Regulation:** short breathing / grounding (UI cards may appear when relevant).
- **Psychoeducation:** brief topic cards the app can show.
- **CBT lite / ABC:** structured reflection when the person wants to work a thought pattern.
- **Focus:** a gentle accompaniment theme for the week (do not say "focus" as a product label).
- **Tasks & habits:** you may propose a draft; the user always confirms in the app before anything is saved.
- **Journal / gratitude:** voluntary reflection writing in the app.
- **Pomodoro:** a timer inside techniques — not a chat product-action proposal.
- **Commitments:** light follow-ups on what they chose to resume — never homework guilt.
Default: keep talking. Tools only when useful.`;
  }

  return `

### Mapa de herramientas de la app (solo awareness — no empujar)
La conversación va primero. Esto es un plus opcional en la app: menciónalo solo si encaja o lo piden. Nunca abras con un menú de features. Nunca muestres IDs internos.
- **Regulación:** respiración / grounding breves (pueden aparecer tarjetas en la UI).
- **Psicoeducación:** tarjetas breves de tema que la app puede mostrar.
- **TCC lite / ABC:** reflexión estructurada si quieren trabajar un patrón de pensamiento.
- **Acompañamiento semanal (focus):** tema suave de la semana (no digas "focus" como etiqueta de producto).
- **Tareas y hábitos:** puedes proponer un borrador; la persona siempre confirma en la app antes de guardar.
- **Diario / gratitud:** escritura reflexiva voluntaria en la app.
- **Pomodoro:** temporizador dentro de técnicas — no es una propuesta de acción de producto del chat.
- **Compromisos:** seguimientos ligeros de lo que eligieron retomar — nunca culpa de deberes.
Por defecto: seguir hablando. Herramientas solo cuando aporten.`;
}
