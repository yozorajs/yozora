<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.0/scaffolds/eslint-config#readme">@yozora/eslint-config</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/eslint-config">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/eslint-config.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/eslint-config">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/eslint-config.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/eslint-config">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/eslint-config.svg"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@yozora/eslint-config"
      />
    </a>
    <a href="https://github.com/eslint/eslint">
      <img
        alt="Eslint Version"
        src="https://img.shields.io/npm/dependency-version/@yozora/eslint-config/peer/eslint"
      />
    </a>
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code Style: prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br/>

Eslint configs for yozora tokenizers.

## Install

- npm

  ```bash
  npm install --save-dev @yozora/eslint-config
  ```

- yarn

  ```bash
  yarn add --dev @yozora/eslint-config
  ```

## Usage

- Basic Usage (`.eslintrc`):

  ```json
  {
    "root": true,
    "extends": ["@yozora"],
  }
  ```

- Use [@babel/eslint-parser][]:

  ```json
  {
    "root": true,
    "extends": ["@yozora"],
    "overrides": [
      {
        "files": ["**/*.js"],
        "parser": "@babel/eslint-parser",
        "parserOptions": {
          "ecmaVersion": 2018,
          "sourceType": "module",
          "requireConfigFile": false,
          "allowImportExportEverywhere": true
        }
      }
    ]
  }
  ```

## Related

- [homepage][]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.0/scaffolds/eslint-config#readme
[@babel/eslint-parser]: https://www.npmjs.com/package/@babel/eslint-parser
