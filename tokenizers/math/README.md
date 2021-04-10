<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/master/tokenizers/math#readme">@yozora/tokenizer-math</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-math">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/tokenizer-math.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-math">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/tokenizer-math.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-math">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/tokenizer-math.svg"
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
        src="https://img.shields.io/node/v/@yozora/tokenizer-math"
      />
    </a>
    <a href="https://github.com/facebook/jest">
      <img
        alt="Tested with Jest"
        src="https://img.shields.io/badge/tested_with-jest-9c465e.svg"
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


Tokenizer for processing fenced math block.

## Install

* npm

  ```bash
  npm install --save @yozora/tokenizer-math
  ```

* yarn

  ```bash
  yarn add @yozora/tokenizer-math
  ```

## Usage

* Use within [@yozora/parser-gfm][]

  ```
  import MathTokenizer from '@yozora/tokenizer-math'
  import { createExGFM } from '@yozora/parser-gfm'

  const parser = createExGFM({ shouldReservePosition: true })
  parser.parse(`
    $$
    f(x)=\\left\\lbrace\\begin{aligned}
    &x^2, &x < 0\\\\
    &0, &x = 0\\\\
    &x^3, &x > 0
    \\end{aligned}\\right.
    $$
  `)
  ```

### Syntax

* multiple line math block
  ````markdown
  $$
    f(x)=\left\lbrace\begin{aligned}
    &x^2, &x < 0\\
    &0, &x = 0\\
    &x^3, &x > 0
    \end{aligned}\right.
  $$
  ````

* single line math block

  ```markdown
  $$ x^2 + y^2 = z^2
  ```

### Node Type

```typescript
export interface Math {
  type: 'math'
  value: string
}
```

### Output Example

```json
{
  "type": "math",
  "value": "$$x^2 + y^2 = z^2$$"
}
```

## Related

* [Math | Yozora AST][node-type]
* [Documentation][documentation]
* [@yozora/tokenizer-math][]
* [@yozora/parser-gfm][]

[node-type]: http://yozora.guanghechen.com/docs/package/ast#math
[documentation]: https://yozora.guanghechen.com/docs/package/tokenizer-math
[@yozora/tokenizer-math]: https://github.com/guanghechen/yozora/tree/master/tokenizers/math#readme
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
