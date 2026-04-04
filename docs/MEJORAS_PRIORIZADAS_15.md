# Mejoras priorizadas (Anto) — 35 ítems

Documento vivo para iteración: cada ítem es accionable y puede convertirse en ticket. **Solo pendientes:** lo ya implementado no se lista aquí.

---

## 1–13 · Base (arquitectura, privacidad, operación)

## 1. Trocear `chatRoutes.js` en módulos por responsabilidad
**Área:** backend · **Impacto:** mantenibilidad, tests  
Extraer handlers de mensajes, conversaciones y streaming a archivos bajo `routes/chat/` manteniendo el mismo contrato HTTP. Reduce riesgo de regresiones al tocar un solo flujo.

## 2. Tipar la navegación raíz (`RootStackParamList`) y el `navigationRef`
**Área:** frontend · **Impacto:** calidad, menos errores en runtime  
Definir parámetros de pantallas (incl. `MainTabs` → `Chat`) y usar `navigationRef` tipado para deep links y notificaciones.

## 3. Deep link `anto://` al chat con `conversationId`
**Área:** frontend + `app.json` · **Impacto:** UX, engagement  
Complementar el push con esquema URL documentado; abrir la conversación correcta sin depender solo de AsyncStorage.

## 4. Unificar criterio Socket vs REST para el check-in poschat
**Área:** backend · **Impacto:** coherencia de producto  
Si Socket sigue activo para mensajes, llamar a `maybeSchedule` tras respuesta del asistente también ahí, o documentar deprecación explícita de Socket para chat.

## 5. Auditoría: no loguear contenido de mensajes en producción
**Área:** backend · **Impacto:** privacidad, cumplimiento  
Revisar `console.log` / logger en rutas de chat y servicios; usar IDs, hashes o longitud, nunca texto completo del usuario.

## 6. Tests de integración mínimos del POST `/api/chat/messages`
**Área:** backend · **Impacto:** confianza en releases  
Mock de OpenAI + flujo guardar usuario + asistente + metadata; detecta roturas de contrato sin UI.

## 7. AbortController en envío de mensajes / stream al salir del chat
**Área:** frontend (`chatService` / `useChatScreen`) · **Impacto:** rendimiento y estados fantasma  
Cancelar peticiones al desmontar o cambiar de conversación para evitar respuestas duplicadas o mezcladas.

## 8. Paginación “cargar más” en el historial del chat
**Área:** frontend + API existente · **Impacto:** UX en conversaciones largas  
Ya hay paginación en GET mensajes; exponer en UI scroll hacia arriba y estado de carga.

## 9. Métricas de negocio: check-in programado / enviado / omitido
**Área:** backend · **Impacto:** producto y tuning  
Registrar contadores (o eventos) desde `intenseChatCheckInService` para ajustar umbrales, delays y cooldown.

## 10. Revisar `sentimentAnalysis` / OpenAI en el cliente
**Área:** frontend · **Impacto:** seguridad y superficie de ataque  
Confirmar si debe ejecutarse en dispositivo; si no, eliminar o mover al backend para no exponer rutas ni claves.

## 11. Shutdown ordenado del proceso Node
**Área:** backend (`server.js`) · **Impacto:** despliegues sin fugas  
En SIGTERM: cerrar HTTP, Socket.IO, `clearInterval` de servicios periódicos y timeout de cierre de Mongo.

## 12. Constantes legales de IA compartidas (modal + AIPrivacy)
**Área:** frontend · **Impacto:** coherencia y revisiones App Store  
Un solo módulo (`shared/legalCopy` o similar) importado por `chatScreenConstants` y `AIPrivacyScreen` para que un cambio actualice todos los textos.

## 13. Índices y TTL opcional en colecciones de seguimiento
**Área:** backend / MongoDB · **Impacto:** coste y privacidad  
Revisar `explain()` en consultas de `IntenseChatCheckIn` y `Message`; considerar TTL o job de limpieza para registros `skipped`/`cancelled` muy antiguos.

---

## 14–23 · Chat con IA y experiencia de usuario

## 14. Streaming perceptible en móvil (chunks reales o simulación fluida)
**Área:** frontend + API · **Impacto:** UX percepción de “Anto está respondiendo”  
Hoy el cliente suele recibir la respuesta completa; valorar SSE/`getReader` donde exista, o animación de texto progresivo + cursor para reducir sensación de bloqueo.

## 16. Regenerar la última respuesta del asistente (límite razonable)
**Área:** frontend + backend · **Impacto:** control del usuario  
Una acción por mensaje del bot (“Reintentar” / “Otra versión”) reutilizando el mismo mensaje de usuario; límites diarios para coste y abuso.

## 17. Preferencias de tono y longitud de respuesta
**Área:** frontend + backend (prompt) · **Impacto:** personalización  
“Breve / Normal / Más detallado” persistido en perfil o ajustes; pasar como señal al `openaiPromptBuilder` sin romper límites de tokens.

## 18. Coherencia de idioma (detección ligera + instrucción al modelo)
**Área:** backend · **Impacto:** UX multilingüe  
Si el usuario escribe en otro idioma, responder en ese idioma o avisar con un mensaje corto; evitar mezclas incómodas en la misma conversación.

## 19. Feedback “útil / no útil” en mensajes del asistente
**Área:** frontend + backend · **Impacto:** producto y mejora del modelo  
Botones discretos bajo la burbuja; guardar en metadata o tabla agregada (sin PII innecesaria) para priorizar mejoras de prompt.

