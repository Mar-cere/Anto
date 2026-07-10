# AGENTS.md

## Agent Skills (guías de producto)

Convenciones de i18n, diseño UI, chat clínico, APIs y narrativa de producto están en `.cursor/skills/` (índice en `.cursor/skills/README.md`). Narrativa completa en `docs/PRODUCT_NARRATIVE.md`. Aplicar la skill que corresponda al tipo de cambio antes de cerrar la tarea. Rules breves en `.cursor/rules/`.

## Cursor Cloud specific instructions

Este repositorio es un único producto, **Anto** (asistente de bienestar emocional con IA), compuesto por dos servicios reales más un scaffold residual:

- `backend/` — API REST + WebSocket (Node 20/22, Express 4, Socket.IO, MongoDB/Mongoose, OpenAI). Entrada: `backend/server.js`.
- `frontend/` — App móvil React Native + Expo SDK 54 (React Navigation, **no** expo-router). Entrada: `frontend/index.ts` → `App.tsx`.
- Raíz (`app/`, `components/`, `app.json`) — scaffold por defecto de `create-expo-app` (plantilla expo-router). **No es el producto**; ignóralo para pruebas end-to-end.

El update script ya instaló dependencias (`npm install` en raíz, `backend/` y `frontend/`) y MongoDB ya está disponible en el sistema. Notas no obvias para arrancar/probar:

### Backend (servicio principal ejecutable aquí)

- **Arranque obligatorio de variables**: `backend/config/config.js` llama a `validateRequiredEnvVars()` al importarse y **lanza error si faltan `OPENAI_API_KEY`, `MONGO_URI`, `JWT_SECRET`**. El servidor no arranca sin las tres. Para desarrollo local, una `OPENAI_API_KEY` placeholder permite arrancar y probar todo el flujo de auth (el chat real sí requiere una clave válida). Crea un `backend/.env` (ignorado por git) con al menos: `PORT=5001`, `MONGO_URI=mongodb://127.0.0.1:27017/anto`, `JWT_SECRET=<min 32 chars>`, `JWT_REFRESH_SECRET=<min 32 chars>`, `OPENAI_API_KEY=<placeholder o real>`. Variables completas documentadas en `docs/ENV.md`.
- **Puerto**: el default del backend es `5000`, pero el cliente Expo en simulador apunta por defecto a `http://localhost:5001` (`frontend/src/config/api.ts`). Para que coincidan, arranca el backend con `PORT=5001` o exporta `EXPO_PUBLIC_API_URL` en el frontend.
- **MongoDB**: no hay systemd en el VM. Arranca el daemon manualmente, p. ej. `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017` (crea `/data/db` si no existe). El backend arranca aunque Mongo esté caído (`/health` devuelve `503`), pero casi todo falla sin él.
- **Comandos**: dev con recarga `npm run dev` (nodemon); typecheck `npm run typecheck`. Health: `GET /health` (devuelve `database: connected` cuando Mongo está activo). Swagger UI en `/api-docs` con `ENABLE_SWAGGER=true`.
- **Tests**: unitarios/i18n no requieren DB (CI los corre solo con `JWT_SECRET`/`OPENAI_API_KEY` dummy): `npm run test:unit`, `npm run test:i18n`, `npm run test:prompt-golden`. Los de integración (`npm run test:integration`) sí requieren MongoDB local (usan `mongodb://localhost:27017/anto-test`). `npm test` corre todo con coverage.
- **Emails/SMS/pagos** (SendGrid, Twilio, Mercado Pago, Cloudinary, Redis) son opcionales: el backend degrada con elegancia si faltan. Para verificar email sin SendGrid, lee `emailVerificationCode` directamente de la colección `users` en Mongo.

### Frontend (app móvil nativa)

- Es una app **nativa** (iOS/Android). **No está configurada para web**: `react-native-web` no está en `frontend/package.json`, así que `expo start --web` falla con `Unable to resolve "react-native-web/...`. No intentes correrla en web.
- En este VM Linux headless no hay simulador iOS/Android, por lo que la UI no se puede visualizar. Sí se puede verificar que **Metro empaqueta** el bundle nativo: arranca `npx expo start` y solicita `GET http://localhost:8081/index.bundle?platform=ios&dev=true` (devuelve HTTP 200 con el bundle JS).
- Comandos: checks estáticos `npm run check` (imports + SafeArea); tests `npm test` (jest-expo); i18n `npm run test:i18n`.

### Scaffold raíz

- `npm run lint` (= `expo lint`) corre sobre el scaffold raíz. La raíz usa yarn como packageManager declarado, pero `npm install` funciona y es lo usado por el update script.

### Estado conocido de tests (no son fallos del entorno)

Sobre `main` limpio hay tests preexistentes que fallan por drift de assertions del código (no por el entorno): en backend `tests/unit/routes/therapeuticTechniquesRoutes.i18n.test.js` (espera 9 temas, recibe 12) y en frontend `chatScreenConstants.test.js` / `profileScreenConstants.test.js` (valores de color desactualizados). No los corrijas como parte del setup.
