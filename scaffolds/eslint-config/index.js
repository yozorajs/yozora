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
    'import/prefer-default-export': 0,
  },
  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['@guanghechen/ts', 'plugin:jest/recommended', 'prettier'],
      rules: {
        'import/prefer-default-export': 0,
        '@typescript-eslint/array-type': [
          2,
          {
            default: 'array-simple',
            readonly: 'generic',
          },
        ],
      },
    },
  ],
}
