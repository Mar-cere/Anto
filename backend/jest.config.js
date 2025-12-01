/**
 * Configuración de Jest para Testing
 * 
 * @author AntoApp Team
 */

// Nota: Jest necesita configuración especial para ES modules
// Ver: https://jestjs.io/docs/ecmascript-modules

export default {
  // Entorno de testing
  testEnvironment: 'node',
  
  // Transformar archivos ES modules
  transform: {},
  
  // Extensiones de archivos a procesar
  moduleFileExtensions: ['js', 'json'],
  
  // Patrones de archivos de test
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Directorios a ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Cobertura de código
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!server.js',
    '!**/scripts/**',
    '!**/config/**'
  ],
  
  // Umbrales de cobertura (ajustados para inicio, aumentar gradualmente)
  // Nota: Estos umbrales son bajos al inicio, se deben aumentar conforme se agregan más tests
  coverageThreshold: {
    global: {
      branches: 2,   // Muy bajo al inicio, aumentar gradualmente
      functions: 5,  // Muy bajo al inicio, aumentar gradualmente
      lines: 10,     // Objetivo inicial razonable
      statements: 10 // Objetivo inicial razonable
    }
  },
  
  // Variables de entorno para tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Timeout para tests
  testTimeout: 10000,
  
  // Configuración de módulos ES
  // Para ES modules, necesitamos mapear las extensiones .js
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Preset para ES modules (experimental)
  preset: undefined,
  
  // Transformar ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@sentry|swagger))'
  ],
  
  // Verbose output
  verbose: true,
  
  // Reporters
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'coverage',
      outputName: 'junit.xml'
    }]
  ]
};

