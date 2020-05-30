[![npm version](https://img.shields.io/npm/v/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)
[![npm download](https://img.shields.io/npm/dm/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)
[![npm license](https://img.shields.io/npm/l/@yozora/eslint-config.svg)](https://www.npmjs.com/package/@yozora/eslint-config)


# Usage

  * Install
    ```shell
    yarn add --dev @yozora/eslint-config
    ```

  * Use in .eslint.rc
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
