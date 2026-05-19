// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '**/.tmp-*.js', '**/.tmp-*.bundle.js'],
  },
  {
    rules: {
      // Regla muy ruidosa con módulos que exponen export default + named.
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
    },
  },
  {
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/jest.setup.js',
    ],
    languageOptions: {
      globals: {
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      // En tests se hacen stubs/mutations de namespaces mockeados.
      'import/namespace': 'off',
      // En tests es habitual importar después de mocks por aislamiento.
      'import/first': 'off',
      // Algunos tests importan globals de Jest explícitamente.
      'no-redeclare': 'off',
    },
  },
  {
    files: ['**/scripts/**/*.js', '**/*.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
]);
