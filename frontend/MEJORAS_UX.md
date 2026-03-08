# Mejoras de UX – Guía de implementación

Documento con sugerencias de UX moderno y profesional para la app Anto. Sirve como backlog priorizado para ir implementando por fases.

---

## Estado actual del documento (resumen)

| # | Área | Estado |
|---|------|--------|
| 1 | Feedback inmediato (Toast/snackbar) | ✅ **Implementado** |
| 2 | Empty states con CTA | ✅ **Implementado** |
| 3 | Skeleton en listas | ✅ **Implementado** |
| 4 | Accesibilidad (VoiceOver / TalkBack) | ✅ **Implementado** |
| 5 | Formularios (errores inline, foco, carga) | ✅ **Implementado** |
| 6 | Navegación y “dónde estoy” | ✅ **Implementado** |
| 7 | Jerarquía visual y tipografía | ✅ **Implementado** |
| 8 | Errores y reconexión | ✅ **Implementado** |
| 9 | Primera vez y onboarding | En progreso |
| 10 | Microinteracciones | Parcial |

---

## 1. Feedback inmediato (acciones y errores) – ✅ implementado (Toast)

**Estado actual:** Muchos flujos usan `Alert` para éxito/error; no hay un sistema global de “toast” o snackbar.

**Mejora:**
- Introducir **toast/snackbar** para acciones que no requieren decisión (ej. “Tarea completada”, “Cambios guardados”, “Copiado”).
- Reservar **Alert** para errores graves o decisiones (confirmar borrado, etc.).
- Mantener y extender **hápticos** (ya usas Haptics) en acciones clave: botones, completar tarea, toggle.

**Impacto:** La persona siempre sabe que la acción “pasó” sin bloquear la pantalla.

**Archivos a revisar:** Pantallas con `Alert.alert` para éxito; componentes con botones/acciones (TaskCard, HabitCard, etc.).

### Toast / Snackbar (implementado)

Sistema global de toasts disponible en toda la app.

**Archivos:** `src/context/ToastContext.js`, `src/components/Toast.js`. La app está envuelta en `ToastProvider` y se renderiza `<Toast />` en `App.tsx`.

**Uso:**

```javascript
import { useToast } from '../context/ToastContext';

// Dentro del componente:
const { showToast, hideToast } = useToast();

// Mensaje simple (se oculta solo a los ~3,5 s)
showToast({ message: 'Cambios guardados', type: 'success' });

// Tipos: 'success' | 'error' | 'warning' | 'info' | 'default'
showToast({ message: 'Error de conexión', type: 'error' });
showToast({ message: 'Sin conexión', type: 'warning' });
showToast({ message: 'Nueva actualización disponible', type: 'info' });

// Con botón de acción (ej. Deshacer)
showToast({
  message: 'Tarea eliminada',
  type: 'default',
  action: {
    label: 'Deshacer',
    onPress: () => { /* restaurar tarea */ },
  },
});

// Duración personalizada (ms). 0 = no auto-ocultar
showToast({ message: 'Copiado', type: 'success', duration: 2000 });
```

**Ejemplo en uso:** `TaskScreen` muestra toast al crear tarea/recordatorio y al marcar como completado (en lugar de `Alert` para el éxito).

---

## 2. Estados vacíos (empty states) – implementado

**Estado actual:** Hay textos tipo “No hay mensajes”, “No hay hábitos”, etc.; a veces solo texto.

**Mejora:**
- Dar a cada empty state: **ilustración o icono grande** + **mensaje breve** + **acción principal** (ej. “Crear primer hábito”, “Enviar primer mensaje”).
- Aplicar el mismo patrón en listas: Chat, Tareas, Hábitos, Transacciones, Alertas.
- Evitar pantallas que se vean “rotas” cuando la lista está vacía.

**Impacto:** Menos confusión y más guía hacia la siguiente acción.

**Pantallas:** `ChatScreen`, `HabitsScreen`, `TaskScreen`, `TransactionHistoryScreen`, `EmergencyAlertsHistoryScreen`, `TherapeuticTechniquesScreen` (si aplica).

### Cambios realizados
- **ChatScreen:** icono `chatbubble-ellipses-outline`, mensaje + subtítulo “Escribe abajo para empezar la conversación con Anto”.
- **TaskScreen:** subtítulo “Agrega tu primera tarea y organízate mejor” + CTA “Agregar tarea/recordatorio” (ya existía).
- **HabitsScreen:** subtítulo “Tu primer hábito es el primer paso” + CTA “Crear primer hábito” (ya existía para activos).
- **TransactionHistoryScreen:** CTA “Ver planes” que navega a `Subscription`.
- **EmergencyAlertsHistoryScreen:** CTA “Configurar contactos de emergencia” que navega a Perfil; icono con color de tema.

