module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        jsxImportSource: 'nativewind',
        // Ensure class properties are transformed for Hermes
        targets: {
          android: 'JSC'
        },
      }],
    ],
    plugins: [
      // Transform private class fields BEFORE other transforms
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      ['module-resolver', {
        root: ['.'],
        alias: { '@': '.' },
      }],
      // MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
