# Variables de entorno — Anto backend

Referencia de variables críticas para despliegue y onboarding. **No incluye valores secretos.** Los ejemplos son ilustrativos.

## Base

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NODE_ENV` | Sí | `development`, `test`, `production` |
| `APP_VERSION` | No | Versión expuesta en `/health` (p. ej. `1.5.0`) |
| `PORT` | No | Puerto HTTP (Render usa `PORT` automáticamente) |
| `MONGO_URI` / `MONGODB_URI` | Sí (prod) | Cadena de conexión MongoDB Atlas |
| `JWT_SECRET` | Sí (prod) | Firma de access tokens (mín. 32 caracteres) |
| `JWT_REFRESH_SECRET` | Sí (prod) | Firma de refresh tokens |
| `FRONTEND_URL` | Sí (prod) | Origen permitido en CORS |
| `SENTRY_DSN` | No | Error tracking backend |
| `ENABLE_SENTRY` | No | `true` para Sentry en desarrollo |

## OpenAI / chat

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `OPENAI_API_KEY` | Sí (chat) | API key OpenAI |
| `OPENAI_TIMEOUT_MS` | No | Timeout por llamada (default `25000`) |
| `CHAT_PROMPT_MAX_MESSAGES` | No | Máx. mensajes en prompt |
| `CHAT_PROMPT_SLIDING_TAIL` | No | Cola reciente siempre incluida |
| `CHAT_MAX_COMPLETION_TOKENS` | No | Tope de tokens de respuesta |
| `WEEKLY_INSIGHT_LLM_ENABLED` | No | Narrativa LLM en informes (`true` opt-in) |

## Atlas / embeddings (#126 / grafo)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `TOPIC_FREE_EMBEDDINGS_ENABLED` | No | Opt-out con `false`; en prod suele estar activo si hay API key |
| `ATLAS_VECTOR_SEARCH_ENABLED` | No | `true` para `$vectorSearch` en Atlas |
| `ATLAS_TOPIC_FREE_VECTOR_INDEX` | No | Nombre del índice (default `topic_free_embedding_index`) |
| `TOPIC_FREE_EMBEDDING_DIMENSIONS` | No | Dimensiones del vector (default `1536`) |
| `OPENAI_EMBEDDING_MODEL` | No | Modelo embeddings (default `text-embedding-3-small`) |

**Backfill histórico (#127):** desde `backend/`

```bash
npm run backfill:topic-free-embeddings -- --stats-only
TOPIC_FREE_EMBEDDINGS_ENABLED=true npm run backfill:topic-free-embeddings -- --loop --limit=500
```

Flags: `--dry-run`, `--stats-only`, `--loop`, `--limit=N`, `--max-batches=N`, `--userId=<mongoId>`, `--delay-ms=80`.

Los eventos nuevos reciben embedding en background vía `persistTopicFreeEmbeddingsForDocs` al insertar `shown`.

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `REDIS_URL` / `REDISCLOUD_URL` | No | Si falta, caché en memoria |

## Feature flags (`ENABLE_*`)

Ver también `backend/config/features.js`.

| Variable | Default | Efecto |
|----------|---------|--------|
| `ENABLE_CRISIS_FOLLOWUP` | activo | Seguimiento post-crisis |
| `ENABLE_INTENSE_CHAT_CHECKIN` | activo | Check-in poschat intenso |
| `ENABLE_NOTIFICATION_SCHEDULER` | activo | Cola de notificaciones |
| `ENABLE_WEEKLY_PATTERN_INSIGHT` | activo | Worker informe semanal |
| `ENABLE_LAST_SESSION_SUMMARY` | activo | Worker continuidad último chat |
| `ENABLE_REMINDERS` | off | Recordatorios contactos emergencia |
| `ENABLE_WEEKLY_SUMMARY_EMAIL` | off | Correo aviso resumen semanal |
| `ENABLE_SWAGGER` | off en prod | Documentación `/api-docs` |
| `PERSONAL_PATTERN_RAG_ENABLED` | off | RAG patrones personales cross-sesión (#203); requiere embeddings y **consent** de Memoria del proceso (`signalConsent.experientialPatterns`). En non-prod también `TOPIC_FREE_EMBEDDINGS_ENABLED=true` si embeddings no están on por defecto. Atlas opcional (`ATLAS_VECTOR_SEARCH_ENABLED`). |
| `EXPERIENTIAL_PATTERNS_ENABLED` | activo | API + persistencia memoria del proceso (#203/#211); `false` desactiva |
| `EXPERIENTIAL_FOLLOWUP_ENABLED` | activo | Follow-up evolutivo en chat; `false` desactiva |
| `EXPERIENTIAL_EXTRACT_ENABLED` | activo | Worker extracción al cierre de sesión; `false` desactiva |
| `EXPERIENTIAL_FOLLOWUP_DAYS` | `14` | Días hasta el primer follow-up tras observar un patrón |
| `EXPERIENTIAL_EXTRACT_TICK_MS` | `120000` | Intervalo del worker de extracción |
| `EXPERIENTIAL_EXTRACT_MAX_ATTEMPTS` | `2` | Reintentos LLM de extracción |
| `ENABLE_CRISIS_HARD_STOP` | activo | Hard-stop sin LLM en HIGH + léxico explícito (#205) |
| `ENABLE_SOFT_LANDING_POST_CRISIS` | activo | Soft landing 48 h tras exit/hard-stop (#225): tono, mute productivos, strip, home |
| `ENABLE_CRISIS_ROUTING_SLO_MONITOR` | activo | Monitor SLO camino A/B crisis (agrega Mongo + alerta Sentry) |

### CTA «Abrir Anto» en correos

Gmail y muchos clientes **no abren** `anto://`. Usa un enlace HTTPS (puente) que sí funciona en el mail:

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `EMAIL_APP_OPEN_LINK` | Recomendada en prod | URL del botón principal. **Recomendado:** `https://www.antoapps.com/open?to=weekly-summary` (ver [docs/open-app/README.md](./open-app/README.md)). Tiene prioridad sobre los flags de abajo. |
| `WEEKLY_SUMMARY_EMAIL_APP_LINK` | No | Override histórico del CTA (si no hay `EMAIL_APP_OPEN_LINK`). |
| `WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY` | No | Si `true` y no hay HTTPS arriba, emite `anto:///weekly-summary` (frágil en clientes de correo). |
| `WEEKLY_SUMMARY_APPSTORE_LINK` / `EMAIL_APPSTORE_LINK` | No | Link «Descargar en App Store» del pie del correo. |

