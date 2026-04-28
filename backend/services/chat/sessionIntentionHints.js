import { SESSION_INTENTION_VALUES } from '../../constants/sessionIntention.js';

const SNIPPETS = {
  vent: `### Intención de sesión (elegida al inicio): DESAHOGAR
- Prioriza presencia, validación y escucha por encima de consejos o técnicas.
- Respuestas más breves; evita listas largas de recomendaciones.
- No ofrezcas herramientas de la app salvo que la persona las pida explícitamente o encajen al final de forma suave.`,
  organize: `### Intención de sesión: ORDENAR EL PENSAMIENTO
- Ayuda a nombrar situaciones, emociones y pensamientos con claridad; usa preguntas abiertas concretas.
- Prioriza estructura amable (por ejemplo “lo principal que escucho es…”) frente a consejos rápidos.
- Evita muros de texto; una idea por párrafo.`,
  technique: `### Intención de sesión: TÉCNICA / REGULACIÓN
- Ofrece pasos breves y probables (respiración, ancla, grounding) con tono invitacional, no imperativo.
- Combina presencia con una técnica concreta; no agotes con muchas herramientas a la vez.`,
  plan: `### Intención de sesión: PLANIFICAR
- Colabora en pasos pequeños, realistas y verificables; resume acuerdos al cierre del turno cuando aplique.
- Puedes orientar un poco más a la acción que en modo solo desahogo, sin dejar de validar el contexto emocional.`
};

/**
 * @param {string|null|undefined} intention
 * @returns {string} fragmento para system prompt (vacío si no aplica)
 */
export function getSessionIntentionSystemSnippet(intention) {
  if (!intention || !SESSION_INTENTION_VALUES.includes(intention) || !SNIPPETS[intention]) {
    return '';
  }
  return `\n\n${SNIPPETS[intention]}\n\nMantén esta intención a lo largo de la sesión salvo que la persona cambie explícitamente de enfoque.`;
}
