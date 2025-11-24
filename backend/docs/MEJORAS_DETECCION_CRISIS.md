# Mejoras al Sistema de Detección de Crisis

Este documento detalla mejoras propuestas para mejorar la precisión, proactividad y efectividad del sistema de detección de crisis.

---

## 📊 Resumen Ejecutivo

**Estado Actual:**
- ✅ Detección basada en mensaje actual
- ✅ Análisis emocional y contextual
- ✅ Alertas para riesgo MEDIUM/HIGH
- ✅ Cooldown de 60 minutos
- ✅ **Análisis de tendencias históricas (7, 30, 90 días)**
- ✅ **Nivel WARNING para detección temprana**
- ✅ **Factores de riesgo adicionales (historial, tendencias, contexto)**
- ✅ **Análisis contextual profundo (frecuencia, silencio, escaladas)**
- ✅ **Sistema de alertas escalonadas**
- ✅ **Registro completo de eventos de crisis**
- ✅ **Seguimiento post-crisis automático**

**Mejoras Implementadas:**
1. ✅ Análisis de tendencias históricas - **IMPLEMENTADO**
2. ✅ Detección temprana (WARNING) - **IMPLEMENTADO**
3. ✅ Factores de riesgo adicionales - **IMPLEMENTADO**
4. ✅ Análisis contextual más profundo - **IMPLEMENTADO**
5. ✅ Sistema de alertas escalonadas - **IMPLEMENTADO**
6. ✅ Registro de eventos de crisis - **IMPLEMENTADO**
7. ✅ Seguimiento post-crisis - **IMPLEMENTADO**
8. ✅ Mejora en patrones de detección - **IMPLEMENTADO**

---

## 🎯 Mejoras Propuestas

### 1. **Análisis de Tendencias Históricas** 🔴 CRÍTICA ✅ IMPLEMENTADO
**Prioridad:** 🔴 **ALTA**  
**Complejidad:** 🟡 **MEDIA**  
**Estado:** ✅ **COMPLETADO**

#### Problema Original:
- Solo se analizaba el mensaje actual
- No se detectaban deterioros graduales
- No se consideraban patrones históricos del usuario

#### Solución Implementada:
- ✅ Servicio `crisisTrendAnalyzer.js` creado
- ✅ Análisis de tendencias en 3 períodos: 7, 30 y 90 días
- ✅ Detección de deterioro rápido, estado bajo sostenido, aislamiento, escalada
- ✅ Cálculo de ajuste de riesgo basado en tendencias
- ✅ Generación de advertencias automáticas

#### Archivos Implementados:
- `backend/services/crisisTrendAnalyzer.js` - Servicio completo de análisis de tendencias
- `backend/routes/chatRoutes.js` - Integración en el flujo de detección
- `backend/services/index.js` - Exportación del servicio

#### Funcionalidades:
- Análisis de intensidad emocional por período
- Detección de cambios en frecuencia de mensajes
- Análisis de volatilidad emocional
- Historial de crisis previas (últimos 30 días)
- Ajuste dinámico del score de riesgo según tendencias

**Impacto:** Detecta crisis antes de que sean críticas, reduce falsos negativos

---

### 2. **Detección Temprana (Señales de Advertencia)** 🔴 CRÍTICA ✅ IMPLEMENTADO
**Prioridad:** 🔴 **ALTA**  
**Complejidad:** 🟡 **MEDIA**  
**Estado:** ✅ **COMPLETADO**

#### Problema Original:
- Solo se detectaba cuando ya había crisis
- No había sistema preventivo
- Usuario podía estar en riesgo sin saberlo

#### Solución Implementada:
- ✅ Nuevo nivel de riesgo `WARNING` agregado (score 2-3)
- ✅ Protocolo de intervención preventiva definido
- ✅ Mensajes personalizados según nivel de riesgo
- ✅ Integrado en `evaluateSuicideRisk()` y `generateCrisisMessage()`

#### Archivos Modificados:
- `backend/constants/crisis.js` - Función `evaluateSuicideRisk()` actualizada
- `backend/constants/crisis.js` - Protocolo `CRISIS_PROTOCOL` actualizado
- `backend/constants/crisis.js` - Función `generateCrisisMessage()` actualizada

#### Funcionalidades:
- Nivel WARNING: Score 2-3 (entre LOW y MEDIUM)
- Intervención proactiva sin alertas externas
- Mensajes con recursos preventivos
- Seguimiento programado en 24-48 horas
- Registro de eventos WARNING para análisis

**Impacto:** Prevención proactiva, reduce necesidad de alertas de emergencia

