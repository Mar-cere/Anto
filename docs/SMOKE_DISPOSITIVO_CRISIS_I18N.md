# Smoke en dispositivo físico — Crisis + i18n EN

Checklist manual para cerrar **#10**, **#93**, **#205** y **#151** de **Sí*** a **Sí** en la matriz.

**Automatizado (CI / local, sin dispositivo):**

```bash
cd backend
npm run test:crisis-protocol-suite   # unitarios + smoke wiring
npm run test:i18n-en-device-suite    # smoke wiring EN
```

**Manual:** este documento. Marcar cada ítem en dispositivo real (iOS y/o Android, build **1.5.1**).

---

## Pre-requisitos

- [ ] Build **1.5.1** (dev client o TestFlight/Play internal)
- [ ] Usuario de prueba con **contacto de emergencia** configurado (WhatsApp si aplica)
- [ ] País/región configurado en Ajustes (p. ej. España o Chile) para validar líneas
- [ ] Sin mensajes reales a líneas de emergencia salvo prueba consciente del entorno

**Registro:** anotar dispositivo, OS, build, idioma, fecha y tester.

| Campo | Valor |
|-------|-------|
| Dispositivo / OS | |
| Build app | |
| Tester | |
| Fecha | |

---

## A. Protocolo crisis — español (#93, #10, #205)

### A1. Activación y panel (camino A / hard-stop)

1. [ ] En chat, enviar mensaje con señal **HIGH** (p. ej. ideación explícita de daño)
2. [ ] Aparece **panel de recursos** (`CrisisResourcesStrip`) con líneas del país
3. [ ] Se muestran bloques de transparencia **T1–T4** (por qué, qué hace Anto, límites, acompañamiento)
4. [ ] Botón **(i)** abre hint de límites IA (tema crisis) → biblioteca completa navegable
5. [ ] **Llamar** abre el marcador (`tel:`) en una línea
6. [ ] Enlace **Contactos de emergencia** abre Perfil/modal

### A2. Alerta contactos — MEDIUM (oferta preguntada)

1. [ ] Con contactos configurados, provocar señal **MEDIUM** (según entorno de prueba)
2. [ ] Aparece burbuja **oferta Sí/No** (sin enviar alerta automática)
3. [ ] **No** cierra la oferta; no re-oferta en la misma sesión de protocolo
4. [ ] **Sí** confirma; aviso post-envío visible (T5 / copy §5.3 si aplica)
5. [ ] Hint **(i)** en oferta explica contactos de emergencia

### A3. Salida de protocolo

1. [ ] Tras mensaje explícito de bienestar («ya estoy bien») **o** 2 turnos estables, el protocolo sale
2. [ ] El panel de crisis deja de forzarse en turnos siguientes de bajo riesgo
3. [ ] No se reactivan sugerencias de tareas/hábitos intrusivas en hard-stop

### A4. Camino B (LLM blindado, si aplica en staging)

1. [ ] En MEDIUM sin hard-stop, la respuesta mantiene tono de contención (sin consejos clínicos)
2. [ ] No aparece copy de «plan de seguridad» ni diagnóstico

**Resultado A:** ☐ OK  ☐ Fallos (describir):

---

## B. Protocolo crisis — inglés (#151 + crisis copy EN)

1. [ ] Ajustes → idioma **English**; reiniciar chat si hace falta
2. [ ] Repetir **A1** (panel, T1–T4, Call, Emergency contacts) — textos en **inglés**
3. [ ] Repetir **A2** (offer Yes/No) — copy en inglés
4. [ ] Biblioteca límites IA en inglés desde hint del panel

**Resultado B:** ☐ OK  ☐ Fallos:

---

## C. i18n EN — recorrido producto (#151)

Con idioma **English** activo:

| Pantalla | Comprobar |
|----------|-----------|
| Inicio / Dashboard | Sin strings en español visibles |
| Chat (welcome + menú) | Opciones, placeholder, menú ⋮ |
| Tareas | Secciones *Today*, *Tomorrow*, *This week*, *Later*, *Completed* |
| Hábitos | Títulos y estados |
| Técnicas / TCC / Psicoed | Al menos 1 wizard y biblioteca |
| Ajustes → Privacidad e IA | Biblioteca límites + política |
| FAQ | Contenido en inglés |
| Perfil → contactos emergencia | Labels en inglés |

1. [ ] Cambio de idioma persiste tras cerrar y reabrir app
2. [ ] Push de prueba (si disponible) llega en inglés
3. [ ] Email transaccional de prueba (verificación / welcome) en inglés

**Revisión nativa EN (proceso):** copy suena natural; anotar frases a pulir.

**Resultado C:** ☐ OK  ☐ Fallos:

---

## D. Cierre y matriz

Cuando **A + B + C** estén OK en al menos un dispositivo por plataforma objetivo:

1. Marcar en [PROTOCOLO_CRISIS_V1.md](./PROTOCOLO_CRISIS_V1.md) §8 los ítems de smoke dispositivo
2. Actualizar matriz: **#10**, **#93**, **#205**, **#151** → **Sí**
3. Archivar este checklist con fecha y enlaces a capturas (opcional)

| Propuesta | Antes | Después (si smoke OK) |
|-----------|-------|------------------------|
| #10 Transparencia crisis | Sí* | Sí |
| #93 Protocolo ideación | Sí* | Sí |
| #205 Guardrails crisis | Sí* | Sí |
| #151 i18n EN fase 1 | Sí* | Sí |

---

*Última actualización: 30 jun 2026 — complementa smoke automatizado `smoke-crisis-protocol-device.mjs` y `smoke-i18n-en-device.mjs`.*
