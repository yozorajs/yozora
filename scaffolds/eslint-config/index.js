module.exports = {
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
    },
    {
      files: ['**/__test__/*.spec.ts'],
      extends: [
        '@guanghechen',
        '@guanghechen/ts',
        'plugin:jest/recommended',
        'prettier',
      ],
      rules: {
        'import/no-extraneous-dependencies': 0,
        'jest/expect-expect': 0,
      },
    },
    {
      files: ['**/__test__/*.spec.js'],
      extends: ['@guanghechen', 'plugin:jest/recommended', 'prettier'],
      rules: {
        'import/no-extraneous-dependencies': 0,
        'jest/expect-expect': 0,
      },
    },
  ],
}