---

### 3. **Factores de Riesgo Adicionales** 🟡 IMPORTANTE ✅ IMPLEMENTADO
**Prioridad:** 🟡 **MEDIA-ALTA**  
**Complejidad:** 🟢 **BAJA-MEDIA**  
**Estado:** ✅ **COMPLETADO**

#### Factores Implementados:
1. ✅ **Historial de crisis previas:**
   - Crisis en últimos 7 días → +2 puntos
   - Crisis en últimos 30 días → +1 punto
   - Múltiples crisis recientes → +1 punto adicional

2. ✅ **Tendencias históricas:**
   - Deterioro rápido → +1-2 puntos
   - Estado bajo sostenido → +0.5-1.5 puntos
   - Aislamiento (reducción comunicación) → +0.5-1.5 puntos
   - Escalada emocional → +1 punto

3. ✅ **Factores protectores adicionales:**
   - Búsqueda de ayuda → -1 punto
   - Emoción secundaria de esperanza → -1 punto
   - Expresiones de mejora → -1 punto
   - Menciones de apoyo social → -0.5 puntos
   - Uso de técnicas de regulación → -0.5 puntos

#### Archivos Modificados:
- `backend/constants/crisis.js` - Función `evaluateSuicideRisk()` expandida
- `backend/services/crisisTrendAnalyzer.js` - Análisis de tendencias
- `backend/routes/chatRoutes.js` - Integración de factores

**Impacto:** Mayor precisión en detección, menos falsos positivos/negativos

---

### 4. **Análisis Contextual Más Profundo** 🟡 IMPORTANTE ✅ IMPLEMENTADO
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟡 **MEDIA**  
**Estado:** ✅ **COMPLETADO**

#### Mejoras Implementadas:
1. ✅ **Análisis de frecuencia:**
   - Mensajes muy frecuentes (ansiedad) → +0.5 puntos
   - Silencio prolongado después de mensaje negativo → +1 punto
   - Cambio en ritmo de conversación → +0.5 puntos

2. ✅ **Análisis de contenido mejorado:**
   - Menciones de planes específicos → +3 puntos (mejorado)
   - Menciones de despedidas → +2 puntos (mejorado)
   - Expresiones indirectas de desesperanza → +1.5 puntos

3. ✅ **Análisis de contexto conversacional:**
   - Escalada emocional en conversación → +1 punto
   - Rechazo de ayuda ofrecida → +0.5 puntos
   - Cambio abrupto en tono → +0.5 puntos
   - Expresiones de aislamiento → +1 punto

#### Archivos Implementados:
- `backend/routes/chatRoutes.js` - Funciones helper:
  - `detectEmotionalEscalation()` - Detecta escaladas emocionales
  - `detectHelpRejection()` - Detecta rechazo de ayuda
  - `detectAbruptToneChange()` - Detecta cambios abruptos
  - `analyzeMessageFrequency()` - Analiza frecuencia de mensajes
  - `detectSilenceAfterNegative()` - Detecta silencio después de mensajes negativos
- `backend/constants/crisis.js` - Integración en `evaluateSuicideRisk()`

**Impacto:** Mejor comprensión del contexto, detección más precisa

---

### 5. **Sistema de Alertas Escalonadas** 🟡 IMPORTANTE ✅ IMPLEMENTADO
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟢 **BAJA**  
**Estado:** ✅ **COMPLETADO**

#### Problema Original:
- Solo alertas para MEDIUM/HIGH
- No había alertas preventivas
- Usuario podía no saber que estaba en riesgo

#### Solución Implementada:
- ✅ **Nivel LOW:** Monitoreo continuo, apoyo emocional
- ✅ **Nivel WARNING:** Intervención proactiva, recursos preventivos, NO alertas externas
- ✅ **Nivel MEDIUM:** Alerta a contactos + intervención + seguimiento en 24h
- ✅ **Nivel HIGH:** Alerta urgente + intervención inmediata + seguimiento en 12h

#### Archivos Modificados:
- `backend/routes/chatRoutes.js` - Lógica de alertas escalonadas
- `backend/services/emergencyAlertService.js` - Solo envía para MEDIUM/HIGH
- `backend/constants/crisis.js` - Protocolos por nivel de riesgo

#### Funcionalidades:
- WARNING: Solo intervención proactiva en la conversación
- MEDIUM/HIGH: Alertas a contactos (email + WhatsApp)
- Seguimientos programados según nivel de riesgo
- Cooldown de 60 minutos para evitar spam

**Impacto:** Respuesta más apropiada según nivel de riesgo

---

