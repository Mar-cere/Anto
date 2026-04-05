# Documentación del proyecto Anto

Índice de la documentación técnica y de producto del proyecto.

---

## 📁 Documentos en esta carpeta (`docs/`)

| Documento | Descripción |
|-----------|-------------|
| [FLUJOS.md](./FLUJOS.md) | Flujos principales: autenticación, chat, pagos, crisis. Resumen y enlaces a detalle. |
| [CONTRATOS_API.md](./CONTRATOS_API.md) | Alineación frontend–backend: endpoints, rutas y contratos request/response. |
| [REVISION_STOREKIT_COMPRAS.md](./REVISION_STOREKIT_COMPRAS.md) | Revisión del flujo de compras con StoreKit (iOS) y validación de recibos. |

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