---

## 3. Estados de carga – implementado (skeletons en listas)

**Estado actual:** Uso de `ActivityIndicator` en varios sitios.

**Mejora:**
- En **listas** (tareas, hábitos, chat, transacciones): usar **skeleton loaders** (bloques animados que imitan la estructura de una fila/tarjeta) en lugar de solo spinner.
- Mantener spinner en pantallas completas (login, dashboard inicial) o en botones (“Guardando…” con spinner en el botón).
- Evitar cambios de layout bruscos al pasar de “cargando” a “contenido”.

**Impacto:** Sensación de velocidad y claridad de “algo está cargando aquí”.

**Componente a crear:** `SkeletonCard` o `SkeletonListItem` reutilizable; usarlo en DashScreen (tasks/habits), ChatScreen, TransactionHistoryScreen, HabitsScreen, TaskScreen.

### Cambios realizados
- **Componente reutilizable:** `src/components/Skeleton.js`
  - `SkeletonBlock`: bloque animado (pulse) para líneas/rectángulos.
  - `SkeletonCard`: card genérica para listas.
- **TaskScreen:** cuando `state.loading` y no hay items, muestra 6 `SkeletonCard` en el `FlatList`.
- **HabitsScreen:** cuando `loading` y la lista está vacía, muestra 6 `SkeletonCard`.
- **TransactionHistoryScreen:** reemplaza el spinner inicial por lista de `SkeletonCard`.
- **ChatScreen:** reemplaza el loader inicial por “burbujas” skeleton (alternando alineación).
- **DashScreen:** reemplaza el loader inicial por header skeleton + 3 cards skeleton.

---

## 4. Accesibilidad (VoiceOver / TalkBack)

**Estado actual:** Pocos elementos tienen `accessibilityLabel` / `accessibilityRole` / `accessibilityHint`.

**Mejora:**
- Añadir en: **botones principales**, **iconos de la barra de navegación**, **tarjetas clicables** (tarea, hábito, técnica), **inputs** (label + estado de error).
- En listas: que cada ítem anuncie bien (ej. “Tarea Comprar leche, pendiente, toque dos veces para completar”).
- Revisar **contraste** de texto sobre fondos (ya usas colores definidos; comprobar en grises y secundarios).

**Impacto:** App usable con lector de pantalla y mejor valoración en criterios de accesibilidad.

**Archivos:** `FloatingNavBar`, `TaskCard`, `HabitCard`, `SignInScreen`, `RegisterScreen`, `EditProfileScreen`, inputs en formularios; revisar `colors.textSecondary` y fondos.

---

## 5. Formularios (login, registro, perfil)

**Estado actual:** Validación y estilos ya están; algunos mensajes de error pueden ser genéricos.

**Mejora:**
- **Error inline** debajo del campo (no solo Alert), con mensaje claro y accesible.
- **Estado de foco** visible (borde/color) en inputs.
- En contraseña: **mostrar/ocultar** con icono y label accesible.
- Botón submit: **estado deshabilitado** hasta que el formulario sea válido, y **estado de carga** (“Ingresando…”) al enviar.

**Impacto:** Menos intentos fallidos y menos abandono en registro/login.

**Pantallas:** `SignInScreen`, `RegisterScreen`, `EditProfileScreen`, `RecoverPasswordScreen`, `VerifyCodeScreen`, `ResetPasswordScreen`, modales de crear/editar (tarea, hábito, contacto).

---

## 6. Navegación y “dónde estoy”

**Estado actual:** FloatingNavBar y headers por pantalla.

**Mejora:**
- Dejar siempre claro **qué pantalla es** (título en header o en contenido).
- En el **FloatingNavBar**: indicador visual claro del tab activo (revisar que sea muy evidente).
- En flujos largos (técnicas, onboarding): **progreso** (pasos 1/3, 2/3) o barra de progreso.
- Considerar **gesto atrás** consistente (p. ej. deslizar desde el borde) en todas las pantallas de detalle.

**Impacto:** Menos “me perdí” y menos toques de prueba.

**Archivos:** `FloatingNavBar`, `Header`, `StackNavigator`, pantallas de técnicas y `OnboardingTutorial`.

---

## 7. Jerarquía visual y tipografía

**Estado actual:** `globalStyles` con títulos y subtítulos; colores y cards definidos.

**Mejora:**
- Definir una **escala tipográfica** (ej. título 24, subtítulo 18, cuerpo 16, caption 14) y usarla en todas las pantallas.
- En cards y listas: **un solo nivel de “título”** por card y el resto como cuerpo o metadata.
- Evitar muchos pesos (bold) en el mismo bloque; reservar bold para lo más importante (1–2 elementos por pantalla).

