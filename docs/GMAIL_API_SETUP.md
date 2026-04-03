# Correo con Gmail API (prioritario en Anto)

El backend (`backend/config/mailer.js`) envía con este **orden**:

1. **Gmail API** — si existen `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` y una dirección en `GMAIL_USER_EMAIL` o `EMAIL_USER`.
2. **SendGrid** — solo si **no** está configurada la triada de Gmail API (y no pusiste `MAIL_OPT_OUT_SENDGRID=true`).
3. **Gmail SMTP** — fallback (`EMAIL_USER` + `EMAIL_APP_PASSWORD`).

Cuando usás Gmail API, en la práctica el primer intento es la API; si falla, el código pasa a **SMTP** (SendGrid no entra en esa ruta porque `USE_SENDGRID` queda en falso).

## 1. Google Cloud Console

1. Proyecto → **APIs y servicios** → **Biblioteca** → habilitar **Gmail API**.
2. **Pantalla de consentimiento de OAuth** (externa o interna según tu caso; Workspace suele usar interna o dominios verificados).
3. **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth**:
   - Tipo recomendado para el script local: **Aplicación de escritorio** (o “Desktop”).
   - Anota **Client ID** y **Client Secret**.

## 2. Variables en `.env` (local) o en el host (p. ej. Render)

```env
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REFRESH_TOKEN=...    # ver paso 3
GMAIL_USER_EMAIL=no-reply@tudominio.com
```

- `GMAIL_USER_EMAIL` debe ser la **misma cuenta** (o alias permitido) con la que generaste el refresh token.
- Para el **fallback SMTP** (recomendado en producción si la API falla):

```env
EMAIL_USER=no-reply@tudominio.com
EMAIL_APP_PASSWORD=xxxx    # contraseña de aplicación de Google
```

## 3. Obtener `GMAIL_REFRESH_TOKEN`

Desde la raíz del backend:

```bash
cd backend
node scripts/getGmailRefreshToken.js
```

1. Abrí la URL que imprime el script.
2. Autorizá con la cuenta que enviará el correo.
3. Pegá el código en la terminal.
4. Copiá `GMAIL_REFRESH_TOKEN` (y configurá `GMAIL_USER_EMAIL`) al `.env` o al panel de secretos.

Si no aparece `refresh_token`: revocá la app en https://myaccount.google.com/permissions y volvé a ejecutar el script.

## 4. Opcional: no usar SendGrid aunque exista la API key

Útil si la clave sigue en el servidor pero querés **solo** Gmail + SMTP:

```env
MAIL_OPT_OUT_SENDGRID=true
```

## 5. Correo al reiniciar el servidor (opcional)

Para comprobar el mailer en cada despliegue / reinicio:

```env
MAIL_STARTUP_PING=true
# Opcional; si no se define, se usa EMAIL_USER:
# MAIL_STARTUP_PING_TO=quien@recibe.com
```

En logs: `Correo de arranque enviado correctamente a ...` o un aviso si falló.

## 6. Arranque del servidor

En los logs deberías ver líneas como:

- `[Mailer] ✅ Gmail API configurado correctamente`
- `[Mailer] 📌 Correo: Gmail API como prioritario (desde ...)`

## 7. Dominio y deliverability

Para que no caiga en spam: **SPF**, **DKIM** y **DMARC** del dominio que usás en `From` (Google Admin / zona DNS). Workspace suele guiar la verificación del dominio.
