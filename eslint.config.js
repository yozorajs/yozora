import ghcConfigs from '@guanghechen/eslint-config'

export default [
  {
    ignores: [
      '.vscode/',
      '**/__tmp__/',
      '**/__test__/cases/',
      '**/doc/',
      '**/example/',
      '**/resources/',
      'packages/character/src/constant/entity.ts',
    ],
  },
  ...ghcConfigs,
  {
    files: ['packages/ast/src/nodes/**/*.ts'],
    rules: {
      '@typescript-eslint/no-redeclare': 'off',
    },
  },
  {
    files: ['**/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'import/no-named-as-default': 'off',
      'space-in-parens': 'off',
    },
  },
]
