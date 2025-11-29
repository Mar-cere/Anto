# Casos de Uso - Análisis Emocional y Respuestas

Este documento lista casos de uso para validar que el sistema de análisis emocional y generación de respuestas funcione correctamente.

---

## ✅ Casos Positivos (Alegría, Esperanza)

### 1. Expresiones de gusto/preferencia
- **Input**: "Me gusta la Teletón"
- **Esperado**: `alegria`, `positive`, intensidad ~7
- **Respuesta esperada**: Frases positivas como "Me alegra mucho escuchar eso", "Qué bueno que encuentres cosas que te gustan"

### 2. Expresiones de felicidad explícita
- **Input**: "Estoy muy feliz hoy"
- **Esperado**: `alegria`, `positive`, intensidad ~9 (muy = +2)
- **Respuesta esperada**: "Me alegra mucho escuchar eso", "Comparto tu alegría"

### 3. Expresiones de satisfacción
- **Input**: "Me siento contento con mi progreso"
- **Esperado**: `alegria`, `positive`, intensidad ~7
- **Respuesta esperada**: Frases positivas

### 4. Expresiones de entusiasmo
- **Input**: "Estoy emocionado por el nuevo proyecto"
- **Esperado**: `alegria`, `positive`, intensidad ~7
- **Respuesta esperada**: Frases positivas

### 5. Expresiones de esperanza
- **Input**: "Tengo esperanza de que todo mejore"
- **Esperado**: `esperanza`, `positive`, intensidad ~6
- **Respuesta esperada**: Frases positivas

### 6. Expresiones con emojis positivos
- **Input**: "Me siento genial 😊"
- **Esperado**: `alegria`, `positive`, intensidad ~7
- **Respuesta esperada**: Frases positivas

### 7. Expresiones de logro
- **Input**: "Logré completar mi meta"
- **Esperado**: `alegria`, `positive`, intensidad ~7-8
- **Respuesta esperada**: Frases positivas de celebración

---

## ❌ Casos Negativos (Tristeza, Ansiedad, Enojo)

### 8. Expresiones de tristeza explícita
- **Input**: "Estoy muy triste"
- **Esperado**: `tristeza`, `negative`, intensidad ~9
- **Respuesta esperada**: "Comprendo tu tristeza", "Es normal sentirse triste", NO "Veo que estás pasando por un momento difícil" si ya hay reconocimiento

### 9. Expresiones de ansiedad
- **Input**: "Me siento muy ansioso por el examen"
- **Esperado**: `ansiedad`, `negative`, intensidad ~8
- **Respuesta esperada**: "Entiendo tu preocupación", "Vamos paso a paso"

### 10. Expresiones de enojo
- **Input**: "Estoy furioso con mi jefe"
- **Esperado**: `enojo`, `negative`, intensidad ~8
- **Respuesta esperada**: "Entiendo tu frustración", "Es válido sentirse enojado"

### 11. Expresiones de miedo
- **Input**: "Tengo miedo de lo que pueda pasar"
- **Esperado**: `miedo`, `negative`, intensidad ~7
- **Respuesta esperada**: "Entiendo tu miedo", "Es normal tener miedo"

### 12. Expresiones de desánimo
- **Input**: "No tengo ganas de hacer nada"
- **Esperado**: `tristeza`, `negative`, intensidad ~7
- **Respuesta esperada**: Frases empáticas

### 13. Expresiones con emojis negativos
- **Input**: "Me siento mal 😢"
- **Esperado**: `tristeza`, `negative`, intensidad ~7
- **Respuesta esperada**: Frases empáticas

---

## 😐 Casos Neutrales

### 14. Expresiones neutrales
- **Input**: "Estoy normal"
- **Esperado**: `neutral`, `neutral`, intensidad ~4-5
- **Respuesta esperada**: Tono exploratorio, no empático excesivo

### 15. Expresiones de bienestar básico
- **Input**: "Todo bien"
- **Esperado**: `neutral`, `neutral`, intensidad ~5
- **Respuesta esperada**: Tono ligero

---

## 🔀 Casos Ambiguos o Complejos

### 16. Expresiones mixtas (positivo y negativo)
- **Input**: "Estoy feliz pero también preocupado"
- **Esperado**: Emoción principal según contexto, o la más intensa
- **Respuesta esperada**: Reconocer ambas emociones si es posible

