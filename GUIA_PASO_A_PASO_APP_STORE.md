# Guía Paso a Paso: Subir App a App Store Connect

## ⚠️ IMPORTANTE: Orden de Ejecución

**NO hagas el build hasta completar los pasos 1-3**. Los productos DEBEN estar configurados antes del build.

---

## Paso 1: Configurar Productos en App Store Connect (OBLIGATORIO)

**Tiempo estimado: 30-60 minutos**

### 1.1. Acceder a App Store Connect

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Inicia sesión con tu cuenta de desarrollador
3. Selecciona tu app "Anto"

### 1.2. Crear Productos de Suscripción

Para cada producto, sigue estos pasos:

#### Producto 1: Premium Semanal

1. Ve a **Features** → **In-App Purchases**
2. Haz clic en **+** (botón azul)
3. Selecciona **Auto-Renewable Subscription**
4. Completa:
   - **Product ID**: `com.anto.app.weekly` (EXACTO, sin espacios)
   - **Reference Name**: `Premium Semanal`
   - **Subscription Group**: Crea uno nuevo llamado "Anto Premium" (o usa uno existente)
5. Haz clic en **Create**
6. Configura:
   - **Subscription Duration**: 1 Week
   - **Price**: $990 CLP (o el equivalente en tu moneda base)
   - **Display Name**: `Premium Semanal`
   - **Description**: `Acceso completo a todas las funciones de Anto por 7 días`
7. Haz clic en **Save**

#### Repite para los otros 4 productos:

| Product ID | Nombre | Duración | Precio CLP |
|------------|--------|----------|------------|
| `com.anto.app.monthly` | Premium Mensual | 1 Month | $3.990 |
| `com.anto.app.quarterly` | Premium Trimestral | 3 Months | $11.990 |
| `com.anto.app.semestral` | Premium Semestral | 6 Months | $20.990 |
| `com.anto.app.yearly` | Premium Anual | 1 Year | $39.990 |

**⚠️ CRÍTICO**: Los Product IDs deben ser EXACTAMENTE como se muestran arriba.

### 1.3. Verificar Productos

Asegúrate de que todos los productos estén en estado **"Ready to Submit"** o **"Approved"**.

---

## Paso 2: Configurar Shared Secret

**Tiempo estimado: 5 minutos**

1. Ve a **App Store Connect** → Tu App → **App Information**
2. Desplázate hasta **App Store Connect API**
3. Si no tienes un Shared Secret, haz clic en **Generate** o **Manage**
4. Copia el **Shared Secret** (es una cadena larga de caracteres)
5. Agrega en tu archivo `.env` del backend:

```bash
APPLE_SHARED_SECRET=tu_shared_secret_copiado_aqui
```

6. Reinicia tu servidor backend para que cargue la nueva variable

---

## Paso 3: Actualizar Privacidad en App Store Connect

**Tiempo estimado: 10 minutos**

1. Ve a **App Store Connect** → Tu App → **App Privacy**
2. En la sección **"Data Used to Track You"**:
   - Si "Name" está ahí, **remuévelo**
3. Si necesitas mantener "Name" en la privacidad:
   - Muévelo a **"Data Linked to You"**
   - Explica: "Se usa solo para funcionalidad interna de la app (perfil de usuario)"
4. Guarda los cambios

---

## Paso 4: Crear Screenshots

**Tiempo estimado: 1-2 horas**

### 4.1. Screenshots para iPhone 6.5"

1. Abre el **Simulador de iOS** (Xcode → Open Developer Tool → Simulator)
2. Selecciona un dispositivo **iPhone 15 Pro Max** o **iPhone 14 Pro Max**
3. Ejecuta tu app en el simulador
4. Navega a cada pantalla y toma screenshots:
   - **Screenshot 1**: Dashboard/Pantalla principal
   - **Screenshot 2**: Chat con Anto
   - **Screenshot 3**: Pantalla de suscripción (mostrando los precios)
   - **Screenshot 4**: Perfil/Configuración
   - **Screenshot 5**: Otra funcionalidad principal

