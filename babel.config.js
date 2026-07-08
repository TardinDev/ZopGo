module.exports = function (api) {
  api.cache(true);

  const plugins = [];

  // react-native-worklets/plugin crashes Jest — only load it outside test env
  if (process.env.NODE_ENV !== 'test') {
    plugins.push('react-native-worklets/plugin');
  }

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // Web : des dépendances (zustand ESM, @base-org/account vendoré par
          // Clerk) contiennent `import.meta`, que Metro ne transforme pas —
          // le bundle web entier échoue au parsing (écran blanc). Ce polyfill
          // officiel remplace import.meta à la compilation. Web uniquement,
          // aucun impact sur les builds natifs Android/iOS.
          web: { unstable_transformImportMeta: true },
        },
      ],
      'nativewind/babel',
    ],
    plugins,
  };
};
