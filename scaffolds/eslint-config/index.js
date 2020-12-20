const customRules = require('./rule-custom')


module.exports = {
  root: true,
  plugins: ['import'],
  overrides: [
    {
      files: ['**/*{.ts,tsx}'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },

        // typescript-eslint specific options
        warnOnUnsupportedTypeScriptVersion: true,
      },
      plugins: ['@typescript-eslint'],
      rules: {
        ...customRules.tsRules,
      }
    },
  ],
  ignorePatterns: [
    '**/test/cases/**',
    '**/__test__/cases/**',
    '**/node_modules/**',
    '**/lib/**',
    '**/dist/**',
    '**/build/**',
    '**/target/**',
    '**/vendor/**',
    '**/release/**',
    '**/example/**',
    '**/demo/**',
    '**/doc/**',
    '**/tmp/**',
    '**/__tmp__/**',
    '**/script/**',
    '**/coverage/**',
    '**/*.styl.d.ts',
    '*.tsbuildinfo',
    '.eslintrc.js',
    'rollup.config.js',
  ],
  rules: {
    ...customRules.jsRules,
  }
}
