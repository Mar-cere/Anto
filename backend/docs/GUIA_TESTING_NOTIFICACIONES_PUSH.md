# Guía de Testing - Notificaciones Push

## 🧪 Cómo Probar el Sistema de Notificaciones Push

### Prerequisitos

1. **Development Build o Build de Producción**
   - ⚠️ Las notificaciones push NO funcionan en Expo Go
   - ✅ Requiere un development build o build de producción
   - Para crear un development build: `npx expo run:ios` o `npx expo run:android`

2. **Project ID de Expo**
   - Obtener desde: https://expo.dev/accounts/[tu-cuenta]/projects/[tu-proyecto]/settings
   - O ejecutar: `npx expo whoami` y luego `npx expo config --type public`

3. **Dependencias Instaladas**
   ```bash
   cd backend
   npm install expo-server-sdk
   ```

---

## 📋 Pasos para Probar

### Paso 1: Configurar Project ID

**Opción A: En app.json**
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "tu-project-id-aqui"
      }
    }
  }
}
```

**Opción B: En variables de entorno (.env)**
```
EXPO_PUBLIC_PROJECT_ID=tu-project-id-aqui
```

**Opción C: Obtener automáticamente**
El Project ID se puede obtener del archivo `app.json` si ya tienes un proyecto configurado en Expo.

---

### Paso 2: Verificar Instalación de Dependencias

```bash
# Backend
cd backend
npm list expo-server-sdk