**Impacto:** Lectura más rápida y sensación de interfaz más “diseñada”.

**Archivos:** `globalStyles.js`, `constants/ui.js` (añadir `TYPOGRAPHY`); revisar `Title`, `Subtitle`, textos en cards.

---

## 8. Errores y reconexión

**Estado actual:** `OfflineBanner`, mensajes de error y en algunos sitios “Reintentar”.

**Mejora:**
- Mensajes de error **en lenguaje de usuario** (“No se pudo cargar. Revisa tu conexión”) y **acción clara** (botón “Reintentar”).
- Cuando vuelve la conexión: **toast breve** (“Conexión restaurada”) para no dejar dudas.
- En chat o acciones críticas: distinguir “sin conexión” vs “error del servidor” cuando sea posible.

**Impacto:** Menos frustración y más confianza en la app.

**Archivos:** `OfflineBanner`, `useNetworkStatus`, pantallas con `loadData`/`onRefresh`, componente de toast (ya implementado).

---

## 9. Primera vez y onboarding

**Estado actual (detallado):**
- **OnboardingTutorial** (`src/components/OnboardingTutorial.js`): pantalla de bienvenida + 4 pasos (Dashboard, Chat, Tareas/Hábitos, Contactos emergencia), con highlights en `DashScreen` vía `TutorialHighlight`. Botón “Omitir” y gesto deslizar hacia abajo para saltar. Barra de progreso y “Comenzar”/“Finalizar”. Estado guardado en AsyncStorage por usuario.
- **TrialBanner** (`src/components/TrialBanner.js`): banner de trial (días restantes, CTA Suscribirse) en Dash y Chat; no es onboarding sino upsell.
- **DashScreen**: tras cargar, si el tutorial no está completado se muestra el tutorial; al completar se abre (si aplica) el modal de contactos de emergencia. `isFirstTimeUser` se marca para usuarios creados en las últimas 24 h.
- **Falta:** Un **objetivo único de primera sesión** tras el tutorial: **empezar el chat** con Anto, con un hint/tooltip o CTA visible.

**Mejora deseada:**
- Onboarding **corto** (3–4 pantallas): qué hace la app, valor principal, y una sola CTA (“Empezar”).
- Opción de **saltar** para quien ya conoce la app.
- Tras registro/tutorial: **un solo objetivo** para la primera sesión: **empezar el chat** con Anto (highlight o tooltip + CTA).

**Impacto:** Menor abandono en el primer uso.

**Archivos:** `OnboardingTutorial`, `TutorialHighlight`, flujo post-registro en `DashScreen`, `TrialBanner`.

### Plan de implementación (tareas concretas)

| # | Tarea | Prioridad | Estado |
|---|--------|-----------|--------|
| 9.1 | **Objetivo único de primera sesión:** Empezar el chat. Tras el tutorial, hint/banner con ese objetivo y CTA “Empezar chat” (y “Entendido” para cerrar). Persistir “visto/cerrado” en AsyncStorage. | Alta | ✅ Hecho |
| 9.2 | Opción “Omitir” ya existe; revisar que sea muy visible (texto “Omitir” en header). | Baja | Hecho |
| 9.3 | (Opcional) Reducir onboarding a 3 pantallas: bienvenida + 2 slides de valor (ej. Chat + Bienestar) + “Empezar”, si se quiere un flujo más corto. | Baja | Pendiente |
| 9.4 | **Preguntas iniciales para personalización:** 3 preguntas opcionales tras el tutorial; respuestas guardadas en backend y usadas por el chat para personalizar tono y enfoque. | Media | ✅ Hecho |

**Implementado (9.1):** Componente `FirstSessionHint` (`src/components/FirstSessionHint.js`). Objetivo único: **empezar el chat**. Se muestra tras completar u omitir el tutorial, o al cargar el dashboard si el tutorial ya estaba completado y el hint no se había cerrado. Texto: “Tu objetivo por ahora – Empezar el chat con Anto…” con botones “Empezar chat” y “Entendido”. Estado persistido por usuario en AsyncStorage (`firstSessionHintDismissed_<userId>`).

### Preguntas iniciales para personalización (9.4 – implementado)

**Implementado:** 3 preguntas opcionales tras el tutorial, con **uso real en el chat**: las respuestas se guardan en el perfil del usuario y el backend las incluye en el prompt del asistente para personalizar tono y enfoque.

**Preguntas:**
- ¿Qué esperas de la app?
- ¿Qué te gustaría mejorar o trabajar?
- ¿Qué tipo de apoyo buscas?

