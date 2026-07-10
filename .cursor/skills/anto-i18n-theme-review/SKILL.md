---
name: anto-i18n-theme-review
description: >-
  Revisa que cambios de UI, copy y estilos en Anto estén en español e inglés,
  funcionen en tema claro y oscuro, y usen español neutro sin modismos ni voseo.
  Usar al añadir o modificar pantallas, componentes, traducciones, estilos,
  mensajes de error, emails, notificaciones o copy de API en frontend/ o backend/.
---

# Anto — revisión i18n, temas y tono

**Fuente de verdad** para idiomas (ES+EN), compatibilidad claro/oscuro y español neutro. Las demás skills remiten aquí para copy y temas.

## Skills relacionadas

| Si también… | Aplicar |
|-------------|---------|
| Diseñas UI o layout | `anto-ui-design` |
| Redactas copy de producto / onboarding | `anto-product-narrative` |
| Modificas chat o crisis | `anto-chat-clinical` |
| Creas endpoints | `anto-backend-feature` |

Índice: `.cursor/skills/README.md`

---

Aplica este checklist **antes de dar por terminado** cualquier cambio que afecte textos visibles, colores o estilos.

## Checklist rápido

```
Revisión Anto:
- [ ] i18n: claves y textos en ES y EN
- [ ] Tema: claro y oscuro sin colores fijos rotos
- [ ] Tono: español neutro, sin modismos ni voseo
- [ ] Tests: npm run test:i18n en el servicio tocado
```

---

## 1. Internacionalización (ES + EN)

### Frontend

- Traducciones centralizadas en:
  - `frontend/src/constants/translations/es.js`
  - `frontend/src/constants/translations/en.js`
- **Siempre** añadir o actualizar la misma clave en **ambos** archivos.
- Usar `useTranslations()` / `t('clave')`; no hardcodear strings en componentes salvo casos técnicos (logs, IDs).
- Las claves deben coincidir (validado por `translationsParity.test.js`).

### Backend

- Copy de API en módulos `backend/utils/*ApiCopy.js` con bloques `es` y `en`.
- Cada factory exportada debe devolver las **mismas claves** en ambos idiomas (validado por `apiCopyParity.test.js`).
- Rutas usan `req.apiCopy`; no inlinear mensajes en controllers.
- Emails y notificaciones push también tienen variantes ES/EN — revisar si el cambio aplica ahí.

### Al añadir una clave nueva

1. Definir en `es.js` y `en.js` (o en el `*ApiCopy.js` correspondiente).
2. Verificar que la traducción EN sea natural, no literal palabra por palabra.
3. Verificar que la traducción ES sea neutra (ver sección 3).

---

## 2. Temas (claro + oscuro)

### Regla general

Los componentes deben funcionar en **tema claro y oscuro** sin perder contraste ni legibilidad.

### Cómo hacerlo bien

- Usar `useTheme()` de `frontend/src/context/ThemeContext.js`:
  ```js
  const { colors, resolvedScheme, statusBarStyle } = useTheme();
  ```
- Consumir tokens de `colors` (`text`, `surface`, `border`, `primary`, etc.) definidos en `frontend/src/styles/themePalettes.js`.
- `lightColors` y `darkColors` comparten las **mismas claves** — si añades un token nuevo, añádelo en ambas paletas.

### Evitar

- Colores hex/rgba fijos en JSX o StyleSheet que solo funcionen en un tema:
  - `#FFFFFF`, `#000000`, `#24234F` sueltos en componentes.
  - `backgroundColor: 'white'` o `color: 'black'`.
- Sombras o bordes con opacidad pensados solo para fondo claro.
- Iconos o imágenes sin variante para fondo oscuro cuando el contraste falla.

### Patrones del proyecto

- Estilos de dashboard: `createDashboardStyles(colors, resolvedScheme)` en `frontend/src/styles/dashboardTheme.js`.
- Cuando un componente necesita lógica por esquema: ramificar con `resolvedScheme === 'dark'`, no con colores mágicos.
- Si se añade un token de color nuevo a `themePalettes.js`, definir valor en **light y dark**.

### Verificación manual

Mentalmente (o en simulador) comprobar:
- Texto legible sobre fondo (`text` vs `surface` / `background`).
- Bordes y divisores visibles en ambos temas.
- Botones, chips y estados disabled con contraste adecuado.

---

## 3. Tono — español neutro

