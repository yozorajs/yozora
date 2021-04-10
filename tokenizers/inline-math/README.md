<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-math#readme">@yozora/tokenizer-inline-math</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-inline-math">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/tokenizer-inline-math.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-inline-math">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/tokenizer-inline-math.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-inline-math">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/tokenizer-inline-math.svg"
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
        src="https://img.shields.io/node/v/@yozora/tokenizer-inline-math"
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


Tokenizer for processing fenced inline math (formulas).

## Install

* npm

  ```bash
  npm install --save @yozora/tokenizer-inline-math
  ```

* yarn

  ```bash
  yarn add @yozora/tokenizer-inline-math
  ```

## Usage

* Use within [@yozora/parser-gfm][]

  ```typescript {2,5}
  import { createExGFMParser } from '@yozora/parser-gfm'
  import InlineMathTokenizer from '@yozora/tokenizer-inline-math'

  const parser = createExGFMParser({ shouldReservePosition: true })
  parser.useTokenizer(new InlineMathTokenizer({ priority: 10 }))
  parser.parse('`$x^2$`, `$y^2$`')
  ```

### Syntax

```markdown
`$x^2$`
`$y^2$`
```

### Node Type

```typescript
export interface InlineMath extends YastLiteral<'inlineMath'> {
  type: 'inlineMath'
  /**
   * Inline formula contents.
   */
  value: string
}
```

### Output Example

* positions omitted:

  ```json
  {
    "type": "inlineMath",
    "value": "x^2 + y^2 = z^2"
  }
  ```


## Related

* [InlineMath | Yozora AST][node-type]
* [Documentation][documentation]
* [@yozora/tokenizer-inline-math][]
* [@yozora/parser-gfm][]

## Related

[node-type]: http://yozora.guanghechen.com/docs/package/ast#math
[documentation]: https://yozora.guanghechen.com/docs/package/tokenizer-math
[@yozora/tokenizer-inline-math]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-math#readme
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
