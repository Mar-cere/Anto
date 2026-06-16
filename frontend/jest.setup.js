// Mock react-native con componentes mínimos para que módulos que usan View/Text/StyleSheet carguen
const Mock = (props) => props.children ?? null;
jest.mock('react-native', () => ({
  View: Mock,
  Text: Mock,
  TextInput: Mock,
  TouchableOpacity: Mock,
  ScrollView: Mock,
  Modal: Mock,
  ActivityIndicator: Mock,
  SafeAreaView: Mock,
  StatusBar: Mock,
  StyleSheet: { create: (s) => s, flatten: (x) => x, hairlineWidth: 1 },
  Alert: { alert: jest.fn() },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn((_event, _handler) => ({
      remove: jest.fn(),
    })),
  },
  Linking: { openURL: jest.fn().mockResolvedValue(undefined), canOpenURL: jest.fn().mockResolvedValue(true) },
  Platform: {
    OS: 'ios',
    select: jest.fn((dict) => dict.ios),
    isPad: false,
    isTVOS: false,
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo modules
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(),
  AndroidNotificationPriority: { HIGH: 'HIGH' },
  SchedulableTriggerInputTypes: {
    TIME_INTERVAL: 'timeInterval',
    DAILY: 'daily',
    DATE: 'date',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    CALENDAR: 'calendar',
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'iPhone',
  osName: 'iOS',
  osVersion: '15.0',
}));

jest.mock('react-native-health', () => ({
  __esModule: true,
  default: {
    Constants: {
      Permissions: {
        StepCount: 'StepCount',
        SleepAnalysis: 'SleepAnalysis',
        AppleExerciseTime: 'AppleExerciseTime',
      },
    },
    initHealthKit: jest.fn((_permissions, callback) => callback(null)),
    isAvailable: jest.fn((callback) => callback(null, true)),
    getDailyStepCountSamples: jest.fn((_options, callback) => callback(null, [])),
    getSleepSamples: jest.fn((_options, callback) => callback(null, [])),
    getAppleExerciseTime: jest.fn((_options, callback) => callback(null, [])),
  },
}));

jest.mock('react-native-health-connect', () => ({
  SdkAvailabilityStatus: {
    SDK_AVAILABLE: 3,
    SDK_AVAILABLE_PROVIDER_UPDATE_REQUIRED: 2,
  },
  getSdkStatus: jest.fn(() => Promise.resolve(3)),
  initialize: jest.fn(() => Promise.resolve(true)),
  requestPermission: jest.fn(() => Promise.resolve([{ recordType: 'Steps' }])),
  readRecords: jest.fn(() => Promise.resolve({ records: [] })),
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setContext: jest.fn(),
  withScope: jest.fn((callback) => callback({ setTag: jest.fn(), setContext: jest.fn() })),
}));

// Mock axios para userService
global.mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() }
  }
};

jest.mock('axios', () => {
  return {
    create: jest.fn(() => global.mockApiClient),
    post: jest.fn()
  };
});

// Global mocks
global.__DEV__ = true;
global.fetch = jest.fn();

// Idioma estable en tests (evita fallos según locale del dispositivo CI/local).
jest.mock('./src/utils/appLanguage', () => {
  const actual = jest.requireActual('./src/utils/appLanguage');
  return {
    ...actual,
    detectDeviceLanguage: () => 'es',
    getCachedAppLanguage: () => 'es',
    getAppLanguage: jest.fn(() => Promise.resolve('es')),
    ensureAppLanguageInitialized: jest.fn(() => Promise.resolve('es')),
  };
});

// Silenciar solo el warning conocido de deprecación del renderer usado por RTL RN.
// No ocultar otros console.error reales.
const originalConsoleError = console.error;
console.error = (...args) => {
  const firstArg = args[0];
  if (
    typeof firstArg === 'string' &&
    firstArg.includes('react-test-renderer is deprecated')
  ) {
    return;
  }
  originalConsoleError(...args);
};

