import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import { importX } from 'eslint-plugin-import-x'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const tsconfigPath = './tsconfig.test.json'

export default [
  {
    ignores: [
      '.vscode/',
      '**/__tmp__/',
      '**/__test__/cases/',
      '**/coverage/',
      '**/doc/',
      '**/example/',
      '**/lib/',
      '**/node_modules/',
      '**/resources/',
      'packages/character/src/constant/entity.ts',
    ],
  },
  eslint.configs.recommended,
  importX.flatConfigs.recommended,
  {
    files: ['**/*.{mjs,ts}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: tsconfigPath,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
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
      'import-x/no-named-as-default': 'off',
      'space-in-parens': 'off',
    },
  },
  {
    rules: {
      'import-x/named': 'off',
      'import-x/no-unresolved': 'off',
    },
  },
  {
    files: ['packages/ast/src/nodes/**/*.ts'],
    rules: {
      '@typescript-eslint/no-redeclare': 'off',
    },
  },
  {
    files: ['**/__test__/**/*.ts', 'vitest.helper.mts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import-x/no-extraneous-dependencies': 'off',
      'no-plusplus': 'off',
      'no-template-curly-in-string': 'off',
    },
  },
  eslintConfigPrettier,
]
