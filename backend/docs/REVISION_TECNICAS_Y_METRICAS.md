# Revisión: Técnicas Terapéuticas y Dashboard de Métricas

Este documento detalla el análisis y plan de implementación para ambas mejoras.

---

## 📋 1. TÉCNICAS TERAPÉUTICAS

### Estado Actual

#### ✅ Lo que ya existe:
- **Directrices emocionales** en `backend/constants/openai.js`:
  - `EMOTION_SPECIFIC_GUIDELINES` - Directrices por emoción
  - `PHASE_SPECIFIC_GUIDELINES` - Directrices por fase terapéutica
  - `INTENSITY_SPECIFIC_GUIDELINES` - Directrices por intensidad
  - `INTENT_SPECIFIC_GUIDELINES` - Directrices por intención
  - `buildPersonalizedPrompt()` - Construye prompts personalizados

- **Integración en prompts:**
  - Las directrices se incluyen en los prompts de OpenAI
  - Se personalizan según emoción, fase, intensidad, etc.

#### ❌ Lo que falta:
- **Técnicas estructuradas paso a paso** (TCC, DBT, ACT)
- **Técnicas inmediatas vs. a largo plazo** por emoción
- **Sugerencias concretas** cuando se detecta una emoción
- **Archivo de constantes** con técnicas específicas
- **Integración en respuestas** del chat (no solo en prompts)

---

### Plan de Implementación

#### Fase 1: Crear Archivo de Constantes de Técnicas

**Archivo:** `backend/constants/therapeuticTechniques.js`

**Estructura propuesta:**
```javascript
// Técnicas inmediatas por emoción (para usar en el momento)
export const IMMEDIATE_TECHNIQUES = {
  tristeza: [...],
  ansiedad: [...],
  enojo: [...],
  miedo: [...],
  // etc.
};

// Técnicas de TCC (Terapia Cognitivo-Conductual)
export const CBT_TECHNIQUES = {
  cognitiveRestructuring: {...},
  thoughtRecord: {...},
  behavioralActivation: {...}
};

// Técnicas de DBT (Terapia Dialéctica Conductual)
export const DBT_TECHNIQUES = {
  mindfulness: {...},
  distressTolerance: {...},
  emotionRegulation: {...}
};

// Técnicas de ACT (Terapia de Aceptación y Compromiso)
export const ACT_TECHNIQUES = {
  acceptance: {...},
  cognitiveDefusion: {...},
  valuesClarification: {...}
};
```

#### Fase 2: Integrar en Respuestas del Chat

**Modificaciones necesarias:**
1. **En `openaiService.js`:**
   - Función para seleccionar técnica apropiada según emoción/fase
   - Formatear técnica como sugerencia paso a paso
   - Incluir en respuesta del chat

2. **En `chatRoutes.js`:**
   - Después de análisis emocional, seleccionar técnica
   - Agregar técnica a la respuesta del asistente
   - Opcional: Guardar técnica sugerida en metadata

3. **En prompts de OpenAI:**
   - Incluir técnicas disponibles en el contexto
   - Instruir al modelo para sugerir técnicas cuando sea apropiado

#### Fase 3: Frontend (Opcional)

**Pantalla de técnicas:**
- Lista de técnicas disponibles
- Técnicas favoritas del usuario
- Historial de técnicas usadas
- Guías paso a paso interactivas

---

### Archivos a Crear/Modificar

**Nuevos:**
- `backend/constants/therapeuticTechniques.js` - Constantes de técnicas

**Modificar:**
- `backend/services/openaiService.js` - Integrar selección de técnicas
- `backend/routes/chatRoutes.js` - Agregar técnicas a respuestas
- `backend/constants/openai.js` - Incluir técnicas en prompts

**Opcional (Frontend):**
- `frontend/src/screens/TechniquesScreen.js` - Pantalla de técnicas
- `frontend/src/components/TechniqueCard.js` - Componente de técnica

---

### Ejemplo de Implementación

**Cuando se detecta tristeza con intensidad 7:**
1. Sistema selecciona técnica: "Activación Conductual" (TCC)
2. Formatea como sugerencia paso a paso
3. Incluye en respuesta del chat:
   ```
   "Veo que estás pasando por un momento difícil. 
   Te sugiero probar esta técnica de activación conductual:
   
   1. Identifica una actividad pequeña y alcanzable
   2. Comprométete a hacerla (aunque no tengas ganas)
   3. Observa cómo te sientes después
   4. Celebra el esfuerzo, no el resultado
   
   ¿Te gustaría que exploremos juntos qué actividad podrías hacer?"
   ```

