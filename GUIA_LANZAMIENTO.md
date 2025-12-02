# 🚀 Guía de Lanzamiento - Anto App

Esta guía te ayudará a lanzar la aplicación Anto paso a paso.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 20.x o superior)
- **npm** o **yarn**
- **MongoDB** (local o MongoDB Atlas)
- **Expo CLI** (se instala automáticamente con npm)
- **Cuenta de OpenAI** (para la API key)
- **Cuenta de Mercado Pago** (opcional, para pagos)
- **Cuenta de SendGrid** (opcional, para emails)

## 🔧 Paso 1: Configurar el Backend

### 1.1. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 1.2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:

```env
# Base de Datos (OBLIGATORIO)
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/anto

# Autenticación (OBLIGATORIO)
JWT_SECRET=tu-secret-super-seguro-de-al-menos-32-caracteres-aqui

# OpenAI (OBLIGATORIO)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Puerto del servidor (opcional, por defecto 5000)
PORT=5000

# Email (Opcional - Recomendado para producción)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@tudominio.com

# Pagos - Mercado Pago (Opcional)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx

# Error Tracking - Sentry (Opcional)
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxx

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:8081
```

**Nota:** Consulta `backend/ENV_EXAMPLE.md` para más detalles sobre las variables de entorno.

### 1.3. Validar configuración

```bash
cd backend
node scripts/validateEnv.js
```

### 1.4. Iniciar el servidor backend

**Modo desarrollo (con auto-reload):**
```bash
cd backend
npm run dev
```

**Modo producción:**
```bash
cd backend
npm start
```

El servidor debería iniciarse en `http://localhost:5000` (o el puerto que hayas configurado).

## 📱 Paso 2: Configurar el Frontend

### 2.1. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 2.2. Configurar URL del backend

Crea un archivo `.env` en la carpeta `frontend/` con:

```env
# URL del backend
EXPO_PUBLIC_API_URL=http://localhost:5000
```

**Nota:** Si estás usando un dispositivo físico o emulador:
- **Android Emulator**: Usa `http://10.0.2.2:5000`
- **iOS Simulator**: Usa `http://localhost:5000`
- **Dispositivo físico**: Usa la IP local de tu computadora (ej: `http://192.168.1.100:5000`)

### 2.3. Iniciar el frontend

```bash
cd frontend
npm start
```

Esto abrirá Expo DevTools en tu navegador. Desde ahí puedes:
- Presionar `a` para abrir en Android
- Presionar `i` para abrir en iOS
- Escanear el código QR con la app Expo Go (en tu dispositivo físico)

## 🎯 Paso 3: Verificar que todo funciona

### 3.1. Verificar backend

Abre tu navegador y visita:
- `http://localhost:5000/health` - Debería mostrar el estado del servidor
- `http://localhost:5000/api-docs` - Documentación Swagger (si está configurada)

### 3.2. Verificar frontend

Una vez que el frontend esté corriendo:
1. Abre la app en tu dispositivo/emulador
2. Intenta registrarte o iniciar sesión
3. Verifica que puedas enviar mensajes en el chat

## 🔍 Solución de Problemas

### El backend no inicia

1. **Verifica las variables de entorno:**
   ```bash
   cd backend
   node scripts/validateEnv.js
   ```

2. **Verifica que MongoDB esté accesible:**
   ```bash
   cd backend
   node scripts/checkDatabase.js
   ```

3. **Verifica que el puerto no esté en uso:**
   - Cambia el `PORT` en el archivo `.env` si el puerto 5000 está ocupado

### El frontend no se conecta al backend

1. **Verifica la URL del backend:**
   - Asegúrate de que `EXPO_PUBLIC_API_URL` en `frontend/.env` sea correcta
   - Para Android Emulator: `http://10.0.2.2:5000`
   - Para iOS Simulator: `http://localhost:5000`
   - Para dispositivo físico: Usa la IP local de tu computadora

2. **Verifica CORS:**
   - Asegúrate de que `FRONTEND_URL` en `backend/.env` coincida con la URL que usa el frontend

3. **Verifica que el backend esté corriendo:**
   - Visita `http://localhost:5000/health` en tu navegador

### Errores de autenticación

1. **Verifica que `JWT_SECRET` esté configurado** en `backend/.env`
2. **Asegúrate de que el secret tenga al menos 32 caracteres**

### Errores de OpenAI

1. **Verifica que `OPENAI_API_KEY` esté configurada** en `backend/.env`
2. **Asegúrate de que la API key sea válida y tenga créditos disponibles**

## 📦 Comandos Útiles

### Backend

```bash
# Iniciar en modo desarrollo
cd backend && npm run dev

# Iniciar en modo producción
cd backend && npm start

# Ejecutar tests
cd backend && npm test

# Validar variables de entorno
cd backend && node scripts/validateEnv.js

# Verificar conexión a la base de datos
cd backend && node scripts/checkDatabase.js
```

### Frontend

```bash
# Iniciar Expo
cd frontend && npm start

# Iniciar en Android
cd frontend && npm run android

# Iniciar en iOS
cd frontend && npm run ios

# Iniciar en web
cd frontend && npm run web
```

## 🚀 Despliegue en Producción

### Backend (Render, Heroku, etc.)

1. Configura las variables de entorno en tu plataforma de hosting
2. Asegúrate de que `NODE_ENV=production`
3. El servidor se iniciará automáticamente con `npm start`

### Frontend (Expo)

1. **Build para producción:**
   ```bash
   cd frontend
   eas build --platform android
   eas build --platform ios
   ```

2. **Actualiza `EXPO_PUBLIC_API_URL`** con la URL de tu backend en producción

3. **Publica la app:**
   ```bash
   eas update
   ```

## 📚 Recursos Adicionales

- **Documentación de variables de entorno:** `backend/ENV_EXAMPLE.md`
- **Documentación de testing:** `backend/README_TESTING.md`
- **Documentación de configuración de WhatsApp:** `backend/docs/WHATSAPP_SETUP.md`
- **Documentación de configuración de Mercado Pago:** `backend/docs/CONFIGURACION_PLANES_MERCADOPAGO.md`

## ✅ Checklist Pre-Lanzamiento

- [ ] Variables de entorno configuradas
- [ ] Backend iniciado y funcionando
- [ ] Frontend iniciado y conectado al backend
- [ ] Base de datos accesible
- [ ] API de OpenAI funcionando
- [ ] Autenticación funcionando
- [ ] Chat funcionando
- [ ] Notificaciones push configuradas (opcional)
- [ ] Pagos configurados (opcional)

---

¿Necesitas ayuda? Revisa los logs del servidor o los mensajes de error en la consola.