# Frontend (ya debería estar)
cd frontend
npm list expo-notifications
```

---

### Paso 3: Probar Registro de Token

1. **Iniciar el servidor backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Iniciar la app en dispositivo real:**
   ```bash
   cd frontend
   npx expo run:ios  # o npx expo run:android
   ```

3. **Iniciar sesión en la app**

4. **Verificar en logs del backend:**
   - Buscar: `[NotificationRoutes] ✅ Token push actualizado para usuario`
   - O verificar en MongoDB que el usuario tenga `pushToken` guardado

5. **Verificar en Settings:**
   - Ir a Settings → Notificaciones Push
   - El toggle debería estar disponible
   - Al activarlo, debería mostrar "✅ Registrado"

---

### Paso 4: Probar Notificación de Crisis WARNING

1. **Abrir el chat en la app**

2. **Enviar un mensaje que active detección de crisis WARNING:**
   ```
   Ejemplos:
   - "Me siento muy triste últimamente"
   - "No sé qué hacer, todo me sale mal"
   - "Estoy pasando por un momento difícil"
   ```

3. **Verificar en logs del backend:**
   ```
   [ChatRoutes] ⚠️ Nivel WARNING detectado
   [PushNotificationService] ✅ Notificación enviada exitosamente
   ```

4. **Verificar en el dispositivo:**
   - Deberías recibir una notificación push
   - Título: "⚠️ Cuidado con tu bienestar"
   - Al tocar, debería abrir el chat

---

### Paso 5: Probar Notificación de Crisis MEDIUM/HIGH

1. **Enviar un mensaje más intenso:**
   ```
   Ejemplos:
   - "Ya no puedo más, no veo salida"
   - "Todo sería mejor si no existiera"
   - "No quiero seguir viviendo así"
   ```

2. **Verificar:**
   - Notificación push al usuario
   - Alertas enviadas a contactos de emergencia (si están configurados)

---

### Paso 6: Probar Seguimiento Post-Crisis

**Opción A: Esperar el tiempo programado**
- Generar una crisis
- Esperar 12-48 horas según nivel de riesgo
- Verificar que llegue notificación de seguimiento

**Opción B: Modificar temporalmente el intervalo (solo para testing)**
En `backend/services/crisisFollowUpService.js`, cambiar temporalmente:
```javascript
this.FOLLOW_UP_INTERVALS = {
  FIRST: 0.1, // 6 minutos para testing
  // ...
};
```

Luego esperar 6 minutos y verificar la notificación.

---

### Paso 7: Probar desde Settings

1. **Ir a Settings → Notificaciones Push**

2. **Desactivar el toggle:**
   - Debería mostrar alerta de confirmación
   - El estado debería cambiar a "⚠️ No registrado"

3. **Activar el toggle nuevamente:**
   - Debería solicitar permisos
   - Debería registrar el token
   - Debería mostrar "✅ Registrado"

---

## 🔍 Verificación en Backend

### Verificar Token en Base de Datos

```javascript
// En MongoDB o usando una herramienta de base de datos
db.users.findOne({ email: "tu-email@ejemplo.com" }, { pushToken: 1, pushTokenUpdatedAt: 1 })
```

### Verificar Logs del Backend

Buscar en los logs:
- `[PushNotificationService] ✅ Notificación enviada exitosamente`
- `[NotificationRoutes] ✅ Token push actualizado`
- `[CrisisFollowUpService] ✅ Notificación push de seguimiento enviada`

---

## 🐛 Troubleshooting

### Problema: "No se pudo obtener token push"

**Causas posibles:**
1. Estás usando Expo Go (no soporta push remotas)
2. No hay Project ID configurado
3. No hay conexión a internet

**Solución:**
- Crear development build: `npx expo run:ios` o `npx expo run:android`
- Verificar Project ID en `app.json` o variables de entorno
- Verificar conexión a internet

---

### Problema: "Token inválido" en backend

**Causa:**
- El token no tiene el formato correcto de Expo

**Solución:**
- Verificar que el token comience con `ExponentPushToken[` o `ExpoPushToken[`
- Verificar que se esté usando un development build

---

### Problema: No se reciben notificaciones

**Verificaciones:**
1. ✅ Token está registrado en la base de datos
2. ✅ Permisos de notificaciones otorgados
3. ✅ Notificaciones no están silenciadas en el dispositivo
4. ✅ Backend está enviando (verificar logs)
5. ✅ Usando development build o build de producción

---

### Problema: Error "expo-server-sdk not found"

**Solución:**
```bash
cd backend
npm install expo-server-sdk
```

---

## 📱 Testing Manual Rápido

### Script de Testing Rápido

1. **Registrar token:**
   - Iniciar sesión
   - Ir a Settings → Activar "Notificaciones Push"
   - Verificar estado: "✅ Registrado"

2. **Probar notificación de crisis:**
   - Enviar mensaje en chat: "Me siento muy mal"
   - Verificar notificación push recibida

3. **Verificar en backend:**
   ```bash
   # Ver logs del servidor
   # Buscar: "Notificación enviada exitosamente"
   ```

---

## 🧪 Testing Automatizado (Futuro)

Para implementar tests automatizados:

```javascript
// backend/tests/services/pushNotificationService.test.js
describe('PushNotificationService', () => {
  it('should send crisis warning notification', async () => {
    const result = await pushNotificationService.sendCrisisWarning(
      'ExponentPushToken[test-token]',
      { emotion: 'tristeza', intensity: 7 }
    );
    expect(result.success).toBe(true);
  });
});
```

---

## ✅ Checklist de Testing

- [ ] Project ID configurado
- [ ] Dependencias instaladas
- [ ] Development build creado
- [ ] Token se registra correctamente
- [ ] Estado muestra "✅ Registrado" en Settings
- [ ] Notificación WARNING se recibe
- [ ] Notificación MEDIUM se recibe
- [ ] Notificación HIGH se recibe
- [ ] Seguimiento post-crisis funciona
- [ ] Toggle en Settings funciona correctamente
- [ ] Logs del backend muestran envíos exitosos

---

## 📞 Comandos Útiles

```bash
# Verificar Project ID
cd frontend
npx expo config --type public | grep projectId

# Crear development build iOS
npx expo run:ios

# Crear development build Android
npx expo run:android

# Ver logs del backend
cd backend
npm run dev

# Verificar token en MongoDB
# Usar MongoDB Compass o CLI
```

---

**Nota:** Recuerda que las notificaciones push remotas solo funcionan en development builds o builds de producción, NO en Expo Go.