---

## 📊 2. DASHBOARD DE MÉTRICAS

### Estado Actual

#### ✅ Datos Disponibles:

**1. CrisisEvent Model:**
- Eventos de crisis registrados
- Nivel de riesgo (LOW, WARNING, MEDIUM, HIGH)
- Fechas de detección y resolución
- Alertas enviadas
- Seguimientos programados/completados
- Outcomes (resolved, ongoing, escalated, etc.)
- Metadatos (riskScore, factors, protectiveFactors)

**2. CrisisTrendAnalyzer:**
- Tendencias emocionales (7, 30, 90 días)
- Deterioro rápido, estado bajo sostenido
- Aislamiento, escalada emocional
- Distribución emocional por período
- Frecuencia de mensajes

**3. UserProfile:**
- Patrones emocionales
- Métricas de progreso
- Estadísticas de conexión
- Frecuencia por período del día
- Patrones por día de la semana

**4. Message Model:**
- Historial completo de mensajes
- Análisis emocional de cada mensaje
- Intensidad emocional
- Temas discutidos

#### ❌ Lo que falta:
- **Endpoints API** para obtener métricas
- **Frontend** para visualizar métricas
- **Gráficos** de tendencias
- **Agregaciones** de datos para estadísticas

---

### Plan de Implementación

#### Fase 1: Backend - Endpoints de Métricas

**Archivo:** `backend/routes/crisisRoutes.js` (nuevo)

**Endpoints propuestos:**
```javascript
// Obtener resumen de crisis del usuario
GET /api/crisis/summary
- Total de crisis
- Crisis por nivel de riesgo
- Crisis por mes
- Tasa de resolución

// Obtener tendencias emocionales
GET /api/crisis/trends
- Tendencias de 7, 30, 90 días
- Gráfico de intensidad emocional
- Distribución de emociones

// Obtener historial de crisis
GET /api/crisis/history
- Lista de crisis con detalles
- Filtros por fecha, nivel de riesgo
- Paginación

// Obtener estadísticas de alertas
GET /api/crisis/alerts-stats
- Alertas enviadas
- Tasa de éxito
- Contactos notificados
- Canales utilizados

// Obtener métricas de seguimiento
GET /api/crisis/followup-stats
- Seguimientos programados
- Seguimientos completados
- Tasa de respuesta
- Outcomes
```

#### Fase 2: Servicio de Métricas

**Archivo:** `backend/services/crisisMetricsService.js` (nuevo)

**Funciones:**
```javascript
class CrisisMetricsService {
  // Resumen general
  async getCrisisSummary(userId, days = 30)
  
  // Tendencias emocionales
  async getEmotionalTrends(userId, period = '30d')
  
  // Estadísticas de alertas
  async getAlertStatistics(userId, days = 30)
  
  // Estadísticas de seguimiento
  async getFollowUpStatistics(userId, days = 30)
  
  // Gráfico de crisis por mes
  async getCrisisByMonth(userId, months = 6)
  
  // Distribución de emociones
  async getEmotionDistribution(userId, days = 30)
  
  // Progreso emocional
  async getEmotionalProgress(userId, days = 90)
}
```

#### Fase 3: Frontend - Dashboard

**Pantalla:** `frontend/src/screens/CrisisDashboardScreen.js`

**Componentes:**
1. **Resumen General:**
   - Total de crisis
   - Crisis este mes
   - Nivel de riesgo promedio
   - Tasa de resolución

2. **Gráfico de Tendencias:**
   - Línea de tiempo de intensidad emocional
   - Crisis detectadas por mes
   - Tendencias de 7, 30, 90 días

3. **Distribución de Emociones:**
   - Gráfico de pastel
   - Emociones más frecuentes
   - Intensidad promedio por emoción

4. **Historial de Crisis:**
   - Lista de crisis con detalles
   - Filtros y búsqueda
   - Detalles de cada crisis

5. **Estadísticas de Alertas:**
   - Alertas enviadas
   - Contactos notificados
   - Canales utilizados

6. **Seguimientos:**
   - Seguimientos programados
   - Seguimientos completados
   - Outcomes

**Librerías necesarias:**
- `react-native-chart-kit` o `victory-native` para gráficos
- `react-native-svg` para gráficos SVG

---

### Archivos a Crear/Modificar

**Backend - Nuevos:**
- `backend/routes/crisisRoutes.js` - Rutas de métricas
- `backend/services/crisisMetricsService.js` - Servicio de métricas

