# Cómo Configurar el Project ID de Expo

## 🔧 Pasos para Obtener y Configurar el Project ID

### Opción 1: Obtener Project ID desde Expo Dashboard (Recomendado)

1. **Inicia sesión en Expo:**
   ```bash
   cd frontend
   npx expo login
   ```

2. **Vincula tu proyecto (si no está vinculado):**
   ```bash
   npx expo init --template blank
   # O simplemente:
   eas init
   ```

3. **Obtén el Project ID:**
   - Ve a: https://expo.dev/accounts/[tu-cuenta]/projects/anto/settings
   - O ejecuta: `npx expo config --type public` y busca `projectId`

4. **Copia el Project ID** (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

### Opción 2: Crear Proyecto en Expo (Si no existe)

1. **Inicia sesión:**
   ```bash
   cd frontend
   npx expo login
   ```

2. **Crea el proyecto en Expo:**
   ```bash
   eas init
   ```
   Esto creará un `eas.json` y vinculará tu proyecto con Expo.

3. **Obtén el Project ID** del archivo `eas.json` o desde el dashboard.

---

### Opción 3: Configurar Manualmente

1. **Edita `frontend/app.json`:**
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

2. **O crea/edita `.env` en `frontend/`:**
   ```
   EXPO_PUBLIC_PROJECT_ID=tu-project-id-aqui
   ```

---

## ✅ Verificar Configuración

Después de configurar, verifica:

```bash
cd frontend
npx expo config --type public | grep projectId
```

Deberías ver tu Project ID en la salida.

---

## 🚀 Alternativa: Usar sin Project ID (Solo para Testing Local)

Si solo quieres probar localmente sin configurar Expo, puedes modificar temporalmente el código para usar notificaciones locales en lugar de push remotas. Sin embargo, esto limitará las funcionalidades.

---

## 📝 Nota Importante

- El Project ID es necesario para notificaciones push remotas
- Sin Project ID, solo funcionarán notificaciones locales (no desde el backend)
- Para producción, definitivamente necesitas el Project ID

