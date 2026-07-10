---
name: anto-backend-feature
description: >-
  Patrón para añadir o modificar endpoints REST en el backend de Anto: rutas,
  ApiCopy ES/EN, validación Joi, middleware, registro en server.js y tests.
  Usar al crear APIs, rutas, mensajes de error, schemas o servicios en backend/.
---

# Anto — nueva feature de backend (API)

Patrón estándar del backend Express + Mongoose. Sigue este flujo al añadir o extender endpoints.

Complementa **anto-i18n-theme-review** (copy ES/EN) y **anto-chat-clinical** si el endpoint es de chat.

## Skills relacionadas

| Si también… | Aplicar |
|-------------|---------|
| Mensajes al usuario | `anto-i18n-theme-review` |
| Rutas de chat/crisis | `anto-chat-clinical` |
| Pantalla que consume la API | `anto-ui-design` |
| Evaluar si la feature encaja en el ecosistema | `anto-product-narrative` |

Índice: `.cursor/skills/README.md`

---

## Estructura de archivos

Para un dominio `miRecurso`:

```
backend/
├── routes/miRecursoRoutes.js       # Endpoints Express
├── utils/miRecursoApiCopy.js       # Mensajes ES/EN
├── utils/miRecursoSchemas.js       # Joi con mensajes localizados (opcional)
├── models/MiRecurso.js             # Mongoose (si persiste)
├── services/miRecursoService.js    # Lógica de negocio (si es compleja)
└── tests/unit/
    ├── routes/miRecursoRoutes.i18n.test.js
    └── utils/miRecursoApiCopy.test.js  (opcional)
```

---

## Plantilla de ruta

```js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { attachApiCopy } from '../middleware/apiLanguageMiddleware.js';
import { validateObjectId } from '../middleware/validation.js';
import { createRateLimiter } from '../utils/createRateLimiter.js';
import { resolveRequestLanguage } from '../utils/apiLanguage.js';
import { validateBody, validationErrorBody } from '../utils/apiValidation.js';
import { miRecursoApiCopy } from '../utils/miRecursoApiCopy.js';
import { getCreateMiRecursoSchema } from '../utils/miRecursoSchemas.js';

const router = express.Router();
router.use(attachApiCopy(miRecursoApiCopy));
router.use(authenticateToken);

const createLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: (req) => miRecursoApiCopy(resolveRequestLanguage(req)).rateLimitCreate,
});

router.post('/', createLimiter, async (req, res) => {
  const copy = req.apiCopy;
  try {
    const { error, value } = validateBody(getCreateMiRecursoSchema(copy), req.body);
    if (error) {
      return res.status(400).json(validationErrorBody(copy, error));
    }
    // ... lógica ...
    return res.status(201).json({ success: true, message: copy.createdSuccess, data: result });
  } catch (err) {
    return res.status(500).json({ message: copy.createError });
  }
});

export default router;
```

### Referencia real

`backend/routes/journalRoutes.js` — rate limits, `attachApiCopy`, Joi, `req.apiCopy`.

---

## ApiCopy (`*ApiCopy.js`)

```js
import { normalizeApiLanguage } from './apiLanguage.js';

const COPY = {
  es: { createdSuccess: '...', createError: '...', joiTitleRequired: '...' },
  en: { createdSuccess: '...', createError: '...', joiTitleRequired: '...' },
};

export function miRecursoApiCopy(language) {
  return COPY[normalizeApiLanguage(language)];
}
```

**Reglas:**
- Mismas claves en `es` y `en` (validado por `apiCopyParity.test.js`).
- Mensajes Joi en el copy (`joi*`).
- Tono y español neutro: skill **anto-i18n-theme-review**.
- Exportar factory `miRecursoApiCopy`, no objeto plano.

---

## Idioma del request

Resolución automática vía `attachApiCopy`:

1. Header `X-App-Language` (preferido, lo envía el cliente Expo)
2. Query `?language=`
3. `Accept-Language`
4. `req.user.preferences.language`

En handlers: `const copy = req.apiCopy` (ya resuelto).

Para rate limiters fuera del middleware: `miRecursoApiCopy(resolveRequestLanguage(req))`.

---

## Validación Joi

Schemas como funciones que reciben `copy` para mensajes localizados:

```js
export function getCreateMiRecursoSchema(copy) {
  return Joi.object({
    title: Joi.string().required().max(100).messages({
      'any.required': copy.joiTitleRequired,
      'string.max': copy.joiTitleMax,
    }),
  });
}
```

Respuesta de error estándar:

```js
import { validateBody, validationErrorBody } from '../utils/apiValidation.js';

const { error, value } = validateBody(schema, req.body);
if (error) return res.status(400).json(validationErrorBody(copy, error));
```

---

## Middleware habitual

