# Solución para el Rechazo de App Store - App Tracking Transparency

## Problema

Apple rechazó la app porque:
- En App Store Connect se indica que la app recopila datos para "tracking" (específicamente "Name")
- La app NO está usando App Tracking Transparency (ATT) para solicitar permiso antes de rastrear

## Análisis de la Aplicación

✅ **No hay SDKs de tracking**: No se encontraron Facebook SDK, Google Analytics, Amplitude, Mixpanel, ni otros SDKs de publicidad
✅ **No hay uso de IDFA**: No se usa el identificador de publicidad de Apple
✅ **Solo Sentry**: El único servicio de terceros es Sentry para error tracking (NO es tracking de usuarios)
✅ **Política de privacidad**: Indica que NO venden ni comparten datos con terceros para fines comerciales

**Conclusión**: La app NO está haciendo tracking real de usuarios para publicidad.

## Solución Implementada

### 1. Remover NSUserTrackingUsageDescription del app.json

Se removió la clave `NSUserTrackingUsageDescription` del `frontend/app.json` ya que no se está usando App Tracking Transparency.

**Antes:**
```json
"infoPlist": {
  "NSUserTrackingUsageDescription": "Esta app usa datos para mejorar tu experiencia terapéutica.",
  ...
}
```

**Después:**
```json
"infoPlist": {
  "NSPhotoLibraryUsageDescription": "...",
  "NSCameraUsageDescription": "...",
  ...
}
```

## Pasos para Resolver el Rechazo

### Paso 1: Actualizar Información de Privacidad en App Store Connect

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Selecciona tu app
3. Ve a **App Privacy** (Privacidad de la App)
4. Revisa la sección **"Data Used to Track You"** (Datos usados para rastrearte)
5. **IMPORTANTE**: Cambia la configuración para indicar que **NO recopilas datos para tracking**

#### Configuración Correcta:

**Para "Name" (Nombre):**
- Si recopilas el nombre del usuario para uso interno de la app (perfil, personalización), marca como:
  - ✅ **"Data Linked to You"** (Datos vinculados a ti) - **NO para tracking**
  - ❌ **NO marques como "Data Used to Track You"** (Datos usados para rastrearte)

**Explicación:**
- **"Data Used to Track You"**: Se usa cuando compartes datos con terceros para publicidad dirigida o análisis de comportamiento entre apps
- **"Data Linked to You"**: Se usa cuando recopilas datos para uso interno de la app (perfil, personalización, funcionalidad)

### Paso 2: Rebuild y Resubmit

1. Haz un nuevo build con los cambios en `app.json` (sin `NSUserTrackingUsageDescription`)
2. Sube el nuevo build a App Store Connect
3. En las **Review Notes**, incluye:

```
Hemos actualizado la información de privacidad en App Store Connect. 
La app NO recopila datos para tracking de usuarios. Los datos recopilados 
(como nombre) se usan únicamente para funcionalidad interna de la app 
(perfil de usuario, personalización) y NO se comparten con terceros para 
publicidad o tracking.

No utilizamos App Tracking Transparency porque no hacemos tracking de usuarios.
```

### Paso 3: Responder al Rechazo en App Store Connect

1. Ve a la sección de **App Review** en App Store Connect
2. Encuentra el rechazo
3. Responde con:

```
Hemos actualizado la información de privacidad en App Store Connect para 
reflejar correctamente que la app NO recopila datos para tracking de usuarios.

Los datos recopilados (como nombre) se usan únicamente para funcionalidad 
interna de la app (perfil de usuario, personalización del asistente AI) y 
NO se comparten con terceros para publicidad o tracking entre apps.

Hemos removido NSUserTrackingUsageDescription del código ya que no 
utilizamos App Tracking Transparency, ya que no hacemos tracking de usuarios.

La información de privacidad en App Store Connect ahora refleja correctamente 
nuestras prácticas de privacidad.
```

## Verificación

Antes de resubmitir, verifica:

- [ ] `NSUserTrackingUsageDescription` removido de `app.json`
- [ ] Información de privacidad actualizada en App Store Connect
- [ ] "Name" marcado como "Data Linked to You" (NO "Data Used to Track You")
- [ ] No hay SDKs de tracking en el código
- [ ] Review Notes incluyen explicación clara

## Notas Importantes

1. **No necesitas App Tracking Transparency** si no haces tracking
2. **"Data Linked to You"** es diferente de **"Data Used to Track You"**
   - Data Linked to You: Para uso interno de la app
   - Data Used to Track You: Para publicidad/tracking entre apps
3. **Sentry NO es tracking**: Sentry es para error tracking, no requiere ATT

## Referencias

- [Apple App Tracking Transparency](https://developer.apple.com/documentation/apptrackingtransparency)
- [App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Guideline 5.1.2](https://developer.apple.com/app-store/review/guidelines/#privacy)

