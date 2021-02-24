// rules for *.js, *.jsx, *.ts, *.tsx
const jsRules = {
  'class-methods-use-this': 0,
  'func-call-spacing': ['error', 'never'],
  'func-names': 0,
  'key-spacing': ['error'],
  'lines-between-class-members': 0,
  'max-len': [
    'error',
    {
      code: 100,
      comments: 120,
      tabWidth: 2,
      ignorePattern: [
        /^\s*\*\s*@\w+/, // ignore '* @param ...'
        /^\s*\/\/\s*eslint-disable-next-line\s/, // ignore '// eslint-disable-next-line ...'
        /^\s*\/\//, // ignore line comment
      ]
        .map(r => '(?:' + r.source + ')')
        .join('|'),
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
    },
  ],
  'new-cap': ['error', { newIsCap: true, capIsNew: true }],
  'no-await-in-loop': 0,
  'no-bitwise': 0,
  'no-console': 0,
  'no-continue': 0,
  'no-cond-assign': ['error', 'always'],
  'no-inner-declarations': 'error',
  'no-mixed-operators': 0,
  'no-mixed-spaces-and-tabs': 'error',
  'no-multi-spaces': ['error', { ignoreEOLComments: true }],
  'no-param-reassign': ['error', { props: true }],
  'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
  'no-restricted-syntax': 0,
  'no-return-assign': ['error', 'always'],
  'no-throw-literal': 0,
  'no-underscore-dangle': 0,
  'prefer-destructuring': 0,
  quotes: ['error', 'single'],
  semi: ['error', 'never'],
  'space-before-blocks': [
    'error',
    {
      functions: 'always',
      keywords: 'always',
      classes: 'always',
    },
  ],
  'space-before-function-paren': 0,
  'spaced-comment': ['error', 'always'],
  'space-in-parens': ['error', 'never'],
  'space-infix-ops': ['error', { int32Hint: false }],
  'space-unary-ops': ['error', { words: true, nonwords: false }],
}

// rules for *.ts, *.tsx
const tsRules = {
  '@typescript-eslint/interface-name-prefix': 0,
  '@typescript-eslint/no-empty-function': 0,
  '@typescript-eslint/no-empty-interface': 0,
  '@typescript-eslint/no-explicit-any': 0,
  '@typescript-eslint/no-non-null-assertion': 0,
  '@typescript-eslint/no-redeclare': [
    'warn',
    {
      ignoreDeclarationMerge: true,
    },
  ],
  '@typescript-eslint/no-this-alias': [
    'error',
    {
      allowDestructuring: true, // Allow `const { props, state } = this`; false by default
      allowedNames: ['self'], // Allow `const self = this`; `[]` by default
    },
  ],
  '@typescript-eslint/space-before-function-paren': [
    'error',
    {
      named: 'never',
      anonymous: 'always',
      asyncArrow: 'always',
    },
  ],
}

module.exports = { jsRules, tsRules }