**Cómo tomar screenshot:**
- Presiona `Cmd + S` en el simulador
- El screenshot se guarda en el escritorio
- O: Device → Screenshot en el menú del simulador

### 4.2. Screenshots para iPad 13"

1. En el simulador, selecciona **iPad Pro (12.9-inch)**
2. Ejecuta tu app
3. Toma screenshots de las mismas pantallas
4. **IMPORTANTE**: Deben mostrar la app en frame de iPad (NO iPhone)

### 4.3. Requisitos de Screenshots

- ✅ Mostrar la app REAL en uso
- ✅ NO usar splash screens o login como mayoría
- ✅ Mostrar funcionalidades principales
- ✅ Frame correcto para cada dispositivo
- ✅ Formato: PNG o JPEG
- ✅ Tamaño mínimo: 320x568 píxeles
- ✅ Recomendado: 1242x2208 píxeles o mayor

---

## Paso 5: Subir Screenshots a App Store Connect

**Tiempo estimado: 15 minutos**

1. Ve a **App Store Connect** → Tu App → **App Store** → **Versión**
2. Haz clic en **Screenshots**
3. Selecciona **"View All Sizes in Media Manager"**
4. Para cada tamaño requerido:
   - Haz clic en **"+"** o arrastra el screenshot
   - Sube el screenshot correspondiente
5. Asegúrate de que:
   - iPhone 6.5" tenga 5 screenshots
   - iPad 13" tenga 5 screenshots (en frame de iPad)

---

## Paso 6: Preparar Build de Producción

**Tiempo estimado: 30 minutos**

### 6.1. Verificar Configuración

1. **Verifica `app.json`**:
   ```json
   {
     "ios": {
       "buildNumber": "2",  // Debe ser 2 o superior
       "bundleIdentifier": "com.anto.app"
     }
   }
   ```

2. **Verifica variables de entorno del backend**:
   ```bash
   APPLE_SHARED_SECRET=tu_shared_secret
   NODE_ENV=production
   ```

3. **Verifica que los Product IDs en el código coincidan**:
   - `frontend/src/services/storeKitService.js`
   - Deben ser: `com.anto.app.weekly`, `com.anto.app.monthly`, etc.

### 6.2. Hacer Build con EAS

```bash
# Desde la raíz del proyecto
cd frontend

# Si no tienes EAS CLI instalado:
npm install -g eas-cli

# Login en EAS (si no estás logueado):
eas login

# Crear build de producción:
eas build --platform ios --profile production
```

**Notas:**
- El build puede tardar 15-30 minutos
- EAS te dará un link para seguir el progreso
- Cuando termine, el build se subirá automáticamente a App Store Connect

### 6.3. Alternativa: Build Local (si prefieres)

```bash
cd frontend
npx expo run:ios --configuration Release
```

Luego sube el `.ipa` manualmente a App Store Connect.

---

## Paso 7: Completar Información en App Store Connect

**Tiempo estimado: 20 minutos**

1. Ve a **App Store Connect** → Tu App → **App Store** → **Versión**
2. Completa:
   - **What's New in This Version**: Describe los cambios
   - **Keywords**: Palabras clave para búsqueda
   - **Support URL**: URL de soporte
   - **Marketing URL** (opcional): URL de marketing
   - **Privacy Policy URL**: URL de política de privacidad

### 7.1. Review Notes (MUY IMPORTANTE)

En **Review Notes**, pega esto:

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

CUENTA DE PRUEBA (si es requerida):
- Email: [tu email de prueba]
- Contraseña: [tu contraseña]
- Nota: [cualquier información adicional que Apple necesite]
```

---

## Paso 8: Responder a los Rechazos

**Tiempo estimado: 10 minutos**

1. Ve a **App Store Connect** → Tu App → **Resolution Center**
2. Para cada rechazo, haz clic en **"Reply"** y pega la respuesta correspondiente:

### Rechazo 5.1.2 (App Tracking Transparency):

```
Hemos actualizado la información de privacidad en App Store Connect. 
La app NO recopila datos para tracking de usuarios. Los datos recopilados 
(como nombre) se usan únicamente para funcionalidad interna de la app 
(perfil de usuario, personalización del asistente AI) y NO se comparten 
con terceros para publicidad o tracking entre apps.

