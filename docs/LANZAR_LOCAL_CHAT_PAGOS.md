# Cómo lanzar en local para probar Chat y Pagos

Guía para levantar backend y frontend en tu máquina y probar el **chat** y el **sistema de pagos**.

---

## 1. Requisitos

- **Node.js** 20.x
- **MongoDB** (local o Atlas)
- **Cuenta OpenAI** (API key para el chat)
- Para pagos: credenciales de **Mercado Pago** (sandbox) y/o **Apple** (Shared Secret) según la plataforma

---

## 2. Backend

### 2.1 Variables de entorno

En `backend/` crea un archivo `.env` con al menos:

```env
# Obligatorias (chat + auth)
MONGO_URI=mongodb://localhost:27017/anto
JWT_SECRET=tu_secreto_jwt_minimo_32_caracteres
OPENAI_API_KEY=sk-...

# Puerto (el frontend en iOS simulator usa 5001 por defecto)
PORT=5001
```

Para **pagos** añade según lo que vayas a probar:

```env
# Mercado Pago (Android / checkout web) – token de prueba/sandbox
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# Apple (iOS compras in-app) – Shared Secret de App Store Connect
APPLE_SHARED_SECRET=tu_shared_secret_apple
```

Opcional: `FRONTEND_URL=http://localhost:8081` (o la URL que use Expo).

### 2.2 Validar env

Desde la raíz del proyecto (el script busca `.env` en la raíz):

```bash
node backend/scripts/validateEnv.js
```

Si tu `.env` está en `backend/`, el servidor lo cargará igual al hacer `npm run dev` desde `backend/`.

### 2.3 Instalar e iniciar

```bash
cd backend
npm install
PORT=5001 npm run dev
```

Deberías ver algo como: `Servidor corriendo en 0.0.0.0:5001`.

Comprobar: `curl http://localhost:5001/health` → debe responder OK.

---

## 3. Frontend (Expo)

### 3.1 Apuntar al backend local

- **iOS Simulator**: en desarrollo la app ya usa `http://localhost:5001` si no hay `EXPO_PUBLIC_API_URL`.
- **Android Emulador**: suele necesitar la IP de tu máquina o `10.0.2.2:5001`. Crea en `frontend/` un `.env`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5001
```

(En dispositivo físico Android usa la IP de tu PC, ej. `http://192.168.1.10:5001`.)

### 3.2 Instalar e iniciar

```bash
cd frontend
npm install
npm start
```

Luego:

- **i** → abrir en iOS Simulator  
- **a** → abrir en Android Emulator  
- o escanear el QR con **Expo Go** en el móvil (en ese caso el dispositivo debe poder alcanzar `localhost:5001` o la IP que pongas en `EXPO_PUBLIC_API_URL`).

---

## 4. Probar el Chat

1. Abre la app (simulador o Expo Go).
2. Inicia sesión o regístrate.
3. Entra al **Chat** y envía un mensaje.

El chat usa `POST /api/chat/messages` contra tu backend local. Si el backend está en `localhost:5001` y el frontend en iOS Simulator, debería funcionar sin más. Si no ves respuesta, revisa que:

- Backend esté en marcha en el puerto correcto.
- No haya errores en consola del backend (p. ej. `OPENAI_API_KEY` o `MONGO_URI`).

---

## 5. Probar el sistema de pagos

### 5.1 Qué puedes probar con backend local

- **Planes**: la app llama a `GET /api/payments/plans` y `GET /api/payments/subscription-status`. Con el backend local y MongoDB funcionan aunque no completes un pago real.
- **Estado de suscripción / trial**: flujo de “suscribirse”, trial, etc. según cómo tengas los modelos en BD.

### 5.2 Mercado Pago (Android / checkout)

- En el backend, configura `MERCADOPAGO_ACCESS_TOKEN` con un **access token de prueba** (sandbox) de Mercado Pago.
- La app abre la URL de checkout que devuelve el backend; puedes probar el flujo de “ir a pagar” y, en sandbox, usar tarjetas de test de MP.
- Webhooks: si MP debe notificar a tu backend (confirmación de pago), en local necesitas un túnel (ngrok, etc.) y configurar esa URL en MP.

### 5.3 iOS (StoreKit / compras in-app)

- **StoreKit no funciona en Expo Go.** Hace falta un **development build** con módulos nativos.
- Opción recomendada para probar pagos en iOS:

  ```bash
  cd frontend
  npx eas build --profile development --platform ios
  ```

  Luego instala el build en simulador o dispositivo y prueba “Comprar” / “Restaurar compras”.

- En el backend necesitas `APPLE_SHARED_SECRET` (de App Store Connect) para validar recibos. En desarrollo, Apple usa **sandbox**; el backend ya suele reenviar a sandbox si recibe 21007.

---

## 6. Resumen rápido

