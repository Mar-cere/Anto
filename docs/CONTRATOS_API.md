# Contratos API: alineación frontend–backend

Documento de integración entre el frontend (React Native) y el backend (Node/Express). Los paths del frontend (`config/api.ts` → `ENDPOINTS`) coinciden con las rutas del backend montadas bajo `/api/*`.

---

## 1. Origen de los contratos

| Lado     | Ubicación | Uso |
|----------|------------|-----|
| Frontend | `frontend/src/config/api.ts` | Objeto `ENDPOINTS` con todos los paths. Cliente `api` (get, post, put, delete, patch) con auth por header `Authorization: Bearer <token>`. |
| Frontend | `frontend/src/types/api.types.ts` | Tipos para User, LoginCredentials, LoginResultType, CheckAuthResult, ApiError, ApiGetResponse. |
| Backend  | Rutas en `backend/routes/*.js` | Rutas montadas en el servidor (p. ej. `/api/auth`, `/api/users`, `/api/chat`, `/api/payments`, `/api/crisis`). |
| Backend  | `backend/types/api.types.ts` | Tipos alineados con el frontend (User, LoginResponse, ApiErrorResponse, ApiSuccessResponse, etc.). |

Para una especificación interactiva de cada ruta (parámetros, cuerpos, respuestas), usar **Swagger** en `/api-docs` con el servidor en marcha.

---

## 2. Resumen de endpoints por dominio

### Auth
| Frontend ENDPOINTS | Método | Ruta backend | Auth | Contrato resumido |
|-------------------|--------|--------------|------|-------------------|
| LOGIN | POST | /api/auth/login | No | Body: `{ email, password }` → `{ token o accessToken, user }` |
| REGISTER | POST | /api/auth/register | No | Body: datos registro → `{ user, token?, message? }` |
| VERIFY_EMAIL | POST | /api/auth/verify-email | No | Body: código verificación |
| RESEND_VERIFICATION_CODE | POST | /api/auth/resend-verification-code | No | Reenvío de código |

### Usuario y perfil
| Frontend ENDPOINTS | Método | Ruta backend | Auth | Contrato resumido |
|-------------------|--------|--------------|------|-------------------|
| ME / PROFILE / UPDATE_PROFILE | GET / PUT | /api/users/me | Sí | GET → User; PUT body → datos a actualizar |
| ONBOARDING_PREFERENCES | PATCH | /api/users/me/onboarding-preferences | Sí | Preferencias de onboarding |
| EMERGENCY_CONTACTS | GET / POST | /api/users/me/emergency-contacts | Sí | GET → `{ contacts }`; POST body → nuevo contacto |
| EMERGENCY_CONTACT_BY_ID(id) | PUT / DELETE | /api/users/me/emergency-contacts/:id | Sí | Actualizar o eliminar contacto |
| EMERGENCY_CONTACT_TOGGLE(id) | PATCH | /api/users/me/emergency-contacts/:id/toggle | Sí | Activar/desactivar contacto para alertas |
| EMERGENCY_ALERTS | GET | /api/users/me/emergency-alerts | Sí | Historial de alertas |
| EMERGENCY_ALERTS_STATS | GET | /api/users/me/emergency-alerts/stats | Sí | Estadísticas de alertas |
| EMERGENCY_ALERTS_PATTERNS | GET | /api/users/me/emergency-alerts/patterns | Sí | Patrones de alertas |

### Chat
| Frontend ENDPOINTS | Método | Ruta backend | Auth | Contrato resumido |
|-------------------|--------|--------------|------|-------------------|
| CHAT_MESSAGES | POST | /api/chat/messages | Sí | Body: contenido, conversación → mensaje asistente + análisis |
| CHAT_CONVERSATIONS | GET | /api/chat/conversations | Sí | Lista de conversaciones |
| CHAT_CONVERSATION_BY_ID(id) | GET | /api/chat/conversations/:id | Sí | Conversación y mensajes |
| CHAT_MESSAGE_STATUS | PATCH | /api/chat/messages/status | Sí | Actualizar estado de mensajes |
| CHAT_SEARCH | GET | /api/chat/messages/search | Sí | Query params de búsqueda |

### Tareas y hábitos
| Frontend ENDPOINTS | Método | Ruta backend | Auth | Contrato resumido |
|-------------------|--------|--------------|------|-------------------|
| TASKS | GET / POST | /api/tasks | Sí | CRUD tareas |
| TASKS_PENDING | GET | /api/tasks/pending | Sí | Tareas pendientes |
| TASK_BY_ID(id) | GET / PUT / DELETE | /api/tasks/:id | Sí | Una tarea |
| HABITS | GET / POST | /api/habits | Sí | CRUD hábitos |
| HABITS_ACTIVE | GET | /api/habits/active | Sí | Hábitos activos |
| HABIT_BY_ID(id) | GET / PUT / DELETE | /api/habits/:id | Sí | Un hábito |
| HABIT_COMPLETE(id) | POST | /api/habits/:id/complete | Sí | Marcar completado |

