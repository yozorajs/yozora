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
  {
    files: ['**/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unnecessary-type-arguments': 0,
      'import/no-named-as-default': 0,
    },
  },
  {
    files: ['**/__test__/**/*.spec.{js,cjs,mjs,ts,cts,mts}'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 0,
      'import/no-extraneous-dependencies': 0,
      'import/no-named-as-default': 0,
      'jest/expect-expect': 0,
    },
  },
]