Hemos removido NSUserTrackingUsageDescription del código ya que no 
utilizamos App Tracking Transparency, ya que no hacemos tracking de usuarios.
```

### Rechazo 2.3.3 (Screenshots):

```
Hemos actualizado todos los screenshots para mostrar la app en uso real:
- Los screenshots de iPhone 6.5" muestran la app funcionando con funcionalidades principales
- Los screenshots de iPad muestran la app en el frame correcto de iPad (no iPhone)
- Todos los screenshots reflejan la UI real de la app
```

### Rechazo 3.1.1 (In-App Purchase):

```
Hemos implementado StoreKit para todas las suscripciones en iOS. 
Las suscripciones ahora se compran exclusivamente usando In-App Purchase 
a través de StoreKit. Los productos están configurados en App Store Connect 
y el backend valida todos los recibos con Apple.

Mercado Pago solo se usa en Android, que no tiene estas restricciones.
```

---

## Paso 9: Seleccionar Build y Enviar

**Tiempo estimado: 5 minutos**

1. En **App Store Connect** → Tu App → **App Store** → **Versión**
2. En la sección **Build**, haz clic en **"+ Build"**
3. Selecciona el build que acabas de subir (debe ser build number 2 o superior)
4. Verifica que toda la información esté completa
5. Haz clic en **"Submit for Review"**
6. Confirma el envío

---

## ✅ Checklist Final Antes de Enviar

- [ ] 5 productos configurados en App Store Connect
- [ ] Shared Secret configurado en backend
- [ ] Privacidad actualizada en App Store Connect
- [ ] 5 screenshots de iPhone 6.5" subidos
- [ ] 5 screenshots de iPad 13" subidos (en frame de iPad)
- [ ] Build de producción creado y subido
- [ ] Review Notes completados
- [ ] Respuestas a rechazos preparadas
- [ ] Build seleccionado en la versión
- [ ] Información de la app completa
- [ ] Enviado para revisión

---

## ⏱️ Timeline Estimado

- **Paso 1** (Productos): 30-60 min
- **Paso 2** (Shared Secret): 5 min
- **Paso 3** (Privacidad): 10 min
- **Paso 4** (Screenshots): 1-2 horas
- **Paso 5** (Subir screenshots): 15 min
- **Paso 6** (Build): 30 min (más tiempo de compilación)
- **Paso 7** (Información): 20 min
- **Paso 8** (Rechazos): 10 min
- **Paso 9** (Enviar): 5 min

**Total: 3-4 horas** (más tiempo de compilación del build)

---

## 🚨 Errores Comunes y Soluciones

### Error: "No products found"
- **Causa**: Productos no configurados en App Store Connect
- **Solución**: Completa el Paso 1

### Error: "Invalid receipt"
- **Causa**: Shared Secret incorrecto o no configurado
- **Solución**: Verifica el Paso 2

### Error: "You've already submitted this build"
- **Causa**: Build number duplicado
- **Solución**: Incrementa `buildNumber` en `app.json`

### Error: "Screenshots required"
- **Causa**: Faltan screenshots para algún tamaño
- **Solución**: Completa el Paso 5

---

## 📞 Recursos

- [App Store Connect](https://appstoreconnect.apple.com)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Apple In-App Purchase Guide](https://developer.apple.com/in-app-purchase/)

---

## 💡 Tips

1. **Haz los productos PRIMERO** - Sin productos, StoreKit no funcionará
2. **Prueba en dispositivo real** - StoreKit no funciona en simulador
3. **Screenshots reales** - Apple los verifica, no uses mockups
4. **Review Notes claros** - Explica bien los cambios
5. **Sé paciente** - La revisión puede tardar 1-3 días

---

¡Buena suerte con el envío! 🚀

