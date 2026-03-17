module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-url-polyfill|@supabase/.*|zustand)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
