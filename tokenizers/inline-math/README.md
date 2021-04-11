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

[@yozora/tokenizer-inline-math][] is already built-in [@yozora/parser][].

* Use with [@yozora/parser]

  ```typescript
  import YozoraParser from '@yozora/parser'

  const parser = new YozoraParser({ shouldReservePosition: true })
  parser.parse('`$x^2$`, `$y^2$`')
  ```

* Use with [@yozora/parser-gfm-ex]

  ```typescript {2,5}
  import GfmExParser from '@yozora/parser-gfm-ex'
  import InlineMathTokenizer from '@yozora/tokenizer-inline-math'

  const parser = new GfmExParser({ shouldReservePosition: true })
  parser.useTokenizer(new InlineMathTokenizer())
  parser.parse('`$x^2$`, `$y^2$`')
  ```

* Use with [@yozora/parser-gfm]

  ```typescript {2,5}
  import GfmParser from '@yozora/parser-gfm'
  import InlineMathTokenizer from '@yozora/tokenizer-inline-math'

  const parser = new GfmParser({ shouldReservePosition: true })
  parser.useTokenizer(new InlineMathTokenizer())
  parser.parse('`$x^2$`, `$y^2$`')
  ```

* Use from scratch

  ```typescript {2,8}
  import { DefaultYastParser } from '@yozora/core-parser'
  import InlineMathTokenizer from '@yozora/tokenizer-inline-math'

  const parser = new DefaultYastParser({ shouldReservePosition: true })
  parser
    .useBlockFallbackTokenizer(new ParagraphTokenizer())
    .useInlineFallbackTokenizer(new TextTokenizer())
    .useTokenizer(new InlineMathTokenizer())
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

* [@yozora/parser][]
* [@yozora/parser-gfm][]
* [@yozora/parser-gfm-ex][]
* [InlineMath | Yozora AST][node-type]
* [Documentation][documentation]


[node-type]: http://yozora.guanghechen.com/docs/package/ast#inlinemath
[documentation]: https://yozora.guanghechen.com/docs/package/tokenizer-math
[@yozora/tokenizer-inline-math]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-math#readme

[@yozora/parser]: https://github.com/guanghechen/yozora/tree/master/packages/parser#readme
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm-ex#readme