**Backend - Modificar:**
- `backend/routes/index.js` o `server.js` - Registrar rutas

**Frontend - Nuevos:**
- `frontend/src/screens/CrisisDashboardScreen.js` - Pantalla principal
- `frontend/src/components/CrisisSummaryCard.js` - Tarjeta de resumen
- `frontend/src/components/EmotionalTrendChart.js` - Gráfico de tendencias
- `frontend/src/components/EmotionDistributionChart.js` - Gráfico de distribución
- `frontend/src/components/CrisisHistoryList.js` - Lista de historial

**Frontend - Modificar:**
- `frontend/src/config/api.js` - Agregar endpoints
- `frontend/src/navigation/StackNavigator.js` - Agregar ruta
- `frontend/src/screens/SettingsScreen.js` - Agregar enlace al dashboard

---

### Ejemplo de Datos del Dashboard

**Resumen General:**
```json
{
  "totalCrises": 12,
  "crisesThisMonth": 3,
  "averageRiskLevel": "MEDIUM",
  "resolutionRate": 0.75,
  "recentCrises": 2,
  "alertsSent": 8,
  "followUpsCompleted": 10
}
```

**Tendencias Emocionales:**
```json
{
  "period": "30d",
  "averageIntensity": 6.2,
  "trend": "improving",
  "dataPoints": [
    { "date": "2024-12-01", "intensity": 7.5 },
    { "date": "2024-12-15", "intensity": 6.0 },
    { "date": "2024-12-30", "intensity": 5.0 }
  ],
  "emotionDistribution": {
    "tristeza": 0.4,
    "ansiedad": 0.3,
    "neutral": 0.2,
    "alegria": 0.1
  }
}
```

**Crisis por Mes:**
```json
{
  "months": [
    { "month": "Oct 2024", "crises": 5, "high": 1, "medium": 3, "warning": 1 },
    { "month": "Nov 2024", "crises": 4, "high": 0, "medium": 2, "warning": 2 },
    { "month": "Dec 2024", "crises": 3, "high": 0, "medium": 1, "warning": 2 }
  ]
}
```

---

## 🎯 Priorización

### Opción 1: Técnicas Terapéuticas Primero
**Ventajas:**
- Impacto inmediato en efectividad terapéutica
- Mejora experiencia del usuario en cada conversación
- Relativamente rápido de implementar (6-8 horas)

**Desventajas:**
- No hay feedback visual inmediato
- Usuario puede no notar la mejora de inmediato

### Opción 2: Dashboard de Métricas Primero
**Ventajas:**
- Feedback visual inmediato
- Usuario puede ver su progreso
- Transparencia total del sistema
- Motiva al usuario a seguir usando la app

**Desventajas:**
- Más tiempo de implementación (8-10 horas)
- Requiere librerías adicionales para gráficos

### Opción 3: Implementar Ambas en Paralelo
**Ventajas:**
- Máximo impacto
- Mejora tanto efectividad como transparencia

**Desventajas:**
- Más tiempo total (14-18 horas)
- Más archivos a crear/modificar

---

## 📋 Recomendación

**Implementar Dashboard de Métricas primero** porque:
1. ✅ Ya tenemos todos los datos necesarios
2. ✅ Proporciona feedback visual inmediato
3. ✅ Motiva al usuario a seguir usando la app
4. ✅ Transparencia total del sistema
5. ✅ Permite al usuario ver su progreso

**Luego implementar Técnicas Terapéuticas** porque:
1. ✅ Complementa el dashboard con herramientas prácticas
2. ✅ Mejora efectividad de cada conversación
3. ✅ Usuario puede ver qué técnicas funcionan mejor

---

## 🚀 Plan de Acción Sugerido

### Sprint 1: Dashboard de Métricas (8-10 horas)
1. Crear `crisisMetricsService.js` (2-3h)
2. Crear `crisisRoutes.js` con endpoints (2-3h)
3. Crear `CrisisDashboardScreen.js` (3-4h)
4. Agregar gráficos básicos (1-2h)

### Sprint 2: Técnicas Terapéuticas (6-8 horas)
1. Crear `therapeuticTechniques.js` (2-3h)
2. Integrar en `openaiService.js` (2-3h)
3. Modificar `chatRoutes.js` (1-2h)
4. Probar y ajustar (1h)

---

## ❓ ¿Qué implementamos primero?

¿Prefieres:
1. **Dashboard de Métricas** - Ver progreso y transparencia
2. **Técnicas Terapéuticas** - Mejorar efectividad inmediata
3. **Ambas en paralelo** - Máximo impacto

