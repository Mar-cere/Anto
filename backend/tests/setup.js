/**
 * Configuración global para tests
 * 
 * Este archivo se ejecuta antes de cada test suite.
 * 
 * @author AntoApp Team
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno de test
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Configurar variables de entorno por defecto para tests
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-signing-min-32-chars';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/anto-test';

// Suprimir logs durante tests (opcional, comentar si necesitas ver logs)
// console.log = jest.fn();
// console.error = jest.fn();
// console.warn = jest.fn();

// Timeout global para tests (solo si jest está disponible)
if (typeof jest !== 'undefined') {
  jest.setTimeout(10000);

  // Limpiar mocks después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });
}