Tras publicar la página puente en antoapps.com, en local y en Render:

```bash
EMAIL_APP_OPEN_LINK=https://www.antoapps.com/open?to=weekly-summary
```

### SLO crisis routing (`ENABLE_CRISIS_ROUTING_SLO_MONITOR`)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `CRISIS_ROUTING_SLO_CHECK_INTERVAL_MS` | `900000` (15 min) | Intervalo del monitor |
| `CRISIS_ROUTING_SLO_WINDOW_HOURS` | `24` | Ventana de agregación Mongo |
| `CRISIS_ROUTING_SLO_ALERT_COOLDOWN_MS` | `1800000` (30 min) | Cooldown entre alertas |
| `CRISIS_ROUTING_SLO_MIN_ROUTING_EVENTS` | `10` | Mín. eventos hard-stop + llm para evaluar |
| `CRISIS_ROUTING_SLO_MIN_ELIGIBLE_EVENTS` | `3` | Mín. elegibles para alerta de captura |
| `CRISIS_ROUTING_SLO_MAX_SANITIZE_RATE_PCT` | `35` | Alerta si % respuestas LLM saneadas supera umbral |
| `CRISIS_ROUTING_SLO_MIN_HARD_STOP_CAPTURE_PCT` | `80` | Alerta si captura entre elegibles cae bajo umbral |

Endpoint ops: `GET /api/health/crisis-routing?windowHours=24&source=merged` (`memory` | `mongo` | `merged`). En producción requiere auth (igual que `/detailed`).

## Cliente móvil (Expo)

| Variable | Descripción |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | URL base del API |
| `EXPO_PUBLIC_SENTRY_DSN` | DSN Sentry cliente (sin secretos de backend) |
| `EXPO_PUBLIC_ENABLE_SENTRY` | `true` para forzar Sentry en builds de desarrollo |

## E2E (Maestro)

| Variable | Descripción |
|----------|-------------|
| `E2E_EMAIL` | Cuenta de staging para login |
| `E2E_PASSWORD` | Contraseña de staging |

## Health check

- `GET /` — liveness mínima (proceso vivo; **no** comprueba Mongo). Útil como health check de Render si no quieres reinicios por blips de Atlas.
- `GET /health` y `GET /api/health` — snapshot público: MongoDB, Redis, OpenAI configurado, Atlas (sin nombre de índice ni workers).
- `GET /api/health/detailed` — workers, índice Atlas, memoria; en producción requiere usuario autenticado y tiene rate limit.
- `GET /api/health/crisis-routing` — métricas ops camino A/B crisis (memoria + ventana Mongo); query `windowHours`, `source`.

Códigos: `200` si el servicio responde (incluso `degraded`); `503` solo si MongoDB no está disponible (`unavailable`).

Recomendación Render: health check de **liveness** en `GET /`; alertas de **readiness** con `GET /health` (UptimeRobot u otro). Las rutas `/api/*` (excepto `/api/health*`) responden `503` + `DATABASE_UNAVAILABLE` si Mongo no está conectado.

### Mongo — reintentos

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MONGO_CONNECT_MAX_ATTEMPTS` | `5` | Intentos iniciales al arrancar |
| `MONGO_CONNECT_RETRY_MS` | `2000` | Base del backoff entre intentos iniciales |
