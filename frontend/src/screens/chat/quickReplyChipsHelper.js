/**
 * Respuestas rápidas contextuales (sin llamada extra al modelo).
 *
 * - Rotación: varias filas predefinidas por contexto; la semilla elige la fila.
 * - A/B de copy: grupo A (más directo) vs B (más suave), estable por semilla.
 * - Tonos de apoyo; no sustituyen valoración clínica.
 */

/** @param {string} s */
export function hashSeed(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/**
 * Grupo A/B estable para la misma semilla (útil para tono de copy).
 * @param {number} seed
 * @returns {'A' | 'B'}
 */
export function copyGroupFromSeed(seed) {
  return seed % 2 === 0 ? 'A' : 'B';
}

/**
 * @param {{ A: { label: string, text: string }, B: { label: string, text: string } }} pair
 * @param {'A' | 'B'} group
 */
function ab(pair, group) {
  const p = pair[group];
  return { label: p.label, text: p.text };
}

/**
 * @param {Array<{ id: string, A: object, B: object }>} triple
 * @param {'A' | 'B'} group
 * @param {string} idSuffix
 */
function mapTriple(triple, group, idSuffix) {
  return triple.map((row, i) => ({
    id: `${row.id}${idSuffix}-${i}`,
    ...ab(row, group),
  }));
}

/** Rota entre filas completas */
function pickRow(rows, seed) {
  if (!rows.length) return [];
  return rows[seed % rows.length];
}

/**
 * @param {string} assistantText
 * @param {string} userText
 * @param {number} seed
 * @param {'A' | 'B'} group
 */
function getQuickRepliesCompact(assistantText, userText, seed, group) {
  const combined = `${assistantText} ${userText}`;
  const thanks = /gracias|mejor|eso ayuda|me sirve/i.test(combined);

  if (thanks) {
    const rows = [
      mapTriple(
        [
          {
            id: 'qc-th-0',
            A: { label: 'Seguir', text: 'Quiero seguir un poco más' },
            B: { label: 'Seguir', text: 'Me gustaría seguir un ratito más' },
          },
          {
            id: 'qc-th-1',
            A: { label: 'Descanso', text: 'Prefiero dejarlo aquí por hoy' },
            B: { label: 'Parar', text: 'Creo que prefiero parar aquí por hoy' },
          },
        ],
        group,
        `-c${seed}`
      ),
      mapTriple(
        [
          {
            id: 'qc-th2-0',
            A: { label: 'Un poco más', text: '¿Podemos seguir un poco más?' },
            B: { label: 'Sigo', text: 'Aún quiero hablar un poco' },
          },
          {
            id: 'qc-th2-1',
            A: { label: 'Cerrar', text: 'Lo dejamos aquí, gracias' },
            B: { label: 'Hasta aquí', text: 'Por hoy lo dejo aquí, gracias' },
          },
        ],
        group,
        `-c${seed}`
      ),
    ];
    return pickRow(rows, seed);
  }

  const rows = [
    mapTriple(
      [
        {
          id: 'qc-0',
          A: { label: 'Sigo aquí', text: 'Sigo aquí, cuéntame más' },
          B: { label: 'Aquí sigo', text: 'Sigo por aquí, dime más' },
        },
        {
          id: 'qc-1',
          A: { label: 'Otro ángulo', text: '¿Lo puedes ver desde otro ángulo?' },
          B: { label: 'Otra mirada', text: '¿Podrías mirarlo desde otro lado?' },
        },
      ],
      group,
      `-c${seed}`
    ),
    mapTriple(
      [
        {
          id: 'qc-alt-0',
          A: { label: 'Más', text: 'Necesito un poco más de esto' },
          B: { label: 'Profundizar', text: 'Quiero profundizar un poco' },
        },
        {
          id: 'qc-alt-1',
          A: { label: 'Pausa', text: 'Necesito frenar un momento' },
          B: { label: 'Respirar', text: 'Quiero hacer una pausa breve' },
        },
      ],
      group,
      `-c${seed}`
    ),
    mapTriple(
      [
        {
          id: 'qc-alt2-0',
          A: { label: 'Sigue', text: 'Sigue por aquí' },
          B: { label: 'Continúa', text: 'Puedes continuar' },
        },
        {
          id: 'qc-alt2-1',
          A: { label: 'Cambio', text: 'Prefiero cambiar de enfoque' },
          B: { label: 'Otro enfoque', text: 'Me ayudaría otro enfoque' },
        },
      ],
      group,
      `-c${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

/** Pregunta en respuesta del asistente */
function buildQuestion(seed, group) {
  const rows = [
    mapTriple(
      [
        {
          id: 'q-yes',
          A: { label: 'Sí', text: 'Sí' },
          B: { label: 'Sí', text: 'Sí, por favor' },
        },
        {
          id: 'q-more',
          A: { label: 'Explícame más', text: 'Explícame un poco más, por favor' },
          B: { label: 'Amplía', text: '¿Puedes ampliar eso un poco?' },
        },
        {
          id: 'q-unsure',
          A: { label: 'No estoy seguro/a', text: 'No lo tengo claro todavía' },
          B: { label: 'No sé', text: 'Todavía no lo tengo claro' },
        },
      ],
      group,
      `-q${seed}`
    ),
    mapTriple(
      [
        {
          id: 'q2-yes',
          A: { label: 'De acuerdo', text: 'De acuerdo' },
          B: { label: 'Vale', text: 'Vale' },
        },
        {
          id: 'q2-mid',
          A: { label: 'Un paso más', text: '¿Puedes dar un paso más?' },
          B: { label: 'Detalle', text: '¿Puedes contarlo con más detalle?' },
        },
        {
          id: 'q2-no',
          A: { label: 'Más bien no', text: 'Más bien no' },
          B: { label: 'No del todo', text: 'No del todo, la verdad' },
        },
      ],
      group,
      `-q${seed}`
    ),
    mapTriple(
      [
        {
          id: 'q3-yes',
          A: { label: 'Correcto', text: 'Sí, eso es' },
          B: { label: 'Eso es', text: 'Sí, algo así' },
        },
        {
          id: 'q3-elab',
          A: { label: 'Ejemplo', text: '¿Puedes poner un ejemplo?' },
          B: { label: 'Concretar', text: '¿Puedes concretarlo un poco?' },
        },
        {
          id: 'q3-diff',
          A: { label: 'Otra idea', text: 'Se me ocurre otra cosa' },
          B: { label: 'Otro punto', text: 'Pienso en otro punto' },
        },
      ],
      group,
      `-q${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

function buildThanks(seed, group) {
  const rows = [
    mapTriple(
      [
        {
          id: 'th-c',
          A: { label: 'Seguir', text: 'Quiero seguir hablando de esto' },
          B: { label: 'Seguir', text: 'Me gustaría seguir con este tema' },
        },
        {
          id: 'th-t',
          A: { label: 'Otro tema', text: 'Prefiero cambiar de tema' },
          B: { label: 'Otro asunto', text: '¿Podemos hablar de otra cosa?' },
        },
      ],
      group,
      `-t${seed}`
    ),
    mapTriple(
      [
        {
          id: 'th2',
          A: { label: 'Útil', text: 'Me está ayudando esto' },
          B: { label: 'Bien', text: 'Me está sentando bien hablarlo' },
        },
        {
          id: 'th2b',
          A: { label: 'Nuevo tema', text: 'Quiero pasar a otra cosa' },
          B: { label: 'Cambiar', text: 'Prefiero cambiar de tema' },
        },
      ],
      group,
      `-t${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

function buildWork(seed, group) {
  const rows = [
    mapTriple(
      [
        {
          id: 'w1',
          A: { label: 'Más trabajo', text: 'Necesito hablar más del tema laboral' },
          B: { label: 'Laburo', text: 'Quiero seguir con lo del trabajo' },
        },
        {
          id: 'w2',
          A: { label: 'Pausa mental', text: 'Necesito ideas para desconectar un momento' },
          B: { label: 'Desconectar', text: '¿Cómo desconectar un rato sin culpa?' },
        },
        {
          id: 'w3',
          A: { label: 'Priorizar', text: 'No sé por dónde empezar a ordenar esto' },
          B: { label: 'Orden', text: 'Me cuesta ordenar prioridades' },
        },
      ],
      group,
      `-w${seed}`
    ),
    mapTriple(
      [
        {
          id: 'w4',
          A: { label: 'Jefe/equipo', text: 'El tema es mi jefe o el equipo' },
          B: { label: 'Relación laboral', text: 'Me cuesta la relación en el trabajo' },
        },
        {
          id: 'w5',
          A: { label: 'Carga', text: 'Siento demasiada carga' },
          B: { label: 'Agobio', text: 'Me siento agobiado/a con la carga' },
        },
        {
          id: 'w6',
          A: { label: 'Límites', text: 'Necesito poner límites en el trabajo' },
          B: { label: 'Decir que no', text: 'Me cuesta decir que no en el trabajo' },
        },
      ],
      group,
      `-w${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

function buildSleep(seed, group) {
  const rows = [
    mapTriple(
      [
        {
          id: 's1',
          A: { label: 'No duermo bien', text: 'Últimamente no duermo bien' },
          B: { label: 'Dormir', text: 'Tengo problemas para dormir' },
        },
        {
          id: 's2',
          A: { label: 'Rutina', text: '¿Qué podría ayudarme a relajarme antes de dormir?' },
          B: { label: 'Antes de dormir', text: '¿Qué me recomiendas antes de acostarme?' },
        },
        {
          id: 's3',
          A: { label: 'Otro tema', text: 'Prefiero hablar de otra cosa' },
          B: { label: 'Cambiar', text: 'Mejor hablamos de otra cosa' },
        },
      ],
      group,
      `-s${seed}`
    ),
    mapTriple(
      [
        {
          id: 's4',
          A: { label: 'Desvelo', text: 'Me desvelo seguido' },
          B: { label: 'Insomnio', text: 'Siento que tengo insomnio' },
        },
        {
          id: 's5',
          A: { label: 'Cabeza', text: 'No paro de dar vueltas en la cabeza' },
          B: { label: 'Rumiar', text: 'No dejo de dar vueltas a las cosas' },
        },
        {
          id: 's6',
          A: { label: 'Miedo', text: 'Me da miedo no poder dormir' },
          B: { label: 'Ansiedad nocturna', text: 'De noche sube la ansiedad' },
        },
      ],
      group,
      `-s${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

function buildFamily(seed, group) {
  const rows = [
    mapTriple(
      [
        {
          id: 'f1',
          A: { label: 'Mal en casa', text: 'Me siento mal por cómo están las cosas en casa' },
          B: { label: 'Clima en casa', text: 'Hay un clima difícil en casa' },
        },
        {
          id: 'f2',
          A: { label: 'Límites', text: 'Me cuesta poner límites con ellos' },
          B: { label: 'Decir basta', text: 'No sé cómo poner límites' },
        },
        {
          id: 'f3',
          A: { label: 'Seguir', text: 'Sigue escuchándome' },
          B: { label: 'Aquí estoy', text: 'Sigo necesitando que me escuches' },
        },
      ],
      group,
      `-f${seed}`
    ),
    mapTriple(
      [
        {
          id: 'f4',
          A: { label: 'Pareja', text: 'Es sobre mi pareja' },
          B: { label: 'Relación', text: 'Vamos mal con mi pareja' },
        },
        {
          id: 'f5',
          A: { label: 'Familia', text: 'Es tema de familia' },
          B: { label: 'Padres/hijos', text: 'Me cuesta con padres o hijos' },
        },
        {
          id: 'f6',
          A: { label: 'Discusión', text: 'Discutimos mucho' },
          B: { label: 'Tensión', text: 'Hay mucha tensión' },
        },
      ],
      group,
      `-f${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

function buildCrisis(seed, group) {
  const rows = [
    mapTriple(
      [
        {
          id: 'cr1',
          A: { label: 'Sigo aquí', text: 'Sigo necesitando apoyo con esto' },
          B: { label: 'No estoy bien', text: 'Sigo mal y necesito apoyo' },
        },
        {
          id: 'cr2',
          A: { label: '¿Qué hago?', text: '¿Qué puedo hacer ahora mismo?' },
          B: { label: 'Un paso', text: '¿Qué pequeño paso puedo dar ahora?' },
        },
        {
          id: 'cr3',
          A: { label: 'Pausa', text: 'Necesito un momento' },
          B: { label: 'Respirar', text: 'Necesito frenar y respirar' },
        },
      ],
      group,
      `-cr${seed}`
    ),
    mapTriple(
      [
        {
          id: 'cr4',
          A: { label: 'Solo/a', text: 'Me siento muy solo/a' },
          B: { label: 'Aislamiento', text: 'Me siento aislado/a' },
        },
        {
          id: 'cr5',
          A: { label: 'Ayuda real', text: 'Necesito saber dónde buscar ayuda humana' },
          B: { label: 'Profesional', text: 'Creo que necesito ayuda profesional' },
        },
        {
          id: 'cr6',
          A: { label: 'No puedo más', text: 'Siento que no puedo más' },
          B: { label: 'Límite', text: 'Estoy al límite' },
        },
      ],
      group,
      `-cr${seed}`
    ),
    mapTriple(
      [
        {
          id: 'cr7',
          A: { label: 'Hablar', text: 'Necesito seguir hablando' },
          B: { label: 'Escucha', text: 'Necesito que me escuches un poco más' },
        },
        {
          id: 'cr8',
          A: { label: 'Recursos', text: '¿Hay recursos o líneas que pueda usar?' },
          B: { label: 'Teléfonos', text: '¿Conoces líneas de apoyo?' },
        },
        {
          id: 'cr9',
          A: { label: 'Parar tema', text: 'Necesito cambiar de tema un momento' },
          B: { label: 'Distraer', text: 'Necesito distraerme un momento' },
        },
      ],
      group,
      `-cr${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

/** Fallback genérico: varias filas × A/B */
function buildDefault(seed, group) {
  const rows = [
    mapTriple(
      [
        {
          id: 'd1',
          A: { label: 'Sigue', text: 'Sigue, por favor' },
          B: { label: 'Continúa', text: 'Puedes continuar, por favor' },
        },
        {
          id: 'd2',
          A: { label: 'Otro enfoque', text: '¿Podrías verlo desde otro ángulo?' },
          B: { label: 'Otra perspectiva', text: '¿Lo ves desde otra perspectiva?' },
        },
        {
          id: 'd3',
          A: { label: 'Parar aquí', text: 'Quiero parar aquí por ahora' },
          B: { label: 'Pausa', text: 'Prefiero hacer una pausa aquí' },
        },
      ],
      group,
      `-d${seed}`
    ),
    mapTriple(
      [
        {
          id: 'd4',
          A: { label: 'Más claro', text: 'Necesito que sea más claro' },
          B: { label: 'Más simple', text: '¿Puedes decirlo más simple?' },
        },
        {
          id: 'd5',
          A: { label: 'Ejemplo', text: '¿Puedes darme un ejemplo?' },
          B: { label: 'Concreto', text: '¿Puedes concretar un poco?' },
        },
        {
          id: 'd6',
          A: { label: 'Otro tema', text: 'Prefiero hablar de otra cosa' },
          B: { label: 'Cambiar', text: 'Mejor cambiamos de tema' },
        },
      ],
      group,
      `-d${seed}`
    ),
    mapTriple(
      [
        {
          id: 'd7',
          A: { label: 'Sí', text: 'Sí, sigue' },
          B: { label: 'Adelante', text: 'Adelante' },
        },
        {
          id: 'd8',
          A: { label: 'Duda', text: 'Tengo una duda' },
          B: { label: 'Pregunta', text: 'Tengo una pregunta' },
        },
        {
          id: 'd9',
          A: { label: 'Hasta luego', text: 'Lo dejamos aquí por ahora' },
          B: { label: 'Gracias', text: 'Gracias, lo dejo aquí' },
        },
      ],
      group,
      `-d${seed}`
    ),
    mapTriple(
      [
        {
          id: 'd10',
          A: { label: 'Profundizar', text: 'Quiero profundizar' },
          B: { label: 'Más fondo', text: 'Quiero ir un poco más al fondo' },
        },
        {
          id: 'd11',
          A: { label: 'Resumen', text: '¿Puedes resumir lo que llevamos?' },
          B: { label: 'Recap', text: '¿Recapitulamos un segundo?' },
        },
        {
          id: 'd12',
          A: { label: 'Siguiente paso', text: '¿Cuál sería el siguiente paso?' },
          B: { label: 'Paso pequeño', text: '¿Qué paso pequeño podría hacer?' },
        },
      ],
      group,
      `-d${seed}`
    ),
  ];
  return pickRow(rows, seed);
}

/**
 * @param {string} assistantText
 * @param {string} userText
 * @param {{
 *   compact?: boolean,
 *   rotationSeed?: number,
 *   copyGroup?: 'A' | 'B',
 * }} [options]
 * @returns {Array<{ id: string, label: string, text: string }>}
 */
export function getQuickReplies(assistantText = '', userText = '', options = {}) {
  const base = `${assistantText}\0${userText}`;
  const seed =
    typeof options.rotationSeed === 'number' && Number.isFinite(options.rotationSeed)
      ? Math.abs(options.rotationSeed >>> 0)
      : hashSeed(base);

  const group =
    options.copyGroup === 'A' || options.copyGroup === 'B'
      ? options.copyGroup
      : copyGroupFromSeed(seed);

  if (options.compact) {
    return getQuickRepliesCompact(assistantText, userText, seed, group);
  }

  const a = (assistantText || '').trim();
  const u = (userText || '').trim();
  const combined = `${a} ${u}`;

  if (a.includes('?')) {
    return buildQuestion(seed, group);
  }

  if (/gracias|agradec|me ayuda|me siento mejor|eso ayuda/i.test(combined)) {
    return buildThanks(seed, group);
  }

  if (/estr[eé]s|agotad|burnout|presi[oó]n laboral|trabajo|jefe|reuni[oó]n/i.test(combined)) {
    return buildWork(seed, group);
  }

  if (/no puedo dormir|insomnio|sueño|desvel|pesadill/i.test(combined)) {
    return buildSleep(seed, group);
  }

  if (/familia|pareja|padres|hij[oa]s|discuti|enfad|enoj/i.test(combined)) {
    return buildFamily(seed, group);
  }

  if (/triste|ansiedad|miedo|solo|sol[aá]|mal |peor|desbord|agobi|crisis|suicid/i.test(combined)) {
    return buildCrisis(seed, group);
  }

  return buildDefault(seed, group);
}
