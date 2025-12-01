# 🧪 Guía de Testing - Anto App Backend

## 📋 Resumen

Esta guía explica cómo ejecutar y escribir tests para el backend de Anto App.

## 🚀 Inicio Rápido

### Instalar Dependencias

```bash
cd backend
npm install
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Solo tests unitarios
npm run test:unit

# Solo tests de integración
npm run test:integration
```

## 📁 Estructura de Tests

```
backend/
  tests/
    ├── setup.js              # Configuración global
    ├── helpers/
    │   └── testHelpers.js    # Funciones auxiliares
    ├── fixtures/
    │   └── userFixtures.js   # Datos de ejemplo
    ├── unit/                 # Tests unitarios
    │   └── utils/
    │       └── errors.test.js
    └── integration/          # Tests de integración
        └── routes/
            └── health.test.js
```

## ✍️ Escribir Tests

### Test Unitario de Ejemplo

```javascript
import { ValidationError } from '../../../utils/errors.js';

describe('ValidationError', () => {
  it('debe crear un error de validación', () => {
    const error = new ValidationError('Invalid data');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});
```

### Test de Integración de Ejemplo

```javascript
import request from 'supertest';
import app from '../../../server.js';

describe('Health Check', () => {
  it('debe retornar status 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
```

## 🛠️ Helpers Disponibles

### Test Helpers

```javascript
import {
  generateTestToken,
  createTestUser,
  getAuthHeaders,
  clearDatabase,
  connectDatabase,
  closeDatabase,
} from '../helpers/testHelpers.js';

// Generar token JWT
const token = generateTestToken({ id: '123' });

// Crear usuario de test
const user = await createTestUser(UserModel, { email: 'test@example.com' });

// Headers de autenticación
const headers = getAuthHeaders(token);

// Limpiar base de datos
await clearDatabase();
```

### Fixtures

```javascript
import { validUser, userWithSubscription } from '../fixtures/userFixtures.js';

// Usar datos de ejemplo
const user = await createTestUser(UserModel, validUser);
```

## 📊 Cobertura de Código

Los tests generan un reporte de cobertura automáticamente:

```bash
npm test
```

El reporte se genera en `coverage/` y muestra:
- Líneas cubiertas
- Funciones cubiertas
- Branches cubiertos
- Statements cubiertos

## ⚙️ Configuración

### Variables de Entorno para Tests

Crea un archivo `.env.test` en la raíz del backend:

```env
NODE_ENV=test
MONGO_URI=mongodb://localhost:27017/anto-test
JWT_SECRET=test-secret-key-for-jwt-signing-min-32-chars
```

### Jest Configuration

La configuración de Jest está en `jest.config.js`. Incluye:
- Timeout de 10 segundos
- Cobertura mínima del 50%
- Reportes en formato JUnit

## 🎯 Mejores Prácticas

1. **Nombres descriptivos**: Usa nombres claros para tests
2. **Un test, una aserción**: Idealmente, un test debe verificar una cosa
3. **Arrange-Act-Assert**: Estructura tus tests claramente
4. **Limpieza**: Limpia la base de datos después de cada test
5. **Mocks**: Usa mocks para servicios externos (OpenAI, Mercado Pago, etc.)

## 📝 Ejemplos Completos

Ver los archivos en `tests/` para ejemplos completos de:
- Tests unitarios de utilidades
- Tests de integración de rutas
- Uso de helpers y fixtures

## 🐛 Troubleshooting

### Error: "Cannot find module"
- Asegúrate de ejecutar `npm install`
- Verifica que estás en el directorio correcto

### Error: "MongoDB connection failed"
- Verifica que MongoDB está corriendo
- Revisa la URI en `.env.test`

### Tests muy lentos
- Usa mocks para servicios externos
- Limpia la base de datos eficientemente
- Considera usar una base de datos en memoria para tests

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

