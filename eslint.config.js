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
      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      'import/no-named-as-default': 'off',
    },
  },
]
