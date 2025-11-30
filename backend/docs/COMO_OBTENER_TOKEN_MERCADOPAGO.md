# 🔑 Cómo Obtener el Access Token de Mercado Pago

Guía rápida paso a paso para obtener tu Access Token de Mercado Pago.

---

## 📍 Ubicación del Token

El Access Token se encuentra en el **Panel de Desarrolladores de Mercado Pago**.

---

## 🚀 Pasos Rápidos

### 1. Accede al Panel de Desarrolladores

**URL directa:** https://www.mercadopago.cl/developers/panel

O sigue estos pasos:
1. Ve a https://www.mercadopago.cl
2. Inicia sesión con tu cuenta
3. Haz clic en tu nombre (arriba a la derecha)
4. Selecciona **"Desarrolladores"** o **"Tu negocio" → "Desarrolladores"**

### 2. Crea o Selecciona una Aplicación

Si es tu primera vez:
1. Haz clic en **"Crear aplicación"**
2. Completa:
   - **Nombre:** `AntoApp` (o el que prefieras)
   - **Descripción:** `Aplicación de asistente AI terapéutico`
   - **Categoría:** `Servicios`
3. Haz clic en **"Crear"**

Si ya tienes una aplicación:
- Selecciónala de la lista

### 3. Obtén el Access Token

1. En la página de tu aplicación, busca la sección **"Credenciales"**
2. Verás dos tipos de credenciales:
   - **Credenciales de prueba** (para desarrollo)
   - **Credenciales de producción** (para producción)

3. **Para desarrollo (TEST):**
   - Busca el **Access Token** que comienza con `TEST-`
   - Haz clic en el botón **"Ver"** o **"Mostrar"** (icono de ojo 👁️)
   - **Copia el token completo** (es largo, asegúrate de copiarlo todo)

4. **Para producción:**
   - Busca el **Access Token** que comienza con `APP_USR-`
   - Haz clic en **"Ver"** o **"Mostrar"**
   - **Copia el token completo**

---

## 📋 Ejemplo de Token

Un Access Token se ve así:

**Test:**
```
TEST-1234567890-abcdefghijklmnopqrstuvwxyz-1234567890-abcdefghijklmnopqrstuvwxyz-1234567890-abcdefghijklmnopqrstuvwxyz
```

**Producción:**
```
APP_USR-1234567890-abcdefghijklmnopqrstuvwxyz-1234567890-abcdefghijklmnopqrstuvwxyz-1234567890-abcdefghijklmnopqrstuvwxyz
```

---

## ⚙️ Configurar el Token

### En Desarrollo Local

1. Abre el archivo `backend/.env`
2. Agrega o actualiza:
   ```env
   MERCADOPAGO_ACCESS_TOKEN=TEST-tu-token-aqui
   ```
3. Guarda el archivo
4. Reinicia el servidor

### En Render.com (Producción)

1. Ve a https://dashboard.render.com
2. Selecciona tu servicio de backend
3. Ve a **"Environment"** en el menú lateral
4. Haz clic en **"Add Environment Variable"**
5. Agrega:
   - **Key:** `MERCADOPAGO_ACCESS_TOKEN`
   - **Value:** `APP_USR-tu-token-de-produccion-aqui`
6. Haz clic en **"Save Changes"**
7. Render reiniciará automáticamente

---

## ✅ Verificar que Funciona

### 1. Revisa los Logs del Servidor

Al iniciar el servidor, deberías ver:
- ✅ **Sin warnings** = Token configurado correctamente
- ❌ **Warning:** `⚠️ MERCADOPAGO_ACCESS_TOKEN no está configurado` = Token no encontrado

### 2. Prueba el Endpoint

```bash
curl http://localhost:5000/api/payments/plans
```

Debería devolver:
```json
{
  "success": true,
  "plans": { ... },
  "provider": "mercadopago"
}
```

Si devuelve error 503, el token no está configurado correctamente.

---

## 🔒 Seguridad

- ⚠️ **NUNCA** compartas tu Access Token públicamente
- ⚠️ **NUNCA** lo subas a GitHub o repositorios públicos
- ✅ **SÍ** úsalo en variables de entorno (`.env` o Render)
- ✅ **SÍ** guárdalo de forma segura (gestor de contraseñas)

---

## 🆘 Problemas Comunes

### "No encuentro el botón Ver/Mostrar"

- Asegúrate de estar en la página correcta: **"Credenciales"** dentro de tu aplicación
- Intenta refrescar la página
- Si no aparece, puede que necesites verificar tu cuenta primero

### "El token no funciona"

- Verifica que copiaste el token completo (son muy largos)
- Asegúrate de no tener espacios al inicio o final
- Verifica que estás usando el token correcto (TEST- para desarrollo, APP_USR- para producción)
- Revisa que la variable de entorno esté configurada correctamente

### "No puedo crear una aplicación"

- Verifica que tu cuenta de Mercado Pago esté verificada
- Completa tu información de negocio en el perfil
- Contacta con soporte de Mercado Pago si persiste

---

## 📚 Recursos Adicionales

- [Documentación de Mercado Pago](https://www.mercadopago.cl/developers/es/docs)
- [Panel de Desarrolladores](https://www.mercadopago.cl/developers/panel)
- [Guía de Credenciales](https://www.mercadopago.cl/developers/es/docs/your-integrations/credentials)

---

**Última actualización:** 2025-01-XX
**Autor:** AntoApp Team

