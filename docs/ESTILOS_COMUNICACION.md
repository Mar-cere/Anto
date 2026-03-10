# Estilos de comunicación: communicationStyle vs responseStyle

Documentación del uso unificado de `communicationStyle` y `responseStyle` en el perfil del usuario para personalizar el chat.

---

## Resumen

| Campo | Ubicación | Propósito | Afecta |
|-------|-----------|-----------|--------|
| **communicationStyle** | `UserProfile.preferences.communicationStyle` | Tono general de comunicación (cómo validar, reflexionar, dirigir) | STYLE_GUIDELINES, CONTEXT_SECTION |
| **responseStyle** | `UserProfile.preferences.responseStyle` o `User.preferences.responseStyle` | Longitud y estructura de la respuesta | maxWords, estructura del prompt, determinarLongitudRespuesta |

---

## communicationStyle

**Fuente única:** `UserProfile.preferences.communicationStyle`

Define el **tono y estilo de interacción** del asistente: validación, reflexión, directness.

### Valores soportados

| Valor | Descripción | Uso en prompt |
|-------|-------------|---------------|
| `neutral` | Equilibrado, profesional, adaptativo | Por defecto |
| `empatico` / `empático` | Cálido, validante, reflexivo | Alto en validación y reflexión |
| `directo` | Claro, conciso, directo al punto | Alta directness, baja reflexión |
| `exploratorio` | Curioso, abierto, no directivo | Preguntas abiertas, invita a explorar |
| `estructurado` | Organizado, sistemático, con pasos | Respuestas estructuradas |
| `formal` | (alias) → `estructurado` | Mapeado internamente |
| `casual` | (alias) → `neutral` | Mapeado internamente |

### Dónde se usa

- `buildPersonalizedPrompt()` → `getCommunicationStyleGuidelines(communicationStyle)`
- `CONTEXT_SECTION`: `Estilo: {communicationStyle}`
- `STYLE_GUIDELINES`: tono, validación, reflexión, directness

### Lectura

```javascript
const communicationStyle = profile.preferences?.communicationStyle || 'neutral';
```

**Nota:** `communicationPreferences` está deprecado; usar siempre `preferences.communicationStyle`.

---

## responseStyle

**Fuentes (prioridad):** `UserProfile.preferences.responseStyle` > `User.preferences.responseStyle` (merge en chatRoutes)

Define la **longitud y estructura** de las respuestas del asistente.

### Valores soportados

| Valor | maxWords aprox. | Estructura |
|-------|-----------------|------------|
| `brief` | ~30 | 1 oración, reconocimiento + pregunta breve |
| `balanced` | ~50 (default) | 1-2 oraciones estándar |
| `deep` | ~80 | 2-3 oraciones, exploración profunda |
| `empatico` | ~60 | Reconocimiento empático + validación + pregunta |
| `profesional` | ~55 | Reconocimiento + análisis estructurado |
| `directo` | ~35 | Directo y claro |
| `calido` | ~50 | Cálido y cercano |
| `estructurado` | ~60 | Organizado en pasos |

### Dónde se usa

- `buildPersonalizedPrompt()` → ajuste de `maxWords` y `RESPONSE_STRUCTURE`
- `openaiService.determinarLongitudRespuesta()` → tokens máximos por contexto
- Bloque `ESTILO DE RESPUESTA` en el prompt

### Lectura

```javascript
const responseStyle = profile.preferences?.responseStyle || 'balanced';
```

En `chatRoutes`, el `combinedProfile` fusiona `userProfile` con `user.preferences`, por lo que si el usuario actualizó `responseStyle` en User, se obtiene desde ahí.

---

## Sincronización

Cuando el usuario actualiza preferencias vía `PUT /users/me` con `preferences.responseStyle`:

1. Se actualiza `User.preferences.responseStyle`
2. Se sincroniza a `UserProfile.preferences.responseStyle` para mantener una única fuente de verdad en flujos que solo usan UserProfile

---

## Modelos

### UserProfile

```javascript
preferences: {
  communicationStyle: { enum: ['neutral', 'empatico', 'empático', 'directo', 'exploratorio', 'estructurado', 'formal', 'casual'], default: 'neutral' },
  responseStyle: { enum: ['brief', 'balanced', 'deep', 'empatico', 'profesional', 'directo', 'calido', 'estructurado'], default: 'balanced' },
  responseLength: { enum: ['SHORT', 'MEDIUM', 'LONG'], default: 'MEDIUM' },
  topicsOfInterest: [String],
  triggerTopics: [String]
}
```

### User

```javascript
preferences: {
  responseStyle: { enum: ['brief', 'balanced', 'deep', ...], default: 'balanced' },
  // ... theme, notifications, language, privacy
}
```

---

## API de actualización

- **User:** `PUT /users/me` con `{ preferences: { responseStyle: 'brief' } }` → actualiza User y sincroniza a UserProfile
- **UserProfile:** `userProfileService.updatePreferences(userId, { communicationStyle, responseStyle, ... })` → actualiza solo UserProfile

Para preferencias de chat, se recomienda usar UserProfile como fuente principal; User.preferences.responseStyle se mantiene por compatibilidad con la API existente.
