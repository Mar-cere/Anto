# Documentación del proyecto Anto

Índice de la documentación técnica y de producto del proyecto.

---

## 📁 Documentos en esta carpeta (`docs/`)

| Documento | Descripción |
|-----------|-------------|
| [PRODUCT_NARRATIVE.md](./PRODUCT_NARRATIVE.md) | Narrativa de producto v1: promesa, categoría, voz de marca y límites. |
| [CONTRATO_PATRONES_EXPERIENCIALES_V1.md](./CONTRATO_PATRONES_EXPERIENCIALES_V1.md) | Contrato memoria del proceso / follow-up evolutivo (#203 / #211). |
| [SMOKE_EXPERIENTIAL_PATTERNS.md](./SMOKE_EXPERIENTIAL_PATTERNS.md) | Checklist smoke memoria del proceso. |
| [PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md](./PROPUESTAS_ACOMPANAMIENTO_IA_MATRIZ.md) | Backlog priorizado (~180 propuestas): urgencia, impacto, estado de implementación. |
| [FLUJOS.md](./FLUJOS.md) | Flujos principales: autenticación, chat, pagos, crisis. Resumen y enlaces a detalle. |
| [CONTRATOS_API.md](./CONTRATOS_API.md) | Alineación frontend–backend: endpoints, rutas y contratos request/response. |
| [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md) | Revisión del flujo de compras con StoreKit (iOS) y validación de recibos. |
| [PAYMENTS_PRODUCTION_CHECKLIST.md](./PAYMENTS_PRODUCTION_CHECKLIST.md) | Invariantes de pagos, trial y webhooks; checklist manual en producción. |
| [PROTOCOLO_CRISIS_V1.md](./PROTOCOLO_CRISIS_V1.md) | Contrato producto/clínico del modo crisis (#93, #10, #205). |
| [CONTRATO_SOFT_LANDING_POST_CRISIS_V1.md](./CONTRATO_SOFT_LANDING_POST_CRISIS_V1.md) | Soft landing 48 h post crisis (#225): tono, mute, strip, home, push. |
| [SMOKE_SOFT_LANDING_POST_CRISIS.md](./SMOKE_SOFT_LANDING_POST_CRISIS.md) | Smoke wiring + checklist opcional dispositivo (#225). |
| [SMOKE_DISPOSITIVO_CRISIS_I18N.md](./SMOKE_DISPOSITIVO_CRISIS_I18N.md) | Checklist manual dispositivo + comandos smoke automatizados (crisis + i18n EN). |
| [SMOKE_DISPOSITIVO_STREAMING.md](./SMOKE_DISPOSITIVO_STREAMING.md) | Checklist manual dispositivo streaming socket/SSE (#59, #128). |

---

## 📂 Documentación por área

### Backend
- **`backend/docs/MENSAJE_FLUJO.md`** — Flujo completo del mensaje de chat: validación, análisis emocional, contexto, crisis, generación de respuesta, filtros y servicios involucrados.
- **`backend/docs/SECURITY_REVIEW_V1.1.md`** — Revisión de seguridad (v1.1).
- **`backend/TYPESCRIPT.md`** — Tipos y contratos TypeScript en el backend (`types/`, `npm run typecheck`).
- **`backend/tests/README.md`** — Instrucciones para ejecutar tests del backend.

### Frontend
- **`frontend/MEJORAS_UX.md`** — Mejoras de UX y accesibilidad (formularios, a11y, tipografía, errores, reconexión).
- **`frontend/TYPESCRIPT.md`** — Estado del tipado TypeScript en el frontend.
- **`frontend/INSTRUCCIONES_SUBMIT_APP_STORE.md`** — Instrucciones para envío a App Store.
- **`frontend/e2e/README.md`** — Pruebas end-to-end (Maestro).

### Proyecto
- **`README.md`** (raíz) — Visión general del producto, tecnologías, estructura, estado y documentación principal.
- **`EVALUACION_PROYECTO.md`** — Evaluación global del proyecto (backend, frontend, integración) y opciones para seguir mejorando.

---

## 🔗 Enlaces rápidos

- **API (Swagger):** cuando el servidor está en marcha, ver `/api-docs`.
- **Contratos API:** [CONTRATOS_API.md](./CONTRATOS_API.md).
- **Flujo del mensaje (chat):** [backend/docs/MENSAJE_FLUJO.md](../backend/docs/MENSAJE_FLUJO.md).
- **Pagos y StoreKit:** [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md).
