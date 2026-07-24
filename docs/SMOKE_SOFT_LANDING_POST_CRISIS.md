# Smoke — Soft landing post-crisis (#225)

Checklist para validar [CONTRATO_SOFT_LANDING_POST_CRISIS_V1.md](./CONTRATO_SOFT_LANDING_POST_CRISIS_V1.md) (v1.1).

**Automatizado (sin dispositivo):**

```bash
cd backend
node scripts/smoke-soft-landing-v1.mjs
npm test -- --testPathPattern='postCrisisWindowGuard|softLandingPostCrisis|commitmentPostCrisisGuard'
```

**Manual (opcional, dispositivo) — incluye v1.1:**

1. [ ] Tras hard-stop o salida de protocolo, en las siguientes 48 h el chat no propone tareas/hábitos/TCC/psicoed automática.
2. [ ] Primera apertura de chat en ventana: strip con respiración/grounding; dismiss no lo remuestra.
3. [ ] Home muestra línea calmada mientras la ventana está activa.
4. [ ] Si hay panel de crisis o soft check-in #19, el soft landing cede.
5. [ ] Push de follow-up (si activo) usa tono de presencia; sin mensajes fantasma en el hilo.
6. [ ] Con `ENABLE_SOFT_LANDING_POST_CRISIS=false`: sin strip/home/snippet.
7. [ ] v1.1: tap en respiración/grounding del strip (telemetría best-effort).
8. [ ] v1.1: check-in de ánimo en home no ofrece hábito/tarea/BA; sí regulación o retomar chat.

**Registro:** dispositivo, OS, build, idioma, fecha, tester.