### 6. **Registro y Seguimiento de Crisis** 🟢 MEJORA ✅ IMPLEMENTADO
**Prioridad:** 🟢 **BAJA-MEDIA**  
**Complejidad:** 🟢 **BAJA**  
**Estado:** ✅ **COMPLETADO**

#### Problema Original:
- No se registraban eventos de crisis
- No había seguimiento post-crisis
- No se podía analizar efectividad del sistema

#### Solución Implementada:
- ✅ Modelo `CrisisEvent` completo creado
- ✅ Registro automático de cada evento de crisis
- ✅ Almacenamiento de contexto completo (tendencias, historial, factores)
- ✅ Métodos estáticos para consultas eficientes
- ✅ Índices optimizados para búsquedas rápidas

#### Archivos Creados:
- `backend/models/CrisisEvent.js` - Modelo completo con:
  - Información del trigger (mensaje que activó la crisis)
  - Análisis de tendencias al momento de detección
  - Historial de crisis previas
  - Estado de alertas enviadas
  - Programación de seguimientos
  - Resultado/outcome de la crisis
  - Metadatos (score, factores, factores protectores)

#### Funcionalidades:
- Registro automático en cada detección de crisis
- Métodos: `getRecentCrises()`, `getPendingFollowUps()`
- Métodos de instancia: `markAsResolved()`, `scheduleFollowUp()`
- Integración completa en `chatRoutes.js`

**Impacto:** Mejora continua del sistema, seguimiento del usuario

---

### 7. **Seguimiento Post-Crisis Automático** 🟡 IMPORTANTE ✅ IMPLEMENTADO
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟡 **MEDIA**  
**Estado:** ✅ **COMPLETADO**

#### Problema Original:
- No había seguimiento después de crisis
- Usuario podía estar solo después de alerta
- No se verificaba si la situación mejoró

#### Solución Implementada:
- ✅ Servicio `crisisFollowUpService.js` creado
- ✅ Programación automática de seguimientos según nivel de riesgo:
  - HIGH: 12 horas
  - MEDIUM: 24 horas
  - WARNING: 48 horas
- ✅ Verificación de actividad reciente del usuario
- ✅ Mensajes de seguimiento personalizados
- ✅ Evaluación de estado emocional post-crisis

#### Archivos Creados:
- `backend/services/crisisFollowUpService.js` - Servicio completo con:
  - `scheduleFollowUps()` - Programa seguimientos automáticos
  - `processPendingFollowUps()` - Procesa seguimientos pendientes
  - `checkRecentUserActivity()` - Verifica actividad del usuario
  - `generateFollowUpMessage()` - Genera mensajes personalizados
  - `start()` - Inicia el servicio (ejecuta cada hora)

#### Integración:
- `backend/server.js` - Inicialización automática del servicio
- `backend/routes/chatRoutes.js` - Programación automática al registrar crisis
- `backend/services/index.js` - Exportación del servicio

#### Funcionalidades:
- Procesamiento automático cada hora
- Verificación de actividad reciente (últimas 24h)
- Análisis de estado emocional post-crisis
- Actualización automática de outcomes
- Preparado para integración con notificaciones push

**Impacto:** Mejor cuidado del usuario, detección de recaídas

---

### 8. **Mejora en Patrones de Detección** 🟡 IMPORTANTE ✅ IMPLEMENTADO
**Prioridad:** 🟡 **MEDIA**  
**Complejidad:** 🟢 **BAJA**  
**Estado:** ✅ **COMPLETADO**

#### Mejoras Implementadas:
1. ✅ **Expresiones indirectas de desesperanza:**
   - "Ya no quiero seguir así" → +1.5 puntos
   - "No vale la pena" → +1.5 puntos
   - "Todo está perdido" → +1.5 puntos
   - "Para qué sirve" → +1.5 puntos
   - "No tiene sentido" → +1.5 puntos

2. ✅ **Expresiones de desesperanza adicionales:**
   - "Nada tiene sentido" → +1.5 puntos
   - "No hay solución" → +1.5 puntos
   - "Es inútil" → +1.5 puntos
   - "No tiene propósito" → +1.5 puntos
   - "Sin razón de ser" → +1.5 puntos

3. ✅ **Expresiones de aislamiento mejoradas:**
   - "Nadie me entiende" → +1 punto
   - "Estoy solo" → +1 punto
   - "No tengo a nadie" → +1 punto
   - "Me siento desconectado" → +1 punto
   - "Nadie me comprende" → +1 punto

4. ✅ **Patrones mejorados existentes:**
   - Planes específicos: mejorado con más variantes
   - Despedidas: mejorado con más expresiones
   - Rendición: mejorado con más variantes

