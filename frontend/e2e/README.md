# Pruebas E2E (Maestro)

Este directorio contiene flujos [Maestro](https://maestro.mobile.dev/) para Android/iOS.

## Requisitos

- [Maestro CLI](https://maestro.mobile.dev/getting-started/installation) instalado (`maestro` en PATH).
- Build de la app con el bundle **`com.anto.app`** (ver `frontend/app.json`).

## Ejecutar

Desde la raíz del repo:

```bash
maestro test frontend/e2e/maestro/chat-roundtrip-from-tabs.yaml
```

Flujo opcional (solo si la app arranca en la pantalla Home sin sesión o con prerequisitos documentados en el YAML):

```bash
maestro test frontend/e2e/maestro/emergency-chat-home-back.yaml
```

## Flujos

| Archivo | Descripción |
|--------|-------------|
| `maestro/chat-roundtrip-from-tabs.yaml` | MainTabs → abrir Chat (FAB) → atrás → Home. Requiere usuario ya en tabs. |
| `maestro/emergency-chat-home-back.yaml` | Home → banner emergencia → Chat → atrás → Home. Suele requerir no estar logueado o estado concreto. |

Los `testID` usados están en `EmotionBanner`, `FloatingNavBar`, `ChatHeader` y `HomeScreen`.
