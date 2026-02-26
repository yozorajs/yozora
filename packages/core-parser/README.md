<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.13/packages/core-parser#readme">@yozora/core-parser</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/core-parser">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/core-parser.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-parser">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/core-parser.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-parser">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/core-parser.svg"
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
        src="https://img.shields.io/node/v/@yozora/core-parser"
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

- npm

  ```bash
  npm install --save @yozora/core-parser
  ```


## Usage

[@yozora/core-parser][] provide a DefaultParser, which without any built-in tokenizers.

```typescript
import { DefaultParser } from '@yozora/parser-gfm-ex'
import ParagraphTokenizer from '@yozora/tokenizer-paragraph'
import IndentedTokenizer from '@yozora/tokenizer-indented-code'
import InlineCodeTokenizer from '@yozora/tokenizer-inline-code'
import InlineMathTokenizer from '@yozora/tokenizer-inline-math'
import TextTokenizer from '@yozora/tokenizer-text'

const parser = new DefaultParser()
parser
  .useFallbackTokenizer(new ParagraphTokenizer())
  .useFallbackTokenizer(new TextTokenizer())
  .useTokenizer(new IndentedCodeTokenizer())
  .useTokenizer(new InlineMathTokenizer({ backtickRequired: false }))
  .useTokenizer(new InlineCodeTokenizer())

parser.parse(
  'source markdown content',  // markdown source contents, `string|Iterable<string>`
  {},                         // ParseOptions, optional.
)

parser.parse(['source', 'contents'])

/**
 * String stream is supported through the iterator API.
 */
function* source () {
  yield 'hello',
  yield 'world',
}
parser.parse(source())
```

### Options

- Constructor Options

  | Name                      | Type                      | Required | Description                                             |
  | :------------------------ | :------------------------ | :------- | :------------------------------------------------------ |
  | `blockFallbackTokenizer`  | `BlockFallbackTokenizer`  | `false`  | Fallback tokenizer on processing block structure phase  |
  | `inlineFallbackTokenizer` | `InlineFallbackTokenizer` | `false`  | Fallback tokenizer on processing inline structure phase |
  | `defaultParseOptions`     | `ParseOptions`            | `false`  | Default options for `parse()`                           |

- Parse Options

  | Name                        | Type                                     | Required | Description                                                          |
  | :-------------------------- | :--------------------------------------- | :------- | :------------------------------------------------------------------- |
  | `shouldReservePosition`     | `boolean`                                | `false`  | Whether it is necessary to reserve the position in the Node produced |
  | `presetDefinitions`         | `Array<Omit<Definition, 'type'>`         | `false`  | Preset definitions                                                   |
  | `presetFootnoteDefinitions` | `Array<Omit<FootnoteDefinition, 'type'>` | `false`  | Preset footnote definitions                                          |

## Related

- [@yozora/ast][]
- [@yozora/parser][]
- [@yozora/parser-gfm][]
- [Github Flavor Markdown Spec][gfm-spec]
- [Mdast][mdast-homepage]

[docpage]: https://yozora.guanghechen.com/docs/package/core-parser
[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.13/packages/core-parser#readme

<!-- yozora package link definitions -->

[@yozora/ast]: https://github.com/yozorajs/yozora/tree/v2.3.13/packages/ast#readme
[@yozora/core-parser]: https://github.com/yozorajs/yozora/tree/v2.3.13/packages/core-parser#readme
[@yozora/parser]: https://github.com/yozorajs/yozora/tree/v2.3.13/packages/parser#readme
[@yozora/parser-gfm]: https://github.com/yozorajs/yozora/tree/v2.3.13/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/packages/parser-gfm-ex#readme
[@yozora/tokenizer-admonition]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/blockquote#readme
[@yozora/tokenizer-break]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/break#readme
[@yozora/tokenizer-definition]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/definition#readme
[@yozora/tokenizer-delete]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/delete#readme
[@yozora/tokenizer-emphasis]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/fenced-code#readme
[@yozora/tokenizer-heading]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/heading#readme
[@yozora/tokenizer-html-block]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/html-inline#readme
[@yozora/tokenizer-image]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/image#readme
[@yozora/tokenizer-image-reference]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/inline-math#readme
[@yozora/tokenizer-link]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/link#readme
[@yozora/tokenizer-link-reference]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/link-reference#readme
[@yozora/tokenizer-list]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/list#readme
[@yozora/tokenizer-math]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/table#readme
[@yozora/tokenizer-text]: https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:
  https://github.com/yozorajs/yozora/tree/v2.3.13/tokenizers/thematic-break#readme

<!-- gfm link definitions -->

[gfm-spec]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast
[GFM Autolinks]: https://github.github.com/gfm/#autolinks
[GFM Autolinks (extension)]: https://github.github.com/gfm/#autolinks-extension-
[GFM blockquotes]: https://github.github.com/gfm/#block-quotes
[GFM hard line breaks]: https://github.github.com/gfm/#hard-line-breaks
[GFM soft line breaks]: https://github.github.com/gfm/#soft-line-breaks
[GFM link reference definitions]: https://github.github.com/gfm/#link-reference-definitions
[GFM strikethrough (extension)]: https://github.github.com/gfm/#strikethrough-extension-
[GFM emphasis and strong emphasis]: https://github.github.com/gfm/#emphasis-and-strong-emphasis
[GFM fenced code blocks]: https://github.github.com/gfm/#fenced-code-blocks
[GFM ATX headings]: https://github.github.com/gfm/#atx-headings
[GFM HTML blocks]: https://github.github.com/gfm/#html-blocks
[GFM raw HTML]: https://github.github.com/gfm/#raw-html
[GFM images]: https://github.github.com/gfm/#images
[GFM reference images]: https://github.github.com/gfm/#example-590
[GFM indented code blocks]: https://github.github.com/gfm/#indented-code-blocks
[GFM code spans]: https://github.github.com/gfm/#code-spans
[GFM links]: https://github.github.com/gfm/#links
[GFM reference links]: https://github.github.com/gfm/#reference-link
[GFM lists]: https://github.github.com/gfm/#lists
[GFM list items]: https://github.github.com/gfm/#list-items
[GFM task list items]: https://github.github.com/gfm/#task-list-items-extension-
[GFM paragraphs]: https://github.github.com/gfm/#paragraphs
[GFM setext headings]: https://github.github.com/gfm/#setext-headings
[GFM tables]: https://github.github.com/gfm/#tables-extension-
[GFM textual contents]: https://github.github.com/gfm/#textual-content
[GFM thematic breaks]: https://github.github.com/gfm/#thematic-breaks
