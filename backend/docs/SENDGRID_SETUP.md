# Configuración de SendGrid

Este documento explica cómo configurar SendGrid para el envío de emails en AntoApp.

## Variables de Entorno Requeridas

Agrega las siguientes variables a tu archivo `.env`:

```env
# SendGrid (Recomendado - Prioridad Alta)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@tudominio.com

# Gmail SMTP (Fallback - Opcional)
EMAIL_USER=tu-email@gmail.com
EMAIL_APP_PASSWORD=tu-app-password-de-gmail
EMAIL_USE_SSL=false
```

## Cómo Obtener tu API Key de SendGrid

1. **Crear cuenta en SendGrid:**
   - Ve a [https://sendgrid.com](https://sendgrid.com)
   - Crea una cuenta gratuita (100 emails/día gratis)

2. **Crear API Key:**
   - Ve a Settings > API Keys
   - Click en "Create API Key"
   - Nombre: "AntoApp Production" (o el que prefieras)
   - Permisos: "Full Access" (o solo "Mail Send")
   - Copia el API Key (solo se muestra una vez)

3. **Verificar dominio (Opcional pero recomendado):**
   - Ve a Settings > Sender Authentication
   - Verifica tu dominio para mejor deliverability
   - O usa un email verificado individual

4. **Configurar email remitente:**
   - Ve a Settings > Sender Authentication
   - Verifica un email individual o dominio
   - Usa ese email en `SENDGRID_FROM_EMAIL`

## Configuración en Render

1. Ve a tu servicio en Render
2. Settings > Environment Variables
3. Agrega:
   - `SENDGRID_API_KEY`: Tu API key de SendGrid
   - `SENDGRID_FROM_EMAIL`: El email verificado en SendGrid

## Cómo Funciona

El sistema intenta usar SendGrid primero. Si SendGrid no está configurado o falla, automáticamente usa Gmail SMTP como fallback.

### Prioridad:
1. **SendGrid** (si `SENDGRID_API_KEY` está configurado)
2. **Gmail SMTP** (fallback si SendGrid no está disponible o falla)

## Ventajas de SendGrid

- ✅ **100 emails/día gratis** (suficiente para empezar)
- ✅ **Mejor deliverability** (menos probabilidad de spam)
- ✅ **Sin problemas de firewall** (API REST, no SMTP)
- ✅ **Tracking y analytics** incluidos
- ✅ **Escalable** (fácil migrar a planes pagos)

## Troubleshooting

### Error: "SendGrid API Key is invalid"
- Verifica que copiaste el API Key completo
- Asegúrate de que el API Key tenga permisos de "Mail Send"

### Error: "The from address does not match a verified Sender Identity"
- Verifica tu email o dominio en SendGrid
- Usa un email verificado en `SENDGRID_FROM_EMAIL`

### Los emails no llegan
- Revisa la carpeta de spam
- Verifica los logs del servidor
- Revisa el dashboard de SendGrid para ver el estado de los envíos

## Plan Gratuito de SendGrid

- **100 emails/día** gratis
- **Sin tarjeta de crédito** requerida
- **Sin límite de tiempo**
- Perfecto para desarrollo y producción inicial

## Migración desde Gmail

Si ya tienes Gmail configurado, simplemente agrega `SENDGRID_API_KEY` y `SENDGRID_FROM_EMAIL` a tu `.env`. El sistema automáticamente usará SendGrid y Gmail como fallback.

