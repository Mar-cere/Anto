# Checklist para Reenvío a Apple App Store

## ✅ Estado Actual del Código

### Completado en Código:
- [x] Removido `NSUserTrackingUsageDescription` del `app.json` ✅
- [x] `react-native-iap` instalado (v12.13.0) ✅
- [x] `storeKitService.js` implementado ✅
- [x] `paymentService.js` integrado con StoreKit ✅
- [x] `SubscriptionScreen.js` usa StoreKit en iOS ✅
- [x] Endpoint `/api/payments/validate-receipt` en backend ✅
- [x] `appleReceiptService.js` para validar recibos ✅
- [x] Build number incrementado a "2" ✅
- [x] Precios hardcodeados para screenshots ✅

---

## 📋 Pasos Pendientes para Reenvío

### 1. Configurar Productos en App Store Connect ⚠️ CRÍTICO

**Esto es OBLIGATORIO antes de hacer el build**

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Selecciona tu app → **Features** → **In-App Purchases**
3. Crea los siguientes productos (Auto-Renewable Subscription):

| Product ID | Nombre | Duración | Precio (CLP) |
|------------|--------|----------|--------------|
| `com.anto.app.weekly` | Premium Semanal | 1 semana | $990 |
| `com.anto.app.monthly` | Premium Mensual | 1 mes | $3.990 |
| `com.anto.app.quarterly` | Premium Trimestral | 3 meses | $11.990 |
| `com.anto.app.semestral` | Premium Semestral | 6 meses | $20.990 |
| `com.anto.app.yearly` | Premium Anual | 1 año | $39.990 |

**Pasos detallados:**
- Haz clic en **+** → Selecciona **Auto-Renewable Subscription**
- Ingresa el Product ID exacto (ej: `com.anto.app.weekly`)
- Configura el precio base (Apple ajustará para otros países)
- Agrega nombre y descripción en español
- Guarda y repite para cada producto

**⚠️ IMPORTANTE:** Los Product IDs deben coincidir EXACTAMENTE con los del código.

---

### 2. Configurar Shared Secret

1. Ve a **App Store Connect** → Tu App → **App Information**
2. En la sección **App Store Connect API**, genera un **Shared Secret**
3. Copia el Shared Secret
4. Agrega en tu backend `.env`:
   ```bash
   APPLE_SHARED_SECRET=tu_shared_secret_aqui
   ```

---

### 3. Actualizar Privacidad en App Store Connect

1. Ve a **App Store Connect** → Tu App → **App Privacy**
2. En **"Data Used to Track You"**:
   - **Remueve "Name"** de esta sección
   - Si necesitas mantener "Name", muévelo a **"Data Linked to You"**
3. Explica que los datos se usan solo para funcionalidad interna, NO para tracking

---

### 4. Crear Screenshots Correctos

**iPhone 6.5" (iPhone 14 Pro Max / 15 Pro Max):**
- [ ] Screenshot 1: Pantalla principal (Dashboard)
- [ ] Screenshot 2: Chat con Anto
- [ ] Screenshot 3: Pantalla de suscripción (mostrando los precios)
- [ ] Screenshot 4: Perfil/Configuración
- [ ] Screenshot 5: Otra funcionalidad principal

**iPad 13" (iPad Pro 12.9"):**
- [ ] Screenshot 1: App en frame de iPad (NO iPhone)
- [ ] Screenshot 2: Chat en iPad
- [ ] Screenshot 3: Dashboard en iPad
- [ ] Screenshot 4: Suscripción en iPad
- [ ] Screenshot 5: Otra funcionalidad

**Cómo crear screenshots:**
```bash
# En el simulador de iOS:
# 1. Abre la app en el simulador correcto
# 2. Navega a la pantalla
# 3. Presiona Cmd + S (screenshot se guarda en escritorio)
# 4. Repite para cada pantalla
```

**Requisitos:**
- ✅ Mostrar la app REAL en uso
- ✅ NO usar splash screens o login como mayoría
- ✅ Mostrar funcionalidades principales
- ✅ Frame correcto para cada dispositivo

---

### 5. Subir Screenshots a App Store Connect

1. Ve a **App Store Connect** → Tu App → **App Store** → **Versión**
2. En **Screenshots**, haz clic en "View All Sizes in Media Manager"
3. Sube los screenshots para cada tamaño requerido
4. Asegúrate de que los screenshots de iPad muestren frame de iPad

---

### 6. Testing en Sandbox (Recomendado)

1. Crea un usuario de prueba en **App Store Connect** → **Users and Access** → **Sandbox Testers**
2. En tu dispositivo iOS:
   - Cierra sesión de tu cuenta de App Store real
   - Intenta comprar → se te pedirá usar cuenta de prueba
3. Verifica que:
   - [ ] Los productos se cargan correctamente
   - [ ] Las compras funcionan
   - [ ] Los recibos se validan en el backend
   - [ ] Las suscripciones se activan

---

### 7. Preparar Build para Producción

1. **Verificar variables de entorno:**
   ```bash
   # Backend .env debe tener:
   APPLE_SHARED_SECRET=tu_shared_secret_aqui
   NODE_ENV=production
   ```

