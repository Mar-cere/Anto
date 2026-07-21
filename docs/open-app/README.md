# Puente HTTPS «Abrir Anto» (correos)

Gmail y otros clientes de correo suelen **bloquear** esquemas `anto://`. Esta página HTTPS intenta abrir la app y, si no, muestra App Store / instrucciones Android.

## Publicar

Copia `index.html` a tu hosting de **antoapps.com** de forma que quede en:

`https://www.antoapps.com/open`  
(o `https://www.antoapps.com/open/index.html` con redirect limpio a `/open`)

## Query

| `?to=` | Deep link |
|--------|-----------|
| `weekly-summary` (recomendado en correos) | `anto:///weekly-summary` |
| `app` / vacío / `home` | `anto://` |
| otro segmento | `anto:///<segmento>` |

Opcional: `?lang=en` fuerza copy en inglés.

## Backend (local y Render)

```bash
EMAIL_APP_OPEN_LINK=https://www.antoapps.com/open?to=weekly-summary
```

`EMAIL_APP_OPEN_LINK` tiene prioridad sobre `WEEKLY_SUMMARY_EMAIL_OPEN_APP_ONLY` / `anto://` (ver `buildEmailAppOpenHref` en `backend/config/mailer.js`).

## Probar

1. Publicar la página y abrir en el móvil:  
   `https://www.antoapps.com/open?to=weekly-summary`
2. Enviar correo de prueba:
   ```bash
   cd backend && node scripts/sendWeeklySummaryTestEmail.js tu@email.com Nombre
   ```
3. Confirmar que el CTA del mail es **https://…** (el script imprime el `href` efectivo).
