# 📋 Variables de Entorno - Guía Completa

Este documento contiene todas las variables de entorno necesarias para ejecutar el backend de Anto App.

## 🚀 Inicio Rápido

1. Copia este contenido a un archivo `.env` en la raíz del proyecto backend
2. Reemplaza los valores de ejemplo con tus credenciales reales
3. **NUNCA** commitees el archivo `.env` al repositorio

## 📝 Variables Requeridas

Estas variables son **obligatorias** para que la aplicación funcione:

```env
# Base de Datos
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/anto

# Autenticación
JWT_SECRET=tu-secret-super-seguro-de-al-menos-32-caracteres-aqui

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔧 Variables Recomendadas

Estas variables son **recomendadas** para producción:

```env
# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@tudominio.com

# Pagos (Mercado Pago)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx

# Error Tracking (Sentry)
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@xxxxx.ingest.sentry.io/xxxxx
```

## 📚 Documentación Completa

Para ver todas las variables disponibles y sus descripciones, consulta el archivo `.env.example` en la raíz del proyecto backend.

## ✅ Validación

Ejecuta el siguiente comando para validar que todas las variables requeridas estén configuradas:

```bash
node backend/scripts/validateEnv.js
```

## 🔒 Seguridad

- **NUNCA** commitees el archivo `.env` con valores reales
- Usa diferentes secrets en desarrollo y producción
- Rota tus secrets regularmente
- En producción, usa un gestor de secretos (AWS Secrets Manager, etc.)

