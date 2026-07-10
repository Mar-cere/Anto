# Skills de Anto

Guías para el agente de Cursor. Cada skill se activa por descripción o al invocarla por nombre.

## Cuándo usar cada una

| Tipo de cambio | Skills (en orden) |
|----------------|-------------------|
| Pantalla o componente UI | `anto-ui-design` → `anto-i18n-theme-review` |
| Solo copy / traducciones / colores | `anto-i18n-theme-review` |
| Copy de producto, onboarding, naming, **nueva funcionalidad** | `anto-product-narrative` (5 preguntas) → `anto-i18n-theme-review` (+ UI o clinical según capa) |
| Chat, prompts, crisis, IA | `anto-chat-clinical` → `anto-product-narrative` → `anto-i18n-theme-review` |
| Endpoint o API backend | `anto-backend-feature` → `anto-i18n-theme-review` |
| Chat + API (p. ej. acciones desde chat) | `anto-chat-clinical` → `anto-backend-feature` → `anto-i18n-theme-review` |
| Rediseño visual completo | `anto-ui-design` → `anto-product-narrative` → `anto-i18n-theme-review` |

## Catálogo

| Skill | Carpeta | Responsabilidad |
|-------|---------|-----------------|
| Product narrative | `anto-product-narrative/` | North Star, ecosistema, 5 pilares, filtro de features |
| i18n, temas y tono | `anto-i18n-theme-review/` | ES+EN, claro/oscuro, español neutro |
| Diseño UI | `anto-ui-design/` | Tokens, glass/chrome, layout, navegación |
| Chat y clínica | `anto-chat-clinical/` | Crisis, guardrails, acciones de producto |
| Backend API | `anto-backend-feature/` | Rutas, ApiCopy, Joi, tests |

## Rules complementarias

Las rules en `.cursor/rules/` son recordatorios breves al editar archivos concretos:

| Rule | Alcance |
|------|---------|
| `anto-i18n-theme.mdc` | `frontend/src/**`, `*ApiCopy.js`, `backend/routes/**` |
| `anto-chat-clinical.mdc` | Rutas/servicios de chat y crisis |
| `anto-backend-feature.mdc` | `backend/routes/**`, `backend/utils/*ApiCopy.js` |

## Mantenimiento

Actualizar la skill correspondiente cuando cambie en el repo:

- Protocolo de crisis, guardrails o contratos de chat → `anto-chat-clinical`
- Promesa de producto, North Star, voz de marca o features → `anto-product-narrative` (+ `docs/PRODUCT_NARRATIVE.md` v2)
- Patrón de rutas, ApiCopy o middleware → `anto-backend-feature`
- Tokens de tema, espaciado o patrones visuales → `anto-ui-design`
- Reglas de i18n, tono o paridad de claves → `anto-i18n-theme-review`

Tras cambios grandes en `docs/`, revisar si la skill citada sigue alineada.
