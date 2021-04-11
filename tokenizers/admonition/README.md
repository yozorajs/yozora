<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/master/tokenizers/admonition#readme">@yozora/tokenizer-admonition</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-admonition">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/tokenizer-admonition.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-admonition">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/tokenizer-admonition.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-admonition">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/tokenizer-admonition.svg"
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
        src="https://img.shields.io/node/v/@yozora/tokenizer-admonition"
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

Tokenizer for processing admonitions.


## Install

* npm

  ```bash
  npm install --save @yozora/tokenizer-admonition
  ```

* yarn

  ```bash
  yarn add @yozora/tokenizer-admonition
  ```

## Usage

[@yozora/tokenizer-admonition][] is already built-in [@yozora/parser][].

* Use with [@yozora/parser]

  ```typescript
  import YozoraParser from '@yozora/parser'

  const parser = new YozoraParser({ shouldReservePosition: true })
  parser.parse(`
    :::keyword This is title, and could use *markdown inlines*
    This is the admonition's body, support full features of markdown.

    ## This is a heading
    :::
  `)
  ```

* Use with [@yozora/parser-gfm-ex]

  ```typescript {2,5}
  import GfmExParser from '@yozora/parser-gfm-ex'
  import AdmonitionTokenizer from '@yozora/tokenizer-admonition'

  const parser = new GfmExParser({ shouldReservePosition: true })
  parser.useTokenizer(new AdmonitionTokenizer())
  parser.parse(`
    :::keyword This is title, and could use *markdown inlines*
    This is the admonition's body, support full features of markdown.

    ## This is a heading
    :::
  `)
  ```

* Use with [@yozora/parser-gfm]

  ```typescript {2,5}
  import GfmParser from '@yozora/parser-gfm'
  import AdmonitionTokenizer from '@yozora/tokenizer-admonition'

  const parser = new GfmParser({ shouldReservePosition: true })
  parser.useTokenizer(new AdmonitionTokenizer())
  parser.parse(`
    :::keyword This is title, and could use *markdown inlines*
    This is the admonition's body, support full features of markdown.

    ## This is a heading
    :::
  `)
  ```

* Use from scratch

  ```typescript {2,8}
  import { DefaultYastParser } from '@yozora/core-parser'
  import AdmonitionTokenizer from '@yozora/tokenizer-admonition'

  const parser = new DefaultYastParser({ shouldReservePosition: true })
  parser
    .useBlockFallbackTokenizer(new ParagraphTokenizer())
    .useInlineFallbackTokenizer(new TextTokenizer())
    .useTokenizer(new AdmonitionTokenizer())
  parser.parse(`
    :::keyword This is title, and could use *markdown inlines*
    This is the admonition's body, support full features of markdown.

    ## This is a heading
    :::
  `)
  ```

### Syntax

````markdown
:::keyword This is title, and could use *markdown inlines*
This is the admonition's body, support full features of markdown.

## This is a heading

```
here is a fenced code block.
```

:::
````

### Node Type

```typescript
export interface Admonition extends YastParent<'admonition'> {
  type: 'admonition'
  /**
  * Keyword of an admonition.
  */
  keyword: 'note' | 'important' | 'tip' | 'caution' | 'warning' | string
  /**
  * Admonition title.
  */
  title: YastNode[]
  /**
   * Admonition body.
   */
  children: YastNode[]
}
```

### Output Example

* positions omitted:

  ```json
  {
    "type": "admonition",
    "keyword": "tip",
    "title": [
      {
        "type": "text",
        "value": "pro tip"
      }
    ],
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "value": "admonition is awesome!\n"
          }
        ]
      }
    ]
  }
  ```


## Related

* [@yozora/parser][]
* [@yozora/parser-gfm][]
* [@yozora/parser-gfm-ex][]
* [Admonition | Yozora AST][node-type]
* [Documentation][documentation]


[node-type]: http://yozora.guanghechen.com/docs/package/ast#admonition
[documentation]: https://yozora.guanghechen.com/docs/package/tokenizer-admonition

[@yozora/tokenizer-admonition]: https://github.com/guanghechen/yozora/tree/master/tokenizers/admonition#readme
[@yozora/parser]: https://github.com/guanghechen/yozora/tree/master/packages/parser#readme
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm-ex#readme
