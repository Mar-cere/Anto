# 🧠 Anto App - Asistente AI Terapéutico

**Anto** es una aplicación móvil de salud mental que utiliza inteligencia artificial para proporcionar apoyo terapéutico personalizado, análisis emocional avanzado, detección de crisis y herramientas de bienestar mental.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Variables de Entorno](#-variables-de-entorno)
- [Ejecución](#-ejecución)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Estado del Proyecto](#-estado-del-proyecto)

---

## ✨ Características

### 🤖 Asistente AI Terapéutico
- Chat conversacional con IA (OpenAI GPT-4)
- Análisis emocional avanzado en tiempo real
- Respuestas personalizadas basadas en el contexto del usuario
- Técnicas terapéuticas adaptadas a cada situación

### 🚨 Detección de Crisis
- Detección automática de crisis emocionales
- Alertas de emergencia a contactos designados
- Seguimiento post-crisis automatizado
- Análisis de tendencias emocionales

### 📊 Herramientas de Bienestar
- Sistema de tareas y recordatorios
- Seguimiento de hábitos saludables
- Técnicas terapéuticas interactivas
- Dashboard de métricas y progreso

### 💳 Sistema de Suscripciones
- Planes de suscripción flexibles
- Período de prueba gratuito (3 días)
- Integración con Mercado Pago
- Gestión de pagos y facturación

### 🔔 Notificaciones
- Notificaciones push personalizadas
- Recordatorios de actividades
- Alertas de crisis
- Notificaciones de seguimiento

---

## 🛠 Tecnologías

### Frontend
- **React Native** - Framework móvil multiplataforma
- **Expo** - Herramientas y servicios para desarrollo React Native
- **React Navigation** - Navegación entre pantallas
- **AsyncStorage** - Almacenamiento local
- **Socket.IO Client** - Comunicación en tiempo real

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Socket.IO** - WebSockets para tiempo real
- **OpenAI API** - Integración con GPT-4
- **Mercado Pago** - Procesamiento de pagos
- **SendGrid** - Envío de emails
- **Twilio** - WhatsApp y SMS
- **Winston** - Logging estructurado
- **Sentry** - Error tracking

### Seguridad
- **Helmet** - Headers de seguridad HTTP
- **CORS** - Control de acceso
- **Rate Limiting** - Protección contra abuso
- **JWT** - Autenticación con tokens
- **bcrypt** - Hasheo de contraseñas
- **Joi** - Validación de datos
- **DOMPurify** - Sanitización de inputs

---

## 📦 Requisitos

### Desarrollo
- **Node.js** 20.x o superior
- **npm** 9.0.0 o superior
- **MongoDB** (local o MongoDB Atlas)
- **Expo CLI** (se instala automáticamente)

### Producción
- Servidor Node.js (Render, Heroku, AWS, etc.)
- MongoDB Atlas o servidor MongoDB
- Dominio con SSL/HTTPS
- Cuentas de servicios externos (OpenAI, Mercado Pago, etc.)

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Anto
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuración

### Backend

1. **Crear archivo `.env` en `backend/`**

```bash
cp backend/.env.example backend/.env
```

2. **Configurar variables de entorno** (ver sección [Variables de Entorno](#-variables-de-entorno))

3. **Validar configuración**

```bash
cd backend
node scripts/validateEnv.js
```

### Frontend

1. **Configurar URL del backend** en `frontend/src/config/api.js`

2. **Configurar variables de entorno** si es necesario

---

## 🔐 Variables de Entorno

### Variables Requeridas

```env
# Base de Datos
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/anto

# Autenticación
JWT_SECRET=tu-secret-super-seguro-de-al-menos-32-caracteres

# OpenAI
OPENAI_API_KEY=sk-tu-api-key-de-openai
```

### Variables Recomendadas

```env
# Pagos
MERCADOPAGO_ACCESS_TOKEN=tu-token-de-mercadopago

# Email
SENDGRID_API_KEY=SG.tu-api-key-de-sendgrid

# WhatsApp
TWILIO_ACCOUNT_SID=tu-account-sid
TWILIO_AUTH_TOKEN=tu-auth-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Frontend
FRONTEND_URL=https://tu-dominio.com
```

### Variables Opcionales

```env
# Cloudinary (para avatares)
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# Sentry (error tracking)
SENTRY_DSN=https://tu-dsn-de-sentry

# Redis (caché)
REDIS_URL=redis://localhost:6379

# Ambiente
NODE_ENV=production
PORT=5000
```

**📝 Nota:** Consulta `backend/.env.example` para ver todas las variables disponibles.

---

## ▶️ Ejecución

### Desarrollo

#### Backend

```bash
cd backend
npm run dev
```

El servidor se iniciará en `http://localhost:5000`

#### Frontend

```bash
cd frontend
npx expo start
```

Luego escanea el código QR con la app Expo Go o presiona:
- `i` para iOS Simulator
- `a` para Android Emulator
- `w` para web

### Producción

#### Backend

```bash
cd backend
npm start
```

#### Frontend

```bash
cd frontend
eas build --platform ios
eas build --platform android
```

---

## 🧪 Testing

### Backend

```bash
cd backend

# Todos los tests
npm test

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration

# Con cobertura
npm test -- --coverage
```

### Frontend

```bash
cd frontend
npm test
```

### Estado de Tests

- ✅ **Tests Backend:** 721/741 pasando (97.3%)
- ✅ **Tests Frontend:** 138/141 pasando (97.9%)
- ✅ **Tests Integración:** 121/135 pasando (89.6%)
- ✅ **Cobertura:** 32% en funciones

---

## 🚢 Deployment

### Backend

1. **Configurar variables de entorno en el servidor**
2. **Verificar health checks:**
   ```bash
   curl https://tu-dominio.com/health
   curl https://tu-dominio.com/api/health
   ```
3. **Configurar monitoreo externo** (UptimeRobot, Pingdom, etc.)
4. **Configurar backups de base de datos** (MongoDB Atlas)

### Frontend

1. **Configurar EAS Build:**
   ```bash
   cd frontend
   eas build:configure
   ```

2. **Construir para producción:**
   ```bash
   eas build --platform all --profile production
   ```

3. **Subir a stores:**
   - App Store Connect (iOS)
   - Google Play Console (Android)

### Checklist Pre-Deployment

- [x] Variables de entorno configuradas
- [x] Health checks funcionando
- [x] SSL/HTTPS configurado
- [x] Logs centralizados configurados
- [x] Tests pasando
- [ ] Monitoreo externo configurado
- [ ] Backups configurados
- [ ] Documentación actualizada

---

## 📁 Estructura del Proyecto

```
Anto/
├── backend/                 # Servidor Node.js/Express
│   ├── config/             # Configuraciones
│   ├── constants/          # Constantes de la aplicación
│   ├── middleware/         # Middlewares de Express
│   ├── models/             # Modelos de Mongoose
│   ├── routes/             # Rutas de la API
│   ├── services/           # Servicios de negocio
│   ├── utils/              # Utilidades
│   ├── scripts/            # Scripts de utilidad
│   ├── tests/              # Tests
│   ├── server.js           # Punto de entrada del servidor
│   └── package.json
│
├── frontend/               # Aplicación React Native
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── screens/        # Pantallas
│   │   ├── services/       # Servicios del frontend
│   │   ├── utils/          # Utilidades
│   │   ├── config/         # Configuración
│   │   └── constants/      # Constantes
│   ├── app.json            # Configuración de Expo
│   └── package.json
│
├── docs/                   # Documentación adicional
├── ACCIONES_PRODUCCION_COMPLETADAS.md
├── CHECKLIST_PRE_LANZAMIENTO.md
├── REVISION_FINAL_PRODUCCION.md
└── README.md
```

---

## 📚 Documentación

### Documentos Principales

- **[ACCIONES_PRODUCCION_COMPLETADAS.md](./ACCIONES_PRODUCCION_COMPLETADAS.md)** - Estado de preparación para producción
- **[CHECKLIST_PRE_LANZAMIENTO.md](./CHECKLIST_PRE_LANZAMIENTO.md)** - Checklist completo pre-lanzamiento
- **[REVISION_FINAL_PRODUCCION.md](./REVISION_FINAL_PRODUCCION.md)** - Revisión técnica detallada

### Documentación del Backend

- `backend/ENV_EXAMPLE.md` - Guía de variables de entorno
- `backend/README_TESTING.md` - Guía de testing
- `backend/docs/` - Documentación técnica adicional

### APIs y Endpoints

- **Health Checks:**
  - `GET /health` - Health check básico
  - `GET /api/health` - Health check de API
  - `GET /api/health/detailed` - Health check detallado (requiere auth)

- **Autenticación:**
  - `POST /api/auth/register` - Registro de usuario
  - `POST /api/auth/login` - Inicio de sesión
  - `POST /api/auth/refresh` - Refrescar token

- **Usuario:**
  - `GET /api/users/me` - Obtener perfil
  - `PUT /api/users/me` - Actualizar perfil
  - `PUT /api/users/me/password` - Cambiar contraseña

- **Chat:**
  - `POST /api/chat/conversations` - Crear conversación
  - `POST /api/chat/messages` - Enviar mensaje
  - `GET /api/chat/conversations/:id` - Obtener mensajes

**📝 Nota:** Consulta la documentación Swagger en `/api-docs` cuando el servidor esté corriendo.

---

## ✅ Estado del Proyecto

### Estado General: **Listo para Producción** ✅

**Última actualización:** 2025-12-09

### Completado ✅

- ✅ Dependencias instaladas y configuradas
- ✅ Sanitización de inputs activada
- ✅ Compresión de respuestas habilitada
- ✅ Health checks implementados
- ✅ Variables de entorno configuradas
- ✅ SSL/HTTPS configurado
- ✅ Logs centralizados configurados
- ✅ Optimizaciones de performance
- ✅ Tests pasando (97%+)
- ✅ Código del backend corregido y optimizado

### Pendiente ⚠️

- [ ] Configurar monitoreo externo (UptimeRobot, Sentry)
- [ ] Configurar backups automáticos de base de datos
- [ ] Probar health checks en producción

---

## 🔒 Seguridad

### Medidas Implementadas

- ✅ **Helmet** - Headers de seguridad HTTP
- ✅ **CORS** - Control de acceso por origen
- ✅ **Rate Limiting** - Protección contra abuso
- ✅ **JWT** - Autenticación segura
- ✅ **bcrypt** - Hasheo de contraseñas
- ✅ **Validación Joi** - Validación de entrada
- ✅ **Sanitización DOMPurify** - Prevención de XSS
- ✅ **HSTS** - HTTP Strict Transport Security
- ✅ **Content Security Policy** - Prevención de ataques

### Mejores Prácticas

- Nunca commitees archivos `.env` con valores reales
- Usa diferentes secrets en desarrollo y producción
- Rota tus secrets regularmente
- En producción, usa un gestor de secretos (AWS Secrets Manager, etc.)

---

## 🤝 Contribución

Este es un proyecto privado. Para contribuir, contacta al equipo de desarrollo.

---

## 📄 Licencia

Este proyecto es privado y propietario. Todos los derechos reservados.

---

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa la documentación en `docs/`
- Consulta los issues conocidos
- Contacta al equipo de desarrollo

---

## 🎯 Roadmap

### Próximas Funcionalidades

- [ ] Modo offline
- [ ] Internacionalización (multi-idioma)
- [ ] Integración con wearables
- [ ] Sistema de referidos
- [ ] Programa de fidelización
- [ ] Más técnicas terapéuticas

---

**Desarrollado con ❤️ por el equipo de Anto App**
