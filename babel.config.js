module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // react-native-worklets/plugin crashes Jest — only load it outside test env
  if (process.env.NODE_ENV !== 'test') {
    plugins.push('react-native-worklets/plugin');
  }

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
