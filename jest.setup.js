// Mock @sentry/react-native
jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
  wrap: (component) => component,
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-network
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true })
  ),
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock expo-device
jest.mock('expo-device', () => ({
  isDevice: true,
  modelName: 'Test Device',
}));

// Mock react-native-url-polyfill
jest.mock('react-native-url-polyfill', () => ({}));
jest.mock('react-native-url-polyfill/auto', () => ({}));

// Mock global fetch
global.fetch = jest.fn();

// Mock __DEV__
if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = true;
}

// Mock supabase
jest.mock('./src/lib/supabase', () => {
  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn(),
  }));
  return {
    supabase: { from: mockFrom },
    setClerkTokenProvider: jest.fn(),
  };
});

// Mock supabaseProfile
jest.mock('./src/lib/supabaseProfile', () => ({
  fetchProfileByClerkId: jest.fn(),
  upsertProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

// Mock supabaseNotifications
jest.mock('./src/lib/supabaseNotifications', () => ({
  fetchNotificationPreferences: jest.fn(() =>
    Promise.resolve({ courses: true, trajets: true, hebergements: true, promotions: true })
  ),
  updateNotificationPreferences: jest.fn(),
  updatePushToken: jest.fn(),
}));
