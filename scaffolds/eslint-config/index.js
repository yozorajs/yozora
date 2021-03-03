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
  rules: {},
  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['@guanghechen/ts', 'plugin:jest/recommended', 'prettier'],
      rules: {},
    },
  ],
}
