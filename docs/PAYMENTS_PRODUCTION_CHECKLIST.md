# Checklist — Pagos y trial en producción (Anto)

Este documento fija **invariantes** y pasos de validación manual. Complementa el código en `paymentRoutes`, `paymentServiceMercadoPago`, `appleReceiptService`, `checkSubscription`.

## Fuentes de verdad

| Capa | Campos relevantes | Uso |
|------|-------------------|-----|
| `User.subscription` | `status` (`free\|trial\|premium\|expired`), fechas de trial y premium, `plan`, `trialGrantedAt` | UI, trial banner, compatibilidad legacy |
| `Subscription` (colección) | `status`, `plan`, `currentPeriodEnd`, IDs MP/Apple | Preferido en `checkSubscription` si existe documento |
| `Transaction` | `status`, `amount`, `plan`, `metadata` (MP payment/preapproval ids, idempotencia) | Webhooks, auditoría, recuperación |

## Invariantes de acceso (chat y premium)

1. **Acceso permitido** si:
   - `Subscription` existe y `(status active o trialing)` y `now <= currentPeriodEnd` **o**
   - No hay `Subscription` y `User.subscription.status === trial` con `trialEndDate >= now` **o**
   - No hay `Subscription` y `User.subscription.status === premium` con `subscriptionEndDate >= now`.
2. **Tras pago aprobado (MP) o recibo válido (Apple)**:
   - `Transaction` queda coherente (`completed` cuando aplica).
   - `User.subscription.status === premium` y fechas alineadas al período.
   - En `Subscription` (si aplica MP): `active`, `trialStart`/`trialEnd` limpiados.
3. **Trial de app (3 días)**:
   - Se otorga **una vez por cuenta** en el registro (`trialGrantedAt` definido).
   - Al pasar a premium se limpian `trialStartDate` / `trialEndDate` embebidos en usuario.

## Webhook Mercado Pago

- **Producción**: con `MERCADOPAGO_WEBHOOK_SECRET`, validar firma `x-signature` (HMAC) con `data.id` + `x-request-id` + `ts`.
- **Idempotencia**: el mismo `paymentId` / `preapprovalId` no debe activar suscripción dos veces (metadatos en `Transaction`).
- **Validación**:
  - Monto del pago vs `Transaction.amount` (vía API de pagos MP si el body no trae monto).
  - Email del pagador vs usuario: modo estricto por defecto en producción (`MERCADOPAGO_STRICT_PAYER_EMAIL`).

## Pruebas manuales recomendadas (post-deploy)

- [ ] Registro nuevo → `GET /api/payments/trial-info` muestra trial y días coherentes.
- [ ] iOS: compra sandbox/prod → `POST /api/payments/validate-receipt` → estado premium y chat OK.
- [ ] Android: checkout MP → webhook → premium y chat desde backend.
- [ ] Repetir webhook (simulación o reintento MP) → **sin** doble extensión de período.
- [ ] Email de pago distinto al usuario → **no** activar (si strict activo).
- [ ] Trial vencido → `403` en chat con mensaje coherente.
- [ ] Admin: `GET /api/payments/metrics/integrity` → sin alertas críticas inesperadas.

## Variables de entorno relacionadas

| Variable | Rol |
|----------|-----|
| `MERCADOPAGO_ACCESS_TOKEN` | API REST / SDK |
| `MERCADOPAGO_WEBHOOK_SECRET` | Firma HMAC webhooks |
| `MERCADOPAGO_WEBHOOK_IPS` | Opcional, allowlist IP |
| `MERCADOPAGO_STRICT_PAYER_EMAIL` | `true` (default prod): bloquear activación si email pagador ≠ usuario |
| `APPLE_SHARED_SECRET` | Validación de recibos de suscripción |

## Métricas de integridad

- Endpoint (admin): `GET /api/payments/metrics/integrity` — resumen de transacciones completadas recientes sin premium activo, huérfanas, y duplicados detectados.
