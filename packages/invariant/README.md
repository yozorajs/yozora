<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.2/packages/invariant#readme">@yozora/invariant</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/invariant">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/invariant.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/invariant">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/invariant.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/invariant">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/invariant.svg"
      />
    </a>
    <a href="#install">
      <img
        alt="Module formats: cjs, esm"
        src="https://img.shields.io/badge/module_formats-cjs%2C%20esm-green.svg"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@yozora/invariant"
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

An invariant function, which takes a `condition` and a optional `message` value, and throw an error
when the given condition fails.

## Install

- npm

  ```bash
  npm install --save @yozora/invariant
  ```

- yarn

  ```bash
  yarn add @yozora/invariant
  ```

## Usage

- Syntax

  ```typescript
  function invariant(
    condition: boolean,
    message?: string | (() => string),
  ): asserts condition
  ```

- Demo

  ```typescript
  import invariant from '@yozora/invariant'

  invariant(typeof window !== 'undefined', '`window` is not defined.')
  invariant(typeof window !== 'undefined', () => '`window` is not defined:' + window)
  ```

## Related

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.2/packages/invariant#readme
[tiny-invariant]: https://github.com/alexreardon/tiny-invariant
