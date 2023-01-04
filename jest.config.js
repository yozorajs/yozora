const { tsMonorepoConfig } = require('@guanghechen/jest-config')
const path = require('path')

const baseConfig = tsMonorepoConfig(__dirname, {
  useESM: true,
})

module.exports = {
  ...baseConfig,
  coveragePathIgnorePatterns: [
    'packages/character/src/util/node-point.ts',
    'packages/parser/src/types.ts',
    'packages/parser-gfm/src/types.ts',
    /tokenizers[/\\][^/]*[/\\]src[/\\]index\.ts/.source,
  ],
  coverageProvider: 'babel',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 75,
      lines: 60,
      statements: 60,
    },
  },
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    chalk: require.resolve('chalk'),
    '#ansi-styles': path.join(
      require.resolve('chalk').split('chalk')[0],
      'chalk/source/vendor/ansi-styles/index.js',
    ),
    '#supports-color': path.join(
      require.resolve('chalk').split('chalk')[0],
      'chalk/source/vendor/supports-color/index.js',
    ),
  },
}
