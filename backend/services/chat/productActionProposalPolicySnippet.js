/**
 * Política anti-cargante para propuestas de tareas/hábitos en el turno de chat.
 */

/**
 * @param {'es'|'en'} language
 * @param {{ toolEnabled?: boolean }} [opts]
 * @returns {string}
 */
export function buildProductActionProposalPolicySnippet(language = 'es', opts = {}) {
  const toolEnabled = opts.toolEnabled === true;

  if (language === 'en') {
    if (!toolEnabled) {
      return `

### Product actions (tasks/habits)
The propose tool is **not** available this turn. Do not invent JSON or promise that a task/habit was saved. Stay in conversation.`;
    }
    return `

### Product actions (tasks/habits) — tool available, prefer NOT using it
You may call \`propose_product_action\` **at most once**. Default: **do not** call it.
Call it only when:
- the user clearly asks to save something in their tasks/habits, OR
- a concrete micro-step was agreed in this thread and saving it would help.
Never invent generic titles ("define a simple daily routine"). Never propose during pure venting.
In your visible reply: soft invitation at most; the app shows a confirm card — nothing is saved until they confirm.`;
  }

  if (!toolEnabled) {
    return `

### Acciones de producto (tareas/hábitos)
La tool de proponer **no** está disponible este turno. No inventes JSON ni prometas que se guardó una tarea/hábito. Quédate en la conversación.`;
  }

  return `

### Acciones de producto (tareas/hábitos) — tool disponible, prefiere NO usarla
Puedes llamar \`propose_product_action\` **como máximo una vez**. Por defecto: **no** la llames.
Úsala solo si:
- piden con claridad guardar algo en sus tareas/hábitos, O
- quedó acordado un micro-paso concreto y guardarlo ayuda.
Nunca inventes títulos genéricos ("definir una rutina diaria simple"). Nunca propongas en puro desahogo.
En el texto visible: como mucho una invitación suave; la app muestra una tarjeta de confirmación — nada se guarda hasta que confirmen.`;
}