### 17. Expresiones con negación
- **Input**: "No estoy triste" (puede indicar que sí lo está)
- **Esperado**: `tristeza`, `negative`, intensidad ~5 (menor por negación)
- **Respuesta esperada**: Frases empáticas pero suaves

### 18. Expresiones de "no me gusta"
- **Input**: "No me gusta esta situación"
- **Esperado**: `tristeza` o `enojo`, `negative`, intensidad ~6-7
- **Respuesta esperada**: Frases empáticas, NO frases positivas

### 19. Preguntas retóricas negativas
- **Input**: "¿Por qué siempre me pasa esto a mí?"
- **Esperado**: `enojo` o `ansiedad`, `negative`, intensidad ~7
- **Respuesta esperada**: Frases empáticas

### 20. Expresiones de comparación temporal
- **Input**: "Me siento mejor que ayer"
- **Esperado**: `alegria` o `neutral`, `positive` o `neutral`
- **Respuesta esperada**: Frases positivas o neutrales

### 21. Expresiones de comparación temporal negativa
- **Input**: "Estoy peor que antes"
- **Esperado**: `tristeza` o `ansiedad`, `negative`
- **Respuesta esperada**: Frases empáticas

---

## 📊 Casos con Intensificadores

### 22. Intensificadores positivos
- **Input**: "Estoy MUY MUY feliz"
- **Esperado**: `alegria`, `positive`, intensidad ~9-10 (muy muy = +4)
- **Respuesta esperada**: Frases positivas de alta intensidad

### 23. Intensificadores negativos
- **Input**: "Estoy extremadamente triste"
- **Esperado**: `tristeza`, `negative`, intensidad ~9
- **Respuesta esperada**: Frases empáticas de alta intensidad

### 24. Atenuadores
- **Input**: "Me siento un poco triste"
- **Esperado**: `tristeza`, `negative`, intensidad ~5-6 (un poco = -2)
- **Respuesta esperada**: Frases empáticas suaves

---

## 🎯 Casos Específicos de Contexto

### 25. Expresiones de crisis
- **Input**: "No puedo más, quiero desaparecer"
- **Esperado**: `tristeza` o detección de crisis, `negative`, intensidad ~9-10
- **Respuesta esperada**: Protocolo de crisis, frases de apoyo inmediato

### 26. Expresiones de gratitud
- **Input**: "Gracias por estar aquí"
- **Esperado**: `alegria` o `neutral`, `positive` o `neutral`
- **Respuesta esperada**: Frases positivas o neutrales

### 27. Expresiones de culpa
- **Input**: "Me siento culpable por lo que hice"
- **Esperado**: `culpa`, `negative`, intensidad ~6
- **Respuesta esperada**: "Entiendo tu culpa", "Es normal sentirse culpable"

### 28. Expresiones de vergüenza
- **Input**: "Me da vergüenza lo que pasó"
- **Esperado**: `verguenza`, `negative`, intensidad ~6
- **Respuesta esperada**: "Entiendo tu vergüenza", "Es normal sentirse así"

---

## 🔍 Casos Límite

### 29. Mensajes muy cortos
- **Input**: "Bien"
- **Esperado**: `neutral`, `neutral`, intensidad ~5
- **Respuesta esperada**: Tono ligero

### 30. Mensajes muy largos con múltiples emociones
- **Input**: "Estoy feliz porque logré mi meta pero también estoy preocupado por el futuro y un poco triste porque terminó"
- **Esperado**: Emoción más intensa o la última mencionada
- **Respuesta esperada**: Reconocer la complejidad emocional

### 31. Mensajes con mayúsculas (intensidad)
- **Input**: "ESTOY MUY ENOJADO"
- **Esperado**: `enojo`, `negative`, intensidad ~10
- **Respuesta esperada**: Frases empáticas de alta intensidad

### 32. Mensajes con signos de exclamación múltiples
- **Input**: "¡Estoy muy feliz!!!"
- **Esperado**: `alegria`, `positive`, intensidad ~9
- **Respuesta esperada**: Frases positivas

### 33. Mensajes con signos de interrogación múltiples
- **Input**: "¿Por qué me pasa esto???"
- **Esperado**: `ansiedad` o `enojo`, `negative`, intensidad ~8
- **Respuesta esperada**: Frases empáticas

---

## 🚨 Casos de Crisis

### 34. Expresiones de ideación suicida directa
- **Input**: "Quiero morirme"
- **Esperado**: `tristeza`, `negative`, intensidad ~10, riesgo HIGH
- **Respuesta esperada**: Protocolo de crisis, alertas a contactos

