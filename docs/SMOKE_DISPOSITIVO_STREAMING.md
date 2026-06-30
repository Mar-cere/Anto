# Smoke en dispositivo físico — Streaming / TTFT (#59, #128)

Checklist manual para cerrar **#59** y **#128** de **Sí*** a **Sí** en la matriz.

**Automatizado (CI / local, sin dispositivo):**

```bash
cd backend
npm run test:streaming-suite
```

**Manual:** este documento. Marcar en dispositivo real (iOS y/o Android, build **1.5.1**).

---

## Pre-requisitos

- [ ] Build **1.5.1** (dev client o TestFlight/Play internal)
- [ ] Usuario registrado con suscripción activa
- [ ] Red estable (Wi‑Fi o datos); anotar si se prueba también con red lenta

| Campo | Valor |
|-------|-------|
| Dispositivo / OS | |
| Build app | |
| Tester | |
| Fecha | |

---

## A. Socket (camino principal) — #128

1. [ ] Abrir chat y enviar mensaje de saludo simple
2. [ ] El texto del asistente **aparece por trozos** antes de terminar (no todo de golpe al final)
3. [ ] Los puntos de «escribiendo…» / burbuja vacía desaparecen al llegar el primer trozo
4. [ ] Al terminar el turno, metadata intacta: sugerencias, TCC lite o acciones de producto si aplican
5. [ ] Cancelar respuesta (si UI lo permite): el stream se detiene sin mensaje final duplicado

## B. Fallback SSE — #59

1. [ ] Forzar fallback (p. ej. desconectar socket / modo avión breve al enviar) o entorno sin socket
2. [ ] El mensaje igualmente llega por streaming o respuesta completa sin error bloqueante
3. [ ] No hay doble respuesta (user + assistant duplicados)

## C. Percepción TTFT

1. [ ] Primera frase visible en **< 3 s** en mensaje simple (red normal)
2. [ ] En crisis hard-stop, el panel + texto aparecen sin espera larga en blanco

## D. Cierre y matriz

Cuando **A + B + C** estén OK:

1. Actualizar matriz: **#59**, **#128** → **Sí**
2. Archivar checklist con fecha (opcional: captura de video del stream)

| Propuesta | Antes | Después (si smoke OK) |
|-----------|-------|------------------------|
| #59 Streaming / TTFT | Sí* | Sí |
| #128 Socket paridad SSE | Sí* | Sí |

---

*Última actualización: 30 jun 2026 — complementa `test:streaming-suite` y `smoke:streaming`.*