#### Archivos Modificados:
- `backend/constants/crisis.js` - Función `evaluateSuicideRisk()` expandida con nuevos patrones

**Impacto:** Detección de señales más sutiles, mayor cobertura

---

## 📋 Plan de Implementación - ESTADO: ✅ COMPLETADO

### Fase 1: Mejoras Críticas ✅ COMPLETADA
1. ✅ Análisis de tendencias históricas - **IMPLEMENTADO**
2. ✅ Detección temprana (WARNING) - **IMPLEMENTADO**
3. ✅ Factores de riesgo adicionales - **IMPLEMENTADO**

### Fase 2: Mejoras Importantes ✅ COMPLETADA
4. ✅ Análisis contextual más profundo - **IMPLEMENTADO**
5. ✅ Sistema de alertas escalonadas - **IMPLEMENTADO**
6. ✅ Mejora en patrones de detección - **IMPLEMENTADO**

### Fase 3: Mejoras de Seguimiento ✅ COMPLETADA
7. ✅ Registro de crisis - **IMPLEMENTADO**
8. ✅ Seguimiento post-crisis - **IMPLEMENTADO**

### Resumen de Archivos Creados/Modificados:

**Nuevos Archivos:**
- `backend/services/crisisTrendAnalyzer.js` - Análisis de tendencias históricas
- `backend/services/crisisFollowUpService.js` - Seguimiento post-crisis
- `backend/models/CrisisEvent.js` - Modelo de registro de crisis

**Archivos Modificados:**
- `backend/constants/crisis.js` - Evaluación de riesgo mejorada, protocolos actualizados
- `backend/routes/chatRoutes.js` - Integración completa de todas las mejoras
- `backend/services/index.js` - Exportación de nuevos servicios
- `backend/models/index.js` - Exportación del modelo CrisisEvent
- `backend/server.js` - Inicialización del servicio de seguimiento

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

## 🔄 Estado de Implementación

### ✅ Todas las Mejoras Implementadas

**Fecha de Implementación:** Diciembre 2024

**Mejoras Completadas:**
- ✅ Análisis de tendencias históricas (7, 30, 90 días)
- ✅ Nivel WARNING para detección temprana
- ✅ Factores de riesgo adicionales (historial, tendencias, contexto)
- ✅ Análisis contextual profundo (frecuencia, silencio, escaladas)
- ✅ Sistema de alertas escalonadas
- ✅ Registro completo de eventos de crisis
- ✅ Seguimiento post-crisis automático
- ✅ Patrones de detección mejorados

### 📊 Próximos Pasos Sugeridos

1. **Monitoreo y Validación:**
   - Monitorear métricas de precisión (falsos positivos/negativos)
   - Revisar logs de detección de crisis
   - Analizar efectividad de seguimientos post-crisis

2. **Mejoras Futuras Opcionales:**
   - Integración con notificaciones push para seguimientos
   - Dashboard de métricas de crisis
   - Análisis de efectividad del sistema
   - Machine Learning para mejorar precisión

3. **Optimizaciones:**
   - Ajustar umbrales según datos reales
   - Refinar patrones de detección basado en feedback
   - Optimizar consultas de base de datos

---

## 📝 Notas de Implementación

### Principios Aplicados:
- ✅ Privacidad del usuario: Solo se almacena preview de mensajes (200 caracteres)
- ✅ Proporcionalidad: Alertas según nivel de riesgo
- ✅ Transparencia: Logging detallado de todas las decisiones
- ✅ No bloqueante: Errores en servicios auxiliares no bloquean el flujo principal
- ✅ Documentación: Cada mejora está documentada en código

### Consideraciones Técnicas:
- **Rendimiento:** Análisis en paralelo para no bloquear el flujo principal
- **Escalabilidad:** Índices en MongoDB para consultas eficientes
- **Mantenibilidad:** Servicios modulares y reutilizables
- **Robustez:** Manejo de errores en todos los niveles

### Configuración:
- El servicio de seguimiento se inicia automáticamente en producción
- Se puede deshabilitar con `ENABLE_CRISIS_FOLLOWUP=false`
- Cooldown de alertas: 60 minutos (configurable)
- Intervalos de seguimiento: 12h (HIGH), 24h (MEDIUM), 48h (WARNING)

### Métricas Disponibles:
- Eventos de crisis registrados en `CrisisEvent`
- Tendencias históricas calculadas automáticamente
- Seguimientos programados y completados
- Alertas enviadas (email y WhatsApp)

