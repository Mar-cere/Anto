/**
 * Helpers para tests
 * 
 * Funciones auxiliares para facilitar la escritura de tests.
 * 
 * @author AntoApp Team
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

/**
 * Aísla la BD por worker de Jest para que clearDatabase en un proceso no borre
 * datos de otro (suites en paralelo compartían anto-test).
 */
function resolveTestMongoUri() {
  let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/anto-test';
  const wid = process.env.JEST_WORKER_ID;
  if (wid === undefined || wid === '') {
    return uri;
  }

  const qIndex = uri.indexOf('?');
  const pathAndHost = qIndex === -1 ? uri : uri.slice(0, qIndex);
  const query = qIndex === -1 ? '' : uri.slice(qIndex);
  const lastSlash = pathAndHost.lastIndexOf('/');
  if (lastSlash < 0 || lastSlash >= pathAndHost.length - 1) {
    return uri;
  }

  let dbName = pathAndHost.slice(lastSlash + 1);
  if (!dbName) {
    return uri;
  }
  const suffix = `-w${wid}`;
  if (dbName.endsWith(suffix)) {
    return uri;
  }
  if (/-w\d+$/.test(dbName)) {
    dbName = dbName.replace(/-w\d+$/, suffix);
  } else {
    dbName = `${dbName}${suffix}`;
  }
  return `${pathAndHost.slice(0, lastSlash + 1)}${dbName}${query}`;
}

/**
 * Limpiar base de datos de test
 */
export const clearDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    // Si la conexión está "abierta" pero no es utilizable, no bloquear los tests.
    try {
      await mongoose.connection.db.admin().ping();
    } catch (error) {
      return;
    }
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        // Evita trabajo innecesario: si está vacía, saltar.
        const count = await collections[key].estimatedDocumentCount({ maxTimeMS: 2000 });
        if (!count) continue;
        await collections[key].deleteMany({}, { maxTimeMS: 5000 });
      } catch (error) {
        // Ignorar: algunos suites corren sin Mongo o hay locks temporales.
      }
    }
  }
};

/**
 * Cerrar conexión a base de datos
 */
export const closeDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    // Cerrar todas las conexiones
    await mongoose.connection.close();
    // Forzar cierre de todas las conexiones del pool
    await mongoose.disconnect();
    // Dar tiempo para que la conexión se cierre completamente
    await new Promise(resolve => setTimeout(resolve, 200));
  } else if (mongoose.connection.readyState !== 0) {
    // Si está en cualquier otro estado, intentar desconectar
    try {
      await mongoose.disconnect();
    } catch (error) {
      // Ignorar errores al desconectar
    }
  }
};

/**
 * Conectar a base de datos de test
 */
export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    const mongoUri = resolveTestMongoUri();
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      // Esperar a que la conexión esté lista
      await mongoose.connection.db.admin().ping();
    } catch (error) {
      console.warn('⚠️ No se pudo conectar a MongoDB para tests:', error.message);
      console.warn('⚠️ Los tests continuarán pero algunos pueden fallar');
      // Importante: si el driver alcanzó a crear monitores/sockets, desconectar para no dejar handles abiertos.
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        // Ignorar errores al desconectar tras fallo de conexión
      }
    }
  }
};

/**
 * Generar token JWT para tests
 * 
 * @param {Object} payload - Payload del token
 * @param {string} secret - Secret para firmar (opcional)
 * @returns {string} Token JWT
 */
export const generateTestToken = (payload = {}, secret = null) => {
  const defaultPayload = {
    id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    ...payload,
  };
  
  const jwtSecret = secret || process.env.JWT_SECRET || 'test-secret';
  
  return jwt.sign(defaultPayload, jwtSecret, { expiresIn: '1h' });
};

/**
 * Crear usuario de test
 * 
 * @param {Object} userData - Datos del usuario
 * @param {Object} UserModel - Modelo de usuario
 * @returns {Object} Usuario creado
 */
export const createTestUser = async (UserModel, userData = {}) => {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123456!',
    ...userData,
  };
  
  return await UserModel.create(defaultUser);
};

/**
 * Crear headers de autenticación para tests
 * 
 * @param {string} token - Token JWT
 * @returns {Object} Headers
 */
export const getAuthHeaders = (token = null) => {
  const testToken = token || generateTestToken();
  return {
    'Authorization': `Bearer ${testToken}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Esperar un tiempo determinado (útil para tests asíncronos)
 * 
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promise que se resuelve después del tiempo
 */
export const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Mock de request de Express
 * 
 * @param {Object} options - Opciones del request
 * @returns {Object} Request mockeado
 */
export const createMockRequest = (options = {}) => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ip: '127.0.0.1',
    method: 'GET',
    path: '/',
    ...options,
  };
};

/**
 * Mock de response de Express
 * 
 * @returns {Object} Response mockeado
 */
export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Mock de next de Express
 * 
 * @returns {Function} Next mockeado
 */
export const createMockNext = () => {
  return jest.fn();
};

export default {
  clearDatabase,
  closeDatabase,
  connectDatabase,
  generateTestToken,
  createTestUser,
  getAuthHeaders,
  wait,
  createMockRequest,
  createMockResponse,
  createMockNext,
};

