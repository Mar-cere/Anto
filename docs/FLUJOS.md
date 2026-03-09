# Flujos principales del proyecto Anto

Resumen de los flujos de autenticación, chat, pagos y crisis, con enlaces a la documentación detallada.

---

## 1. Autenticación

### Resumen
- **Registro:** `POST /api/auth/register` → verificación de email (código).
- **Login:** `POST /api/auth/login` → devuelve token y usuario; el frontend guarda `userToken` y `userData` en AsyncStorage.
- **Sesión:** Al abrir la app, el frontend restaura sesión desde AsyncStorage (`AuthContext`). Si hay token, se considera usuario autenticado.
- **Logout:** El frontend borra `userToken` y `userData` y navega a SignIn; opcionalmente llama a `POST` de logout en backend si existe.

### Dónde está el código
- **Frontend:** `config/api.ts` (login, logout, checkAuthStatus), `contexts/AuthContext`, pantallas SignIn / Register / VerifyEmail.
- **Backend:** rutas en `routes/authRoutes.js` (o equivalente), middleware `authenticateToken`.

### Contratos
- Login: body `{ email, password }` → respuesta `{ token o accessToken, user }`.
- Ver [CONTRATOS_API.md](./CONTRATOS_API.md) para detalle de request/response.

---

## 2. Chat y mensajes

### Resumen
1. El usuario envía un mensaje desde la app.
2. **Frontend:** `POST /api/chat/messages` con contenido y conversación.
3. **Backend:** Validación → análisis emocional → análisis contextual → evaluación de riesgo de crisis → generación de respuesta (OpenAI) → guardado del mensaje del asistente → actualización de perfil y registros.
4. Si se detecta riesgo MEDIUM/HIGH, se pueden enviar alertas a contactos de emergencia (ver flujo de crisis).

### Documentación detallada
- **Flujo completo del mensaje (paso a paso):** [backend/docs/MENSAJE_FLUJO.md](../backend/docs/MENSAJE_FLUJO.md).

Incluye: validación, límites, análisis emocional, intención, tema, urgencia, evaluación de riesgo de crisis, alertas, construcción del prompt, generación con OpenAI, validación de respuesta y actualización de registros.

---

## 3. Pagos y suscripciones

### Resumen
- **iOS (StoreKit):** La app usa `storeKitService` y `paymentService.purchaseWithStoreKit(plan)`. Tras la compra, el frontend envía el recibo al backend para validación; solo entonces se finaliza la transacción en StoreKit.
- **Android:** Flujo con Mercado Pago (checkout session, URL de pago).
- **Estado de suscripción:** `GET /api/payments/subscription-status` (frontend: `paymentService.getSubscriptionStatus()`).
- **Restaurar compras (iOS):** `storeKitService.restorePurchases()` y validación de cada recibo con el backend.

### Documentación detallada
- **StoreKit y validación de recibos:** [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md).

Incluye: flujo completo, validación server-side, contratos entre frontend y backend, y recomendaciones.

### Contratos
- Validación de recibo: `POST /api/payments/validate-receipt` con `{ receipt, productId, transactionId?, originalTransactionIdentifierIOS?, restore? }`.
- Ver [CONTRATOS_API.md](./CONTRATOS_API.md) y [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md).

---

## 4. Crisis y alertas de emergencia

### Resumen
1. **Detección:** Durante el flujo del mensaje de chat, el backend evalúa riesgo (p. ej. `evaluateSuicideRisk`) y determina nivel LOW / MEDIUM / HIGH.
2. **Alertas:** Si el nivel es MEDIUM o HIGH, se envían alertas a los contactos de emergencia del usuario (email; opcionalmente WhatsApp). Hay cooldown (p. ej. 1 hora) entre alertas.
3. **Dashboard de crisis:** El frontend obtiene métricas vía endpoints como `/api/crisis/summary`, `/api/crisis/trends`, `/api/crisis/by-month`, `/api/crisis/emotion-distribution`, `/api/crisis/history`.
4. **Contactos de emergencia:** El usuario gestiona sus contactos en Perfil; API bajo `/api/users/me/emergency-contacts`.

### Dónde está el código
- **Backend:** `constants/crisis.js` (evaluación de riesgo, recursos por país), `services/emergencyAlertService.js`, rutas de crisis y de usuarios (emergency-contacts).
- **Frontend:** Pantalla CrisisDashboard (refactor en `screens/crisisDashboard/`), Perfil (contactos de emergencia), flujo de chat (sin cambio directo; el backend decide cuándo alertar).

### Documentación detallada
- **Evaluación de riesgo y alertas:** descritas en [backend/docs/MENSAJE_FLUJO.md](../backend/docs/MENSAJE_FLUJO.md) (pasos 4.3 y 4.4, y sección de crisis).

---

## Resumen de documentos relacionados

| Tema        | Documento |
|------------|-----------|
| Índice doc | [docs/README.md](./README.md) |
| Contratos API | [CONTRATOS_API.md](./CONTRATOS_API.md) |
| Flujo mensaje (chat) | [backend/docs/MENSAJE_FLUJO.md](../backend/docs/MENSAJE_FLUJO.md) |
| Pagos / StoreKit | [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md) |
| Seguridad  | [backend/docs/SECURITY_REVIEW_V1.1.md](../backend/docs/SECURITY_REVIEW_V1.1.md) |
