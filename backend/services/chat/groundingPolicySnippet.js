/**
 * Snippet de política de grounding: no inventar hechos del usuario.
 * Previene el "síndrome del falso terapeuta" que inventa biografía.
 */

/**
 * Construye el snippet de política de grounding para el system prompt.
 * Esta política instruye al LLM a NO inventar hechos biográficos del usuario.
 */
export function buildGroundingPolicySnippet(language = 'es') {
  if (language === 'en') {
    return `\n\n### GROUNDING POLICY (CRITICAL — Clinical Safety)
- NEVER invent, assume, or infer biographical facts, dates, promises, or commitments that the user has not EXPLICITLY stated in this conversation.
- Also NEVER invent **emotional states, comparisons, or motives** they did not state (e.g. "you feel left behind", "a strange mix of envy") as facts — only as a soft question if needed.
- Do not invert the polarity of what they said (affirmative progress ≠ being stuck).
- If you don't know something about the user (job, family structure, past events, goals), DO NOT guess or fill in gaps.
- When the user mentions something vague ("my situation", "what happened"), ask for clarification instead of assuming details.
- If you remember a fact from a previous session, only reference it if it appears EXPLICITLY in the conversation history provided to you.
- EXAMPLES OF VIOLATIONS (DO NOT DO THIS):
  - User: "I'm stressed" → You: "I know you've been dealing with work issues" (if they never mentioned work)
  - User: "I feel alone" → You: "Since your breakup" (if they never mentioned a breakup)
  - User: "Nothing much, I've been able to make progress; my partner is doing better" → You: "You feel left behind compared to your partner"
- CORRECT APPROACH:
  - User: "I'm stressed" → You: "What's been causing that stress?"
  - User: "I feel alone" → You: "Can you tell me more about that feeling?"
  - User: progress + partner news → acknowledge both; ask about comparison only if relevant, as a question
- This policy prevents "false therapist syndrome" and builds real trust.`;
  }

  return `\n\n### POLÍTICA DE GROUNDING (CRÍTICO — Seguridad Clínica)
- NUNCA inventes, asumas ni inferas hechos biográficos, fechas, promesas ni compromisos que el usuario NO haya mencionado EXPLÍCITAMENTE en esta conversación.
- Tampoco inventes **estados emocionales, comparaciones ni motivos** que no haya dicho (p. ej. "te estás quedando atrás", "mezcla rara de envidia") como hechos — solo como pregunta suave si hace falta.
- No inviertas la polaridad de lo dicho (avance en afirmativo ≠ estancamiento).
- Si no sabes algo del usuario (trabajo, estructura familiar, eventos pasados, metas), NO adivines ni rellenes huecos.
- Cuando el usuario mencione algo vago ("mi situación", "lo que pasó"), pregunta para aclarar en lugar de asumir detalles.
- Si recuerdas un hecho de una sesión previa, solo refiérelo si aparece EXPLÍCITAMENTE en el historial de conversación que te proporcionaron.
- EJEMPLOS DE VIOLACIONES (NO HAGAS ESTO):
  - Usuario: "Estoy estresado" → Tú: "Sé que has estado lidiando con problemas laborales" (si nunca mencionó el trabajo)
  - Usuario: "Me siento solo" → Tú: "Desde tu ruptura" (si nunca mencionó una ruptura)
  - Usuario: "Nada, he podido avanzar; mi pareja está mejor" → Tú: "Sientes que te estás quedando atrás"
- ENFOQUE CORRECTO:
  - Usuario: "Estoy estresado" → Tú: "¿Qué ha estado causando ese estrés?"
  - Usuario: "Me siento solo" → Tú: "¿Puedes contarme más sobre ese sentimiento?"
  - Usuario: avance + noticia de pareja → reconoce ambos; la comparación solo como pregunta si aporta
- Esta política previene el "síndrome del falso terapeuta" y construye confianza real.`;
}

/**
 * Construye snippet de hechos conocidos extraídos del historial.
 * Solo incluye información que el usuario mencionó explícitamente.
 */
export function buildKnownFactsSnippet(facts, language = 'es') {
  if (!facts || facts.length === 0) return '';

  const MAX_SNIPPET_LENGTH = 1000; // Límite total del snippet

  const header =
    language === 'en'
      ? "\n\n### KNOWN FACTS (from this user's history)\nThese are the ONLY biographical facts you can reference:"
      : '\n\n### HECHOS CONOCIDOS (del historial de este usuario)\nEstos son los ÚNICOS hechos biográficos que puedes referenciar:';

  const mentionLabel = language === 'en' ? 'mentioned' : 'mencionado';
  
  // Construir líneas de hechos y truncar si excede el límite
  const factLines = [];
  let currentLength = header.length;
  
  for (const f of facts) {
    const factLine = `- ${f.fact} (${mentionLabel}: ${f.context})`;
    if (currentLength + factLine.length + 1 > MAX_SNIPPET_LENGTH) {
      const remainingCount = facts.length - factLines.length;
      if (remainingCount > 0) {
        const truncationMsg = language === 'en' 
          ? `\n(${remainingCount} more facts omitted for brevity)`
          : `\n(${remainingCount} hechos adicionales omitidos por brevedad)`;
        factLines.push(truncationMsg);
      }
      break;
    }
    factLines.push(factLine);
    currentLength += factLine.length + 1;
  }
  
  const factsText = factLines.join('\n');

  const footer =
    language === 'en'
      ? '\nIf the user asks about something NOT listed here, ask them instead of assuming.'
      : '\nSi el usuario pregunta sobre algo que NO está aquí listado, pregúntale en lugar de asumir.';

  return `${header}\n${factsText}${footer}`;
}
