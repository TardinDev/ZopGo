module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|native-base|react-native-svg|react-native-url-polyfill|@supabase/.*|zustand)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
