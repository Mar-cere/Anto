# 🧪 Configuración de Tests - Frontend

## ✅ Estado Actual

Se ha configurado Jest para el frontend con las siguientes características:

### Dependencias Instaladas
- `jest` - Framework de testing
- `jest-expo` - Preset para Expo
- `@testing-library/react-native` - Utilidades para testing de React Native
- `@testing-library/jest-native` - Matchers adicionales
- `react-test-renderer` - Para renderizar componentes

### Archivos Creados
1. **`jest.config.js`** - Configuración principal de Jest
2. **`jest.setup.js`** - Setup inicial con mocks
3. **`src/utils/__tests__/greetings.test.js`** - Tests para utilidad de saludos
4. **`src/config/__tests__/api.test.js`** - Tests para configuración de API

### Scripts Disponibles
```bash
npm test              # Ejecutar todos los tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

## ✅ Problema Resuelto

El problema con `jest-expo` y archivos TypeScript ha sido resuelto mediante:
1. Creación de `babel.config.js` con preset de Expo
2. Configuración correcta de mocks en `jest.setup.js`
3. Mock de Platform antes de cualquier import

## 📝 Tests Creados

### 1. Tests de Utilidades (`src/utils/__tests__/greetings.test.js`)
- ✅ Tests para función `getGreetingByHourAndDayAndName`
- ✅ Cobertura de diferentes horas del día
- ✅ Validación de inclusión de nombre de usuario
- ✅ Validación de días de la semana

### 2. Tests de Configuración (`src/config/__tests__/api.test.js`)
- ✅ Tests para `ENDPOINTS`
- ✅ Tests para `checkServerConnection`
- ✅ Validación de endpoints dinámicos

## 🚀 Próximos Pasos

1. **Resolver conflicto de jest-expo** con archivos TypeScript
2. **Agregar más tests para:**
   - Servicios (`userService.js`, `chatService.js`)
   - Componentes críticos
   - Utilidades adicionales
3. **Configurar CI/CD** para ejecutar tests automáticamente

## 📊 Cobertura Objetivo

- **Inicial:** 10% statements
- **Objetivo:** 30-40% statements para componentes críticos

