module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      // Transform private class fields for Hermes compatibility
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
