# Release 1.5.2 — Estabilidad, crisis, continuidad y dashboard

**Versión app:** 1.5.2 · **iOS build** 41 · **Android versionCode** 27  
**Base:** 1.5.1 (jun 2026)  
**Backend:** desplegar antes o junto con builds de tienda (streaming, crisis v1, continuidad TCC).

---

## Resumen

Release incremental sobre **1.5.1** centrado en **confiabilidad del chat**, **protocolo de crisis v1**, **continuidad TCC en dashboard**, **UX del home** y **cierre de gaps i18n EN**. No introduce cambios de esquema de DB obligatorios para usuarios existentes.

---

## Cambios principales

### Crisis y seguridad

- Protocolo de crisis v1 con alertas híbridas y blindajes de pánico.
- Check-in de crisis suave (#19) sin activar protocolo completo.
- Smoke automatizado crisis + i18n EN; pendiente checklist en dispositivo físico (ver `PROTOCOLO_CRISIS_V1.md`).

### Chat y backend

- Streaming por chunks en WebSocket (#128) con blindaje de filtro de conversación (#59).
- Métricas TTFT desglosadas y suite de streaming.
- Fix envío WebSocket (`.catch` en undefined).
- Continuidad TCC: chip «Retoma tu proceso» tras borrar conversación; blindaje de carrera.

### Dashboard y home

- Rachas: batería de mensajes y colores proporcionales al nivel de días.
- Check-in de ánimo: etiquetas cortas (Calma, Tenso, Fatiga, Bien).
- Continuidad de compromisos y sugerencias WAI en dashboard.
- Grafo «Lo que te ayuda»: copy humanizado y chips pulsables.

### Producto e i18n

- Biblioteca de límites IA con hints contextuales (#194).
- Cierre gaps i18n EN fase 1 (#151).
- Fix suscripción en chat, país en configuración, hint primera sesión (modo oscuro).

---

## Validación automatizada

```bash
cd backend && npm run validate:release-1.5.2
cd frontend && npm run validate:release-1.5.2
cd frontend && npm run test:i18n
cd frontend && npm test -- --ci
```

---

## Checklist pre-publicación

### Backend (Render)

- [ ] Deploy `main` con `APP_VERSION=1.5.2`
- [ ] Health check OK
- [ ] Smoke crisis protocol (`npm run smoke:crisis-protocol`)

### Frontend (EAS)

- [ ] `eas build --profile production` iOS (build 41) y Android (27)
- [ ] TestFlight / Play internal con build 1.5.2

### Dispositivo físico (manual)

- [ ] `docs/SMOKE_DISPOSITIVO_CRISIS_I18N.md` — flujo crisis end-to-end
- [ ] `docs/SMOKE_DISPOSITIVO_STREAMING.md` — respuesta streaming en chat
- [ ] Dashboard: racha, check-in ánimo, continuidad TCC tras borrar chat

### Tiendas

- [ ] Notas de versión ES/EN alineadas a este documento
- [ ] Revisión App Store / Play Console

---

## Notas de versión (usuario)

**Español:** Mejoras de estabilidad en el chat, respuestas más fluidas, continuidad de tu proceso tras borrar conversaciones, tarjeta de racha con mensajes variados y pulido del home.

**English:** Chat stability improvements, smoother streaming replies, better session continuity after clearing conversations, varied streak messages, and home polish.

---

*Julio 2026 — Anto 1.5.2*
