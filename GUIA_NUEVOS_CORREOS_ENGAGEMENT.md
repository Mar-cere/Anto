# Guía: Nuevos Correos de Engagement y Retención

## 📧 Correos Agregados

Se han agregado **2 nuevos tipos de correos** para mejorar la adhesión e interactividad:

### 1. 📬 Correo de Re-engagement (Usuarios Inactivos)
- **Propósito**: Re-enganchar usuarios que no han usado la app en 7+ días
- **Contenido**: 
  - Mensaje personalizado con días de inactividad
  - Tip del día aleatorio
  - Recordatorio de beneficios de la app
  - Llamado a la acción para volver a usar la app

### 2. 💡 Correo de Tips Semanales
- **Propósito**: Enviar consejos de bienestar emocional semanalmente
- **Contenido**:
  - Tip semanal rotativo (7 tips diferentes)
  - Explicación del tip
  - Acción sugerida para probar
  - Recordatorio de que Anto está disponible

---

## 🚀 Cómo Usar

### Opción 1: Scripts Manuales

#### Enviar Re-engagement (usuarios inactivos 7+ días):
```bash
cd backend
node scripts/sendReEngagementEmails.js 7
```

#### Enviar Tips Semanales:
```bash
cd backend
node scripts/sendWeeklyTipsEmails.js
```

O con número de semana específico:
```bash
node scripts/sendWeeklyTipsEmails.js 5
```

### Opción 2: Desde el Código

```javascript
import emailMarketingService from './services/emailMarketingService.js';

// Enviar re-engagement a usuarios inactivos 7+ días
const results = await emailMarketingService.sendReEngagementEmails(7);

// Enviar tips semanales
const results = await emailMarketingService.sendWeeklyTipsEmails();
```

---

## ⚙️ Configuración Automática (Opcional)

Para enviar estos correos automáticamente, puedes configurar un cron job o tarea programada:

### Ejemplo con Cron (Linux/Mac):

```bash
# Re-engagement cada lunes a las 9 AM (usuarios inactivos 7+ días)
0 9 * * 1 cd /ruta/al/backend && node scripts/sendReEngagementEmails.js 7

# Tips semanales cada lunes a las 10 AM
0 10 * * 1 cd /ruta/al/backend && node scripts/sendWeeklyTipsEmails.js
```

### Ejemplo con Node-cron (en el servidor):

```javascript
import cron from 'node-cron';
import emailMarketingService from './services/emailMarketingService.js';

// Re-engagement cada lunes a las 9 AM
cron.schedule('0 9 * * 1', async () => {
  await emailMarketingService.sendReEngagementEmails(7);
});

// Tips semanales cada lunes a las 10 AM
cron.schedule('0 10 * * 1', async () => {
  await emailMarketingService.sendWeeklyTipsEmails();
});
```

---

## 📋 Criterios de Envío

### Re-engagement:
- ✅ Email verificado
- ✅ Usuario activo
- ✅ Inactivo por X días (configurable, default: 7)
- ✅ Basado en `lastLogin` o `stats.lastActive`

### Tips Semanales:
- ✅ Email verificado
- ✅ Usuario activo
- ✅ Al menos 1 sesión en la app (`stats.totalSessions >= 1`)

---

## 🎨 Personalización

### Modificar Tips Semanales

Edita `backend/config/mailer.js`, función `weeklyTipsEmail`:

```javascript
const weeklyTips = [
  {
    title: '🌱 Tu Tip Personalizado',
    content: 'Tu contenido aquí...',
    action: 'Pregúntale a Anto: "..."'
  },
  // Agregar más tips...
];
```

### Modificar Re-engagement

Edita `backend/config/mailer.js`, función `reEngagementEmail`:

```javascript
reEngagementEmail: (username, daysInactive) => {
  // Personalizar mensaje, tips, etc.
}
```

---

## 📊 Monitoreo

Los logs mostrarán:

```
[EmailMarketing] Re-engagement enviado a usuario@email.com (7 días inactivo)
[EmailMarketing] Re-engagement completado: 15/20 enviados
[EmailMarketing] Tips semanales enviados a usuario@email.com (semana 5)
[EmailMarketing] Tips semanales completados: 50/50 enviados
```

---

## 🔒 Seguridad y Privacidad

- ✅ Solo se envían a usuarios con email verificado
- ✅ Solo a usuarios activos
- ✅ Los errores no afectan otros procesos
- ✅ Logs detallados para auditoría

---

## 📈 Impacto Esperado

### Re-engagement:
- **Retención**: Recuperar usuarios inactivos
- **Engagement**: Aumentar uso de la app
- **Conversión**: Recordar beneficios de suscripción

### Tips Semanales:
- **Educación**: Compartir conocimiento de bienestar
- **Hábito**: Crear rutina de uso semanal
- **Valor**: Demostrar valor continuo de la app

---

## 🧪 Pruebas

### Probar Re-engagement:
```bash
# Enviar a usuarios inactivos 1+ día (para pruebas)
node scripts/sendReEngagementEmails.js 1
```

### Probar Tips Semanales:
```bash
# Enviar tips de la semana 1
node scripts/sendWeeklyTipsEmails.js 1
```

---

## 📝 Notas

- Los correos se envían usando el mismo sistema de mailer (Gmail API, SendGrid, o Gmail SMTP)
- Los errores no son críticos y no afectan otros procesos
- Se recomienda enviar re-engagement una vez por semana
- Se recomienda enviar tips semanales cada lunes

---

**Última actualización**: 2025-01-02