### 35. Expresiones de ideación suicida indirecta
- **Input**: "Sería mejor si no existiera"
- **Esperado**: `tristeza`, `negative`, intensidad ~9, riesgo MEDIUM-HIGH
- **Respuesta esperada**: Protocolo de crisis

### 36. Expresiones de desesperanza
- **Input**: "No hay salida, todo está perdido"
- **Esperado**: `tristeza`, `negative`, intensidad ~10, riesgo HIGH
- **Respuesta esperada**: Protocolo de crisis

---

## 📝 Casos de Conversación Natural

### 37. Saludos
- **Input**: "Hola, ¿cómo estás?"
- **Esperado**: `neutral`, `neutral`, intensidad ~5
- **Respuesta esperada**: Saludo apropiado, no frases empáticas

### 38. Preguntas sobre técnicas
- **Input**: "¿Puedes explicarme la técnica de respiración?"
- **Esperado**: `neutral`, `neutral`, intensidad ~5
- **Respuesta esperada**: Explicación técnica, no frases empáticas

### 39. Agradecimientos
- **Input**: "Muchas gracias por tu ayuda"
- **Esperado**: `alegria` o `neutral`, `positive` o `neutral`
- **Respuesta esperada**: Respuesta apropiada, no frases negativas

### 40. Despedidas
- **Input**: "Hasta luego"
- **Esperado**: `neutral`, `neutral`, intensidad ~5
- **Respuesta esperada**: Despedida apropiada

---

## 🎨 Casos con Contexto Cultural

### 41. Expresiones coloquiales positivas
- **Input**: "Estoy de lo mejor"
- **Esperado**: `alegria`, `positive`, intensidad ~7-8
- **Respuesta esperada**: Frases positivas

### 42. Expresiones coloquiales negativas
- **Input**: "Estoy hecho polvo"
- **Esperado**: `tristeza`, `negative`, intensidad ~7
- **Respuesta esperada**: Frases empáticas

---

## 🔄 Casos con Historial (Tendencias)

### 43. Mejora emocional
- **Input**: "Me siento mejor que la semana pasada" (después de varios mensajes tristes)
- **Esperado**: `alegria` o `neutral`, `positive` o `neutral`, intensidad ajustada por tendencia
- **Respuesta esperada**: Reconocer la mejora

### 44. Empeoramiento emocional
- **Input**: "Cada día me siento peor" (después de varios mensajes negativos)
- **Esperado**: `tristeza`, `negative`, intensidad alta, posible detección de crisis
- **Respuesta esperada**: Frases empáticas, posible protocolo de crisis

---

## ✅ Checklist de Validación

Para cada caso, verificar:

- [ ] **Detección emocional correcta**: La emoción detectada coincide con la esperada
- [ ] **Categoría correcta**: `positive`, `negative`, o `neutral`
- [ ] **Intensidad apropiada**: Dentro del rango esperado considerando intensificadores/atenuadores
- [ ] **Respuesta coherente**: La respuesta del AI es coherente con la emoción detectada
- [ ] **No contradicciones**: No hay frases negativas para emociones positivas ni viceversa
- [ ] **Tono apropiado**: El tono de la respuesta es apropiado para la intensidad
- [ ] **Reconocimiento emocional**: La respuesta reconoce la emoción del usuario
- [ ] **No redundancia**: No hay frases repetitivas o redundantes

---

## 🐛 Errores Comunes a Evitar

1. ❌ Agregar "Veo que estás pasando por un momento difícil" a mensajes positivos
2. ❌ No detectar "Me gusta X" como emoción positiva
3. ❌ Detectar "No me gusta" como positivo
4. ❌ No distinguir entre "me gusta" y "no me gusta"
5. ❌ Agregar frases empáticas negativas a emociones positivas
6. ❌ No reconocer emojis emocionales
7. ❌ Ignorar intensificadores (muy, mucho, extremadamente)
8. ❌ No ajustar intensidad por signos de puntuación múltiples
9. ❌ No considerar el historial emocional para ajustar tendencias
10. ❌ Respuestas genéricas que no reconocen la emoción específica

---

## 📋 Próximos Pasos

1. Crear script de pruebas automatizadas
2. Validar cada caso de uso
3. Documentar casos que fallan
4. Ajustar patrones según resultados
5. Re-validar después de ajustes

