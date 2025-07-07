module.exports = function (api) {
  api.cache(true);
<<<<<<< HEAD
  const plugins = [];
=======
  let plugins = [];
>>>>>>> 5115cf2 (Initial commit)

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
