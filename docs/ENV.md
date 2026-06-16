# Variables de entorno — Anto backend

Referencia de variables críticas para despliegue y onboarding. **No incluye valores secretos.** Los ejemplos son ilustrativos.

## Base

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NODE_ENV` | Sí | `development`, `test`, `production` |
| `APP_VERSION` | No | Versión expuesta en `/health` (p. ej. `1.4.6`) |
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

## Caché / Redis

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

- `GET /health` y `GET /api/health` — snapshot público: MongoDB, Redis, OpenAI configurado, Atlas (sin nombre de índice ni workers).
- `GET /api/health/detailed` — workers, índice Atlas, memoria; en producción requiere usuario autenticado y tiene rate limit.

Códigos: `200` si el servicio responde (incluso `degraded`); `503` solo si MongoDB no está disponible (`unavailable`).