### Crisis (métricas y historial)
| Frontend ENDPOINTS | Método | Ruta backend | Auth | Contrato resumido |
|-------------------|--------|--------------|------|-------------------|
| CRISIS_SUMMARY | GET | /api/crisis/summary | Sí | Query: `days` → `{ success, data }` (totales, tasa resolución, riesgo promedio) |
| CRISIS_TRENDS | GET | /api/crisis/trends | Sí | Query: `period` (7d, 30d, 90d) → `{ success, data }` (dataPoints, trend) |
| CRISIS_BY_MONTH | GET | /api/crisis/by-month | Sí | Query: `months` → `{ success, data }` (array por mes) |
| CRISIS_EMOTION_DISTRIBUTION | GET | /api/crisis/emotion-distribution | Sí | Query: `days` → `{ success, data }` (distribution, total) |
| CRISIS_HISTORY | GET | /api/crisis/history | Sí | Query: `limit` → `{ success, data: { crises } }` |
| CRISIS_ALERTS_STATS | GET | /api/crisis/alerts-stats | Sí | Query: `days` |
| CRISIS_FOLLOWUP_STATS | GET | /api/crisis/followup-stats | Sí | Query: `days` |

### Pagos
| Frontend ENDPOINTS | Método | Ruta backend | Auth | Contrato resumido |
|-------------------|--------|--------------|------|-------------------|
| PAYMENT_PLANS | GET | /api/payments/plans | Opcional | `{ success, plans, provider? }` |
| PAYMENT_CREATE_CHECKOUT | POST | /api/payments/create-checkout-session | Sí | Body: plan, successUrl?, cancelUrl? → session/URL Mercado Pago |
| PAYMENT_SUBSCRIPTION_STATUS | GET | /api/payments/subscription-status | Sí | `{ success, subscription?, ... }` (o 304 not modified) |
| PAYMENT_TRIAL_INFO | GET | /api/payments/trial-info | Sí | Info de trial |
| PAYMENT_VALIDATE_RECEIPT | POST | /api/payments/validate-receipt | Sí | Body: receipt, productId, transactionId?, originalTransactionIdentifierIOS?, restore? → `{ success, subscription?, appleStatus? }` |
| PAYMENT_TRANSACTIONS | GET | /api/payments/transactions | Sí | `{ success, transactions }` |
| PAYMENT_CANCEL_SUBSCRIPTION | POST | /api/payments/cancel-subscription | Sí | Cancelar suscripción |

Detalle del flujo StoreKit y validación de recibos: [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md).

### Notificaciones
| Frontend ENDPOINTS | Método | Ruta backend | Auth | Contrato resumido |
|-------------------|--------|--------------|------|-------------------|
| PUSH_TOKEN | POST / GET / DELETE | /api/notifications/push-token | Sí | Registrar/obtener/eliminar token push |

### Otras rutas
- **Health:** `GET /health` (sin prefijo `/api`) — estado del servidor.
- **Técnicas terapéuticas:** THERAPEUTIC_TECHNIQUES, THERAPEUTIC_TECHNIQUES_BY_EMOTION, THERAPEUTIC_TECHNIQUES_USE, THERAPEUTIC_TECHNIQUES_HISTORY, THERAPEUTIC_TECHNIQUES_STATS.
- **Escalas clínicas:** bajo `/api/clinical-scales/*` (available, submit, progress, summary, etc.).
- **Distorsiones cognitivas:** bajo `/api/cognitive-distortions/*`.
- **Métricas:** METRICS_ME, METRICS_SYSTEM, METRICS_HEALTH (admin).
- **Diarios:** JOURNALS, JOURNAL_BY_ID, JOURNALS_STATS, JOURNAL_ARCHIVE.

---

## 3. Tipos compartidos (User, Login, errores)

Los tipos de usuario, login y respuestas de error están alineados entre backend y frontend:

- **Backend:** `backend/types/api.types.ts` — User, UserPreferences, UserStats, UserSubscription, LoginResponse, ApiErrorResponse, ApiSuccessResponse, ApiFailResponse.
- **Frontend:** `frontend/src/types/api.types.ts` — User, LoginCredentials, LoginResultType, CheckAuthResult, ApiError, ApiGetResponse.

El frontend usa estos tipos en `config/api.ts` y en pantallas/servicios que consumen la API. Cualquier cambio en un contrato (nuevo campo, cambio de nombre) debe reflejarse en ambos lados para evitar roturas.

---

## 4. Errores y manejo en frontend

- Las respuestas de error del backend suelen incluir `message` o `error` (y opcionalmente `errors`).
- El frontend centraliza el manejo en `utils/apiErrorHandler.js`: `getApiErrorMessage()`, `isNetworkError`, `isAuthError`, `isRateLimitError`, `isServerError`. Se re-exporta `handleApiError` desde `config/api`.
- Para pagos (validación de recibo), el backend puede devolver `appleStatus` cuando Apple rechaza el recibo; el frontend lo usa para mostrar mensajes claros (ver [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md)).

---

## 5. Cómo usar este documento

- **Desarrolladores frontend:** usar `ENDPOINTS` de `config/api.ts`; para formas exactas de request/response consultar Swagger (`/api-docs`) o el código del backend en `routes/`.
- **Desarrolladores backend:** al añadir o cambiar rutas, actualizar este documento y, si aplica, `frontend/src/config/api.ts` y los tipos en `frontend/src/types/api.types.ts` y `backend/types/api.types.ts`.
- **Integración:** este documento sirve como referencia única de alineación; para flujos de negocio ver [FLUJOS.md](./FLUJOS.md).
