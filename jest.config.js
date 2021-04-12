const { tsMonorepoConfig } = require('@guanghechen/jest-config')

module.exports = {
  ...tsMonorepoConfig(__dirname),
  coveragePathIgnorePatterns: [
    'packages/character/src/util/node-point.ts',
    'packages/parser/src/types.ts',
    'packages/parser-gfm/src/types.ts',
    'tokenizers/*/src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 80,
      lines: 60,
      statements: 60,
    },
  },
}
