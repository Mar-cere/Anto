# Smoke — memoria del proceso / patrones experienciales

**Manual:** marcar en dispositivo o staging tras deploy.

1. [ ] Consent on en Privacidad e IA → Memoria del proceso
2. [ ] Chat sesión A: «las mañanas son lo más difícil» (≥3 turnos sustantivos)
3. [ ] Salir del chat (schedule continuity) → worker crea patrón (o seed manual via API)
4. [ ] Forzar `followUpAt` pasado en DB si hace falta
5. [ ] Sesión B / primer mensaje neutro → Anto retoma con contraste suave **y chips en el mismo turno**
6. [ ] Chips: Sí un poco / Igual / Omitir → status correcto; no reaparece
7. [ ] Home: CTA «proceso para retomar» → abre chat con `resumeExperientialFollowUp` y pregunta
8. [ ] Archivar en UI → silencio
9. [ ] Consent off / crisis / compromiso due: sin follow-up experiencial
10. [ ] ES y EN en chips, CTA home y pantalla

Automatizado: `cd backend && npm run validate:experiential-patterns`
