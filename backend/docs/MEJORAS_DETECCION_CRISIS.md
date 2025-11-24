# Mejoras al Sistema de Detección de Crisis

Este documento detalla mejoras propuestas para mejorar la precisión, proactividad y efectividad del sistema de detección de crisis.

---

## 📊 Resumen Ejecutivo

**Estado Actual:**
- ✅ Detección basada en mensaje actual
- ✅ Análisis emocional y contextual
- ✅ Alertas para riesgo MEDIUM/HIGH
- ✅ Cooldown de 60 minutos

**Áreas de Mejora Identificadas:**
1. Análisis de tendencias históricas
2. Detección temprana (prevención)
3. Factores de riesgo adicionales
4. Análisis contextual más profundo
5. Sistema de alertas escalonadas
6. Seguimiento post-crisis
7. Registro de eventos de crisis

---

## 🎯 Mejoras Propuestas

### 1. **Análisis de Tendencias Históricas** 🔴 CRÍTICA
**Prioridad:** 🔴 **ALTA**  
**Complejidad:** 🟡 **MEDIA**

#### Problema Actual:
- Solo se analiza el mensaje actual
- No se detectan deterioros graduales
- No se consideran patrones históricos del usuario

#### Solución:
- Analizar tendencia emocional de últimos 7-30 días
- Detectar cambios abruptos en patrones emocionales
- Comparar con baseline emocional del usuario
- Ajustar score de riesgo según tendencia

#### Implementación:
```javascript
// Nueva función: analyzeHistoricalTrend
- Obtener mensajes de últimos 30 días
- Calcular promedio emocional histórico
- Detectar desviaciones significativas
- Ajustar riskScore según tendencia
```

**Impacto:** Detecta crisis antes de que sean críticas, reduce falsos negativos

---

### 2. **Detección Temprana (Señales de Advertencia)** 🔴 CRÍTICA
**Prioridad:** 🔴 **ALTA**  
**Complejidad:** 🟡 **MEDIA**

#### Problema Actual:
- Solo se detecta cuando ya hay crisis
- No hay sistema preventivo
- Usuario puede estar en riesgo sin saberlo

#### Solución:
- Sistema de "señales de advertencia" (WARNING)
- Alertas preventivas para el usuario mismo
- Intervenciones tempranas antes de crisis
- Nivel de riesgo: `WARNING` (entre LOW y MEDIUM)

#### Implementación:
```javascript
// Nuevo nivel de riesgo: 'WARNING'
- Score 2-3: WARNING (no alerta externa, pero intervención proactiva)
- Mensaje al usuario con recursos preventivos
- Sugerencia de técnicas de regulación
- Seguimiento en 24h
```

**Impacto:** Prevención proactiva, reduce necesidad de alertas de emergencia

---

### 3. **Factores de Riesgo Adicionales** 🟡 IMPORTANTE
**Prioridad:** 🟡 **MEDIA-ALTA**  
**Complejidad:** 🟢 **BAJA-MEDIA**

#### Factores a Agregar:
1. **Historial de crisis previas:**
   - Si tuvo crisis en últimos 30 días → +1 punto
   - Si tuvo crisis en últimos 7 días → +2 puntos
   - Frecuencia de crisis → ajuste dinámico

2. **Cambios abruptos en patrones:**
   - Cambio súbito en frecuencia de mensajes → +1 punto
   - Cambio en horarios de interacción → +0.5 puntos
   - Cambio en longitud de mensajes → +0.5 puntos

3. **Factores protectores adicionales:**
   - Uso reciente de técnicas de regulación → -1 punto
   - Mensajes positivos recientes → -0.5 puntos
   - Interacción social mencionada → -0.5 puntos

#### Implementación:
```javascript
// Modificar evaluateSuicideRisk para incluir:
- crisisHistory (últimas crisis del usuario)
- patternChanges (cambios en patrones de comunicación)
- protectiveFactors (factores protectores detectados)
```

