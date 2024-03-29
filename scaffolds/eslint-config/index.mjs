export default {
  root: true,
  extends: ['@guanghechen', 'prettier'],
  plugins: ['import'],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['@guanghechen', '@guanghechen/ts', 'prettier'],
      rules: {
        '@typescript-eslint/no-unnecessary-type-arguments': 0,
        'import/no-named-as-default': 0,
      },
    },
    {
      files: ['**/__test__/*.spec.ts'],
      extends: ['@guanghechen', '@guanghechen/ts', 'plugin:jest/recommended', 'prettier'],
      rules: {
        '@typescript-eslint/consistent-type-assertions': 0,
        'import/no-extraneous-dependencies': 0,
        'import/no-named-as-default': 0,
        'jest/expect-expect': 0,
      },
    },
    {
      files: ['**/__test__/*.spec.js'],
      extends: ['@guanghechen', 'plugin:jest/recommended', 'prettier'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 0,
        'import/no-extraneous-dependencies': 0,
        'import/no-named-as-default': 0,
        'jest/expect-expect': 0,
      },
    },
  ],
}