2. **Verificar código:**
   - [ ] Los Product IDs coinciden con App Store Connect
   - [ ] El código usa StoreKit en iOS (no Mercado Pago)
   - [ ] El build number es "2" o superior

3. **Hacer build:**
   ```bash
   cd frontend
   eas build --platform ios --profile production
   ```

---

### 8. Actualizar Review Notes

En **App Store Connect** → Tu App → **App Store** → **Versión** → **Review Notes**:

```
SOLUCIÓN A LOS PROBLEMAS IDENTIFICADOS:

1. App Tracking Transparency (Guideline 5.1.2):
   - Hemos actualizado la información de privacidad en App Store Connect
   - La app NO recopila datos para tracking de usuarios
   - Removimos NSUserTrackingUsageDescription del código
   - Los datos recopilados (nombre) se usan solo para funcionalidad interna

2. Screenshots (Guideline 2.3.3):
   - Hemos actualizado todos los screenshots
   - Los screenshots de iPhone 6.5" muestran la app en uso real
   - Los screenshots de iPad muestran la app en frame de iPad correcto
   - Todos muestran funcionalidades principales de la app

3. In-App Purchase (Guideline 3.1.1):
   - Hemos implementado StoreKit para todas las suscripciones en iOS
   - Las suscripciones ahora se compran usando In-App Purchase exclusivamente
   - Los productos están configurados en App Store Connect:
     * com.anto.app.weekly (Premium Semanal)
     * com.anto.app.monthly (Premium Mensual)
     * com.anto.app.quarterly (Premium Trimestral)
     * com.anto.app.semestral (Premium Semestral)
     * com.anto.app.yearly (Premium Anual)
   - El backend valida todos los recibos con Apple
   - Mercado Pago solo se usa en Android (no aplica a iOS)
```

---

### 9. Responder a los Rechazos

En **App Store Connect** → Tu App → **Resolution Center**:

**Para cada rechazo, responde:**

**Rechazo 5.1.2 (App Tracking Transparency):**
```
Hemos actualizado la información de privacidad en App Store Connect. 
La app NO recopila datos para tracking de usuarios. Los datos recopilados 
(como nombre) se usan únicamente para funcionalidad interna de la app 
(perfil de usuario, personalización del asistente AI) y NO se comparten 
con terceros para publicidad o tracking entre apps.

Hemos removido NSUserTrackingUsageDescription del código ya que no 
utilizamos App Tracking Transparency, ya que no hacemos tracking de usuarios.
```

**Rechazo 2.3.3 (Screenshots):**
```
Hemos actualizado todos los screenshots para mostrar la app en uso real:
- Los screenshots de iPhone 6.5" muestran la app funcionando con funcionalidades principales
- Los screenshots de iPad muestran la app en el frame correcto de iPad (no iPhone)
- Todos los screenshots reflejan la UI real de la app
```

**Rechazo 3.1.1 (In-App Purchase):**
```
Hemos implementado StoreKit para todas las suscripciones en iOS. 
Las suscripciones ahora se compran exclusivamente usando In-App Purchase 
a través de StoreKit. Los productos están configurados en App Store Connect 
y el backend valida todos los recibos con Apple.

Mercado Pago solo se usa en Android, que no tiene estas restricciones.
```

---

### 10. Subir Build y Enviar para Revisión

1. Ve a **App Store Connect** → Tu App → **App Store** → **Versión**
2. Selecciona el build nuevo (debe ser build number 2 o superior)
3. Completa toda la información requerida
4. Haz clic en **Submit for Review**

---

## ⚠️ Checklist Final Antes de Enviar

- [ ] Productos configurados en App Store Connect (5 productos)
- [ ] Shared Secret configurado en backend
- [ ] Privacidad actualizada en App Store Connect
- [ ] Screenshots creados y subidos (iPhone 6.5" y iPad 13")
- [ ] Testing en sandbox completado (opcional pero recomendado)
- [ ] Build de producción creado
- [ ] Review Notes actualizados
- [ ] Respuestas a rechazos preparadas
- [ ] Build subido a App Store Connect
- [ ] Enviado para revisión

---

## 📝 Notas Importantes

1. **Los productos DEBEN estar configurados ANTES del build** - Si no, StoreKit no funcionará
2. **Los Product IDs deben coincidir EXACTAMENTE** con los del código
3. **Los screenshots deben ser reales** - Apple los verifica
4. **StoreKit es obligatorio** - No puedes usar Mercado Pago en iOS
5. **El build number debe incrementarse** cada vez que subes un nuevo build

---

## 🚀 Orden Recomendado de Ejecución

1. **Día 1**: Configurar productos en App Store Connect + Shared Secret
2. **Día 2**: Crear screenshots + Actualizar privacidad
3. **Día 3**: Testing en sandbox (opcional)
4. **Día 4**: Build de producción + Subir a App Store Connect
5. **Día 5**: Completar Review Notes + Responder rechazos + Enviar

**Tiempo estimado total: 3-5 días**

---

## 📞 Si Necesitas Ayuda

- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)
- [StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

