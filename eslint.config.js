import ghcConfigs from '@guanghechen/eslint-config'

export default [
  {
    ignores: [
      '.DS_Store',
      '**/*.hbs',
      '.vscode/',
      '**/.husky/',
      '**/.nx/',
      '**/.git/',
      '**/.yarn/',
      '**/__tmp__/',
      '**/__test__/cases/',
      '**/__test__/fixtures/',
      '**/coverage/',
      '**/dist/',
      '**/doc/',
      '**/example/',
      '**/lib/',
      '**/node_modules/',
      '**/resources/',
      '**/test/',
      'packages/character/src/constant/entity.ts',
    ],
  },
  ...ghcConfigs,
  {
    files: ['packages/ast/src/nodes/**/*.ts'],
    rules: {
      '@typescript-eslint/no-redeclare': 0,
    },
  },
]
