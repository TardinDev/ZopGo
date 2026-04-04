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

// Mock @react-native-community/datetimepicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

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

// Mock supabaseTrajets
jest.mock('./src/lib/supabaseTrajets', () => ({
  fetchTrajets: jest.fn(() => Promise.resolve([])),
  insertTrajet: jest.fn(() => Promise.resolve(null)),
  deleteTrajet: jest.fn(() => Promise.resolve(true)),
  markTrajetEffectue: jest.fn(() => Promise.resolve(true)),
  fetchAllAvailableTrajets: jest.fn(() => Promise.resolve([])),
}));

// Mock supabaseAvatar
jest.mock('./src/lib/supabaseAvatar', () => ({
  uploadAvatar: jest.fn(() => Promise.resolve(null)),
  deleteAvatar: jest.fn(() => Promise.resolve(true)),
  generateAvatarPlaceholder: jest.fn((name, userId) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563EB&color=fff&size=200&bold=true`),
}));

// Mock supabaseHebergements
jest.mock('./src/lib/supabaseHebergements', () => ({
  fetchHebergements: jest.fn(() => Promise.resolve([])),
  insertHebergement: jest.fn(() => Promise.resolve(null)),
  deleteHebergement: jest.fn(() => Promise.resolve(true)),
  toggleHebergementStatus: jest.fn(() => Promise.resolve(true)),
  fetchAllAvailableHebergements: jest.fn(() => Promise.resolve([])),
}));

// Mock supabaseHebergementImages
jest.mock('./src/lib/supabaseHebergementImages', () => ({
  uploadHebergementImage: jest.fn(() => Promise.resolve(null)),
  deleteHebergementImage: jest.fn(() => Promise.resolve(true)),
  updateHebergementImages: jest.fn(() => Promise.resolve(true)),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ canceled: true, assets: [] })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
}));