**Impacto:** Mayor precisión en detección, menos falsos positivos/negativos

---

### 4. **Análisis Contextual Más Profundo** 🟡 IMPORTANTE
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟡 **MEDIA**

#### Mejoras:
1. **Análisis de frecuencia:**
   - Mensajes muy frecuentes (ansiedad) → +0.5 puntos
   - Silencio prolongado después de mensaje negativo → +1 punto
   - Cambio en ritmo de conversación → +0.5 puntos

2. **Análisis de contenido:**
   - Menciones de planes específicos → +2 puntos (ya existe, mejorar)
   - Menciones de despedidas → +1.5 puntos (ya existe, mejorar)
   - Menciones de métodos → +2 puntos (ya existe, mejorar)

3. **Análisis de contexto conversacional:**
   - Escalada emocional en conversación → +1 punto
   - Rechazo de ayuda ofrecida → +0.5 puntos
   - Expresiones de aislamiento → +1 punto

#### Implementación:
```javascript
// Nueva función: analyzeConversationalContext
- Analizar últimos 5-10 mensajes de la conversación
- Detectar escaladas emocionales
- Detectar rechazo de ayuda
- Detectar expresiones de aislamiento
```

**Impacto:** Mejor comprensión del contexto, detección más precisa

---

### 5. **Sistema de Alertas Escalonadas** 🟡 IMPORTANTE
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟢 **BAJA**

#### Problema Actual:
- Solo alertas para MEDIUM/HIGH
- No hay alertas preventivas
- Usuario puede no saber que está en riesgo

#### Solución:
- **Nivel WARNING:** Notificación al usuario (no a contactos)
- **Nivel LOW-MEDIUM:** Intervención proactiva con recursos
- **Nivel MEDIUM:** Alerta a contactos + intervención
- **Nivel HIGH:** Alerta urgente + intervención inmediata

#### Implementación:
```javascript
// Modificar sistema de alertas:
- WARNING: Solo notificación al usuario
- LOW-MEDIUM: Mensaje proactivo con recursos
- MEDIUM: Alerta a contactos + intervención
- HIGH: Alerta urgente + intervención inmediata
```

**Impacto:** Respuesta más apropiada según nivel de riesgo

---

### 6. **Registro y Seguimiento de Crisis** 🟢 MEJORA
**Prioridad:** 🟢 **BAJA-MEDIA**  
**Complejidad:** 🟢 **BAJA**

#### Problema Actual:
- No se registran eventos de crisis
- No hay seguimiento post-crisis
- No se puede analizar efectividad del sistema

#### Solución:
- Modelo `CrisisEvent` para registrar crisis
- Seguimiento automático post-crisis (24h, 48h, 7 días)
- Métricas de efectividad del sistema
- Análisis de patrones de crisis

#### Implementación:
```javascript
// Nuevo modelo: CrisisEvent
{
  userId: ObjectId,
  riskLevel: String,
  detectedAt: Date,
  resolvedAt: Date,
  alertSent: Boolean,
  followUpScheduled: Boolean,
  outcome: String // 'resolved', 'ongoing', 'escalated'
}
```

**Impacto:** Mejora continua del sistema, seguimiento del usuario

---

### 7. **Seguimiento Post-Crisis Automático** 🟡 IMPORTANTE
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟡 **MEDIA**

#### Problema Actual:
- No hay seguimiento después de crisis
- Usuario puede estar solo después de alerta
- No se verifica si la situación mejoró

#### Solución:
- Mensajes de seguimiento automáticos (24h, 48h, 7 días)
- Verificación de estado emocional
- Ofrecimiento de recursos adicionales
- Escalada si la situación empeora

#### Implementación:
```javascript
// Nuevo servicio: crisisFollowUpService
- Programar seguimientos automáticos
- Enviar mensajes de verificación
- Evaluar respuesta del usuario
- Escalar si es necesario
```