**Flujo:** Tras completar u omitir el tutorial → modal “Un momento para conocerte” con las 3 preguntas (texto libre, opcional) → botones “Enviar” y “Omitir”. Al cerrar (enviar u omitir) se muestra el hint “Empezar chat”.

**Backend:** `UserProfile.onboardingAnswers` (whatExpectFromApp, whatToImproveOrWorkOn, typeOfSpecialist). Endpoint `PATCH /api/users/me/onboarding-preferences`. En `openaiService.construirPromptContextualizado` se añade al system prompt: “INFORMACIÓN QUE EL USUARIO COMPARTIÓ AL INICIO” con las tres respuestas, para que Anto las use en la conversación.

**Frontend:** Componente `OnboardingQuestions` (`src/components/OnboardingQuestions.js`), mostrado en `DashScreen` tras el tutorial; envía las respuestas con `api.patch(ENDPOINTS.ONBOARDING_PREFERENCES, …)`.

### Personalización a largo plazo (evolución del perfil)

**Implementado:** Tras cada respuesta del chat, el backend actualiza el perfil del usuario con lo que se desprende de la conversación (temas, emociones recurrentes). Ese perfil enriquecido se usa en el prompt del asistente en mensajes posteriores, así que la personalización mejora con el tiempo.

**Qué se actualiza en cada mensaje:**
- **commonTopics:** temas detectados (contexto o emoción) con frecuencia y última vez; se mantienen los 15 más frecuentes.
- **emotionalPatterns.predominantEmotions:** emociones predominantes con frecuencia; se mantienen las 10 más frecuentes.
- **patrones.temas:** temas en español con frecuencia y última vez; se mantienen los 15 más frecuentes.
- **lastInteractions:** últimas 10 interacciones (timestamp, emoción, tema).
- **preferences.topicsOfInterest:** se añaden temas nuevos (no genéricos) para que el prompt pueda usarlos.

**Dónde se usa:** En `openaiService.generateLongTermContext` ya se leen `commonTopics`, `emotionalPatterns.predominantEmotions` y `patrones.temas` para construir el bloque “MEMORIA” del system prompt (temas recurrentes, emociones frecuentes). Al actualizar estos campos tras cada mensaje, ese bloque se va afinando con el uso.

**Backend:** `userProfileService.updateLongTermProfileFromConversation(userId, { emotionalAnalysis, contextualAnalysis })`, llamado desde `chatRoutes` después de guardar el mensaje del asistente (asíncrono, no bloquea la respuesta). Se invalida la caché del perfil tras la actualización.

---

## 10. Microinteracciones y sensación de respuesta

**Estado actual:** Animaciones de entrada (Home, Dash) y hápticos en algunos sitios.

**Mejora:**
- **Press state** en botones y cards (opacidad o escala 0.98) en `TouchableOpacity` / `Pressable`.
- En listas: **animación suave** al completar tarea o marcar hábito (ej. check + breve feedback).
- En chat: que el mensaje enviado tenga un **estado “enviado”** (icono o texto) hasta confirmación.
- Evitar animaciones largas que retrasen la acción; priorizar respuestas < 100–200 ms.

**Impacto:** La app se siente más “viva” y responsive.

**Archivos:** `AnimatedButton`, `TaskCard`, `HabitCard`, `ChatScreen` (burbujas y estado de mensaje), botones globales.

---

## Priorización sugerida

| Prioridad | Área                         | Esfuerzo | Impacto | Estado     |
|----------|------------------------------|----------|---------|------------|
| Alta     | Toast/snackbar               | Medio    | Alto    | ✅ Hecho   |
| Alta     | Empty states con CTA         | Bajo     | Alto    | ✅ Hecho   |
| Alta     | Skeleton en listas           | Medio    | Alto    | ✅ Hecho   |
| Media    | Accesibilidad (labels)       | Bajo     | Alto (inclusión) | ✅ Hecho   |
| Media    | Errores inline en formularios| Bajo     | Alto    | ✅ Hecho   |
| Media    | Indicador de tab activo y títulos | Bajo | Medio   | ✅ Hecho   |
| Baja     | Escala tipográfica global    | Bajo     | Medio   | ✅ Hecho   |
| Baja     | Errores y reconexión (toast restaurada) | Bajo | Alto | ✅ Hecho   |
| Baja     | Onboarding corto             | Medio    | Medio   | Pendiente  |

---

## Orden recomendado (siguientes pasos)

**Ya implementado:** Toast (1), Empty states (2), Skeletons (3), Accesibilidad (4), Formularios (5), Navegación y tab activo (6), Tipografía (7), Errores y reconexión (8), Microinteracciones parcial (10).

**Pendiente opcional:** Onboarding más corto (9.3); estado "enviado" en chat.
