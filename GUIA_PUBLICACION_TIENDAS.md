# 📱 Guía de Publicación en Tiendas - Anto App

Esta guía te ayudará a publicar Anto en **Google Play Store**, **Huawei AppGallery** y **Apple App Store**.

## 📋 Prerrequisitos

### Cuentas Necesarias

1. **Google Play Console** - [$25 USD una vez](https://play.google.com/console)
2. **Apple Developer Program** - [$99 USD/año](https://developer.apple.com/programs/)
3. **Huawei Developer Account** - [Gratis](https://developer.huawei.com/consumer/en/console)
4. **Expo Account** - [Gratis con opciones premium](https://expo.dev)

### Herramientas Necesarias

```bash
# Instalar EAS CLI globalmente
npm install -g eas-cli

# Iniciar sesión en Expo
eas login
```

## 🔧 Paso 1: Configuración Inicial

### 1.1. Actualizar app.json

Asegúrate de que `frontend/app.json` tenga toda la información necesaria:

```json
{
  "expo": {
    "name": "Anto",
    "slug": "anto",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "anto",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#030A24"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anto.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "Esta app usa datos para mejorar tu experiencia.",
        "NSPhotoLibraryUsageDescription": "Necesitamos acceso a tus fotos para que puedas subir imágenes.",
        "NSCameraUsageDescription": "Necesitamos acceso a la cámara para que puedas tomar fotos."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#030A24"
      },
      "package": "com.anto.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "extra": {
      "eas": {
        "projectId": "37ba58c5-a788-4f5e-a36f-6b6bb5eb7b99"
      }
    },
    "owner": "marceloull"
  }
}
```

### 1.2. Configurar EAS

El archivo `eas.json` ya está creado. Verifica que esté en `frontend/eas.json`.

## 🍎 Paso 2: Publicar en Apple App Store

### 2.1. Preparar Certificados iOS

```bash
cd frontend

# Configurar credenciales de Apple
eas credentials
```

Sigue las instrucciones para:
- Configurar tu Apple ID
- Crear certificados de distribución
- Configurar provisioning profiles

### 2.2. Build para iOS

```bash
# Build de producción para App Store
eas build --platform ios --profile production
```

Esto tomará aproximadamente 15-20 minutos. Recibirás un enlace para descargar el build.

### 2.3. Subir a App Store Connect

**Opción A: EAS Submit (Recomendado)**

```bash
cd frontend

# Subir automáticamente a App Store Connect
eas submit --platform ios --latest

# O subir un build específico por ID
eas submit --platform ios --id <build-id>
```

**Opción B: Usando xcrun altool (Línea de comandos de Apple)**

Primero, necesitas crear una App-Specific Password en [appleid.apple.com](https://appleid.apple.com):

```bash
# Subir usando altool (requiere App-Specific Password)
xcrun altool --upload-app \
  --type ios \
  --file "path/to/your/app.ipa" \
  --username "tu-apple-id@example.com" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --asc-provider "G53VJVM874"
```

**Opción C: Usando Transporter (App de Apple)**

1. Descarga el `.ipa` desde el enlace de EAS
2. Abre la app **Transporter** (disponible en Mac App Store)
3. Arrastra el archivo `.ipa` a Transporter
4. Haz clic en "Deliver" para subir

**Opción D: Usando Xcode**

1. Descarga el `.ipa` desde el enlace de EAS
2. Abre Xcode
3. Ve a **Window > Organizer** (o `Cmd + Shift + 2`)
4. Arrastra el `.ipa` o usa **Distribute App**
5. Selecciona **App Store Connect**
6. Sigue el asistente

**Nota:** La API de App Store Connect (`POST /v1/buildUploads`) requiere autenticación con JWT y es más compleja. Se recomienda usar EAS Submit o las herramientas oficiales de Apple.

### 2.4. Completar Información en App Store Connect

1. **Información de la App:**
   - Nombre: "Anto"
   - Subtítulo: "Tu asistente terapéutico personal"
   - Categoría: Salud y Bienestar
   - Descripción: [Escribe una descripción atractiva]
   - Palabras clave: terapia, salud mental, bienestar, AI, asistente
   - URL de soporte: [Tu URL de soporte]
   - URL de marketing: [Tu URL de marketing]

2. **Capturas de Pantalla:**
   - iPhone 6.7" (iPhone 14 Pro Max): 1290 x 2796 px
   - iPhone 6.5" (iPhone 11 Pro Max): 1242 x 2688 px
   - iPhone 5.5" (iPhone 8 Plus): 1242 x 2208 px
   - iPad Pro 12.9": 2048 x 2732 px

3. **Icono de la App:**
   - 1024 x 1024 px (sin transparencia, sin bordes redondeados)

4. **Información de Precios:**
   - Selecciona "Gratis" o configura precios

5. **Información de Privacidad:**
   - Política de privacidad (URL requerida)
   - Datos que recopilas (si aplica)

### 2.5. Enviar para Revisión

1. Completa toda la información
2. Selecciona "Enviar para revisión"
3. El proceso de revisión toma 1-3 días

## 🤖 Paso 3: Publicar en Google Play Store

### 3.1. Crear Keystore (si no existe)

```bash
cd frontend

# EAS puede generar el keystore automáticamente
eas credentials
```

### 3.2. Build para Android

```bash
# Build de producción para Play Store
eas build --platform android --profile production
```

Esto generará un `.aab` (Android App Bundle) que es el formato requerido por Play Store.

### 3.3. Subir a Google Play Console

**Opción A: Automático (Recomendado)**

Primero, crea una cuenta de servicio de Google:

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita "Google Play Android Developer API"
4. Crea una cuenta de servicio
5. Descarga el archivo JSON de la cuenta de servicio
6. En Play Console, ve a Configuración > Acceso API
7. Sube el archivo JSON de la cuenta de servicio
8. Guarda el archivo como `google-service-account.json` en `frontend/`

Luego:

```bash
# Subir automáticamente a Play Store
eas submit --platform android --latest
```

**Opción B: Manual**

1. Descarga el `.aab` desde el enlace de EAS
2. Ve a [Google Play Console](https://play.google.com/console)
3. Crea una nueva app o selecciona una existente
4. Ve a "Producción" > "Crear nueva versión"
5. Sube el archivo `.aab`

### 3.4. Completar Información en Play Console

1. **Información de la App:**
   - Nombre: "Anto"
   - Descripción corta: "Tu asistente terapéutico personal"
   - Descripción completa: [Escribe una descripción detallada]
   - Categoría: Salud y Bienestar
   - URL de soporte: [Tu URL de soporte]
   - URL de política de privacidad: [Tu URL de política de privacidad]

2. **Capturas de Pantalla:**
   - Teléfono: 1080 x 1920 px (mínimo 2, máximo 8)
   - Tablet 7": 1200 x 1920 px (opcional)
   - Tablet 10": 1600 x 2560 px (opcional)
   - Feature Graphic: 1024 x 500 px (requerido)

3. **Icono de la App:**
   - 512 x 512 px (PNG, sin transparencia)

4. **Clasificación de Contenido:**
   - Completa el cuestionario de clasificación

5. **Precio y Distribución:**
   - Selecciona países
   - Configura precio (gratis o de pago)

### 3.5. Enviar para Revisión

1. Completa toda la información
2. Selecciona "Enviar para revisión"
3. El proceso de revisión toma 1-7 días

## 📱 Paso 4: Publicar en Huawei AppGallery

### 4.1. Preparar Build para Huawei

Huawei requiere un APK (no AAB):

```bash
cd frontend

# Build específico para Huawei
eas build --platform android --profile production-huawei
```

### 4.2. Crear App en AppGallery Connect

1. Ve a [AppGallery Connect](https://developer.huawei.com/consumer/en/console)
2. Inicia sesión con tu cuenta de Huawei Developer
3. Crea un nuevo proyecto
4. Crea una nueva app dentro del proyecto

### 4.3. Configurar Información de la App

1. **Información Básica:**
   - Nombre de la app: "Anto"
   - Nombre del paquete: `com.anto.app`
   - Categoría: Salud y Bienestar
   - Descripción: [Escribe una descripción]

2. **Capturas de Pantalla:**
   - Teléfono: 1080 x 1920 px (mínimo 2)
   - Tablet: 1200 x 1920 px (opcional)
   - Banner: 1080 x 432 px

3. **Icono de la App:**
   - 512 x 512 px (PNG)

### 4.4. Subir APK

1. Ve a "Versiones de la app"
2. Crea una nueva versión
3. Sube el archivo `.apk` descargado de EAS
4. Completa la información de la versión

### 4.5. Configurar Información de Distribución

1. **Información de Privacidad:**
   - Política de privacidad (URL requerida)
   - Información de permisos

2. **Precio:**
   - Selecciona "Gratis" o configura precios

3. **Países:**
   - Selecciona los países donde quieres distribuir

### 4.6. Enviar para Revisión

1. Completa toda la información
2. Envía para revisión
3. El proceso de revisión toma 3-7 días

## 📝 Paso 5: Recursos Necesarios

### 5.1. Capturas de Pantalla

Necesitarás capturas de pantalla para cada plataforma:

**iOS:**
- iPhone 6.7": 1290 x 2796 px
- iPhone 6.5": 1242 x 2688 px
- iPhone 5.5": 1242 x 2208 px
- iPad Pro 12.9": 2048 x 2732 px

**Android (Play Store):**
- Teléfono: 1080 x 1920 px (mínimo 2, máximo 8)
- Tablet 7": 1200 x 1920 px
- Tablet 10": 1600 x 2560 px
- Feature Graphic: 1024 x 500 px

**Huawei:**
- Teléfono: 1080 x 1920 px (mínimo 2)
- Tablet: 1200 x 1920 px
- Banner: 1080 x 432 px

### 5.2. Iconos

- **iOS:** 1024 x 1024 px (sin transparencia, sin bordes)
- **Android:** 512 x 512 px (PNG, sin transparencia)
- **Huawei:** 512 x 512 px (PNG)

### 5.3. Textos Necesarios

- **Nombre de la app:** Anto
- **Descripción corta:** Tu asistente terapéutico personal
- **Descripción completa:** [Escribe una descripción detallada de 2000-4000 caracteres]
- **Palabras clave:** terapia, salud mental, bienestar, AI, asistente, mindfulness
- **Política de privacidad:** [URL de tu política de privacidad]
- **URL de soporte:** [URL de soporte]

## 🔄 Paso 6: Actualizaciones Futuras

### 6.1. Actualizar Versión

Antes de cada nueva versión, actualiza:

**app.json:**
```json
{
  "expo": {
    "version": "1.0.1",  // Incrementa la versión
    "ios": {
      "buildNumber": "2"  // Incrementa el build number
    },
    "android": {
      "versionCode": 2  // Incrementa el version code
    }
  }
}
```

### 6.2. Build y Submit

```bash
# iOS
eas build --platform ios --profile production
eas submit --platform ios --latest

# Android (Play Store)
eas build --platform android --profile production
eas submit --platform android --latest

# Android (Huawei)
eas build --platform android --profile production-huawei
# Luego sube manualmente el APK a AppGallery Connect
```

## ✅ Checklist Pre-Publicación

### iOS (App Store)
- [ ] Cuenta de Apple Developer activa
- [ ] Certificados y provisioning profiles configurados
- [ ] Build de producción generado
- [ ] Información de la app completada
- [ ] Capturas de pantalla subidas
- [ ] Icono de 1024x1024 px
- [ ] Política de privacidad disponible
- [ ] App enviada para revisión

### Android (Play Store)
- [ ] Cuenta de Google Play Console activa
- [ ] Keystore configurado
- [ ] Build de producción (.aab) generado
- [ ] Información de la app completada
- [ ] Capturas de pantalla subidas
- [ ] Feature graphic (1024x500 px)
- [ ] Icono de 512x512 px
- [ ] Política de privacidad disponible
- [ ] Clasificación de contenido completada
- [ ] App enviada para revisión

### Huawei (AppGallery)
- [ ] Cuenta de Huawei Developer activa
- [ ] Proyecto y app creados en AppGallery Connect
- [ ] Build de producción (.apk) generado
- [ ] Información de la app completada
- [ ] Capturas de pantalla subidas
- [ ] Banner (1080x432 px)
- [ ] Icono de 512x512 px
- [ ] Política de privacidad disponible
- [ ] App enviada para revisión

## 🆘 Solución de Problemas

### Error: "No se encontró el keystore"
```bash
eas credentials
# Selecciona "Set up new keystore"
```

### Error: "Certificado iOS expirado"
```bash
eas credentials
# Selecciona "iOS" > "Set up new credentials"
```

### Error: "Build fallido"
- Revisa los logs en `https://expo.dev`
- Verifica que todas las dependencias estén instaladas
- Asegúrate de que `app.json` esté correctamente configurado

### Error: "Submit fallido"
- Verifica que tengas los permisos necesarios en las consolas
- Asegúrate de que la cuenta de servicio (Android) esté correctamente configurada
- Verifica que el build esté en estado "finished"

## 📚 Recursos Adicionales

- [Documentación de EAS Build](https://docs.expo.dev/build/introduction/)
- [Documentación de EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Guía de App Store Connect](https://developer.apple.com/app-store-connect/)
- [Guía de Google Play Console](https://support.google.com/googleplay/android-developer)
- [Guía de Huawei AppGallery](https://developer.huawei.com/consumer/en/doc/distribution/app/agc-help-introduction)

---

**¡Buena suerte con el lanzamiento! 🚀**

