const customRules = require('./rule-custom')

module.exports = {
  root: true,
  env: { browser: true, commonjs: true, es6: true, jest: true, node: true },
  globals: { Atomics: 'readonly', SharedArrayBuffer: 'readonly' },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['import', 'prettier'],
  rules: { ...customRules.jsRules },
  overrides: [
    {
      files: ['**/*.ts', '**/*tsx'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'prettier',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: './tsconfig.json',

        // typescript-eslint specific options
        warnOnUnsupportedTypeScriptVersion: true,
        allowImportExportEverywhere: true,
      },
      plugins: ['import', 'prettier', '@typescript-eslint'],
      rules: { ...customRules.jsRules, ...customRules.tsRules },
    },
  ],
}
