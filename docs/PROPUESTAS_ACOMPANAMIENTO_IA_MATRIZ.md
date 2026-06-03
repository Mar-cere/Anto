# Propuestas de producto: acompañamiento e IA

Listado de **~185** propuestas `No` en la tabla principal, más **3** `Parcial` con trabajo abierto (#127 MVP cerrado, #151, #194) y **8 anclas entregadas** referenciadas (numeración **#1–#214**; huecos históricos conservados; **16** ex-Q5 + **11** entregadas archivadas). **Hecha:** `Sí` / `Sí*` / `Parcial` = ver columna; en la tabla activa predominan filas `No` y `Parcial` con trabajo abierto. Chat → tarea/hábito: [CONTRATO_CHAT_ACCIONES_V1.md](./CONTRATO_CHAT_ACCIONES_V1.md).

**Matriz:** Urgencia, Impacto, Retención (1–5). **Imp*** = redondeo de la media de Impacto y Retención. **Costo** B/M/A. **T** tiempo dev S/M/L. **Q** = cuadrante Eisenhower (**Q1–Q4**). **Q5** = descartadas (sección ex-Q5). **Entregadas archivadas** = fuera de la tabla salvo anclas referenciadas (sección siguiente).

### Propuestas retiradas (ex-Q5, mayo 2026)

Criterio para **eliminar** del backlog activo (no son un quinto cuadrante de priorización):

- **Urg ≤ 2** y **Imp* ≤ 3**, y además al menos una de: (a) valor casi solo interno (dev/ops/B2B sin usuario), (b) dependencia de partner o módulos inexistentes, (c) cosmética o gamificación sin aportar al núcleo terapéutico, (d) costo **A/L** desproporcionado frente a retención.

| # | Propuesta | Motivo breve de retiro |
|---|-----------|------------------------|
| 14 | Compartir resumen confianza | Costo A/L alto; nicho social; bajo Imp* |
| 21 | Rama por tema | Complejidad de datos/UX sin demanda clara |
| 27 | Logros proceso | Gamificación; sustituido en espíritu por #162 / #156 |
| 37 | Síntesis colapsable IA | Polish de UI; no diferenciador |
| 68 | Micro-etiquetas fase | Gimmick educativo; riesgo de lectura “clínica” |
| 83 | Timeline / minimapa sesión | Vanity técnica en móvil |
| 110 | Cohortes idioma/región | Bloqueado sin psicoed modular (#85–#99) |
| 122 | Caché semántica estática | Prematuro sin RAG (#113) |
| 137 | API partner EAP | Sin partner; backlog eterno |
| 139 | Chaos dependencias | Madurez ops; equipo pequeño |
| 146 | SLA interno por tier | B2B futuro; no etapa actual |
| 147 | Bug bounty / disclosure | Escala empresa; no prioridad ahora |
| 150 | Cómputo verde / baja CO₂ | Imp* 2; comunicación, no producto |
| 173 | Knip código muerto | Solo DX interno |
| 188 | Copy remoto server-driven | Complejidad vs release de store |
| 196 | Mutación tests pago/token | Costo A/L; Ret bajo |

**Q4 activo** tras el recorte: **7** propuestas (#22, #30, #43, #45, #58, #145, #165) — posponer, no descartar del todo.

### Propuestas entregadas archivadas (fuera de la tabla, mayo 2026)

**Criterio:** `Sí` / `Sí*` / `Parcial` cerrado **sin** que ninguna fila pendiente (`No` o `Parcial` abierto) de la matriz las cite. La especificación técnica de continuidad (#4 + #47) sigue en la sección «Continuidad del chat» más abajo.

| # | Propuesta | Estado al archivar |
|---|-----------|-------------------|
| 4 | Cierre de sesión breve | Sí — mismo artefacto que #47 (spec) |
| 16 | Onboarding acompañamiento | Sí |
| 31 | Espacio entre sesiones | Parcial |
| 56 | Pipeline entender → responder | Sí |
| 57 | Pregunta si baja certeza | Sí |
| 62 | Plantilla validación–normalización–pregunta | Sí |
| 72 | Intención de sesión al inicio | Sí |
| 103 | Cierre natural de sesión | Sí* |
| 114 | Routing modelos triage | Sí* |
| 119 | Dataset eval + CI regresión | Sí* |
| 158 | Hero retoma tu hilo | Parcial (cubierto en parte por continuidad + #34) |

**Anclas entregadas que permanecen en la tabla** (otras propuestas las referencian): **#8** ← #194; **#11** ← #154, #195; **#34** ← #161; **#47** ← #163; **#52–#53** ← #159, #164; **#59** ← #168; **#67** ← #123, #175.

### Estado del código (revisión 18 mayo 2026)

| Área | Estado |
|------|--------|
| **Continuidad chat (#4, #47)** | Sin cambios de alcance: worker `lastSessionSummary`, tarjeta perfil, bloque foco en inicio (`GET /api/summary/focus`). |
| **Acciones desde chat (#52, #53)** | Contrato v1 en producción: `proposedProductActions`, confirmación en UI, `clientRequestId` opcional. |
| **Dashboard foco (#34)** | `DashboardFocusCard` + API agregada; integra continuidad del último hilo cuando aplica. |
| **i18n UI EN (#151)** | **Parcial:** `LanguageContext`, selector en Ajustes (persistencia local + `preferences.language` en perfil), diccionarios `es`/`en` (~2.1k claves c/u), `useTranslations` en la mayoría de pantallas y componentes; FAQ con `FaQScreen.en.js`. **Pendiente:** emails transaccionales, push copy pools, prompts de chat y crisis en backend (**#153** sigue **No**). |
| **Panel IA (#8)** | **Sí (MVP):** `AIPrivacyScreen`, enlace en Ajustes y menú del chat (`ChatOptionsSheet`); textos bilingües vía traducciones. |
| **Resumen en app (#11)** | `SummaryScreen` (semana/mes) sin cambios de alcance. |
| **CI lint unificado (#167)** | Sigue **No** en matriz: CI frontend ejecuta `check` (imports, SafeArea) + Jest; ESLint local en `eslint.config.js` sin gate en workflow. |
| **Grafo tema–intervención (#127)** | **Parcial (jun 2026):** catálogo, eventos, sesión 45 min, cap 1 bloque/sesión, `GET /api/chat/interventions/graph`, panel dev, psicoed vía catálogo (#85), **ranking de sugerencias** según histórico del usuario (completion/CTR/dismiss), **ABC (#86)** en catálogo. **Pendiente:** más señales, resto #87–#99, `topicFree`, #218. |
| **Psicoeducación modular (#85)** | **Parcial (MVP UX jun 2026):** 7 módulos es/en, biblioteca, chat (#78), tests/smoke. **Pendiente:** más temas (#86–#99). **#111** sello UI en módulo/biblioteca/chat. |
| **Autorregistro ABC (#86)** | **Parcial (MVP jun 2026):** wizard A→B→C, API, export, pantalla `AbcRecord`, catálogo #127, sugerencias chat, **prefill paso A desde mensaje**. **Pendiente:** agregación macro (#212). |

### Nuevas propuestas (input producto, mayo 2026)

Incorporadas como **#201–#223** (lotes 1–3). Criterio: no duplicar filas ya cubiertas; donde hay **pinceladas en app**, la fila nueva describe el salto de producto pendiente y enlaza la fila existente.

**Lote 1 (#201–#209)**

| Tema (tu input) | En la app hoy (pinceladas) | Ya en matriz | Nueva fila |
|-----------------|----------------------------|--------------|------------|
| Marcos TCC (distorsiones + reestructuración) | Plantillas terapéuticas con copy CBT; técnicas en pantallas; chat abierto con prompts generales | #40, #86, #89 | **#201** |
| ACT (valores + alineación conducta) | Menciones en plantillas; sin flujo valores→acciones | **#94** (suficiente; ampliar allí) | — |
| Deberes entre sesiones | Tareas/hábitos desde chat (#52–#53); compromisos (#20) sin follow-up sistemático | #20, #52–#53 | **#202** |
| Memoria largo plazo / RAG patrones | Continuidad último hilo (#47); compactación de hilo (#60); resumen semanal (#11); sin vector store personal ni “la semana pasada dijiste…” | #60, #113, #17, #126, #154 | **#203** |
| UX refugio (carga cognitiva) | Tema claro/oscuro, `SPACING`, modo inmersivo propuesto; chat denso en sesiones largas | #36, #134, #165 | **#204** |
| Guardrails crisis (hard-stop + derivación) | `crisis.js`, alertas, clasificación en pipeline (#56 arch.), routing (#114); falta hard-stop explícito y transparencia plena (#10, #194) | #9, #10, #93, #194 | **#205** |
| Roleplay afrontamiento | #48 y #107 genéricos; CNV (#97); sin rol configurable ni debrief estructurado | #48, #97, #107 | **#206** |
| UI dinámica (lienzos) | `proposedProductActions`; técnicas nativas (#78); PSST (#99) solo conversacional | #73, #78, #99 | **#207** |
| Espejo clínico / patrones | `SummaryScreen` = actividad; #154 = informe amplio pendiente; sin gráfico de detonantes ni análisis “noté un patrón” | #11, #154, #79 | **#208** |
| Alianza / tono adaptativo | `responseStyle` en ajustes; intención de sesión (#72 entregada); #3 preferencia escucha vs consejos | #3, #12, #72, #178 | **#209** |

**Lote 2 (#210–#214) — patrones profundos y presentación**

| Tema (tu input) | En la app hoy (pinceladas) | Ya en matriz | Nueva fila |
|-----------------|----------------------------|--------------|------------|
| Rastreador esquemas / creencias nucleares | Copy CBT en plantillas; preguntas socráticas con categoría `beliefs` (`socraticQuestions.js`); sin etiquetado de esquemas ni mapa narrativo | #201, #89, #203, #208 | **#210** |
| Detector puntos ciegos | Sin contraste explícito pasado↔presente; eco comprobatorio (#61) solo en turno | #203, #61, #208 | **#211** |
| Ciclo ABC macro (T→P→C→K) | **#86 MVP:** wizard ABC puntual + export; sin agregación de eventos ni visual de ciclo | #86, #207, #208 | **#212** |
| UX revelación de insights | Refugio general (#204); reportes aún no diseñados para impacto emocional | #204, #208 | **#213** |
| Cápsula del tiempo reflexiva | Carta al yo futuro (#44) es proactiva; sin replay de mensajes pasados vulnerables | #44, #203 | **#214** |

**Lote 3 (#215–#223) — señales conductuales, correlación y capas LLM profundas** (input producto, mayo 2026)

| Tema (tu input) | En la app hoy (pinceladas) | Ya en matriz | Nueva fila |
|-----------------|----------------------------|--------------|------------|
| Dinámica de tecleo (dwell, flight, backspace) | Input de chat sin telemetría de teclado; clasificador de turno en servidor (#56 arch.) | #135 (señal on-device genérica), #178, #79 | **#215** |
| Fenotipado digital (sueño, pasos, pantalla) | Sin HealthKit / Screen Time API integrados | **#106** (contexto opt-in al modelo), #91, #195 | **#216** |
| Motor correlación multimodal + insight semanal | Resumen semanal (#11) = actividad; #208/#213 = patrones pendientes sin cruce tecleo/dispositivo | #203, #208, #213, #154 | **#217** |
| Grafo sinapsis de detonantes (red interactiva) | Sin grafo de usuario; #127 es metadatos internos producto | #127, #212, #208, #79 | **#218** |
| Gemelo conductual / simulación anticipatoria | Sin modelo predictivo personal | #91, #203, #177 | **#219** |
| Clasificador mecanismos de defensa (capa LLM) | Pipeline clasifica riesgo/tono; no etiqueta defensas ni serie temporal | #210, #178, #66 | **#220** |
| Deriva semántica en embeddings | Sin índice vectorial personal ni series de centroides por concepto | #203, #113, #126 | **#221** |
| Rutas socráticas estratificadas (plan 3–4 turnos) | `socraticQuestions.js` por categoría; sin plan oculto multi-turno ni routing dedicado | #61, #177, #209, #201 | **#222** |
| Detección dobles vínculos / paradojas | PSST (#99) y disonancia (#211) parciales; sin desglose de dilema ganar-perder | #211, #99, #209 | **#223** |

**Notas de encaje (lote 3):** La UI de “revelación semanal” (tipografía grande, refugio) se cubre con **#213**; no duplicar fila. **#217** es el motor de datos; **#208** la narrativa de patrones. Ampliar **#106** solo si basta ingestión al prompt — el salto de fenotipado con pródomos y correlaciones justifica **#216**.

### Continuidad del chat (#4 + #47) — especificación v1

**Nombre de producto:** “Continuidad del chat” (no es el resumen semanal/mensual **#11**). **Backend + app (MVP):** modelo `SessionSummaryJob`, `User.lastSessionSummary`, worker `ENABLE_LAST_SESSION_SUMMARY`, `POST /api/chat/conversations/:id/session-summary/schedule`, `GET /api/summary/last-session`, `lastSessionSummary` en `GET /api/summary/focus`. **Cliente:** `schedule` best-effort al salir del chat / segundo plano; tarjeta **Perfil** e **Inicio** con enlace al `conversationId` del hilo. **Robustez (v1):** al reprogramar se cancelan jobs `pending`/`processing` del usuario; el worker solo persiste si el job sigue en `processing` (evita carreras con un reschedule); sin mensajes en la conversación no se encola; lectura API omite continuidad si la conversación ya no existe; fallo LLM con reintentos acotados (`LAST_SESSION_SUMMARY_MAX_ATTEMPTS`, default 2); saneo de texto; rate limit en `schedule`; cuerpo `delayMinutes` validado. **Fuera de alcance por ahora:** notificación educativa (push o similar); badge o cualquier indicador en la **lista de conversaciones** del chat. **Pendiente opcional:** métricas de uso. Complementa **#103** (cierre en prompt).

| Decisión | Detalle |
|----------|---------|
| Disparo | Al **salir del chat o de la app**, encolar generación tras **5–10 min** de inactividad en el `conversationId` relevante; job **idempotente** (un cierre lógico por ventana; criterio robusto ante background/kill). |
| Generación | **LLM** con **topes de extensión** según datos del hilo (emoción, **riesgo/crisis**): **mayor riesgo → texto más corto y neutro** (menos detalle sensible, menos rumiación). |
| Formato | Hasta **3 bullets** “qué me llevo” (**#47**) + **1–2 líneas** puente / próxima vez (**#4**); límites explícitos por nivel de riesgo. |
| Persistencia | **Un solo bloque de continuidad activo** por usuario: al generarse uno nuevo, **sustituye** al anterior (sin historial ni borrado manual en v1). Acoplar bien a la **conversación que disparó el job** para no desalinear hilo vs texto. |
| Umbral mínimo | Sesiones **muy cortas/triviales**: **no** llamar al LLM; placeholder breve u omitir según regla única de producto. |
| UI | **Perfil:** tarjeta dedicada (`LastSessionSummaryCard`). **Inicio:** mismo contenido **integrado en el bloque de foco** (`lastSessionSummary` en `/api/summary/focus`), sin segunda tarjeta ni petición extra. CTA abre el chat en la **conversación** de la continuidad. **No** se añade indicador en la lista de conversaciones (alcance cerrado). |
| Notificaciones | **No** push por cada generación. **No** notificación educativa dedicada en v1 actual; el descubrimiento es solo vía **Perfil** e **Inicio**. |
| Relación **#11** | **#11** es el resumen agregado en app (semanal/mensual, temas recurrentes); esta funcionalidad es **solo** puente al último hilo de chat, sin solapar naming ni expectativa de “resumen de actividad”. |


| # | Propuesta | Descripción | Hecha | Urg | Imp | Ret | Imp* | Costo | T | Q |
|---|-----------|-------------|-------|-----|-----|-----|------|-------|---|---|
| 1 | Ritual inicio sesión | Al abrir el chat: micro-check-in o una línea de continuidad (“cómo llegas hoy”, “lo último que quedó pendiente”) antes de la lista fría de conversaciones. | No | 3 | 4 | 4 | 4 | M | S | Q2 |
| 2 | Focos de acompañamiento | 1–3 temas por temporada (ansiedad, duelo, etc.) que alineen tono, sugerencias y métricas al proceso personal. | No | 3 | 5 | 5 | 5 | M | M | Q2 |
| 3 | Solo escucha / orientación | Preferencia explícita: validación sin consejos vs pasos concretos y tareas. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 5 | Mapa del proceso | Vista simple de etapas (exploración → experimentación → revisión) para dar estructura visible al acompañamiento. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 6 | Puente protocolos–chat | Que el chat nombre y retome protocolos activos en mensajes posteriores, sin silos de pantalla. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 7 | Bitácora terapéutica | Plantillas cortas (pensamiento–emoción–conducta) además del diario libre; opción exportar. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 8 | Panel qué hace la IA | Copy corto desde chat y ajustes: límites, expectativas, honestidad del producto. **App:** `AIPrivacyScreen` (Ajustes > Privacidad e IA), acceso desde menú del chat; copy en `INFO.AI_PRIVACY` (es/en). Pendiente ampliar a biblioteca completa de límites (#194). | Sí | 4 | 5 | 3 | 4 | B | S | Q1 |
| 9 | Derivación humana | Recursos por región: líneas, guías para buscar psicólogo; posiciona la app como puente, no sustituto. | No | 4 | 4 | 2 | 3 | M | M | Q3 |
| 10 | Transparencia crisis | Cuando hay crisis o alertas, explicación clara en lenguaje llano del “por qué” se sugiere una acción. | No | 4 | 5 | 4 | 5 | B | S | Q1 |
| 11 | Resumen en app | Más allá del email: bloque en app con temas recurrentes, micro-logros y una pregunta para la semana siguiente... | Sí | 3 | 5 | 5 | 5 | M | M | Q2 |
| 12 | Voz y ritmo unificados | Preferencias finas (longitud, formalidad, ratio pregunta/afirmación) coherentes en chat, onboarding y correos. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 13 | Feedback post-mensaje | Más que pulgar: “¿Te sentiste escuchado/a?”, “¿demasiado directo?” para mejorar modelo y UX. | No | 2 | 3 | 5 | 4 | B | M | Q2 |
| 15 | Sesiones programadas | Recordatorios tipo “tu espacio con Anto” en horarios fijos para ritualizar el encuentro. | No | 3 | 4 | 5 | 5 | B | S | Q2 |
| 17 | Línea de vida / contexto | Captura estructurada (hitos, pérdidas, fortalezas) que alimente el contexto del modelo con consentimiento explícito. | No | 2 | 4 | 4 | 4 | A | L | Q2 |
| 18 | Tarjetas contextuales chat | In-chat shortcuts a respiración, ancla, línea de ayuda cuando el tono o clasificación lo sugieran. | No | 3 | 4 | 3 | 4 | M | M | Q2 |
| 19 | Check-in crisis suave | Flujo corto de regulación sin activar todo el protocolo de crisis cuando solo hay malestar elevado. | No | 4 | 4 | 3 | 4 | M | M | Q1 |
| 20 | Compromisos del chat | Lista de “acuerdos” o micro-compromisos detectados o confirmados por el usuario tras la sesión. | No | 2 | 4 | 5 | 5 | M | M | Q2 |
| 22 | Exportar para profesional | PDF/Markdown con resumen + escalas (si aplica) para llevar a terapia presencial. | No | 3 | 4 | 2 | 3 | M | M | Q4 |
| 23 | Fatiga conversacional | Si la sesión es muy larga o repetitiva, sugerir pausa, técnica breve o “seguimos mañana”. | No | 2 | 3 | 4 | 4 | M | S | Q2 |
| 24 | Biblioteca micro-guías | Contenido curado corto (3–7 min) alineado a protocolos y focos. | No | 2 | 4 | 4 | 4 | A | L | Q2 |
| 25 | Narrativa escalas | PHQ/GAD presentados como parte del acompañamiento con texto humano, no solo gráficos. | No | 3 | 4 | 3 | 4 | B | S | Q2 |
| 26 | Pausa notificaciones | Modo “no interrumpir” con defaults terapéuticos (noches, tras crisis, etc.). | No | 3 | 3 | 4 | 4 | B | S | Q2 |
| 28 | Acceso rápido chat | Deep link, widget o acción desde notificación que abra directo el hilo activo o último foco. | No | 3 | 4 | 5 | 5 | M | S | Q2 |
| 29 | Cola offline / estado | Claridad de “enviando / reintentando” para no romper la confianza en momentos vulnerables. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 30 | Seguridad percibida UX | Badges o sección breve: cifrado en tránsito, quién ve los datos, borrado de cuenta. | No | 3 | 3 | 3 | 3 | B | S | Q4 |
| 32 | Rol acompañante (guía) | Guía de estilo fija (nombre, voseo/tuteo, metáforas permitidas) documentada para IA y frontend. | No | 3 | 4 | 3 | 4 | B | S | Q2 |
| 33 | Consentimientos granulares | Flujos granulares para compartir resumen, exportar, usar voz, analytics de calidad de respuesta. | No | 4 | 3 | 3 | 3 | A | L | Q3 |
| 34 | Dashboard del foco | Dashboard del foco | Sí | 3 | 5 | 5 | 5 | M | M | Q1 |
| 35 | A/B copy terapéutico | Experimentar titulares y primeros mensajes que maximicen sensación de escucha sin subir expectativas clínicas falsas. | No | 2 | 3 | 4 | 4 | M | M | Q2 |
| 36 | Modo inmersivo chat | Pantalla completa u ocultar navegación secundaria durante la sesión para favorecer presencia y escucha. | No | 3 | 4 | 3 | 4 | B | S | Q2 |
| 38 | Anclas de calma | El usuario guarda frases, imagen o audio propio como recurso de regulación accesible desde el chat. | No | 2 | 4 | 4 | 4 | B | M | Q2 |
| 39 | Mini alianza trimestral | 2–4 preguntas breves tipo “¿te sentís comprendido/a?” para ajustar producto y tono sin abrumar. | No | 2 | 4 | 5 | 5 | B | S | Q2 |
| 40 | Reformulación in-chat | Flujo paso a paso (pensamiento → evidencia → alternativa) sin salir del hilo. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 41 | Ventana silenciosa notif. | Bloques horarios donde la app no empuja notificaciones salvo crisis explícita (configurable). | No | 3 | 3 | 4 | 4 | B | S | Q2 |
| 42 | TTS asistente | Accesibilidad y contención auditiva; opcional por mensaje o por sesión. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 43 | Sync calendario | Reservar bloques “sesión Anto” en Google/Apple Calendar como ritual, no como obligación clínica. | No | 2 | 3 | 3 | 3 | M | M | Q4 |
| 44 | Carta yo futuro | El usuario escribe mensaje para sí mismo/a; la app lo muestra en fecha elegida. **Complemento retrospectivo:** #214 (cápsula del tiempo con texto pasado). | No | 1 | 3 | 4 | 4 | B | S | Q2 |
| 45 | Copy nocturno | Respuestas más breves y menos activantes en horario configurable (sueño, rumiación). | No | 2 | 3 | 3 | 3 | M | S | Q4 |
| 46 | Curación clínica prompts | Revisión periódica por psicólogos asesores de prompts, disclaimers y respuestas tipo (governance). | No | 3 | 5 | 3 | 4 | A | L | Q2 |
| 47 | Narrativa cierre sesión | **Arco continuidad del chat** (entregado; ver spec): bullets + bridge con topes por crisis; un activo por usuario. Riesgo en `Message.metadata`; UI perfil + inicio. **Referenciada por** #163. | Sí | 2 | 4 | 5 | 5 | M | M | Q2 |
| 48 | Roleplay breve | Escena corta con guión suave para practicar asertividad; límites y aviso de que no es realidad social. **Evolución:** #206 (rol configurable + debrief). | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 49 | Escala 0–10 foco | Un 0–10 de “cómo voy con [foco]” con histórico simple y narrativa en resúmenes. | No | 3 | 4 | 5 | 5 | B | S | Q2 |
| 50 | Atajo lock screen / widget | Acceso ultrarrápido a respiración o ancla sin abrir el chat completo (plataforma según viabilidad). | No | 4 | 4 | 3 | 4 | M | M | Q1 |
| 51 | Subtareas IA (tareas grandes) | La IA propone un desglose en subtareas pequeñas para reducir carga y evitación; persistencia vía modelo/API de subtareas existente; disparadores desde pantalla de tarea o cuando en el chat surge una tarea abrumadora. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 52 | Hábitos desde chat (confirmación) | Si el flujo conversacional encaja (p. ej. autocuidado repetible), Anto ofrece: hábito con recordatorios y seguimiento de avances; **tras confirmación explícita** (y edición opcional del título/frecuencia) se crea el hábito alineado a lo … | Sí | 3 | 5 | 5 | 5 | M | M | Q2 |
| 53 | Tareas desde chat (confirmación) | Propuesta in-chat de tareas derivadas del tema (título, fecha opcional, prioridad); confirmación antes de `POST` de tarea; vínculo opcional al hilo o mensaje para contexto futuro. | Sí | 3 | 5 | 5 | 5 | M | M | Q2 |
| 54 | Pomodoro desde chat/tarea/subtarea | Cerrar el circuito “hablamos → hacemos”: abrir Pomodoro con nombre de sesión pre-rellenado desde la última sugerencia, tarea o subtarea vinculada al chat (sin obligar flujo clínico). | No | 2 | 4 | 4 | 4 | M | S | Q2 |
| 55 | Paráfrasis + validación antes consejo | Regla de pipeline/prompt: reflejar con palabras del usuario el sentimiento o necesidad **antes** de orientar o intervenir (micro-habilidad terapéutica). | No | 3 | 5 | 5 | 5 | M | M | Q2 |
| 58 | Indicador calibración (opt-in) | Ajuste usuario: pie breve tipo “puede que no haya captado del todo…” o nivel de confianza en lectura; refuerza transparencia sin romper inmersión (opt-in). | No | 2 | 3 | 3 | 3 | M | S | Q4 |
| 59 | Streaming / TTFT | Optimizar percepción de velocidad: streaming estable, colas, modelo o ruta más rápida para primera frase; métricas p50/p95 en producción... | Sí* | 4 | 4 | 4 | 4 | M | S | Q1 |
| 60 | Memoria sesión + compactación | Resumen rodante fiel del hilo actual para contexto largo sin deriva; mejor coherencia y coste/latencia en conversaciones extensas. | No | 3 | 5 | 5 | 5 | M | L | Q2 |
| 61 | Eco comprobatorio | Bloque corto que reformula la lectura del mensaje y pide sí/no antes de profundizar; mezcla de comprensión y alianza. | No | 3 | 5 | 4 | 5 | B | M | Q2 |
| 63 | Grounding hechos usuario | Política: no inventar biografía, fechas ni promesas; solo inferir desde mensajes explícitos; reduce “falso terapeuta que cree saber”. | No | 4 | 5 | 5 | 5 | M | M | Q1 |
| 64 | Ancla hilo de sesión | Cada N turnos o al detectar salto de tema, línea que ancla lo acordado o lo vivido en **esta** sesión (continuidad tipo consultorio). | No | 3 | 4 | 5 | 5 | M | M | Q2 |
| 65 | Fine-tuning / DPO interno | Entrenar o alinear con conversaciones revisadas por criterio clínico para subir calidad terapéutica estable (no solo prompt). | No | 2 | 5 | 4 | 5 | A | L | Q2 |
| 66 | LLM judge en sombra | Segunda pasada opcional o muestreo: detectar invalidación, jerga inútil o desvío del foco antes de enviar (con latencia acotada o async). | No | 2 | 4 | 3 | 4 | A | L | Q2 |
| 67 | SLO latencia + alertas | Dashboards p95 por ruta de chat, regresiones tras deploy; sensación de “app seria” y menos abandono en crisis. | Sí* | 3 | 4 | 4 | 4 | B | S | Q2 |
| 69 | Respuesta mínima si desahogo | Cuando el usuario solo ventila, priorizar presencia breve + validación en lugar de paquete de consejos (no sobre-intervenir). | No | 3 | 4 | 4 | 4 | M | S | Q2 |
| 70 | Desambiguación corto/irónico | Detección de sarcasmo/ambigüedad o mensaje muy corto → una pregunta de intención o tono antes de interpretar en serio. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 71 | Lectura bifurcada A/B | Ofrecer “¿te referís a A o a B?” con dos micro-respuestas posibles en lugar de una interpretación forzada. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 73 | Mensajes enriquecidos (MD + bloques) | Render de Markdown seguro, acordeones, listas interactivas y **chips táctiles** en burbujas del asistente; contrato API mensaje = bloques tipados (JSON) además de texto. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 74 | Voz + STT streaming | STT en streaming, preview editable antes de enviar; reduce fricción en momentos de alta carga emocional y se siente “de verdad” en móvil. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 75 | Responder citando mensaje | Long-press o selección de un mensaje para **responder citando**; el backend recibe `replyToMessageId` + extracto para contexto preciso (menos alucinación de hilo). | No | 3 | 4 | 5 | 5 | B | M | Q2 |
| 76 | Estados typing por fase pipeline | Eventos SSE/WebSocket por fase real (*clasificando / redactando / revisando*), no un único typing genérico; transparencia técnica que genera confianza. | No | 3 | 4 | 3 | 4 | B | S | Q2 |
| 77 | Hilos laterales en conversación | Ramificación visual tipo “sidebar” o tabs sin crear conversación nueva; poder de modelo de datos + UX para temas profundos sin mezclar todo. | No | 2 | 4 | 4 | 4 | A | L | Q2 |
| 78 | Tarjetas psychoed nativas | Componentes RN (pasos, iconografía, CTA “probar 1 min”) disparados desde plantillas del modelo; diferenciación frente a chat plano de competencia. **Parcial:** tarjeta **expandida** (principal) + **compactas** (secundarias), snippet LLM solo para la predominante, micro-pasos solo en expandida. **Pendiente:** pasos interactivos in-chat, disparo vía JSON del modelo. | Parcial | 3 | 5 | 4 | 5 | M | L | Q2 |
| 79 | Curva intensidad en sesión | Serie temporal ligera (SVG/Reanimated) alimentada por scores del clasificador por turno; opcional y con toggle de privacidad/pantalla. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 80 | Chat flotante / overlay | Mini ventana o barra persistente mientras navegás técnicas, tareas o hábitos; sensación de acompañante presente (desafío: performance y accesibilidad). | No | 2 | 5 | 4 | 5 | A | L | Q2 |
| 81 | Cola cifrada + optimista | Borradores y mensajes en `AsyncStorage`/secure store con cifrado, reconciliación con servidor y resolución de conflictos; robustez “app seria” en red inestable. | No | 4 | 4 | 4 | 4 | M | L | Q1 |
| 82 | Slash commands | `/respirar`, `/resumen`, `/silencio` que ejecutan acciones o insertan plantillas sin salir del flujo de chat; extensible por equipo (plugin interno). | No | 2 | 4 | 5 | 5 | B | M | Q2 |
| 84 | Tema dinámico por tono sesión | Paleta o gradiente sutil derivado del tono emocional agregado (no intrusivo); **siempre** con modo alto contraste / off por accesibilidad y preferencia usuario. | No | 2 | 4 | 3 | 4 | M | S | Q2 |
| 85 | Psicoeducación modular evidencia | Módulos breves (ansiedad, depresión, ira, sueño, trauma informado) con fuentes y lenguaje no diagnóstico; activables desde chat o biblioteca. **Parcial (jun 2026):** 7 temas, disclaimer/fuentes, biblioteca en Técnicas, chat vía catálogo #127. **Pendiente:** #78 tarjetas nativas, #111 sello clínico, más temas. | Parcial | 2 | 4 | 4 | 4 | M | M | Q2 |
| 86 | Autorregistro ABC | Flujo guiado in-app o desde el chat para patrones conductuales; export opcional para terapeuta humano. **Parcial (jun 2026):** wizard A→B→C, API `/api/abc-records`, export texto, pantalla `AbcRecord`, catálogo #127. **Pendiente:** prefill desde chat, agregación macro (#212). | Parcial | 3 | 5 | 4 | 5 | M | M | Q2 |
| 87 | Jerarquía exposición + SUDS | Lista colaborativa de pasos + intensidad subjetiva; seguimiento de intentos sin sustituir ERP clínica presencial. | No | 2 | 4 | 4 | 4 | M | L | Q2 |
| 88 | Activación conductual | Planificación de actividades placenteras/obligatorias vinculada a estado de ánimo y registro breve post-actividad. | No | 3 | 4 | 5 | 5 | M | M | Q2 |
| 89 | Pensamientos automáticos CBT | Detectar y nombrar cogniciones con vocabulario CBT estándar + enlace a distorsiones ya existentes en el producto. **Evolución:** #201 (flujo estructurado paso a paso en chat). | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 90 | Hoja de ruta duelo | Fases normalizadas (shock, año, sentido) con copy revisado clínicamente; sin presionar “cerrar” el duelo. | No | 2 | 4 | 3 | 4 | M | L | Q2 |
| 91 | Prevención recaída | Señaladores tempranos, plan por escrito con el usuario y contactos; alineado a modelos de Marlatt/Marlatt-Kadden en versión app. | No | 3 | 5 | 5 | 5 | M | M | Q2 |
| 92 | DBT-lite / regulación | Técnicas cortas (TIPP simplificado, “STOP”, hielo, respiración cuadrada) sugeridas según estado detectado, con timing y opt-in. | No | 2 | 4 | 4 | 4 | B | M | Q2 |
| 93 | Protocolo ideación (seguridad) | Flujo fijo alineado a guías de seguridad: validación, preguntas directas con calidez, recursos y derivación; **revisión legal y clínica obligatoria**. | No | 4 | 5 | 5 | 5 | A | M | Q1 |
| 94 | Valores ACT-lite | Ejercicios breves (bull’s eye, valores en dominios) para decisiones alineadas; integración con focos de acompañamiento. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 95 | Higiene sueño + seguimiento | CBT-I simplificado o pautas estructuradas + diario sueño/ánimo; complementa protocolos ya existentes en la app. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 96 | Mindfulness MBSR-lite | Secuencia de sesiones con práctica corta, cierre y registro de distracción/benevolencia; no sustituye programa clínico completo. | No | 2 | 4 | 3 | 4 | M | L | Q2 |
| 97 | CNV / asertividad | Plantillas OFNR u observación–sentimiento–necesidad–petición con práctica in-chat. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 98 | WAI / feedback post-sesión | 3–5 ítems al cerrar (“me sentí comprendido/a”) para producto y tono; opcional y anónimo agregado para métricas internas. | No | 2 | 4 | 5 | 5 | B | M | Q2 |
| 99 | Resolución problemas PSST | Definir problema → opciones → pros/contras → plan mínimo; guía conversacional + plantilla guardable. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 100 | Hoja sesión imprimible | PDF o pantalla imprimible: foco del día, acuerdos, próximo paso; **sin** volcar el chat crudo; puente entre sesión y vida. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 101 | Acompañante humano limitado | Invitación a familiar o persona de confianza: ve solo resúmenes o checklist acordados, **no** el chat íntimo; consentimientos y revocación claros. | No | 3 | 4 | 3 | 4 | A | L | Q2 |
| 102 | Micro-intervenciones 60s | Una por emoción o trigger, lanzable desde notificación, widget o slash; continuidad terapéutica fuera del hilo largo. | No | 3 | 4 | 5 | 5 | B | M | Q2 |
| 104 | Perfil sensibilidad temas | Lista editable (violencia, cuerpo, familia, sustancias, etc.) para evitar reactivar sin necesidad y ajustar lenguaje del modelo. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 105 | Alta confianza vs exploración | Menos sugerencias automáticas (hábitos, tareas, contenido fuerte) hasta que el usuario eleve confianza; reduce sensación de app intrusiva. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 106 | Salud digital contexto opt-in | Lectura opt-in de sueño/pasos (HealthKit / Health Connect / Google Fit) como señales de contexto para el modelo, con granularidad de permisos. | No | 2 | 4 | 4 | 4 | M | L | Q2 |
| 107 | Simulador + feedback criterios | Roleplay + puntuación o feedback por criterios (claridad, calidez, límites); orientado a práctica, no a juicio social. | No | 2 | 5 | 4 | 5 | M | L | Q2 |
| 108 | Pausa terapéutica global | Un control silencia IA sugerente, micro-acciones y notificaciones **salvo** crisis explícita; para saturación o “burnout de app”. | No | 3 | 4 | 4 | 4 | B | S | Q2 |
| 109 | Versionado prompts rollback | Paquetes de system prompts versionados; revertir release que degrade tono o seguridad; operación madura y confianza de producto. | No | 3 | 4 | 4 | 4 | B | S | Q2 |
| 111 | Sello revisión clínica por versión | Governance visible: qué versión de qué módulo (#85–#99) pasó revisión; alinea marketing y compliance interno. **Parcial (jun 2026):** `clinicalReview` en API + **sello UI** (módulo, biblioteca, tarjeta chat expandida); status `editorial_review` / futuro `clinical_review`. | Parcial | 2 | 4 | 3 | 4 | M | M | Q2 |
| 112 | Pipeline unificado SSE + Socket | Una sola orquestación `mensaje → contexto → OpenAI → persistencia` para REST/stream y sockets; elimina divergencias de comportamiento, métricas y bugs. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 113 | RAG corpus curado | Vector store (p. ej. Atlas Vector, pgvector, Qdrant) con chunks de protocolos, psychoed revisada y políticas de crisis; recuperación por `conversationId` + tema, no web abierta. **Complemento usuario:** #203 (patrones personales entre sesiones). | No | 3 | 5 | 4 | 5 | A | L | Q2 |
| 115 | Structured outputs JSON | Respuestas con esquema para `assistantMessage`, `suggestedActions`, `safetyFlags`; menos parsing frágil en frontend y mejor control. | No | 3 | 5 | 5 | 5 | M | M | Q2 |
| 116 | Tool calling validado | Herramientas declaradas (crear tarea, listar hábitos, registrar escala) ejecutadas solo tras validación Joi/permisos; el modelo propone, el servidor decide. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 117 | OpenTelemetry pipeline | Trazas con `conversationId`, etapas (clasificar, RAG, generar), tokens, errores; correlación con Sentry y dashboards propios. | No | 3 | 4 | 3 | 4 | B | M | Q2 |
| 118 | Colas async jobs IA | Compactación de historial (#60), resúmenes, muestras de judge (#66), embeddings opt-in; no bloquear el request del chat. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 120 | Anti-inyección RAG | Snippets allowlist, sanitización, separación clara “documento recuperado ≠ instrucción”; tests adversarios en CI complementan **#109**. | No | 4 | 5 | 4 | 5 | M | M | Q1 |
| 121 | Budget tokens por rol | Límites explícitos system / RAG / history / user; telemetría cuando se trunca; evita deriva y costos silenciosos. | No | 3 | 4 | 3 | 4 | M | S | Q2 |
| 123 | Resiliencia OpenAI unificada | Pooling de conexiones, jitter de retries, timeouts por etapa alineados a **#67**; un solo módulo usado por stream y no-stream. | No | 3 | 4 | 3 | 4 | B | S | Q2 |
| 124 | Feature flags experimentos | LaunchDarkly, Unleash o flags en DB; combina con **#109** y **#35** para rollout gradual. | No | 3 | 4 | 4 | 4 | B | S | Q2 |
| 125 | Fallback multi-proveedor | Segundo proveedor LLM si el primario falla o rate-limit; contrato de respuesta normalizado; coste operativo **A**. | No | 3 | 4 | 3 | 4 | A | L | Q2 |
| 126 | Embeddings on-write opt-in | Indexar solo mensajes que el usuario marca “recordar para contexto futuro”; base para RAG híbrido personal con borrado duro. | No | 2 | 4 | 3 | 4 | A | L | Q2 |
| 127 | Grafo ligero tema–intervención | Metadatos estructurados (no NLP pesado) para sugerir módulos #85–#99 y medir qué rutas funcionan. **MVP cerrado:** tracking + catálogo + sugerencias desde reglas + grafo agregado por sesión + panel dev. **Pendiente:** cerrar bucle con datos del grafo, expansión catálogo #85–#99, temas emergentes. | Parcial | 2 | 4 | 3 | 4 | M | L | Q2 |
| 128 | Streaming Socket paridad SSE | Mismo streaming por chunks que SSE en HTTP; UX y telemetría coherentes con **#76**. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 129 | Red team prompts automático | Suite mensual de ataques (jailbreak, inyección) sobre builds candidatas; informe bloqueante antes de producción. | No | 3 | 5 | 3 | 4 | M | M | Q2 |
| 130 | Canary prompt/modelo % | Exponer 5–10 % a nueva versión; comparar métricas de calidad y latencia antes de rollout total. | No | 3 | 4 | 4 | 4 | B | M | Q2 |
| 131 | Cost governance + degradación | Caps diarios por usuario/tier, degradación a modelo más barato o respuesta más corta con aviso honesto al usuario. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 132 | B2B + panel agregado | Contratos por organización, métricas **anonimizadas** de uso/engagement, límites por asiento; sin ver contenido clínico individual salvo compliance acordado. | No | 2 | 4 | 3 | 4 | M | L | Q2 |
| 133 | i18n + WCAG chat | RTL donde aplique, plurales, formatos de fecha/hora locales, foco visible y anuncios para lector de pantalla en burbujas dinámicas. | No | 3 | 4 | 3 | 4 | M | L | Q2 |
| 134 | Modo dislexia visual | Tipografía OpenDyslexic o similar, interlineado, ancho de columna, reducción de animaciones; perfil guardado en usuario. | No | 2 | 4 | 3 | 4 | B | M | Q2 |
| 135 | Clasificador on-device opt-in | Modelo Core ML / TFLite mínimo solo para señal local antes de enviar (privacidad); **opt-in** y transparencia total; no sustituye evaluación en servidor. | No | 3 | 5 | 4 | 5 | A | L | Q2 |
| 136 | PWA / escritorio sesión larga | Teclado completo, pantalla grande, copiar/pegar clínico; complementa React Native sin reemplazarlo. | No | 2 | 4 | 3 | 4 | M | L | Q2 |
| 138 | Staging datos sintéticos | Fixtures de conversaciones y perfiles fake para reproducir bugs de IA y regresiones sin PII real. | No | 3 | 4 | 3 | 4 | M | M | Q2 |
| 140 | Data residency por región | Clústeres EU vs LATAM u otra división legal; requisito típico enterprise y salud. | No | 3 | 4 | 3 | 4 | A | L | Q2 |
| 141 | Playbook incidentes seguridad | Roles, comunicación a usuarios, retención forense mínima, coordinación con **#10** y **#93**. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 142 | SSO SAML/OIDC | Login corporativo para **#132**; reduce fricción B2B y centraliza offboarding. | No | 2 | 4 | 3 | 4 | A | L | Q2 |
| 143 | Auditoría accesos inmutable | Quién vio qué recurso (export, contacto emergencia); trazabilidad para compliance y confianza (**Q1** operativo/legal). | No | 4 | 4 | 4 | 4 | M | L | Q1 |
| 144 | Rotación secretos | API keys OpenAI, SendGrid, etc. con rotación programada y alertas de caducidad. | No | 3 | 4 | 3 | 4 | B | M | Q2 |
| 145 | Game day backup restore | Restaurar Mongo y colas desde backup en ejercicio documentado; RTO/RPO explícitos. | No | 3 | 3 | 3 | 3 | M | M | Q4 |
| 148 | OpenAPI + SDKs | Contrato HTTP versionado para partners y frontend alternativo; reduce drift con **#115**. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 149 | E2E a11y axe | Gate en CI para regresiones de foco, roles ARIA y contraste en pantallas críticas. | No | 3 | 4 | 3 | 4 | B | M | Q2 |
| 151 | Inglés EN producto fase 1 | Cadenas de **UI**, emails transaccionales, errores y copy legal/privacidad en **inglés**; selector de idioma en perfil; pruebas con hablantes nativos o revisión profesional. **En curso:** `LanguageContext`, `translations/en.js`, selector en Ajustes, FAQ EN, privacidad IA bilingüe. **Pendiente:** correos, notificaciones push, revisión nativa/legal completa. | Parcial | 3 | 5 | 5 | 5 | M | L | Q2 |
| 152 | Portugués PT producto fase 1 | Misma cobertura que **#151** en **portugués**; prioridad **pt-BR** (Brasil / LATAM) con decisión explícita sobre **pt-PT** (Portugal) como variante o mismo pack. | No | 3 | 5 | 5 | 5 | M | L | Q2 |
| 153 | Chat IA multilingüe ES/EN/PT | Preferencia de idioma en perfil + **detección opcional** del idioma del mensaje; **system prompts y recursos de crisis** versionados por locale; alinea con **#133** (i18n profundo). **Nota:** UI puede estar en EN (#151) pero el modelo sigue con system prompt en español neutro (`openaiPromptBuilder`). | No | 3 | 5 | 5 | 5 | M | L | Q2 |
| 154 | Informe ampliado entre consultas | Evolución de **#11**: síntesis de temas en sesiones, autoinforme y señales observables (hábitos, tareas, escalas). Capa analítica de patrones: **#208** (detonantes, no transcripto del chat). | No | 3 | 5 | 5 | 5 | A | L | Q2 |
| 155 | Compartir con psicólogo tratante | Tras **#154**, flujo explícito para que el usuario **elija** compartir un documento o enlace **cifrado**, con **caducidad**, **revocación** y registro de accesos (**#143**); alinea **#22** (artefacto para profesional) y **#101** (límites… | No | 4 | 5 | 4 | 5 | A | M | Q1 |
| 156 | Racha presencia sana | Indicador de **constancia** sin culpa: límites de frecuencia, **pausa cuenta**, y copy que refuerza proceso frente a racha infinita; complementa **#15** y **#26** sin gamificación infantil. | No | 3 | 4 | 5 | 5 | B | M | Q2 |
| 157 | Win-back 7–30 días | Reactivación con **un toque** al chat y mensaje terapéutico breve; respeta **#41** y preferencias de contacto; métricas D7/D30 (**#200**). | No | 3 | 4 | 5 | 5 | M | M | Q2 |
| 159 | Check-in 60s mañana opt-in | Micro-sesión fija opcional que ancla **hábito de apertura** sin obligar sesión larga; integra con **#52**/**#54** si aplica. | No | 2 | 3 | 5 | 4 | B | M | Q2 |
| 160 | Digest email si push off | Resumen diario/semanal **solo** si el usuario apagó push o modo concentración; evita perderse hitos (**#154** light). | No | 2 | 3 | 4 | 4 | M | M | Q2 |
| 161 | Objetivo semanal en home | Texto corto **escrito por el usuario** (o confirmado) visible en dashboard; refuerza **#34** y **#20** con intención explícita. | No | 3 | 4 | 4 | 4 | B | S | Q2 |
| 162 | Ritual celebración proceso | Tras **N** intercambios reflexivos (no “puntos”), copy y animación sutil que valida esfuerzo; alternativa sana a gamificación superficial (ex-#27). | No | 2 | 3 | 4 | 4 | B | S | Q2 |
| 163 | Agendar sesión desde cierre | CTA en **#47** hacia **#15** con franja sugerida; reduce fricción de reprogramación mental. | No | 3 | 4 | 5 | 5 | B | S | Q2 |
| 164 | CTA única post-sesión | Tras cierre, **una** acción sugerida con confirmación (**#52–#53**); evita fatiga de elección. | No | 3 | 4 | 4 | 4 | B | S | Q2 |
| 165 | Densidad chat compacta/cómoda | Toggle persistente de **interlineado, tamaño burbuja y avatares**; mejora lectura en sesiones largas (preferencia de accesibilidad ligera). | No | 2 | 3 | 3 | 3 | B | S | Q4 |
| 166 | TS strict monorepo | Subir gradualmente **strict**, paths y `noUncheckedIndexedAccess` donde aplique; menos bugs en rutas IA y modelos. | No | 3 | 4 | 3 | 4 | M | L | Q2 |
| 167 | Lint/format CI unificado | Una herramienta o pareja Prettier+ESLint/Biome con **fail on drift** en PR; coherencia FE/BE. | No | 3 | 4 | 4 | 4 | B | S | Q2 |
| 168 | Tests unitarios IA streaming | Mocks de OpenAI/SSE, timeouts, cancelación **AbortController**; regresión en **#59**, **#112**, **#128**. | No | 3 | 4 | 3 | 4 | M | M | Q2 |
| 169 | Contract testing FE-API | Pact u OpenAPI + tests contractuales para no romper **#115** ni payloads de chat. | No | 3 | 4 | 3 | 4 | M | M | Q2 |
| 170 | Zod schemas salida IA | Validación runtime de **structured outputs** y tools; acopla **#115–#116** y reduce respuestas malformadas. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 171 | SAST CodeQL main | Análisis estático en CI para OWASP top issues en rutas autenticadas y upload. | No | 4 | 4 | 3 | 4 | B | M | Q1 |
| 172 | Gate npm audit CI | Bloqueo o aviso fuerte en CVE críticas en dependencias; trade-off con **#144** (rotación). | No | 4 | 3 | 3 | 3 | B | S | Q3 |
| 174 | Guía capas dominio/rutas | ADR + plantilla de carpetas para no mezclar lógica clínica de negocio con HTTP; facilita **#46**, **#109**. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 175 | RED métricas endpoint chat | Request rate, errores, duración por ruta (`/chat`, streaming); complementa **#117**, **#67**. | No | 3 | 4 | 3 | 4 | B | M | Q2 |
| 176 | RAG citas chunk_id | Regla dura: afirmaciones factuales externas **solo** si hay ancla recuperable; refuerza **#120**, **#63**. | No | 4 | 5 | 4 | 5 | M | M | Q1 |
| 177 | Plan oculto + respuesta | Turno en dos pasos internos (plan no mostrado + respuesta al usuario) para **coherencia** y menos divagación; coste latencia a monitorizar. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 178 | Tono carga emocional | Clasificador **ligero** (no clínico) que modula longitud y calidez; acorde a **#55**, **#69**. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 179 | Longitud respuesta adaptativa | Presupuesto de tokens según complejidad de la petición y modo breve/largo (**#177** opcional). | No | 3 | 4 | 4 | 4 | B | S | Q2 |
| 180 | Keep-alive pool IA | Reutilización de conexiones TLS hacia API de inferencia donde el SDK lo permita; mejora p95 de primer token. | No | 3 | 4 | 3 | 4 | B | S | Q2 |
| 181 | Coalescing peticiones cliente | Si el usuario dispara dos envíos rápidos, unificar o cola local; menos estados duplicados con **#81**. | No | 3 | 4 | 4 | 4 | M | S | Q2 |
| 182 | Backoff jitter unificado | Misma política en cliente y worker ante 429/5xx; alinea **#123** y percepción de fiabilidad. | No | 4 | 4 | 4 | 4 | B | S | Q1 |
| 183 | Scroll anchor streaming | Mientras llega texto, mantener **posición de lectura** estable; UX crítica en móvil. | No | 3 | 3 | 4 | 4 | B | S | Q2 |
| 184 | Prune contexto quote-reply | Al citar **#75**, recortar hilo adjunto con heurística de relevancia para no saturar ventana. | No | 3 | 5 | 4 | 5 | M | M | Q2 |
| 185 | Self-consistency turnos críticos | Dos muestras baratas o voto ligero solo en **riesgo** o tool sensible; coste controlado vs **#66**. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 186 | Virtualización lista chat | Lista larga (miles de burbujas) con **windowing**; rendimiento percibido y batería. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 187 | Error boundary burbuja | Fallo de render o de fetch aislado por mensaje con **reintentar** sin perder hilo. | No | 3 | 4 | 4 | 4 | B | M | Q2 |
| 189 | OARS/MI prompts clínico | Incorporar **motivational interviewing** (preguntas abiertas, reflejo, resumen) en system; revisión con **#46**, **#111**. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 190 | Escalado exposición sin saltos | Flujo guiado que impide saltar pasos en **#87** sin validación explícita del usuario. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 191 | Mecanismo de cambio one-liner | Tras micro-guías (**#78**, **#85**), una frase tipo “por qué esto ayuda” basada en evidencia genérica. **Parcial:** `mechanismLine` por tema en catálogo #85 (tarjeta chat + módulo). | Parcial | 2 | 4 | 4 | 4 | M | M | Q2 |
| 192 | Formulación cultural opt-in | Campo opt-in (valores, idioma familiar, espiritualidad) que informa el tono sin diagnosticar; ética con **#104**. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 193 | Repair alianza WAI baja | Si **#98** detecta caída, guion breve de “chequeo de ajuste” sin culpar al usuario. | No | 3 | 4 | 5 | 5 | M | M | Q2 |
| 194 | Biblioteca límites competencia IA | Pantallas y tooltips: **qué no hace** la app, cuándo **#9**, crisis **#10**; reduce expectativas mágicas. **Parcial:** base en #8 (`AIPrivacyScreen` + modal chat); falta biblioteca ampliada, tooltips contextuales y enlaces a derivación (#9). | Parcial | 4 | 4 | 4 | 4 | M | M | Q1 |
| 195 | Diario sueño-vigilia UX | UX de registro simple acoplado a **#95** y resúmenes semanales (**#11**, **#154**). | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 197 | Deep link push a hilo | Notificación abre **conversación y posición** exacta; retención de retorno. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 198 | VoiceOver TalkBack chat | Orden de foco, anuncios de “escribiendo”, estados de error; va más allá de **#149**. | No | 3 | 5 | 3 | 4 | M | L | Q2 |
| 199 | Checklist release prompt/modelo | Gate manual o semi-automático: versión de **#109**, modelo, **#124** antes de deploy a producción. | No | 4 | 4 | 4 | 4 | B | M | Q1 |
| 200 | Panel cohortes retención | Producto ve **D1/D7/D30**, mensajes por sesión, retorno tras email; alimenta **#157** sin PII en agregados. | No | 2 | 4 | 3 | 4 | M | M | Q2 |
| 201 | Marco TCC guiado en chat | Restringir divagación del LLM con **marco clínico TCC**: detectar distorsiones en texto del usuario (catastrofización, todo/nada, etc.), guiar reestructuración **paso a paso** in-chat (no solo consejo genérico). Disclaimers; revisión clínica (#46, #111). Complementa **#40**, **#89**, **#86**. | No | 3 | 5 | 5 | 5 | M | L | Q2 |
| 202 | Deberes terapéuticos entre sesiones | La IA asigna **micro-ejercicios** acordados (o confirma los propuestos) y en la **siguiente sesión** pregunta por ellos antes de abrir tema nuevo. Persistencia ligada a **#20**; puede materializarse como tarea/hábito (**#52–#53**). | No | 3 | 4 | 5 | 5 | M | M | Q2 |
| 203 | Perfil dinámico RAG (patrones) | **Memoria evolutiva** entre sesiones: extraer entidades, emociones y patrones (con consentimiento), índice vectorial por usuario, recuperación en prompt para conectar puntos (“la semana pasada mencionaste…”). Habilita **#210–#212**, **#214**. Distinto de **#113** (corpus curado) y **#60** (solo hilo actual). Acopla **#17**, **#126**, **#154**. | No | 3 | 5 | 5 | 5 | A | L | Q2 |
| 204 | Refugio UX (carga cognitiva) | Experiencia **minimalista** para estrés/carga mental: espaciado generoso, jerarquía tipográfica clara, menos ruido visual en chat, inicio y técnicas; coherente con tema existente. Base para pantallas de insight (**#213**). Complementa **#36**, **#165**, **#134**. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 205 | Guardrails crisis (hard-stop) | Routing robusto de **riesgo** (ideación, autolesión, violencia): al dispararse, **cortar generación LLM**, mostrar recursos humanos (**#9**), copy de límites (**#194**), transparencia (**#10**). Endurecer **#93** y pipeline actual (`crisis.js`, clasificador). | No | 4 | 5 | 5 | 5 | M | M | Q1 |
| 206 | Simulador afrontamiento (roleplay) | Usuario configura **rol de la otra persona** (entrevista, límite familiar, jefe); práctica libre de juicios; al cerrar, la IA vuelve a coach y da **debrief** (asertividad, claridad, regulación). Evolución de **#48**, **#107**, **#97**. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 207 | Lienzos interactivos in-chat | Si el usuario necesita estructurar (decisión, pros/contras), **pausar** el chat y desplegar **componentes nativos** (matriz, diagrama PSST) rellenables por toques; resultado vuelve al hilo. Requiere **#73**, **#115**; complementa **#78**, **#99**. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 208 | Reporte descubrimiento (espejo clínico) | Cada N sesiones o semanal: **análisis de patrones** (detonantes, resiliencia, temas recurrentes) + visualización ligera; **no** resumen transcripto del chat. Capas: **#210–#212**, **#213** (presentación). Evolución de **#154**, **#79**. | No | 3 | 5 | 5 | 5 | M | L | Q2 |
| 209 | Modos alianza (mayéutico–directivo) | Ajuste explícito del **modo de interacción**: mayéutico (solo preguntas socráticas) ↔ directivo (pasos tácticos) ↔ validación intensa; por usuario y/o señal del clasificador. Unifica **#3**, **#12**, `responseStyle` en ajustes e intención de sesión (#72). | No | 3 | 5 | 5 | 5 | M | M | Q2 |
| 210 | Rastreador esquemas / creencias nucleares | Tras N interacciones, etiquetar narrativa recurrente bajo **esquemas/creencias nucleares** (p. ej. perfeccionismo, “debo ser fuerte”) y mostrar mapa con pregunta de sentido (“¿te resuena?”), no diagnóstico. Requiere **#203** + gobernanza clínica (#46). Complementa **#201**, **#208**. | No | 3 | 5 | 5 | 5 | A | L | Q2 |
| 211 | Espejo puntos ciegos (disonancia) | Si el relato actual **contradice** valores o conductas reportadas antes, reflejo **neutral y delicado** con invitación a explorar el cambio de percepción. Depende de memoria entre sesiones (**#203**); no confrontación. Complementa **#61**, **#208**. | No | 3 | 5 | 5 | 5 | M | L | Q2 |
| 212 | Ciclo ABC macro visual | Agrupar eventos similares en **Detonante → Pensamiento → Conducta → Consecuencia**; lienzo interactivo para ver dónde intervenir. Distinto de ABC puntual (**#86**). Acopla **#207**, **#208**. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 213 | UX revelación de insights | Diseño de pantallas de patrón/insight: minimalismo, insight principal en tipografía grande, detalle opcional, gráficos sobrios (neutros, sombras suaves). Para que la revelación se sienta **segura y clínica**, no dashboard ruidoso. Complementa **#204**, **#208–#212**. | No | 3 | 4 | 4 | 4 | M | M | Q2 |
| 214 | Cápsula del tiempo reflexiva | La IA selecciona un **fragmento propio** de hace semanas/meses (alta vulnerabilidad) y guía reflexión: “¿qué herramientas tienes hoy que no tenías entonces?”. Consolida crecimiento. Distinto de carta al futuro (**#44**). Requiere **#203** + consentimiento. | No | 2 | 4 | 5 | 5 | M | M | Q2 |
| 215 | Telemetría de tecleo (estado cognitivo) | En el input del chat (solo en app, opt-in explícito): **dwell time**, **flight time** y tasa de **backspace** por borrador/mensaje; agregados por sesión sin enviar contenido extra al servidor salvo features resumidas. Señales: inhibición/autocensura (reescritura suave), inundación (flight errático + errores). Alimenta **#178**, **#217**; no sustituye lectura clínica del texto. Gobernanza privacidad + copy “no leemos más palabras”. | No | 2 | 4 | 4 | 4 | M | M | Q2 |
| 216 | Fenotipado digital (rutina invisible) | Opt-in **HealthKit / Health Connect** + categorías de **tiempo de pantalla** (APIs nativas): ventana de inactividad (sueño estimado), pasos, ratio social/entretenimiento vs media personal. Patrones: aislamiento (chat “abrumado” + pasos bajos + pantalla ↑), **pródomos** (retraso sueño 3 días → alerta educativa antes de rumiación en chat). Complementa **#106** (inyección al prompt) con capa analítica y **#217**. | No | 3 | 5 | 5 | 5 | M | L | Q2 |
| 217 | Motor correlación multimodal | Cruza señales **#215**, **#216**, extracciones de **#203** y marco clínico (esquemas **#210**, ABC **#212**) en jobs async; produce **insights verificables** (“firma física” ante frustración laboral) para **#208** / sesión semanal con UI **#213**. Umbrales estadísticos conservadores; sin afirmaciones causales fuertes. Requiere consentimiento granular por fuente. | No | 3 | 5 | 5 | 5 | A | L | Q2 |
| 218 | Grafo sinapsis de detonantes | Visualización **nativa** (grafo nodos/aristas): conceptos del chat, métricas de tecleo y fenotipado; grosor de arista = fuerza de correlación del motor **#217**. Autodescubrimiento, no dashboard analítico frío. Distinto de **#127** (grafo interno producto) y **#212** (ciclo ABC macro). Toggle privacidad; accesibilidad simplificada (lista alternativa). | No | 2 | 5 | 4 | 5 | A | L | Q2 |
| 219 | Gemelo conductual (simulación) | Modelo **predictivo conservador** sobre historial propio (tecleo, rutina, emociones en chat): preguntas hipotéticas (“entrega el viernes”) con respuesta basada en patrones pasados + CTA de contención (**#52–#53**, **#41**). No diagnóstico ni certeza; disclaimers. Evolución de **#91** y **#203**; riesgo de sobre-promesa → copy probabilístico. | No | 2 | 4 | 4 | 4 | A | L | Q2 |
| 220 | Mecanismos de defensa (capa LLM) | Capa invisible clasifica estructura defensiva del turno (proyección, racionalización, intelectualización, etc.) **sin** mostrar etiqueta en tiempo real; serie temporal para insight semanal (“cuando hablas de familia, predomina racionalización”). Revisión clínica **#46**, **#111**; evitar patologizar. Acopla **#210**, **#208**. | No | 3 | 5 | 4 | 5 | M | L | Q2 |
| 221 | Deriva semántica (embedding drift) | Monitorear desplazamiento de **centroides** de conceptos clave del usuario en el índice de **#203** (p. ej. “trabajo” alejándose de “logro” hacia “asfixia”); insight narrativo con precisión (“cambió el significado”, no score crudo). Requiere **#203** + volumen de datos; coste embeddings y explicabilidad. | No | 2 | 4 | 3 | 4 | A | L | Q2 |
| 222 | Socrático estratificado (routing) | Con creencia rígida detectada (**#210**), activar **plan oculto** multi-turno (**#177**): secuencia de preguntas encadenadas sin contradecir; objetivo = disonancia cognitiva segura. Registrar “cede ante contradicción” (proxy flexibilidad). Más que `socraticQuestions.js` puntual. Unifica **#209** (modo mayéutico). | No | 3 | 5 | 5 | 5 | M | M | Q2 |
| 223 | Dobles vínculos y paradojas | Detectar estructuras “hagas lo que hagas, pierdes”; desglosar en chat con tercera vía (copy Bateson, no jerga). Complementa **#211** (disonancia factual) y **#99** (PSST). Interrumpe flujo normal con pantalla o bloque estructurado (**#207** opcional). | No | 3 | 5 | 4 | 5 | M | M | Q2 |

---

*Puntuaciones orientativas. Última revisión: 27 mayo 2026 (16 ex-Q5 + 11 entregadas archivadas; 8 anclas; **#201–#214** mayo 2026; **#215–#223** lote 3 mayo 2026; 195 filas en matriz).*
