# 🧠 Anto App — Asistente de bienestar emocional con IA

**Versión de la app (Expo): 1.5.0** · Home unificado, chat más seguro y experiencia accionable

**Anto** es una aplicación móvil de salud mental que utiliza inteligencia artificial para ofrecer **apoyo emocional personalizado**, análisis de estado de ánimo, detección de crisis y herramientas de bienestar. **No sustituye** la atención de un profesional de la salud mental ni proporciona diagnóstico clínico.

**Destacado (v1.5.0):** Home consolidado con insight rotativo, hub de técnicas, resumen e informe observacional accionables, sesión persistente con refresh de JWT, chat con recursos de crisis y acciones de producto (tareas/hábitos), onboarding rediseñado y paywall con memoria del día.

**Versiones anteriores:** v1.4.x — TCC lite en chat, grafo semántico, salud digital (HealthKit / Health Connect), informes con narrativa LLM y patrones ABC. v1.1+ — Escalas PHQ-9/GAD-7, distorsiones cognitivas y protocolos estructurados.

---

## 📋 Tabla de Contenidos

- [Novedades v1.5.0](#-novedades-v150)
- [Beneficios](#-beneficios)
- [Características](#-características)
- [Casos de Uso](#-casos-de-uso)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Historial de versiones](#-historial-de-versiones)

---

## 🚀 Novedades v1.5.0

### Experiencia y navegación

- **Home unificado:** Dashboard consolidado con foco del día, insight rotativo humanizado (LLM), racha de engagement, tareas/hábitos en una sola pantalla y refresh optimizado al volver a la app.
- **Hub de técnicas:** Nueva pestaña que reemplaza Pomodoro; catálogo completo con acceso rápido, acordeón y filas compactas. Pomodoro se inicia al enfocar una tarea.
- **Resumen e informe observacional:** Rediseño con UX accionable, «lo que te ayuda» navegable hacia técnicas concretas y progreso de perfil movido a **Perfil**.
- **Grafo semántico:** Estados vacío y error con panel centrado y CTAs; conexión directa desde nodos e insights hacia la técnica concreta (no solo el hub).
- **Onboarding y bienvenida:** Flujo con tarjetas de beneficios, validación guiada, soporte claro/oscuro, bootstrap sin parpadeos y carga de marca unificada.
- **Sesión persistente:** La app restaura la sesión al abrir sin pedir contraseña en cada arranque; renovación automática del JWT con refresh token y blindaje con tests de sesión.
- **Paywall renovado:** Memoria del día, plan anual destacado y precio mensual equivalente.

### Chat y acompañamiento

- **Crisis y seguridad:** Recursos de crisis en el chat (panel y menú ⋮); hard-stop ante riesgo elevado con tono de contención y recursos concretos en lugar de ejercicios genéricos.
- **Acciones desde el chat:** Crear tareas o hábitos desde la conversación con confirmación en UI (`proposedProductActions`); tarjeta de tarea al confirmar con «Sí».
- **Continuidad mejorada:** Sugerencias del chat persistidas al reabrir la conversación; memoria de temas recurrentes conectada al prompt; resumen breve tras hilos intensos.
- **Análisis emocional ampliado:** Detección de anhedonia adolescente, imagen corporal y bullying; mejor manejo de pensamientos intrusivos, negación emocional idiomática y mensajes breves truncados.

### Plataforma e internacionalización

- **Salud digital (Android):** `minSdk` 26 para compatibilidad con Health Connect (iOS HealthKit ya disponible desde v1.4.4).
- **Idiomas ES/EN:** Interfaz bilingüe en Ajustes; enlaces de Instagram y copy de correos según idioma del usuario.
- **Correos de producto:** Campaña 1.5.0 con copy humano y diseño alineado a la app.

### Validación de release

Scripts de blindaje en backend y frontend:

```bash
cd backend && npm run validate:release-1.5.2
cd frontend && npm run validate:release-1.5.2
```

---

## ✨ Beneficios

### 🎯 Para Usuarios

- **Acceso 24/7**: Soporte emocional disponible en cualquier momento del día
- **Privacidad Total**: Conversaciones completamente confidenciales y seguras
- **Personalización**: Respuestas adaptadas a tu situación emocional específica
- **Sin Esperas**: Respuesta inmediata sin necesidad de agendar citas
- **Accesible**: Disponible desde tu teléfono, sin necesidad de desplazarte
- **Seguimiento Continuo**: Análisis de tus patrones emocionales a lo largo del tiempo
- **Herramientas Prácticas**: Técnicas terapéuticas que puedes aplicar inmediatamente

### 🏥 Para Profesionales de la Salud Mental

- **Complemento Terapéutico**: Herramienta de apoyo entre sesiones
- **Detección Temprana**: Identificación de crisis antes de que escalen
- **Datos Objetivos**: Métricas y análisis emocional para evaluar progreso
- **Reducción de Carga**: Soporte inicial automatizado para casos no críticos

### 💼 Para Organizaciones

- **Bienestar Corporativo**: Mejora el bienestar mental de los empleados
- **Reducción de Ausentismo**: Prevención y manejo temprano de problemas de salud mental
- **Costo-Efectivo**: Alternativa accesible a servicios tradicionales de salud mental
- **Escalable**: Puede atender a múltiples usuarios simultáneamente

---

## 🌟 Características

### 🏠 Home y foco del día (v1.5.0)

- **Dashboard consolidado:** Foco del día, insight rotativo, racha, estadísticas y tareas/hábitos en una sola pantalla.
- **Insight humanizado:** Texto generado con LLM a partir de actividad reciente, con tono de bienestar y fallback determinístico.
- **Refresh inteligente:** Throttle al volver a la app; la UI no bloquea por WebSocket.
- **Navegación accionable:** Tareas, hábitos y conversaciones abiertas desde el foco con un toque.

### 🤖 Asistente de IA (bienestar emocional)

- **Chat conversacional**: Respuestas con IA (OpenAI GPT-5 Mini), con tono **profesional y práctico** por defecto (orientación, micro-pasos y preguntas concretas; no rol de terapeuta clínico en el texto del asistente).
- **Preferencias de conversación**: El usuario puede ajustar aspectos del estilo de respuesta cuando la app lo ofrece (p. ej. directo vs. más conversado), alineado con el perfil y la API de usuario.
- **Análisis emocional en tiempo real**: Detección de emociones e intensidad para contextualizar respuestas; señales ampliadas (anhedonia adolescente, imagen corporal, bullying).
- **Respuestas personalizadas**: Historial, temas recurrentes y situación actual conectados al prompt.
- **Técnicas basadas en evidencia**: Enfoques tipo CBT, mindfulness, respiración y similares cuando encajan (sin jerga innecesaria).
- **Memoria contextual**: Continuidad dentro de la conversación; sugerencias persistidas al reabrir el hilo.
- **Acciones de producto**: Propuesta de tareas/hábitos desde el chat con confirmación explícita del usuario.
- **Personalización de género**: Pronombres y tratamiento acordes al perfil.
- **Referencias contextuales**: Menciones naturales a mensajes anteriores cuando aportan.

### 🚨 Sistema de Detección de Crisis

- **Detección Automática**: Identifica señales de crisis emocional en tiempo real.
- **Hard-stop (v1.5.0)**: Ante riesgo elevado, prioriza recursos concretos y tono de contención sin invocar ejercicios terapéuticos genéricos.
- **Recursos en el chat**: Panel `CrisisResourcesStrip` y menú ⋮ con números de emergencia y líneas de apoyo según país (`GET /api/health/crisis-resources`).
- **Alertas de Emergencia**: Notifica a contactos de confianza cuando es necesario.
- **Seguimiento Post-Crisis**: Acompañamiento automatizado después de eventos críticos; resumen breve tras conversaciones intensas.
- **Análisis de Tendencias**: Identifica patrones emocionales a lo largo del tiempo.
- **Prevención Proactiva**: Alertas tempranas antes de que una situación se agrave.

### 📊 Herramientas de Bienestar

- **Tareas y hábitos unificados**: Pantalla única con tono conversacional de bienestar; Pomodoro al enfocar una tarea.
- **Hub de técnicas**: Catálogo completo con acceso rápido, acordeón y navegación directa desde el grafo y el resumen.
- **Seguimiento de Hábitos**: Monitorea hábitos saludables y construye rutinas positivas.
- **Técnicas Terapéuticas Interactivas**: Ejercicios guiados de relajación, TCC lite inline y micro-guías.
- **Resumen e informe observacional**: Patrones, «lo que te ayuda» navegable y correlaciones con salud digital (opt-in).
- **Grafo semántico**: Visualización de temas, intervenciones y conceptos con búsqueda vectorial (Atlas).
- **Dashboard de Progreso**: Racha, métricas y progreso de perfil en **Perfil**.
- **Estadísticas Personales**: Métricas detalladas de tu bienestar mental.

### 📱 Salud digital (v1.4.4+)

- **HealthKit (iOS) y Health Connect (Android):** Sueño, pasos, actividad y tiempo en pantalla bajo consentimiento explícito.
- **Correlaciones observacionales:** Informes semanal y mensual con narrativa LLM y guardrails clínicos (sin diagnóstico).
- **Opt-in:** Toggle «Conectar salud digital»; Anto solo lee agregados diarios, no sensores en bruto.

### 🏥 Evaluación Clínica Profesional (v1.1+)

- **Escalas Validadas Automáticas**: 
  - **PHQ-9** (Depresión): Evaluación automática de síntomas depresivos
  - **GAD-7** (Ansiedad): Evaluación automática de ansiedad generalizada
  - Completado automático basado en análisis del mensaje
  - Visualización de progreso con tendencias y mejoras
  - Historial completo de evaluaciones

- **Detección Avanzada de Distorsiones Cognitivas**:
  - Detección automática de 15 tipos de distorsiones cognitivas
  - Identificación de pensamientos todo-o-nada, catastrofismo, personalización, etc.
  - Intervenciones específicas sugeridas para cada tipo
  - Reportes detallados con estadísticas y tendencias
  - Análisis de patrones de pensamiento a lo largo del tiempo

- **Protocolos Terapéuticos Estructurados**:
  - **Protocolo de Depresión (CBT)**: 5 pasos estructurados
  - **Protocolo de Ansiedad Generalizada (CBT)**: 6 pasos estructurados
  - **Protocolo de Manejo de Ira**: 5 pasos estructurados
  - **Protocolo de Autocompasión**: 5 pasos estructurados
  - **Protocolo de Higiene del Sueño**: 5 pasos estructurados
  - **Protocolo de Trauma**: 6 pasos estructurados
  - **Protocolo de TOC (ERP)**: 7 pasos estructurados
  - **Protocolo de TEPT**: 7 pasos estructurados
  - Activación automática cuando se detectan síntomas relevantes
  - Seguimiento paso a paso con intervenciones específicas

### 💳 Sistema de Suscripciones

- **Planes Flexibles**: Opciones adaptadas a diferentes necesidades; plan anual destacado con precio mensual equivalente.
- **Paywall con contexto (v1.5.0)**: Memoria del día para personalizar la propuesta de valor.
- **Período de Prueba**: 1 día gratis para explorar todas las funcionalidades.
- **Pagos Seguros**: Integración con Mercado Pago (web) y StoreKit (iOS) para transacciones seguras.
- **Gestión Transparente**: Control total sobre tu suscripción y facturación.

### 🔐 Autenticación y sesión (v1.5.0)

- **Sesión persistente**: Restauración automática al abrir la app.
- **Refresh token**: Renovación transparente del JWT expirado con guards y tests de sesión.
- **Onboarding validado**: Flujo de registro con beneficios claros y corrección de autofill en web.

### 🔔 Notificaciones Inteligentes

- **Recordatorios Personalizados**: Notificaciones adaptadas a tus preferencias
- **Alertas de Crisis**: Avisos inmediatos cuando se detecta una situación crítica
- **Seguimiento Activo**: Recordatorios para mantener tu bienestar
- **Notificaciones de Progreso**: Celebra tus logros y avances

---

## 💡 Casos de Uso

### 1. Manejo de Ansiedad Diaria

**Situación**: Una persona experimenta ansiedad durante el día de trabajo.

**Solución con Anto**:
- Detecta automáticamente el aumento de ansiedad en las conversaciones
- Ofrece técnicas de respiración inmediatas
- Proporciona ejercicios de mindfulness adaptados
- Establece recordatorios para pausas de bienestar
- Analiza patrones para identificar triggers

**Resultado**: Reducción de episodios de ansiedad y mejor manejo del estrés.

---

### 2. Apoyo en Momentos Difíciles

**Situación**: Alguien está pasando por una ruptura o pérdida.

**Solución con Anto**:
- Proporciona apoyo emocional inmediato 24/7
- Ofrece técnicas de procesamiento emocional
- Establece un plan de autocuidado personalizado
- Monitorea el progreso emocional
- Detecta señales de depresión o crisis

**Resultado**: Proceso de duelo más saludable con apoyo constante.

---

### 3. Construcción de Hábitos Saludables

**Situación**: Usuario quiere mejorar su rutina de sueño y ejercicio.

**Solución con Anto**:
- Crea recordatorios personalizados para hábitos
- Monitorea el cumplimiento de objetivos
- Ajusta estrategias según el progreso
- Proporciona motivación y refuerzo positivo
- Analiza correlaciones entre hábitos y bienestar emocional

**Resultado**: Establecimiento exitoso de rutinas saludables.

---

### 4. Detección y Prevención de Crisis

**Situación**: Usuario muestra señales de crisis emocional.

**Solución con Anto**:
- Detecta automáticamente lenguaje y patrones de crisis
- Activa protocolo de emergencia inmediatamente
- Notifica a contactos de confianza designados
- Proporciona recursos de crisis y líneas de ayuda
- Inicia seguimiento post-crisis automatizado

**Resultado**: Intervención temprana que puede salvar vidas.

---

### 5. Apoyo Entre Sesiones Terapéuticas

**Situación**: Paciente necesita apoyo entre citas con su terapeuta.

**Solución con Anto**:
- Complementa el trabajo terapéutico profesional
- Practica técnicas aprendidas en terapia
- Registra eventos y emociones para compartir con el terapeuta
- Proporciona apoyo inmediato cuando surge una necesidad
- Mantiene continuidad en el proceso terapéutico

**Resultado**: Mayor efectividad del tratamiento terapéutico.

---

### 6. Bienestar Corporativo

**Situación**: Empresa quiere mejorar el bienestar mental de sus empleados.

**Solución con Anto**:
- Proporciona acceso a todos los empleados
- Detecta problemas de salud mental tempranamente
- Reduce el estrés y mejora la productividad
- Ofrece métricas agregadas (anónimas) de bienestar organizacional
- Complementa programas de EAP existentes

**Resultado**: Mejor clima laboral y reducción de ausentismo.

---

## 🛠 Tecnologías

### Frontend
- **React Native** - Framework móvil multiplataforma
- **Expo** - Herramientas y servicios para desarrollo React Native (SDK 54)
- **React Navigation** - Navegación entre pantallas
- **AsyncStorage** - Almacenamiento local seguro
- **Socket.IO Client** - Comunicación en tiempo real
- **react-native-health / expo-health-connect** - Salud digital (iOS / Android)

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web robusto
- **MongoDB** - Base de datos NoSQL escalable
- **Mongoose** - ODM para MongoDB
- **Socket.IO** - WebSockets para tiempo real
- **OpenAI API** - Integración con GPT-5 Mini para IA conversacional
- **Mercado Pago** - Procesamiento de pagos seguro
- **SendGrid** - Envío de emails transaccionales
- **Twilio** - WhatsApp y SMS para alertas
- **Winston** - Logging estructurado
- **Sentry** - Error tracking y monitoreo

### Seguridad
- **Helmet** - Headers de seguridad HTTP
- **CORS** - Control de acceso por origen
- **Rate Limiting** - Protección contra abuso
- **JWT + Refresh Token** - Autenticación segura con renovación automática (v1.5.0)
- **bcrypt** - Hasheo seguro de contraseñas
- **Joi** - Validación robusta de datos
- **DOMPurify** - Sanitización de inputs
- **HSTS** - HTTP Strict Transport Security
- **SSL/HTTPS** - Comunicación encriptada

---

## 📁 Estructura del Proyecto

```
Anto/
├── backend/                 # Servidor Node.js/Express
│   ├── config/             # Configuraciones
│   ├── constants/          # Constantes de la aplicación
│   ├── middleware/         # Middlewares de Express
│   ├── models/             # Modelos de base de datos
│   ├── routes/             # Rutas de la API
│   ├── services/           # Servicios de negocio
│   ├── utils/              # Utilidades
│   ├── scripts/            # Scripts de utilidad
│   ├── tests/              # Tests automatizados
│   └── server.js           # Punto de entrada
│
├── frontend/               # Aplicación React Native
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── screens/        # Pantallas de la app
│   │   ├── services/       # Servicios del frontend
│   │   ├── utils/          # Utilidades
│   │   ├── config/         # Configuración
│   │   └── constants/      # Constantes
│   └── app.json            # Configuración de Expo
│
└── docs/                   # Documentación adicional
```

---

## 📚 Documentación

### Índice principal
- **[docs/README.md](./docs/README.md)** — Índice de toda la documentación del proyecto.

### Tests E2E (Maestro)
- **[frontend/e2e/README.md](./frontend/e2e/README.md)** — Pruebas end-to-end del frontend.

### Documentos en `docs/`
- **[docs/FLUJOS.md](./docs/FLUJOS.md)** — Flujos principales (auth, chat, pagos, crisis).
- **[docs/CONTRATOS_API.md](./docs/CONTRATOS_API.md)** — Alineación frontend–backend y contratos de la API.
- **[docs/RELEASE_1.4.3.md](./docs/RELEASE_1.4.3.md)** — Release 1.4.3 (TCC lite, grafo semántico, topicFree).
- **[docs/RELEASE_1.4.4.md](./docs/RELEASE_1.4.4.md)** — Release 1.4.4 (salud digital, informes LLM, ABC macro).
- **[docs/CONTRATO_CHAT_ACCIONES_V1.md](./docs/CONTRATO_CHAT_ACCIONES_V1.md)** — Acciones de producto desde el chat.
- **[docs/REVISION_STOREKIT_COMPRAS.md](./docs/REVISION_STOREKIT_COMPRAS.md)** — StoreKit (iOS) y validación de recibos.

### Backend
- **Flujo del mensaje (chat):** [backend/docs/MENSAJE_FLUJO.md](./backend/docs/MENSAJE_FLUJO.md) (incluye ensamblado del system prompt en `services/openai/openaiPromptBuilder.js` y plantillas en `constants/openai.js`).
- **Seguridad:** [backend/docs/SECURITY_REVIEW_V1.1.md](./backend/docs/SECURITY_REVIEW_V1.1.md).
- **TypeScript:** [backend/TYPESCRIPT.md](./backend/TYPESCRIPT.md).

### Frontend
- **UX y accesibilidad:** [frontend/MEJORAS_UX.md](./frontend/MEJORAS_UX.md).
- **App Store:** [frontend/INSTRUCCIONES_SUBMIT_APP_STORE.md](./frontend/INSTRUCCIONES_SUBMIT_APP_STORE.md).

### APIs y endpoints

- **Health Checks**: `/health`, `/api/health` (incluye `APP_VERSION`)
- **Autenticación**: `/api/auth/register`, `/api/auth/login`, refresh token
- **Usuario**: `/api/users/me` (perfil, preferencias e idioma)
- **Chat**: `/api/chat/conversations`, `/api/chat/messages` (acciones propuestas, sugerencias)
- **Crisis**: `/api/crisis/summary`, `/api/crisis/history`, `/api/health/crisis-resources`
- **Foco / Home**: `/api/summary/focus`, insight rotativo
- **Tareas y Hábitos**: `/api/tasks`, `/api/habits`
- **Técnicas y grafo**: hub de técnicas, grafo semántico, ABC macro
- **Señales / Salud digital**: `/api/signals` (consentimiento, sync, informes)
- **Pagos**: `/api/payments/plans`, `/api/payments/subscription-status`
- **Escalas Clínicas**:
  - `/api/clinical-scales/available` - Escalas disponibles
  - `/api/clinical-scales/:scaleType/submit` - Enviar resultados
  - `/api/clinical-scales/:scaleType/progress` - Ver progreso
  - `/api/clinical-scales/summary` - Resumen completo
- **Distorsiones Cognitivas**:
  - `/api/cognitive-distortions/types` - Tipos disponibles
  - `/api/cognitive-distortions/reports` - Reportes de detecciones
  - `/api/cognitive-distortions/statistics` - Estadísticas
  - `/api/cognitive-distortions/summary` - Resumen completo

**📝 Nota:** Contratos detallados y alineación frontend–backend en [docs/CONTRATOS_API.md](./docs/CONTRATOS_API.md). Documentación Swagger en `/api-docs` cuando el servidor esté corriendo.

---

## ✅ Estado del Proyecto

### Estado General: **Listo para Producción** ✅

**Última actualización del README:** 2026-06-23  
**Versión publicada (app):** 1.5.5 (ver `frontend/app.json`, iOS build 45, Android versionCode 31)

### Completado ✅

- ✅ Asistente de IA para bienestar emocional (chat, personalización, límites de seguridad)
- ✅ Sistema de detección de crisis con hard-stop y recursos en chat (v1.5.0)
- ✅ Acciones de producto desde el chat (tareas/hábitos con confirmación)
- ✅ Home unificado con insight rotativo y refresh optimizado (v1.5.0)
- ✅ Hub de técnicas, resumen accionable y grafo conectado a intervenciones (v1.5.0)
- ✅ Onboarding, bienvenida y paywall rediseñados (v1.5.0)
- ✅ Sesión persistente con refresh automático de JWT (v1.5.0)
- ✅ Salud digital opt-in: HealthKit + Health Connect (v1.4.4)
- ✅ Informes semanal/mensual con narrativa LLM y guardrails clínicos (v1.4.4)
- ✅ TCC lite inline, grafo semántico y ranking topicFree (v1.4.3)
- ✅ Sistema de suscripciones integrado (Mercado Pago + StoreKit)
- ✅ Notificaciones push configuradas
- ✅ Internacionalización ES/EN en app, correos y checkout
- ✅ Seguridad y privacidad garantizadas
- ✅ Tests automatizados con blindaje de release (`validate:release-1.5.0`)
- ✅ Optimizaciones de performance del home
- ✅ Logging y monitoreo configurados (Sentry)
- ✅ SSL/HTTPS y medidas de seguridad activas
- ✅ **Escalas clínicas validadas (PHQ-9, GAD-7)** — Completado automático
- ✅ **Detección avanzada de distorsiones cognitivas** — 15 tipos detectados
- ✅ **Protocolos terapéuticos estructurados** — 8 protocolos basados en evidencia
- ✅ **Reportes y estadísticas profesionales** — Análisis detallado de progreso

### Funcionalidades Clave

- ✅ Chat conversacional con IA (GPT-5 Mini) y tono orientado a utilidad práctica
- ✅ Análisis emocional en tiempo real con señales ampliadas (v1.5.0)
- ✅ Detección automática de crisis y recursos por país en el chat
- ✅ Alertas de emergencia y contactos de confianza
- ✅ Tareas, hábitos y Pomodoro integrados en el foco
- ✅ Hub de técnicas con catálogo completo y micro-guías
- ✅ Resumen observacional, grafo semántico e informes con salud digital
- ✅ Dashboard de métricas, racha y progreso en Perfil
- ✅ Integración con Mercado Pago y StoreKit
- ✅ Notificaciones personalizadas
- ✅ **Escalas clínicas automáticas (PHQ-9, GAD-7)**
- ✅ **Detección de distorsiones cognitivas (15 tipos)**
- ✅ **Protocolos estructurados (Depresión, Ansiedad, Trauma, TOC, TEPT)**
- ✅ **Reportes profesionales con estadísticas**

---

## 🔒 Seguridad y Privacidad

### Medidas de Seguridad Implementadas

- ✅ **Encriptación End-to-End**: Todas las comunicaciones están encriptadas
- ✅ **Autenticación Segura**: JWT con tokens de acceso y refresh; renovación automática (v1.5.0)
- ✅ **Protección de Datos**: Sanitización y validación de todos los inputs
- ✅ **Rate Limiting**: Protección contra abuso y ataques
- ✅ **Headers de Seguridad**: Helmet con HSTS y CSP
- ✅ **Logging Seguro**: Datos sensibles nunca se registran
- ✅ **Backups Automáticos**: Protección de datos del usuario
- ✅ **Crisis hard-stop**: Sin LLM ante riesgo elevado; respuesta estructurada con recursos

### Privacidad

- ✅ **Confidencialidad Total**: Las conversaciones son privadas y seguras
- ✅ **Sin Compartir Datos**: No vendemos ni compartimos información personal
- ✅ **Control del Usuario**: Tú decides qué información compartir
- ✅ **Cumplimiento**: Diseñado siguiendo mejores prácticas de privacidad

---

## 🎯 Impacto Esperado

### Métricas de Éxito

- **Reducción de Crisis**: Detección temprana y prevención de situaciones críticas
- **Mejora del Bienestar**: Aumento en métricas de bienestar mental reportadas
- **Adopción de Hábitos**: Mayor cumplimiento de hábitos saludables
- **Satisfacción del Usuario**: Alta calificación y retención de usuarios
- **Accesibilidad**: Llegar a personas que no tienen acceso a servicios tradicionales
- **Evaluación Clínica Objetiva**: Escalas validadas para seguimiento profesional
- **Identificación de Patrones**: Detección automática de distorsiones cognitivas
- **Intervención Estructurada**: Protocolos basados en evidencia científica

### Beneficios a Largo Plazo

- Mejora general de la salud mental de la población
- Reducción de costos en servicios de salud mental
- Mayor conciencia sobre bienestar emocional
- Prevención de problemas más graves a través de intervención temprana

---

## 🤝 Contribución

Este es un proyecto privado. Para contribuir, contacta al equipo de desarrollo.

---

## 📄 Licencia

Este proyecto es privado y propietario. Todos los derechos reservados.

---

## 📞 Soporte

Para soporte técnico o preguntas:
- Revisa la documentación en `docs/`
- Consulta los documentos de producción
- Contacta al equipo de desarrollo

---

## 📦 Historial de versiones

| Versión | Enfoque principal |
|---------|-------------------|
| **1.5.0** | Home unificado, hub de técnicas, chat más seguro (crisis hard-stop, acciones de producto), onboarding/bienvenida, sesión persistente con JWT refresh, paywall con memoria del día, resumen e informe accionables, grafo conectado a técnicas. |
| **1.4.4** | Salud digital (HealthKit / Health Connect), informes con narrativa LLM, grafo semántico en producción (Atlas), ciclo ABC macro. |
| **1.4.3** | TCC lite inline, psicoeducación, ranking topicFree, grafo visual, micro-guías, patrones mensuales, motor multimodal. |
| **1.1+** | Escalas PHQ-9/GAD-7, distorsiones cognitivas (15 tipos), protocolos terapéuticos estructurados (8 protocolos). |

Documentación detallada de releases recientes: [RELEASE_1.4.3](./docs/RELEASE_1.4.3.md) · [RELEASE_1.4.4](./docs/RELEASE_1.4.4.md)

---

## 🎯 Roadmap

### Próximas Funcionalidades

- [ ] Más escalas clínicas (PCL-5 para TEPT, DERS para regulación emocional)
- [ ] Visualización gráfica de progreso en escalas
- [ ] Dashboard avanzado de distorsiones cognitivas
- [ ] Modo offline para uso sin conexión
- [x] Internacionalización (multi-idioma) — ES/EN en app, correos, push y checkout Mercado Pago
- [x] Integración con wearables / salud digital — HealthKit (iOS) y Health Connect (Android) opt-in (v1.4.4)
- [x] Acciones desde el chat (tareas/hábitos) — v1.5.0
- [x] Crisis hard-stop y recursos en chat — v1.5.0
- [ ] RAG memoria evolutiva completa (#203)
- [ ] Sistema de referidos
- [ ] Programa de fidelización
- [ ] Integración con profesionales de la salud mental
- [ ] Comunidad de usuarios (opcional)

---

**Desarrollado con ❤️ por el equipo de Anto App**

*Versión 1.5.0 — Mejorando la salud mental, una conversación a la vez.*