## 20. Panel o bloque de recursos de crisis contextual
**Área:** frontend (+ copy legal) · **Impacto:** seguridad percibida  
Cuando el análisis marque riesgo alto, mostrar líneas locales / enlaces genéricos ya aprobados; no sustituye emergencias; coherente con políticas de la app.

## 21. Búsqueda dentro de la conversación actual
**Área:** frontend · **Impacto:** UX en hilos largos  
Campo de búsqueda que filtre mensajes locales o por API si hay endpoint; resaltar coincidencias y scroll al resultado.

## 22. Handoff invitado→cuenta: resumen en servidor con consentimiento
**Área:** backend + frontend · **Impacto:** calidad del resumen y cumplimiento  
Endpoint dedicado que genere resumen con consentimiento explícito; alternativa al resumen solo local de v1; política de retención clara.

## 23. Acceso persistente a límites de IA y privacidad desde el chat
**Área:** frontend · **Impacto:** confianza  
Icono o enlace fijo en cabecera (“Privacidad e IA”, límites del asistente) enlazando a `AIPrivacy` y textos unificados (véase ítem 12).

---

## 24–30 · Operación, calidad y producto transversal

## 24. Log estructurado de feature flags al arranque
**Área:** backend · **Impacto:** operación y soporte  
Tras cargar `config/features.js`, un único log (sin secretos) con qué servicios quedaron activos: reminders, crisis follow-up, check-in poschat, scheduler, swagger.

## 25. Health check extendido (`/api/health` o ruta dedicada)
**Área:** backend · **Impacto:** observabilidad y alertas  
Comprobar MongoDB, Redis si aplica, y disponibilidad de OpenAI (ping ligero o HEAD) sin exponer claves; códigos HTTP claros para balanceadores.

## 26. Internacionalización (i18n) del chat y textos críticos
**Área:** frontend · **Impacto:** alcance y mantenimiento  
Extraer strings del chat, modales y errores frecuentes a catálogos `es` / `en` (o base + overrides); evitar duplicar copy en constantes sueltas.

## 27. Sentry (o equivalente) en errores críticos del cliente de chat
**Área:** frontend · **Impacto:** diagnóstico en producción  
Capturar fallos de envío, parseo de respuestas y navegación al chat con contexto mínimo (sin contenido de mensajes en claro si política lo prohíbe).

## 28. Validación de input alineada con límites del backend
**Área:** frontend · **Impacto:** menos errores 4xx y frustración  
Misma longitud máxima y reglas que `guestChat` / chat autenticado; mensajes claros antes de enviar.

## 29. Exportación o copia segura del hilo para el usuario
**Área:** frontend (+ producto legal) · **Impacto:** utilidad y transparencia  
“Copiar conversación” o exportación legible (texto/Markdown) solo en dispositivo; aviso de sensibilidad de los datos.

## 30. Documentación interna de variables de entorno críticas
**Área:** repo / onboarding · **Impacto:** despliegues y cumplimiento  
Tabla en `docs/ENV.md` (o README backend) con JWT, Mongo, Redis, `ENABLE_*`, `CHAT_PROMPT_*`, límites de OpenAI; ejemplos no secretos.

---

## 31–35 · Datos, coste y calidad continua

## 31. Telemetría de truncado de historial para afinar `CHAT_PROMPT_*`
**Área:** backend / observabilidad · **Impacto:** afinación con datos reales  
Contador o evento cuando `selectHistoryForPrompt` descarta tramo viejo (sin contenido de mensajes); dashboards o revisión periódica.

## 32. Resumen ligero del tramo no enviado al modelo (opcional)
**Área:** backend · **Impacto:** contexto en hilos muy largos sin duplicar coste del turno  
Heurística (keywords + crisis) o mini-llamada acotada; solo si el producto prioriza continuidad temática frente a solo ventana + cola.

## 33. Suite E2E mínima (login + envío en chat)
**Área:** frontend / QA · **Impacto:** regresiones críticas  
Un flujo estable (p. ej. Detox / Maestro) que valide autenticación y un mensaje al asistente en entorno de staging.

## 34. Alertas de coste OpenAI (tokens / $ por día o conversación) realizado
**Área:** backend + operación · **Impacto:** control de gasto  
Agregación diaria o umbrales desde logs existentes o métricas; aviso antes de picos anómalos.

## 35. Configuración remota para chips y experimentos A/B
**Área:** backend + frontend · **Impacto:** producto sin releases frecuentes  
Servicio o JSON remoto que habilite variantes de copy de chips, límites de UI o flags de tono; fallback local.

---

## Cómo usar esta lista

- **Base / privacidad / deuda:** **5 → 12 → 1 → 6 → 7** (logs, copys unificados, troceo de rutas, tests, cancelación de peticiones).  
- **Notificaciones y deep links:** **2 → 3**.  
- **Chat IA / UX:** **14 → 19 → 23** (percepción, feedback útil, acceso legal).  
- **Modelo y personalización:** **17 → 18** (tono, idioma).  
- **Invitado y cuenta:** **22**.  
- **Operación y docs:** **24 → 25 → 30**.  
- **Datos y coste:** **31 → 34 → 35**.

**No priorizado explícitamente:** cola post-login “abrir chat” desde notificación; estados de entrega por mensaje en burbuja; accesibilidad extendida del chat (puede ligarse a ítem 26).
