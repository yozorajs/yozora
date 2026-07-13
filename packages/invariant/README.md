<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.17/packages/invariant#readme">@yozora/invariant</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/invariant">
      <img
        alt="npm version"
        src="https://img.shields.io/npm/v/@yozora/invariant.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/invariant">
      <img
        alt="npm downloads"
        src="https://img.shields.io/npm/dm/@yozora/invariant.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/invariant">
      <img
        alt="npm license"
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
    <a href="https://github.com/vitest-dev/vitest">
      <img
        alt="Tested with Vitest"
        src="https://img.shields.io/badge/tested_with-vitest-6E9F18.svg"
      />
    </a>
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code style: Prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br />


<!-- :end -->

An assertion function that throws when `condition` is false. `message` can be a string or a lazy
callback.

## Install

```bash
npm install --save @yozora/invariant
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
  ```

## Related

- [homepage][]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.17/packages/invariant#readme
