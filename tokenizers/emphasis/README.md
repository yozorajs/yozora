<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/emphasis#readme">@yozora/tokenizer-emphasis</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-emphasis">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/tokenizer-emphasis.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-emphasis">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/tokenizer-emphasis.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-emphasis">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/tokenizer-emphasis.svg"
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
        src="https://img.shields.io/node/v/@yozora/tokenizer-emphasis"
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

<!-- :end -->

[@yozora/tokenizer-emphasis] produce [Emphasis][node-type-emphasis] / [Strong][node-type-strong]
type nodes. See [documentation][docpage] for details.

<!-- :begin use tokenizer/usage -->

## Install

- npm

  ```bash
  npm install --save @yozora/tokenizer-emphasis
  ```

- yarn

  ```bash
  yarn add @yozora/tokenizer-emphasis
  ```

## Usage

[@yozora/tokenizer-emphasis][] has been integrated into [@yozora/parser][] /
[@yozora/parser-gfm-ex][] / [@yozora/parser-gfm][], so you can use `YozoraParser` / `GfmExParser` /
`GfmParser` directly.

### Basic Usage

[@yozora/tokenizer-emphasis][] cannot be used alone, it needs to be registered in _YastParser_ as a
plugin-in before it can be used.

```typescript {4,9}
import { DefaultParser } from '@yozora/core-parser'
import ParagraphTokenizer from '@yozora/tokenizer-paragraph'
import TextTokenizer from '@yozora/tokenizer-text'
import EmphasisTokenizer from '@yozora/tokenizer-emphasis'

const parser = new DefaultParser()
  .useFallbackTokenizer(new ParagraphTokenizer())
  .useFallbackTokenizer(new TextTokenizer())
  .useTokenizer(new EmphasisTokenizer())

// parse source markdown content
parser.parse(`

**foo bar**

__foo bar__

_foo bar_

*foo bar*

__**__foo__**__

`)
```

### Use within [@yozora/parser][]

```typescript
import YozoraParser from '@yozora/parser'

const parser = new YozoraParser()

// parse source markdown content
parser.parse(`

**foo bar**

__foo bar__

_foo bar_

*foo bar*

__**__foo__**__

`)
```

### Use with [@yozora/parser-gfm][]

```typescript
import GfmParser from '@yozora/parser-gfm'

const parser = new GfmParser()

// parse source markdown content
parser.parse(`

**foo bar**

__foo bar__

_foo bar_

*foo bar*

__**__foo__**__

`)
```

### Use within [@yozora/parser-gfm-ex][]

```typescript
import GfmExParser from '@yozora/parser-gfm-ex'

const parser = new GfmExParser()

// parse source markdown content
parser.parse(`

**foo bar**

__foo bar__

_foo bar_

*foo bar*

__**__foo__**__

`)
```

### Options

|    Name    |   Type   | Required |                Default                |
| :--------: | :------: | :------: | :-----------------------------------: |
|   `name`   | `string` | `false`  |    `"@yozora/tokenizer-emphasis"`     |
| `priority` | `number` | `false`  | `TokenizerPriority.CONTAINING_INLINE` |

- `name`: The unique name of the tokenizer, used to bind the token it generates, to determine the
  tokenizer that should be called in each life cycle of the token in the entire _matching / parsing_
  phase.

- `priority`: Priority of the tokenizer, determine the order of processing, high priority priority
  execution. interruptable. In addition, in the `match-block` stage, a high-priority tokenizer can
  interrupt the matching process of a low-priority tokenizer.

  **Exception:** Delimiters of type `full` are always processed before other type delimiters.

<!-- :end -->

## Related

- [@yozora/ast][]
- [@yozora/parser][]
- [@yozora/parser-gfm][]
- [@yozora/parser-gfm-ex][]
- [@yozora/react-emphasis][]
- [@yozora/react-strong][]
- [@yozora/react-markdown][]
- [Live Examples][live-examples]
- [Emphasis | Yozora AST][node-type-emphasis]
- [Strong | Yozora AST][node-type-strong]
- [Documentation][docpage]

[node-type-emphasis]: http://yozora.guanghechen.com/docs/package/ast#emphasis
[node-type-strong]: http://yozora.guanghechen.com/docs/package/ast#strong

<!-- :begin use tokenizer/definitions -->

