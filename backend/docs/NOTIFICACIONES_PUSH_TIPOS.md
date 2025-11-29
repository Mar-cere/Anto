# Tipos de Notificaciones Push - Guía Completa

## 📋 Resumen

Este documento describe todos los tipos de notificaciones push disponibles en el sistema Anto, organizadas por categoría.

---

## 🚨 Crisis y Seguimiento

### 1. Crisis WARNING
- **Tipo**: `crisis_warning`
- **Prioridad**: Alta
- **Canal**: `anto-crisis`
- **Descripción**: Se envía cuando se detecta un nivel de riesgo WARNING
- **Método**: `sendCrisisWarning(pushToken, { emotion, intensity })`
- **Acción**: Abre el chat

### 2. Crisis MEDIUM
- **Tipo**: `crisis_medium`
- **Prioridad**: Alta
- **Canal**: `anto-crisis`
- **Descripción**: Se envía cuando se detecta un nivel de riesgo MEDIUM
- **Método**: `sendCrisisMedium(pushToken, options)`
- **Acción**: Abre el chat

### 3. Crisis HIGH
- **Tipo**: `crisis_high`
- **Prioridad**: Alta
- **Canal**: `anto-crisis`
- **Descripción**: Se envía cuando se detecta un nivel de riesgo HIGH
- **Método**: `sendCrisisHigh(pushToken, options)`
- **Acción**: Abre el chat

### 4. Follow-up Post-Crisis
- **Tipo**: `crisis_followup`
- **Prioridad**: Alta
- **Canal**: `anto-followup`
- **Descripción**: Seguimiento después de una crisis detectada
- **Método**: `sendFollowUp(pushToken, { hoursSinceCrisis, message })`
- **Acción**: Abre el chat

---

## 🧘 Técnicas y Bienestar

### 5. Recordatorio de Técnica Terapéutica
- **Tipo**: `technique_reminder`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para practicar una técnica específica
- **Método**: `sendTechniqueReminder(pushToken, { technique, emotion })`
- **Acción**: Abre la técnica

### 6. Recordatorio de Respiración
- **Tipo**: `breathing_reminder`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para hacer una pausa de respiración
- **Método**: `sendBreathingReminder(pushToken, options)`
- **Acción**: Abre técnica de respiración

### 7. Recordatorio de Mindfulness
- **Tipo**: `mindfulness_reminder`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para practicar mindfulness
- **Método**: `sendMindfulnessReminder(pushToken, options)`
- **Acción**: Abre técnica de mindfulness

### 8. Consejo de Bienestar
- **Tipo**: `wellness_tip`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Consejos generales de bienestar
- **Método**: `sendWellnessTip(pushToken, { tip })`
- **Acción**: Abre el dashboard

### 9. Recordatorio de Autocuidado
- **Tipo**: `self_care_reminder`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para dedicar tiempo al autocuidado
- **Método**: `sendSelfCareReminder(pushToken, options)`
- **Acción**: Abre el dashboard

---

## 🎉 Progreso y Logros

### 10. Progreso Positivo
- **Tipo**: `progress_positive`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Celebración de progreso positivo
- **Método**: `sendProgressPositive(pushToken, { achievement, message })`
- **Acción**: Abre el dashboard

### 11. Logro Desbloqueado
- **Tipo**: `achievement_unlocked`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Notificación cuando se desbloquea un logro
- **Método**: `sendAchievementUnlocked(pushToken, { achievementName, description })`
- **Acción**: Abre el dashboard

### 12. Hito de Racha
- **Tipo**: `streak_milestone`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Celebración de rachas de hábitos o días consecutivos
- **Método**: `sendStreakMilestone(pushToken, { streak, type })`
- **Acción**: Abre el dashboard

### 13. Progreso Semanal
- **Tipo**: `weekly_progress`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Resumen semanal de progreso
- **Método**: `sendWeeklyProgress(pushToken, { completedHabits, completedTasks, emotionalTrend })`
- **Acción**: Abre el dashboard

---

## 📋 Hábitos y Tareas

### 14. Recordatorio de Hábito
- **Tipo**: `habit_reminder`
- **Prioridad**: Alta
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para completar un hábito
- **Método**: `sendHabitReminder(pushToken, { habitName, habitId })`
- **Acción**: Abre la pantalla de hábitos

### 15. Hábito Perdido
- **Tipo**: `habit_missed`
- **Prioridad**: Alta
- **Canal**: `anto-reminders`
- **Descripción**: Notificación cuando se pierde un hábito (con mensaje motivacional)
- **Método**: `sendHabitMissed(pushToken, { habitName, streak })`
- **Acción**: Abre la pantalla de hábitos

### 16. Recordatorio de Tarea
- **Tipo**: `task_reminder`
- **Prioridad**: Alta
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para completar una tarea
- **Método**: `sendTaskReminder(pushToken, { taskTitle, taskId, dueDate })`
- **Acción**: Abre la pantalla de tareas

