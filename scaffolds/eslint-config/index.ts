export = {
  'extends': [
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint'
  ],
  'parser': '@typescript-eslint/parser',
  'plugins': [
    '@typescript-eslint',
    'prettier'
  ],
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.ts']
      }
    }
  },
  'ignorePatterns': [
    'lib/',
    'dist/',
    'build/',
    'bundle/',
    'target/',
    'release/',
    'node_modules/',
    '*.tsbuildinfo',
  ],
  'rules': {
    'class-methods-use-this': 0,
    'func-names': 0,
    'import/prefer-default-export': 0,
    'import/no-unresolved': 0,
    'lines-between-class-members': 0,
    'no-await-in-loop': 0,
    'no-bitwise': 0,
    'no-console': 0,
    'no-continue': 0,
    'no-cond-assign': 0,
    'no-inner-declarations': 0,
    'no-param-reassign': ['error', { 'props': true  }],
    'no-plusplus': 0,
    'no-restricted-syntax': 0,
    'no-return-assign': 0,
    'no-throw-literal': 0,
    'no-underscore-dangle': 0,
    'prefer-destructuring': 0,
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    '@typescript-eslint/explicit-function-return-type': 0,
    "@typescript-eslint/interface-name-prefix": 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-empty-interface': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-this-alias': 0,
    '@typescript-eslint/no-use-before-define': 0
  }
}
