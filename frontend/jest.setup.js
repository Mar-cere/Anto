// Mock Platform primero, antes de cualquier import
jest.mock('react-native', () => ({
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