| Objetivo              | Backend      | Frontend     | Notas                                      |
|-----------------------|-------------|-------------|--------------------------------------------|
| Probar chat           | `PORT=5001 npm run dev` en `backend/` | `npm start` en `frontend/`, abrir en simulador | iOS Simulator usa `localhost:5001` por defecto. |
| Probar planes/estado  | Igual       | Igual       | Sin pagar; solo API de planes y suscripción. |
| Probar pago Android   | + `MERCADOPAGO_ACCESS_TOKEN` (test) | Igual       | Checkout MP en sandbox.                    |
| Probar pago iOS       | + `APPLE_SHARED_SECRET` | **EAS development build** (no Expo Go) | StoreKit solo en build nativo.             |

---

## 7. Problemas frecuentes

- **“Network request failed” en la app**: la app no llega al backend. Revisa `EXPO_PUBLIC_API_URL` y que el puerto (ej. 5001) coincida con el del backend.
- **Chat no responde**: revisa en backend que existan `OPENAI_API_KEY` y `MONGO_URI` y que no haya errores 500 en la consola.
- **Pagos iOS no aparecen / fallan**: confirma que estás en un **development build**, no en Expo Go, y que `APPLE_SHARED_SECRET` está en el `.env` del backend.

---

## 8. "No se pudo conectar con App Store" (iOS)

Ese mensaje viene de **StoreKit**, no del backend (el backend responde 200 en `/subscription-status`). Causas habituales y qué revisar:

1. **Expo Go**  
   StoreKit no está disponible en Expo Go. Tienes que usar un **development build** (`npx eas build --profile development --platform ios` o `npx expo run:ios`).

2. **Cuenta Sandbox**  
   Para pruebas, en el iPhone ve a **Ajustes > App Store > Cuenta (Sandbox)** e inicia sesión con un **Apple ID de prueba** creado en [App Store Connect](https://appstoreconnect.apple.com) (Usuarios y acceso > Sandbox > Probadores). Si no hay sesión Sandbox, la conexión con App Store puede fallar.

3. **Simulador**  
   En el simulador las compras in-app a menudo **fallan** o dan “No se pudo conectar con App Store”. El perfil `development` en este proyecto está configurado con `"simulator": true`, así que el build es **solo para simulador**. Para probar pagos en iOS hace falta un **build para dispositivo físico**:
   - **Opción 1:** `npx eas build --profile preview --platform ios` (build para dispositivo, distribución internal).
   - **Opción 2:** `npx eas build --profile development-device --platform ios` (mismo development client pero para dispositivo; instálalo en el iPhone y prueba StoreKit ahí).

4. **Red y hora**  
   Comprueba que el dispositivo tenga internet y que la fecha/hora sean correctas (Ajustes > General > Fecha y hora).

5. **App Store Connect**  
   En tu app, en App Store Connect > Tu app > Funcionalidades > Compras dentro de la app: los productos deben existir y estar en estado "Listo para enviar" (o equivalente). El **Bundle ID** de la app debe coincidir con el de Xcode/EAS.

Si tras revisar todo sigue fallando, usa la sección siguiente para ver el **error exacto** que devuelve StoreKit/Apple.

---

## 9. Cómo ver el error exacto de StoreKit

Para saber qué está fallando en la conexión con App Store tienes dos opciones.

### Opción A: Logs en Metro (recomendado primero)

1. Arranca la app con Metro desde `frontend/`:
   ```bash
   cd frontend && npm start
   ```
2. Abre la app en el dispositivo o simulador (development build, no Expo Go).
3. Ve a **Suscripción Premium** y toca **Suscribirse** en un plan.
4. En la **terminal donde corre Metro** busca líneas que empiecen por:
   - `[StoreKit] CONNECTION_FAILED:` — Ahí verás el mensaje de error y, si existe, el código.
   - `[StoreKit] ❌` — Detalle adicional del error.

Copia ese mensaje (y el código si aparece). Con eso se puede buscar en la documentación de Apple o en expo-in-app-purchases (p. ej. códigos de `IAPResponseCode`).

### Opción B: Consola del dispositivo en Xcode

1. Conecta el iPhone o iPad por cable (o usa el simulador).
2. En Mac: abre **Xcode** → menú **Window** → **Devices and Simulators** (o `Shift+Cmd+2`).
3. En la lista de la izquierda, selecciona tu **dispositivo** (o simulador).
4. Pulsa **Open Console** (abre la consola de ese dispositivo).
5. En el filtro de la consola escribe: `StoreKit` o `IAP` o `InAppPurchase`.
6. En la app, reproduce el error (entra a Suscripción y toca Suscribirse).
7. En la consola aparecerán mensajes del sistema y de StoreKit; el que salga justo al fallar suele ser el error de Apple.

Si quieres, puedes pegar aquí el mensaje que salga en Metro (`CONNECTION_FAILED`) o el que veas en la consola de Xcode y lo interpretamos.
