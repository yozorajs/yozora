[![npm version](https://img.shields.io/npm/v/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)
[![npm download](https://img.shields.io/npm/dm/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)
[![npm license](https://img.shields.io/npm/l/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)
[![Node Version](https://img.shields.io/node/v/@yozora/eslint-config)](https://github.com/nodejs/node)
[![Tested With Jest](https://img.shields.io/badge/tested_with-jest-9c465e.svg)](https://github.com/facebook/jest)
[![Code Style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![eslint version](https://img.shields.io/npm/dependency-version/@guanghechen/eslint-config/peer/eslint)](https://github.com/eslint/eslint)


# `@yozora/eslint-config`


# Usage

  * Use in .eslintrc.js
    ```javascript
    module.exports = {
      root: true,
      extends: [
        '@yozora/eslint-config'
      ],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      },
      rules: {
      }
    }
    ```

See [@yozora/eslint-config documentation](https://yozora.guanghechen.com/docs/package/eslint-config) for details.
