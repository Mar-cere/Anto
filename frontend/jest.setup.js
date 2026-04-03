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
  StyleSheet: { create: (s) => s, flatten: (x) => x },
  Alert: { alert: jest.fn() },
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
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'iPhone',
  osName: 'iOS',
  osVersion: '15.0',
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

