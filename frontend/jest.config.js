module.exports = {
  // No usar preset para evitar conflictos con TypeScript
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|@testing-library)/)'
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  setupFilesAfterEnv: [],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],
  coverageThreshold: {
    global: {
      statements: 10,
      branches: 5,
      functions: 10,
      lines: 10
    }
  },
  testMatch: [
    '**/__tests__/**/*.(js|jsx)',
    '**/*.(test|spec).(js|jsx)'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};