### 17. Tarea Vencida
- **Tipo**: `task_overdue`
- **Prioridad**: Alta
- **Canal**: `anto-reminders`
- **Descripción**: Notificación cuando una tarea está vencida
- **Método**: `sendTaskOverdue(pushToken, { taskTitle, taskId, daysOverdue })`
- **Acción**: Abre la pantalla de tareas

---

## 💭 Check-ins y Reflexión

### 18. Check-in Diario
- **Tipo**: `daily_checkin`
- **Prioridad**: Alta
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para hacer un check-in emocional diario
- **Método**: `sendDailyCheckIn(pushToken, { timeOfDay })`
- **Acción**: Abre el chat

### 19. Check-in Emocional
- **Tipo**: `emotional_checkin`
- **Prioridad**: Alta
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio específico para check-in emocional
- **Método**: `sendDailyCheckIn(pushToken, { timeOfDay })` (usar con timeOfDay específico)
- **Acción**: Abre el chat

### 20. Recordatorio de Gratitud
- **Tipo**: `gratitude_reminder`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Recordatorio para practicar gratitud
- **Método**: `sendGratitudeReminder(pushToken, options)`
- **Acción**: Abre el chat

---

## 💙 Motivación y Apoyo

### 21. Mensaje Motivacional
- **Tipo**: `motivational_message`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Mensajes motivacionales personalizados
- **Método**: `sendMotivationalMessage(pushToken, { message, timeOfDay })`
- **Acción**: Abre el dashboard

### 22. Motivación Matutina
- **Tipo**: `morning_motivation`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Mensajes motivacionales para la mañana
- **Método**: `sendMotivationalMessage(pushToken, { timeOfDay: 'morning' })`
- **Acción**: Abre el dashboard

### 23. Reflexión Nocturna
- **Tipo**: `evening_reflection`
- **Prioridad**: Normal
- **Canal**: `anto-reminders`
- **Descripción**: Mensajes para reflexión nocturna
- **Método**: `sendMotivationalMessage(pushToken, { timeOfDay: 'evening' })`
- **Acción**: Abre el dashboard

---

## 📊 Canales de Notificación (Android)

### `anto-crisis`
- **Importancia**: MAX
- **Uso**: Crisis y alertas de emergencia
- **Vibración**: [0, 500, 200, 500]
- **Color**: #FF6B6B

### `anto-followup`
- **Importancia**: HIGH
- **Uso**: Seguimientos post-crisis
- **Vibración**: [0, 250, 250, 250]
- **Color**: #4ECDC4

### `anto-reminders`
- **Importancia**: HIGH
- **Uso**: Recordatorios, progreso, logros, hábitos, tareas, check-ins, motivación
- **Vibración**: [0, 250]
- **Color**: #1ADDDB

### `anto-notifications`
- **Importancia**: DEFAULT
- **Uso**: Notificaciones generales
- **Vibración**: [0, 200]
- **Color**: #1ADDDB

---

## 🔧 Uso en el Código

### Ejemplo: Enviar recordatorio de hábito

```javascript
import pushNotificationService from '../services/pushNotificationService.js';

await pushNotificationService.sendHabitReminder(
  user.pushToken,
  {
    habitName: 'Meditación matutina',
    habitId: '1234567890'
  }
);
```

### Ejemplo: Enviar mensaje motivacional

```javascript
await pushNotificationService.sendMotivationalMessage(
  user.pushToken,
  {
    timeOfDay: 'morning',
    message: 'Cada nuevo día es una oportunidad para crecer.'
  }
);
```

### Ejemplo: Enviar check-in diario

```javascript
await pushNotificationService.sendDailyCheckIn(
  user.pushToken,
  {
    timeOfDay: 'evening'
  }
);
```

---

## 📝 Notas de Implementación

1. **Prioridades**: Las notificaciones de crisis siempre tienen prioridad alta. Las demás varían según su importancia.

2. **Icono**: Todas las notificaciones incluyen el icono de la aplicación configurado en `NOTIFICATION_ICON_URL`.

3. **Badge**: Todas las notificaciones incrementan el badge del app en 1.

4. **Sonido**: Todas las notificaciones usan el sonido por defecto del dispositivo.

5. **Acciones**: Cada notificación incluye una acción en `data.action` que puede ser:
   - `open_chat`: Abre el chat
   - `open_dashboard`: Abre el dashboard
   - `open_habits`: Abre la pantalla de hábitos
   - `open_tasks`: Abre la pantalla de tareas
   - `open_technique`: Abre una técnica específica

---

## 🚀 Próximos Pasos

- [ ] Implementar programación automática de notificaciones recurrentes
- [ ] Agregar personalización de horarios por usuario
- [ ] Implementar sistema de preferencias de notificaciones
- [ ] Agregar analytics de engagement con notificaciones
- [ ] Implementar notificaciones basadas en comportamiento del usuario

