module.exports = {
  root: true,
  extends: ['@guanghechen', 'plugin:jest/recommended', 'prettier'],
  plugins: ['import'],
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    jest: true,
    node: true,
  },
  rules: {
    'jest/expect-expect': 0,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['@guanghechen/ts', 'plugin:jest/recommended', 'prettier'],
      rules: {
        'jest/expect-expect': 0,
      },
    },
  ],
}
