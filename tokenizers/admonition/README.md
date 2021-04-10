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

* Use within [@yozora/parser-gfm][]

```
import AdmonitionTokenizer from '@yozora/tokenizer-admonition'
import { createExGFM } from '@yozora/parser-gfm'

const parser = createExGFM({ shouldReservePosition: true })
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
export interface Admonition extends YastParent<AdmonitionType> {
  /**
  * Keyword of an admonition.
  */
  keyword: 'note' | 'important' | 'tip' | 'caution' | 'warning' | string
  /**
  * Admonition title.
  */
  title: YastNode[]
}
```

### Output Example

* A tip admonition (positions omitted):

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

* [Yozora AST][node-type]
* [Documentation][documentation]
* [@yozora/tokenizer-admonition][]
* [@yozora/parser-gfm][]

[node-type]: http://yozora.guanghechen.com/docs/package/ast#admonition
[documentation]: https://yozora.guanghechen.com/docs/package/tokenizer-admonition
[@yozora/tokenizer-admonition]: https://github.com/guanghechen/yozora/tree/master/tokenizers/admonition#readme
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