[live-examples]: https://yozora.guanghechen.com/docs/package/tokenizer-emphasis#live-examples
[docpage]: https://yozora.guanghechen.com/docs/package/tokenizer-emphasis
[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/emphasis#readme
[gfm-spec]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast
[@yozora/ast]: https://github.com/yozorajs/yozora/tree/v2.3.4/packages/ast#readme
[@yozora/ast-util]: https://github.com/yozorajs/yozora/tree/v2.3.4/packages/ast-util#readme
[@yozora/character]: https://github.com/yozorajs/yozora/tree/v2.3.4/packages/character#readme
[@yozora/eslint-config]:
  https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/eslint-config#readme
[@yozora/core-parser]: https://github.com/yozorajs/yozora/tree/v2.3.4/packages/core-parser#readme
[@yozora/core-tokenizer]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/packages/core-tokenizer#readme
[@yozora/invariant]: https://github.com/yozorajs/yozora/tree/v2.3.4/packages/invariant#readme
[@yozora/jest-for-tokenizer]:
  https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/jest-for-tokenizer#readme
[@yozora/parser]: https://github.com/yozorajs/yozora/tree/v2.3.4/packages/parser#readme
[@yozora/parser-gfm]: https://github.com/yozorajs/yozora/tree/v2.3.4/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/packages/parser-gfm-ex#readme
[@yozora/template-tokenizer]:
  https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/template-tokenizer#readme
[@yozora/tokenizer-admonition]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/blockquote#readme
[@yozora/tokenizer-break]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/break#readme
[@yozora/tokenizer-definition]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/definition#readme
[@yozora/tokenizer-delete]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/delete#readme
[@yozora/tokenizer-ecma-import]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/ecma-import#readme
[@yozora/tokenizer-emphasis]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-block]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/fenced-block#readme
[@yozora/tokenizer-fenced-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/fenced-code#readme
[@yozora/tokenizer-footnote]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/footnote#readme
[@yozora/tokenizer-footnote-definition]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/footnote-definition#readme
[@yozora/tokenizer-footnote-reference]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/footnote-reference#readme
[@yozora/tokenizer-heading]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/heading#readme
[@yozora/tokenizer-html-block]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/html-inline#readme
[@yozora/tokenizer-image]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/image#readme
[@yozora/tokenizer-image-reference]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/inline-math#readme
[@yozora/tokenizer-link]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/link#readme
[@yozora/tokenizer-link-reference]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/link-reference#readme
[@yozora/tokenizer-list]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/list#readme
[@yozora/tokenizer-math]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/table#readme
[@yozora/tokenizer-text]: https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:
  https://github.com/yozorajs/yozora/tree/v2.3.4/tokenizers/thematic-break#readme
[@yozora/react-admonition]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/admonition#readme
[@yozora/react-blockquote]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/blockquote#readme
[@yozora/react-break]: https://github.com/yozorajs/yozora-react/tree/main/packages/break#readme
[@yozora/react-delete]: https://github.com/yozorajs/yozora-react/tree/main/packages/delete#readme
[@yozora/react-emphasis]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/emphasis#readme
[@yozora/react-code]: https://github.com/yozorajs/yozora-react/tree/main/packages/code#readme
[@yozora/react-code-live]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/code-live#readme
[@yozora/react-footnote-definitions]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/footnote-definitions#readme
[@yozora/react-footnote-reference]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/footnote-reference#readme
[@yozora/react-heading]: https://github.com/yozorajs/yozora-react/tree/main/packages/heading#readme
[@yozora/react-image]: https://github.com/yozorajs/yozora-react/tree/main/packages/image#readme
[@yozora/react-inline-code]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/inline-code#readme
[@yozora/react-inline-math]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/inline-math#readme
[@yozora/react-link]: https://github.com/yozorajs/yozora-react/tree/main/packages/link#readme
[@yozora/react-list]: https://github.com/yozorajs/yozora-react/tree/main/packages/list#readme
[@yozora/react-list-item]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/list-item#readme
[@yozora/react-markdown]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/markdown#readme
[@yozora/react-math]: https://github.com/yozorajs/yozora-react/tree/main/packages/math#readme
[@yozora/react-paragraph]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/paragraph#readme
[@yozora/react-strong]: https://github.com/yozorajs/yozora-react/tree/main/packages/strong#readme
[@yozora/react-table]: https://github.com/yozorajs/yozora-react/tree/main/packages/table#readme
[@yozora/react-text]: https://github.com/yozorajs/yozora-react/tree/main/packages/text#readme
[@yozora/react-thematic-break]:
  https://github.com/yozorajs/yozora-react/tree/main/packages/thematic-break#readme
[doc-live-examples/gfm]: https://yozora.guanghechen.com/docs/example/gfm
[doc-@yozora/ast]: https://yozora.guanghechen.com/docs/package/ast
[doc-@yozora/ast-util]: https://yozora.guanghechen.com/docs/package/ast-util
[doc-@yozora/core-parser]: https://yozora.guanghechen.com/docs/package/core-parser
[doc-@yozora/core-tokenizer]: https://yozora.guanghechen.com/docs/package/core-tokenizer
[doc-@yozora/parser]: https://yozora.guanghechen.com/docs/package/parser
[doc-@yozora/parser-gfm]: https://yozora.guanghechen.com/docs/package/parser-gfm
[doc-@yozora/parser-gfm-ex]: https://yozora.guanghechen.com/docs/package/parser-gfm-ex
[doc-@yozora/tokenizer-admonition]: https://yozora.guanghechen.com/docs/package/tokenizer-admonition
[doc-@yozora/tokenizer-autolink]: https://yozora.guanghechen.com/docs/package/tokenizer-autolink
[doc-@yozora/tokenizer-autolink-extension]:
  https://yozora.guanghechen.com/docs/package/tokenizer-autolink-extension
[doc-@yozora/tokenizer-blockquote]: https://yozora.guanghechen.com/docs/package/tokenizer-blockquote
[doc-@yozora/tokenizer-break]: https://yozora.guanghechen.com/docs/package/tokenizer-break
[doc-@yozora/tokenizer-delete]: https://yozora.guanghechen.com/docs/package/tokenizer-delete
[doc-@yozora/tokenizer-emphasis]: https://yozora.guanghechen.com/docs/package/tokenizer-emphasis
[doc-@yozora/tokenizer-fenced-code]:
  https://yozora.guanghechen.com/docs/package/tokenizer-fenced-code
[doc-@yozora/tokenizer-heading]: https://yozora.guanghechen.com/docs/package/tokenizer-heading
[doc-@yozora/tokenizer-html-block]: https://yozora.guanghechen.com/docs/package/tokenizer-html-block
[doc-@yozora/tokenizer-html-inline]:
  https://yozora.guanghechen.com/docs/package/tokenizer-html-inline
[doc-@yozora/tokenizer-image]: https://yozora.guanghechen.com/docs/package/tokenizer-image
[doc-@yozora/tokenizer-image-reference]:
  https://yozora.guanghechen.com/docs/package/tokenizer-image-reference
[doc-@yozora/tokenizer-indented-code]:
  https://yozora.guanghechen.com/docs/package/tokenizer-indented-code
[doc-@yozora/tokenizer-inline-code]:
  https://yozora.guanghechen.com/docs/package/tokenizer-inline-code
[doc-@yozora/tokenizer-inline-math]:
  https://yozora.guanghechen.com/docs/package/tokenizer-inline-math
[doc-@yozora/tokenizer-link]: https://yozora.guanghechen.com/docs/package/tokenizer-link
[doc-@yozora/tokenizer-definition]: https://yozora.guanghechen.com/docs/package/tokenizer-definition
[doc-@yozora/tokenizer-link-reference]:
  https://yozora.guanghechen.com/docs/package/tokenizer-link-reference
[doc-@yozora/tokenizer-list]: https://yozora.guanghechen.com/docs/package/tokenizer-list
[doc-@yozora/tokenizer-math]: https://yozora.guanghechen.com/docs/package/tokenizer-math
[doc-@yozora/tokenizer-paragraph]: https://yozora.guanghechen.com/docs/package/tokenizer-paragraph
[doc-@yozora/tokenizer-setext-heading]:
  https://yozora.guanghechen.com/docs/package/tokenizer-setext-heading
[doc-@yozora/tokenizer-table]: https://yozora.guanghechen.com/docs/package/tokenizer-table
[doc-@yozora/tokenizer-text]: https://yozora.guanghechen.com/docs/package/tokenizer-text
[doc-@yozora/tokenizer-thematic-break]:
  https://yozora.guanghechen.com/docs/package/tokenizer-thematic-break
[doc-@yozora/jest-for-tokenizer]: https://yozora.guanghechen.com/docs/package/jest-for-tokenizer
[doc-@yozora/parser-gfm]: https://yozora.guanghechen.com/docs/package/parser-gfm
[gfm-atx-heading]: https://github.github.com/gfm/#atx-heading
[gfm-autolink]: https://github.github.com/gfm/#autolinks
[gfm-autolink-extension]: https://github.github.com/gfm/#autolinks-extension-
[gfm-blockquote]: https://github.github.com/gfm/#block-quotes
[gfm-bullet-list]: https://github.github.com/gfm/#bullet-list
[gfm-delete]: https://github.github.com/gfm/#strikethrough-extension-
[gfm-emphasis]: https://github.github.com/gfm/#can-open-emphasis
[gfm-fenced-code]: https://github.github.com/gfm/#fenced-code-block
[gfm-hard-line-break]: https://github.github.com/gfm/#hard-line-break
[gfm-html-block]: https://github.github.com/gfm/#html-block
[gfm-html-inline]: https://github.github.com/gfm/#raw-html
[gfm-image]: https://github.github.com/gfm/#images
[gfm-image-reference]: https://github.github.com/gfm/#example-590
[gfm-indented-code]: https://github.github.com/gfm/#indented-code-block
[gfm-inline-code]: https://github.github.com/gfm/#code-span
[gfm-link]: https://github.github.com/gfm/#inline-link
[gfm-definition]: https://github.github.com/gfm/#link-reference-definition
[gfm-link-reference]: https://github.github.com/gfm/#reference-link
[gfm-list]: https://github.github.com/gfm/#lists
[gfm-list-item]: https://github.github.com/gfm/#list-items
[gfm-list-task-item]: https://github.github.com/gfm/#task-list-items-extension-
[gfm-paragraph]: https://github.github.com/gfm/#paragraph
[gfm-setext-heading]: https://github.github.com/gfm/#setext-heading
[gfm-soft-line-break]: https://github.github.com/gfm/#soft-line-breaks
[gfm-strong]: https://github.github.com/gfm/#can-open-strong-emphasis
[gfm-tab]: https://github.github.com/gfm/#tabs
[gfm-table]: https://github.github.com/gfm/#table
[gfm-text]: https://github.github.com/gfm/#soft-line-breaks
[gfm-thematic-break]: https://github.github.com/gfm/#thematic-break

<!-- :end -->