Todo copy en español debe ser **neutro latinoamericano**: comprensible en cualquier país hispanohablante, sin regionalismos.

### Usar

- «puedes», «quieres», «tienes», «mira», «deja», «cuéntame»
- «¿Estás seguro de que deseas…?» (con «de que»)
- Tuteo estándar (tú), no voseo

### Evitar

**Voseo** (detectado por `copyToneGuards.mjs` y `translationsTone.test.js`):
- podés, querés, tenés, sabés, andá, dejá, contame, seguí, mirá, vení, decí, sentí, recordá, llegás, sentís, tocá, decime

**Modismos y regionalismos** (ejemplos no exhaustivos):
- Argentina: che, boludo, laburo, pibe, copado
- México: güey, chido, padre (como «genial»), ahorita
- España: vale (como muletilla), mola, tío
- Chile: cachai, po, fome
- Cualquier jerga local que un usuario de otro país no entendería

**Inglés en ES**: no dejar palabras en inglés en cadenas `es` salvo nombres de producto o términos técnicos inevitables.

### Inglés (EN)

- Frases naturales, no traducción literal rígida.
- Errores: preferir «Could not load…» sobre «Error loading…».
- Sin caracteres españoles (á, é, ñ…) en cadenas `en` (salvo claves `_ES` de preload).
- Evitar tono excesivamente formal («shall we»).

---

## 4. Flujo de revisión al terminar cambios

### Paso 1 — Inventario

Identificar todo texto o estilo nuevo/modificado en el diff:
- Claves `t('…')` o strings en JSX.
- Entradas en `es.js` / `en.js` o `*ApiCopy.js`.
- `StyleSheet`, colores inline, nuevos tokens en `themePalettes.js`.

### Paso 2 — Corregir omisiones

| Falta | Acción |
|-------|--------|
| Clave solo en `es.js` | Añadir equivalente en `en.js` |
| Clave solo en `en.js` | Añadir equivalente en `es.js` |
| Mensaje API solo en ES | Añadir en bloque `en` del `*ApiCopy.js` |
| Color fijo en componente | Reemplazar por token de `colors` |
| Token solo en `lightColors` | Añadir en `darkColors` |
| Voseo o modismo en ES | Reescribir en neutro |

### Paso 3 — Ejecutar tests

Desde el directorio del servicio modificado:

```bash
# Frontend (traducciones, tono, temas de dashboard)
cd frontend && npm run test:i18n

# Backend (paridad ApiCopy, rutas i18n, tono)
cd backend && npm run test:i18n
```

Si el cambio es acotado a un módulo con test propio (p. ej. `sessionWaiI18n`, `crisisRoutes.i18n`), ejecutar también ese test.

### Paso 4 — Reportar al usuario

Al cerrar la tarea, indicar brevemente:
- Qué claves o copy se añadieron en ES/EN.
- Si se verificó compatibilidad con tema claro/oscuro.
- Resultado de `npm run test:i18n` (o si no se ejecutó, por qué).

---

## 5. Árbol de decisión

```
¿El cambio incluye texto visible al usuario?
├─ No → Solo revisar temas si hay estilos/colores nuevos
└─ Sí
   ├─ ¿Es UI (frontend)?
   │  └─ Actualizar es.js + en.js; usar t(); revisar tono
   ├─ ¿Es API (backend)?
   │  └─ Actualizar *ApiCopy.js (es + en); revisar tono
   └─ ¿Es email/push?
      └─ Buscar plantillas o copy EN correspondiente

¿El cambio incluye colores o estilos?
├─ No → Listo tras i18n
└─ Sí
   └─ Usar useTheme() / themePalettes; probar claro y oscuro
```

---

## Referencias del repo

| Qué | Dónde |
|-----|-------|
| Traducciones UI | `frontend/src/constants/translations/es.js`, `en.js` |
| Paridad de claves UI | `frontend/src/constants/translations/__tests__/translationsParity.test.js` |
| Tono UI | `frontend/src/constants/translations/__tests__/translationsTone.test.js` |
| Tema | `frontend/src/context/ThemeContext.js`, `frontend/src/styles/themePalettes.js` |
| Copy API | `backend/utils/*ApiCopy.js` |
| Paridad API | `backend/tests/unit/i18n/apiCopyParity.test.js` |
| Guardas de tono | `backend/utils/copyToneGuards.mjs` |
