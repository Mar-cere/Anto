# 📱 Revisión del Manejo Offline

## 🔍 Estado Actual

### ✅ Lo que SÍ está implementado:

1. **Almacenamiento Local Básico (AsyncStorage)**
   - ✅ Guardado de mensajes del chat en `chatMessages`
   - ✅ Guardado de `conversationId` en `currentConversationId`
   - ✅ Guardado de token de usuario en `userToken`
   - ✅ Funciones: `saveMessages()`, `loadMessages()`, `clearMessages()`

2. **Reconexión WebSocket**
   - ✅ Reconexión automática con backoff exponencial
   - ✅ Detección de desconexión
   - ✅ Reintentos configurados

3. **Verificación de Servidor**
   - ✅ `checkServerStatus()` con reintentos
   - ✅ Backoff exponencial para reintentos

### ❌ Lo que NO está implementado:

1. **Detección de Estado de Red**
   - ❌ No hay detección de conexión/desconexión de red
   - ❌ No se usa `@react-native-community/netinfo`
   - ❌ No hay listener de cambios de estado de red

2. **Cola de Mensajes Pendientes**
   - ❌ No hay cola de mensajes cuando está offline
   - ❌ Los mensajes se pierden si se envían sin conexión
   - ❌ No hay sincronización automática al volver online

3. **Indicadores Visuales**
   - ❌ No hay banner/indicador de estado offline
   - ❌ No se informa al usuario que está offline
   - ❌ No hay feedback cuando un mensaje está pendiente

4. **Manejo de Errores Offline**
   - ❌ No se diferencia entre error de red y otros errores
   - ❌ No hay mensajes específicos para offline
   - ❌ No hay retry automático cuando vuelve la conexión

5. **Sincronización de Datos**
   - ❌ No hay sincronización de tareas/hábitos offline
   - ❌ No hay caché de datos para uso offline
   - ❌ No hay estrategia de resolución de conflictos

---

## 🎯 Propuesta de Mejoras

### Prioridad ALTA (Crítico para UX)

#### 1. **Detección de Estado de Red**
```javascript
// Instalar: npm install @react-native-community/netinfo
import NetInfo from '@react-native-community/netinfo';

// Hook para estado de red
const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);
  
  return isConnected;
};
```

#### 2. **Cola de Mensajes Pendientes**
```javascript
// Guardar mensajes pendientes en AsyncStorage
const PENDING_MESSAGES_KEY = 'pendingMessages';

// Al enviar mensaje offline
if (!isConnected) {
  await queueMessage(message);
  showOfflineBanner();
  return;
}

// Al volver online, sincronizar
useEffect(() => {
  if (isConnected) {
    syncPendingMessages();
  }
}, [isConnected]);
```

#### 3. **Indicador Visual de Estado**
```javascript
// Banner de estado offline
{!isConnected && (
  <View style={styles.offlineBanner}>
    <Text>Sin conexión. Los mensajes se enviarán cuando vuelva la conexión.</Text>
  </View>
)}
```

### Prioridad MEDIA (Mejora UX)

#### 4. **Caché de Datos para Offline**
- Cachear tareas, hábitos, perfil del usuario
- Mostrar datos cacheados cuando está offline
- Sincronizar cuando vuelve la conexión

#### 5. **Manejo Inteligente de Errores**
```javascript
const handleError = (error) => {
  if (error.message.includes('Network request failed')) {
    // Error de red
    return 'Sin conexión a internet';
  }
  // Otros errores
  return 'Error al procesar la solicitud';
};
```

### Prioridad BAJA (Nice to have)

#### 6. **Modo Offline Completo**
- Permitir crear/editar tareas offline
- Permitir crear/editar hábitos offline
- Sincronización bidireccional al volver online

---

## 📋 Plan de Implementación

### Fase 1: Detección y UI (1-2 días)
1. ✅ Instalar `@react-native-community/netinfo`
2. ✅ Crear hook `useNetworkStatus`
3. ✅ Agregar banner de estado offline
4. ✅ Mostrar indicador en todas las pantallas principales

### Fase 2: Cola de Mensajes (2-3 días)
1. ✅ Crear servicio de cola de mensajes
2. ✅ Guardar mensajes pendientes en AsyncStorage
3. ✅ Sincronizar automáticamente al volver online
4. ✅ Mostrar estado de mensajes (enviado/pendiente)