**Impacto:** Mejor cuidado del usuario, detección de recaídas

---

### 8. **Mejora en Patrones de Detección** 🟡 IMPORTANTE
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟢 **BAJA**

#### Mejoras en Patrones:
1. **Expresiones indirectas:**
   - "Ya no quiero seguir así" → +2 puntos
   - "No vale la pena" → +1.5 puntos
   - "Todo está perdido" → +2 puntos

2. **Expresiones de desesperanza:**
   - "Nada tiene sentido" → +1.5 puntos
   - "No hay solución" → +1.5 puntos
   - "Es inútil" → +1 punto

3. **Expresiones de aislamiento:**
   - "Nadie me entiende" → +1 punto
   - "Estoy solo" → +1 punto
   - "No tengo a nadie" → +1.5 puntos

#### Implementación:
```javascript
// Agregar patrones a evaluateSuicideRisk:
- Patrones de desesperanza indirecta
- Patrones de aislamiento
- Patrones de rendición
```

**Impacto:** Detección de señales más sutiles

---

## 📋 Plan de Implementación Recomendado

### Fase 1: Mejoras Críticas (Inmediato)
1. ✅ Análisis de tendencias históricas
2. ✅ Detección temprana (WARNING)
3. ✅ Factores de riesgo adicionales

### Fase 2: Mejoras Importantes (Corto plazo)
4. ✅ Análisis contextual más profundo
5. ✅ Sistema de alertas escalonadas
6. ✅ Mejora en patrones de detección

### Fase 3: Mejoras de Seguimiento (Mediano plazo)
7. ✅ Registro de crisis
8. ✅ Seguimiento post-crisis

---

## 🎯 Matriz de Decisión: Prioridad vs Complejidad

| Mejora | Prioridad | Complejidad | ROI | Fase |
|--------|-----------|-------------|-----|------|
| 1. Tendencias históricas | 🔴 Alta | 🟡 Media | ⭐⭐⭐⭐⭐ | 1 |
| 2. Detección temprana | 🔴 Alta | 🟡 Media | ⭐⭐⭐⭐⭐ | 1 |
| 3. Factores adicionales | 🟡 Media-Alta | 🟢 Baja-Media | ⭐⭐⭐⭐ | 1 |
| 4. Análisis contextual | 🟡 Media | 🟡 Media | ⭐⭐⭐⭐ | 2 |
| 5. Alertas escalonadas | 🟡 Media | 🟢 Baja | ⭐⭐⭐⭐ | 2 |
| 6. Registro de crisis | 🟢 Baja-Media | 🟢 Baja | ⭐⭐⭐ | 3 |
| 7. Seguimiento post-crisis | 🟡 Media | 🟡 Media | ⭐⭐⭐⭐ | 3 |
| 8. Mejora de patrones | 🟡 Media | 🟢 Baja | ⭐⭐⭐ | 2 |

---

## 📊 Métricas de Éxito

### Métricas a Monitorear:
1. **Precisión:**
   - Tasa de falsos positivos (objetivo: <5%)
   - Tasa de falsos negativos (objetivo: <2%)

2. **Efectividad:**
   - Tiempo promedio de detección
   - Tasa de crisis detectadas antes de escalar
   - Tasa de seguimiento exitoso post-crisis

3. **Impacto:**
   - Reducción en crisis no detectadas
   - Mejora en intervenciones tempranas
   - Satisfacción del usuario con el sistema

---

## 🔄 Próximos Pasos

1. **Revisar y aprobar mejoras propuestas**
2. **Implementar Fase 1 (mejoras críticas)**
3. **Probar y validar mejoras**
4. **Implementar Fase 2 y 3**
5. **Monitorear métricas y ajustar**

---

## 📝 Notas Adicionales

- Todas las mejoras deben mantener la privacidad del usuario
- Las alertas deben ser proporcionales al nivel de riesgo
- El sistema debe ser transparente y explicable
- Se debe documentar cada mejora implementada