| Middleware | Cuándo |
|------------|--------|
| `attachApiCopy(factory)` | Siempre en el router |
| `authenticateToken` | Rutas autenticadas (casi todas) |
| `validateObjectId` | Params `:id` de Mongo |
| `createRateLimiter` | POST/PUT/DELETE sensibles |
| Admin checks | Rutas internas (ver `paymentRecoveryRoutes`) |

---

## Registrar en `server.js`

```js
import miRecursoRoutes from './routes/miRecursoRoutes.js';
// ...
app.use('/api/mi-recurso', miRecursoRoutes);
```

Convención de paths existentes: kebab-case plural (`/api/abc-records`, `/api/daily-mood`).

---

## Respuestas JSON

Patrón común del proyecto:

```js
// Éxito
res.status(201).json({ success: true, message: copy.createdSuccess, data: doc });
res.status(200).json({ success: true, message: copy.updatedSuccess, data: doc });

// Error
res.status(404).json({ message: copy.notFound });
res.status(400).json(validationErrorBody(copy, error));
res.status(500).json({ message: copy.internalError });
```

No hardcodear strings en controllers; siempre `req.apiCopy`.

---

## Checklist al terminar

```
Backend feature:
- [ ] Ruta en routes/ + registro en server.js
- [ ] *ApiCopy.js con claves idénticas es/en
- [ ] Joi con mensajes desde copy (si hay body)
- [ ] authenticateToken y rate limit si aplica
- [ ] Sin strings hardcodeados en handlers
- [ ] Test i18n mínimo (401 sin auth con X-App-Language: en)
- [ ] Cierre con skill anto-i18n-theme-review (npm run test:i18n)
- [ ] Suite de dominio si existe (ver tabla abajo)
```

---

## Tests

### Test i18n mínimo (`*Routes.i18n.test.js`)

```js
import request from 'supertest';
import express from 'express';
import miRecursoRoutes from '../../../routes/miRecursoRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/mi-recurso', miRecursoRoutes);

describe('MiRecurso routes i18n', () => {
  it('POST sin auth rechaza 401', async () => {
    const res = await request(app)
      .post('/api/mi-recurso')
      .set('X-App-Language', 'en')
      .send({ title: 'test' });
    expect(res.status).toBe(401);
  });
});
```

Añadir el patrón del nuevo test a `testPathPattern` en `backend/package.json` → script `test:i18n` si el test no se detecta automáticamente (verificar nombre del archivo contra el pattern existente).

### Comandos

```bash
cd backend && npm run test:i18n          # paridad ApiCopy + rutas i18n
cd backend && npm run test:unit          # unitarios sin DB
cd backend && npm run test:integration   # requiere Mongo local
```

### Suites por dominio

| Dominio | Suite |
|---------|-------|
| ABC | `npm run test:abc-suite` |
| Exposición | `npm run test:exposure-suite` |
| Activación conductual | `npm run test:ba-suite` |
| Crisis | `npm run test:crisis-protocol-suite` |
| Chat / sesión | `npm run test:session-wai-suite` |
| Streaming | `npm run test:streaming-suite` |
| Dashboard | `npm run test:dashboard-suite` |
| TCC lite | `npm run test:tcc-lite-suite` |

---

## Árbol de decisión

```
¿Nuevo endpoint?
├─ Crear *Routes.js + *ApiCopy.js
├─ Registrar en server.js
└─ Test i18n mínimo

¿Valida body?
├─ Crear *Schemas.js con Joi + mensajes de copy
└─ validateBody + validationErrorBody

¿Lógica compleja?
└─ Extraer a services/; ruta solo orquesta

¿Mensajes al usuario?
└─ Solo vía req.apiCopy (skill anto-i18n-theme-review)

¿Toca chat o crisis?
└─ Además: skill anto-chat-clinical
```

---

## Anti-patrones

- Mensajes en español fijos en `res.json({ message: 'Error...' })`
- Claves solo en `es` del ApiCopy
- Joi con strings en inglés hardcodeados
- Olvidar `authenticateToken` en rutas de usuario
- Lógica de negocio de 200 líneas dentro del handler de ruta
- Olvidar registrar la ruta en `server.js`
- Crear endpoint sin test i18n cuando el resto del dominio lo tiene

---

## Referencias

| Qué | Dónde |
|-----|-------|
| Ejemplo completo | `backend/routes/journalRoutes.js` |
| ApiCopy | `backend/utils/journalApiCopy.js` |
| Schemas Joi | `backend/utils/journalSchemas.js` |
| Middleware idioma | `backend/middleware/apiLanguageMiddleware.js` |
| Resolución idioma | `backend/utils/apiLanguage.js` |
| Validación | `backend/utils/apiValidation.js` |
| Paridad copy | `backend/tests/unit/i18n/apiCopyParity.test.js` |
| Contratos API | `docs/CONTRATOS_API.md` |
| Variables entorno | `docs/ENV.md` |
| Arranque local | `AGENTS.md` |