### Fase 3: Caché de Datos (3-5 días)
1. ✅ Cachear datos críticos (tareas, hábitos, perfil)
2. ✅ Mostrar datos cacheados cuando está offline
3. ✅ Sincronizar cambios al volver online
4. ✅ Manejar conflictos de sincronización

---

## 🔧 Archivos a Modificar/Crear

### Nuevos Archivos:
- `frontend/src/hooks/useNetworkStatus.js` - Hook para estado de red
- `frontend/src/services/offlineQueue.js` - Servicio de cola offline
- `frontend/src/services/offlineSync.js` - Servicio de sincronización
- `frontend/src/components/OfflineBanner.js` - Componente de banner

### Archivos a Modificar:
- `frontend/src/screens/ChatScreen.js` - Agregar manejo offline
- `frontend/src/services/chatService.js` - Agregar cola de mensajes
- `frontend/src/config/api.js` - Agregar detección de errores de red
- `frontend/package.json` - Agregar dependencia `@react-native-community/netinfo`

---

## 📊 Impacto Esperado

### Con Fase 1 (Detección y UI):
- ✅ Usuario sabe cuando está offline
- ✅ Mejor experiencia de usuario
- ✅ Menos confusión sobre por qué no funcionan las cosas

### Con Fase 2 (Cola de Mensajes):
- ✅ No se pierden mensajes cuando está offline
- ✅ Sincronización automática al volver online
- ✅ Experiencia fluida sin interrupciones

### Con Fase 3 (Caché Completo):
- ✅ App completamente funcional offline
- ✅ Sincronización bidireccional
- ✅ Experiencia premium

---

## ⚠️ Consideraciones

1. **Límites de AsyncStorage**
   - Máximo ~6MB en iOS, ~10MB en Android
   - Considerar límites para mensajes pendientes

2. **Conflictos de Sincronización**
   - ¿Qué pasa si se edita offline y luego online?
   - Estrategia: Last-Write-Wins o merge inteligente

3. **Seguridad**
   - No guardar datos sensibles en AsyncStorage sin encriptar
   - Considerar encriptación para mensajes pendientes

4. **Performance**
   - Sincronización puede ser lenta si hay muchos mensajes pendientes
   - Considerar sincronización en background

---

## ✅ Implementación Completada

### Fase 1: Detección y UI ✅

1. ✅ **Instalado `@react-native-community/netinfo`**
2. ✅ **Creado hook `useNetworkStatus`** - Detecta estado de red en tiempo real
3. ✅ **Creado componente `OfflineBanner`** - Muestra banner cuando está offline
4. ✅ **Integrado en ChatScreen** - Banner visible y detección de errores de red
5. ✅ **Integrado en DashScreen** - Banner visible en pantalla principal
6. ✅ **Mejorado manejo de errores** - Detecta errores de red específicamente

### Archivos Creados/Modificados:

- ✅ `frontend/src/hooks/useNetworkStatus.js` - Hook para estado de red
- ✅ `frontend/src/components/OfflineBanner.js` - Componente de banner
- ✅ `frontend/src/screens/ChatScreen.js` - Integración de detección offline
- ✅ `frontend/src/screens/DashScreen.js` - Integración de banner offline
- ✅ `frontend/package.json` - Dependencia `@react-native-community/netinfo` agregada

### Funcionalidades Implementadas:

- ✅ Detección automática de estado de red (conectado/desconectado)
- ✅ Banner visual cuando está offline
- ✅ Mensajes de error específicos para errores de red
- ✅ Detección de tipo de conexión (wifi, cellular, etc.)
- ✅ **Manejo de login/registro offline:**
  - ✅ Botones deshabilitados cuando está offline
  - ✅ Verificación de conexión antes de intentar login/registro
  - ✅ Mensajes de error específicos para offline
  - ✅ Banner offline visible en pantallas de autenticación

### Nota:

- ❌ **Cola de mensajes pendientes NO implementada** (según solicitud del usuario)
- Los mensajes enviados sin conexión mostrarán un error específico
- El usuario puede reintentar cuando vuelva la conexión

---

**Estado:** ✅ Fase 1 completada - Detección y UI implementadas  
**Última actualización:** 2025-01-XX

