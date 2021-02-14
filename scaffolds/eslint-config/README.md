[![npm version](https://img.shields.io/npm/v/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)
[![npm download](https://img.shields.io/npm/dm/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)
[![npm license](https://img.shields.io/npm/l/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)


# `@yozora/eslint-config`

## Install
  * yarn

    ```console
    yarn add --dev @yozora/eslint-config
    ```

  * npm

    ```console
    npm install --save-dev @yozora/eslint-config
    ```

## Usage

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

  See [@yozora/eslint-config documentation](https://yozora.guanghechen.com/docs/package/eslint-config)
