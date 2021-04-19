<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm-ex#readme">@yozora/parser-gfm-ex</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/parser-gfm-ex">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/parser-gfm-ex.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/parser-gfm-ex">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/parser-gfm-ex.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/parser-gfm-ex">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/parser-gfm-ex.svg"
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
        src="https://img.shields.io/node/v/@yozora/parser-gfm-ex"
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

A markdown parser with built-in tokenizers to fully support GFM and GFM extensions.

See [@yozora/parser-gfm-ex documentation][dcopage] for details.

<!-- :begin use parser/usage -->

## Install

* npm

  ```bash
  npm install --save @yozora/parser-gfm-ex
  ```

* yarn

  ```bash
  yarn add @yozora/parser-gfm-ex
  ```


## Usage

```typescript
import GfmExParser from '@yozora/parser-gfm-ex'

const parser = new GfmExParser()
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

* Constructor Options

  Name                      | Type                      | Required  | Description
  :-------------------------|:--------------------------|:----------|:------------
  `blockFallbackTokenizer`  | `BlockFallbackTokenizer`  | `false`   | Fallback tokenizer on processing block structure phase
  `inlineFallbackTokenizer` | `InlineFallbackTokenizer` | `false`   | Fallback tokenizer on processing inline structure phase
  `defaultParseOptions`     | `ParseOptions`            | `false`   | Default options for `parse()`

* Parse Options

  Name                        | Type                                      | Required  | Description
  :---------------------------|:------------------------------------------|:----------|:------------
  `shouldReservePosition`     | `boolean`                                 | `false`   | Whether it is necessary to reserve the position in the YastNode produced
  `presetDefinitions`         | `Array<Omit<Definition, 'type'>`          | `false`   | Preset definitions
  `presetFootnoteDefinitions` | `Array<Omit<FootnoteDefinition, 'type'>`  | `false`   | Preset footnote definitions

<!-- :end -->

## Overview

* Built-in tokenizers

  Tokenizer                                 | Description
  :-----------------------------------------|:----------------------------------------------------
  [@yozora/tokenizer-autolink][]            | Resolve [GFM Autolinks][]
  [@yozora/tokenizer-autolink-extension][]  | Resolve [GFM Autolinks (extension)][]
  [@yozora/tokenizer-blockquote][]          | Resolve [GFM blockquotes][]
  [@yozora/tokenizer-break][]               | Resolve [GFM hard line breaks][] and [GFM soft line breaks][]
  [@yozora/tokenizer-definition][]          | Resolve [GFM link reference definitions][]
  [@yozora/tokenizer-delete][]              | Resolve [GFM strikethrough (extension)][]
  [@yozora/tokenizer-emphasis][]            | Resolve [GFM emphasis and strong emphasis][]
  [@yozora/tokenizer-fenced-code][]         | Resolve [GFM fenced code blocks][]
  [@yozora/tokenizer-heading][]             | Resolve [GFM ATX headings][]
  [@yozora/tokenizer-html-block][]          | Resolve [GFM HTML blocks][]
  [@yozora/tokenizer-html-inline][]         | Resolve [GFM raw HTML][]
  [@yozora/tokenizer-image][]               | Resolve [GFM images][]
  [@yozora/tokenizer-image-reference][]     | Resolve [GFM reference images][]
  [@yozora/tokenizer-indented-code][]       | Resolve [GFM indented code blocks][]
  [@yozora/tokenizer-inline-code][]         | Resolve [GFM code spans][]
  [@yozora/tokenizer-link][]                | Resolve [GFM links][]
  [@yozora/tokenizer-link-reference][]      | Resolve [GFM reference links][]
  [@yozora/tokenizer-list][]                | Resolve [GFM lists][]
  [@yozora/tokenizer-list-item][]           | Resolve [GFM list items][] and [GFM task list items][]
  [@yozora/tokenizer-paragraph][]           | Resolve [GFM paragraphs][]
  [@yozora/tokenizer-setext-heading][]      | Resolve [GFM setext headings][]
  [@yozora/tokenizer-table][]               | Resolve [GFM tables][]
  [@yozora/tokenizer-text][]                | Resolve [GFM textual contents][]
  [@yozora/tokenizer-thematic-break][]      | Resolve [GFM thematic breaks][]


## Related

* [@yozora/ast][]
* [@yozora/core-parser][]
* [@yozora/parser][]
* [@yozora/parser-gfm][]
* [Github Flavor Markdown Spec][gfm-homepage]
* [Mdast][mdast-homepage]

<!-- :begin use tokenizer/definitions -->

[live-examples]: https://yozora.guanghechen.com/docs/package/parser-gfm-ex#live-examples
[docpage]: https://yozora.guanghechen.com/docs/package/parser-gfm-ex
[homepage]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm-ex#readme
[gfm-homepage]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast

[@yozora/ast]:                                https://github.com/guanghechen/yozora/tree/master/packages/ast#readme
[@yozora/core-parser]:                        https://github.com/guanghechen/yozora/tree/master/packages/core-parser#readme
[@yozora/parser]:                             https://github.com/guanghechen/yozora/tree/master/packages/parser#readme
[@yozora/parser-gfm]:                         https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]:                      https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm-ex#readme
[@yozora/tokenizer-admonition]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]:                 https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]:       https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/blockquote#readme
[@yozora/tokenizer-break]:                    https://github.com/guanghechen/yozora/tree/master/tokenizers/break#readme
[@yozora/tokenizer-definition]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/definition#readme
[@yozora/tokenizer-delete]:                   https://github.com/guanghechen/yozora/tree/master/tokenizers/delete#readme
[@yozora/tokenizer-emphasis]:                 https://github.com/guanghechen/yozora/tree/master/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-block]:             https://github.com/guanghechen/yozora/tree/master/tokenizers/fenced-block#readme
[@yozora/tokenizer-fenced-code]:              https://github.com/guanghechen/yozora/tree/master/tokenizers/fenced-code#readme
[@yozora/tokenizer-footnote]:                 https://github.com/guanghechen/yozora/tree/master/tokenizers/footnote#readme
[@yozora/tokenizer-footnote-definition]:      https://github.com/guanghechen/yozora/tree/master/tokenizers/footnote-definition#readme
[@yozora/tokenizer-footnote-reference]:       https://github.com/guanghechen/yozora/tree/master/tokenizers/footnote-reference#readme
[@yozora/tokenizer-heading]:                  https://github.com/guanghechen/yozora/tree/master/tokenizers/heading#readme
[@yozora/tokenizer-html-block]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]:              https://github.com/guanghechen/yozora/tree/master/tokenizers/html-inline#readme
[@yozora/tokenizer-image]:                    https://github.com/guanghechen/yozora/tree/master/tokenizers/image#readme
[@yozora/tokenizer-image-reference]:          https://github.com/guanghechen/yozora/tree/master/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]:            https://github.com/guanghechen/yozora/tree/master/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]:              https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]:              https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-math#readme
[@yozora/tokenizer-link]:                     https://github.com/guanghechen/yozora/tree/master/tokenizers/link#readme
[@yozora/tokenizer-link-reference]:           https://github.com/guanghechen/yozora/tree/master/tokenizers/link-reference#readme
[@yozora/tokenizer-list]:                     https://github.com/guanghechen/yozora/tree/master/tokenizers/list#readme
[@yozora/tokenizer-list-item]:                https://github.com/guanghechen/yozora/tree/master/tokenizers/list-item#readme
[@yozora/tokenizer-math]:                     https://github.com/guanghechen/yozora/tree/master/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:                https://github.com/guanghechen/yozora/tree/master/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:           https://github.com/guanghechen/yozora/tree/master/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]:                    https://github.com/guanghechen/yozora/tree/master/tokenizers/table#readme
[@yozora/tokenizer-text]:                     https://github.com/guanghechen/yozora/tree/master/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:           https://github.com/guanghechen/yozora/tree/master/tokenizers/thematic-break#readme

[doc-live-examples/gfm]:                      https://yozora.guanghechen.com/docs/example/gfm
[doc-@yozora/ast]:                            https://yozora.guanghechen.com/docs/package/ast
[doc-@yozora/ast-util]:                       https://yozora.guanghechen.com/docs/package/ast-util
[doc-@yozora/core-parser]:                    https://yozora.guanghechen.com/docs/package/core-parser
[doc-@yozora/core-tokenizer]:                 https://yozora.guanghechen.com/docs/package/core-tokenizer
[doc-@yozora/parser]:                         https://yozora.guanghechen.com/docs/package/parser
[doc-@yozora/parser-gfm]:                     https://yozora.guanghechen.com/docs/package/parser-gfm
[doc-@yozora/parser-gfm-ex]:                  https://yozora.guanghechen.com/docs/package/parser-gfm-ex
[doc-@yozora/tokenizer-admonition]:           https://yozora.guanghechen.com/docs/package/tokenizer-admonition
[doc-@yozora/tokenizer-autolink]:             https://yozora.guanghechen.com/docs/package/tokenizer-autolink
[doc-@yozora/tokenizer-autolink-extension]:   https://yozora.guanghechen.com/docs/package/tokenizer-autolink-extension
[doc-@yozora/tokenizer-blockquote]:           https://yozora.guanghechen.com/docs/package/tokenizer-blockquote
[doc-@yozora/tokenizer-break]:                https://yozora.guanghechen.com/docs/package/tokenizer-break
[doc-@yozora/tokenizer-delete]:               https://yozora.guanghechen.com/docs/package/tokenizer-delete
[doc-@yozora/tokenizer-emphasis]:             https://yozora.guanghechen.com/docs/package/tokenizer-emphasis
[doc-@yozora/tokenizer-fenced-code]:          https://yozora.guanghechen.com/docs/package/tokenizer-fenced-code
[doc-@yozora/tokenizer-heading]:              https://yozora.guanghechen.com/docs/package/tokenizer-heading
[doc-@yozora/tokenizer-html-block]:           https://yozora.guanghechen.com/docs/package/tokenizer-html-block
[doc-@yozora/tokenizer-html-inline]:          https://yozora.guanghechen.com/docs/package/tokenizer-html-inline
[doc-@yozora/tokenizer-image]:                https://yozora.guanghechen.com/docs/package/tokenizer-image
[doc-@yozora/tokenizer-image-reference]:      https://yozora.guanghechen.com/docs/package/tokenizer-image-reference
[doc-@yozora/tokenizer-indented-code]:        https://yozora.guanghechen.com/docs/package/tokenizer-indented-code
[doc-@yozora/tokenizer-inline-code]:          https://yozora.guanghechen.com/docs/package/tokenizer-inline-code
[doc-@yozora/tokenizer-inline-math]:          https://yozora.guanghechen.com/docs/package/tokenizer-inline-math
[doc-@yozora/tokenizer-link]:                 https://yozora.guanghechen.com/docs/package/tokenizer-link
[doc-@yozora/tokenizer-definition]:           https://yozora.guanghechen.com/docs/package/tokenizer-definition
[doc-@yozora/tokenizer-link-reference]:       https://yozora.guanghechen.com/docs/package/tokenizer-link-reference
[doc-@yozora/tokenizer-list]:                 https://yozora.guanghechen.com/docs/package/tokenizer-list
[doc-@yozora/tokenizer-list-item]:            https://yozora.guanghechen.com/docs/package/tokenizer-list-item
[doc-@yozora/tokenizer-math]:                 https://yozora.guanghechen.com/docs/package/tokenizer-math
[doc-@yozora/tokenizer-paragraph]:            https://yozora.guanghechen.com/docs/package/tokenizer-paragraph
[doc-@yozora/tokenizer-setext-heading]:       https://yozora.guanghechen.com/docs/package/tokenizer-setext-heading
[doc-@yozora/tokenizer-table]:                https://yozora.guanghechen.com/docs/package/tokenizer-table
[doc-@yozora/tokenizer-text]:                 https://yozora.guanghechen.com/docs/package/tokenizer-text
[doc-@yozora/tokenizer-thematic-break]:       https://yozora.guanghechen.com/docs/package/tokenizer-thematic-break
[doc-@yozora/jest-for-tokenizer]:             https://yozora.guanghechen.com/docs/package/jest-for-tokenizer
[doc-@yozora/parser-gfm]:                     https://yozora.guanghechen.com/docs/package/parser-gfm

[gfm-atx-heading]:                            https://github.github.com/gfm/#atx-heading
[gfm-autolink]:                               https://github.github.com/gfm/#autolinks
[gfm-autolink-extension]:                     https://github.github.com/gfm/#autolinks-extension-
[gfm-blockquote]:                             https://github.github.com/gfm/#block-quotes
[gfm-bullet-list]:                            https://github.github.com/gfm/#bullet-list
[gfm-delete]:                                 https://github.github.com/gfm/#strikethrough-extension-
[gfm-emphasis]:                               https://github.github.com/gfm/#can-open-emphasis
[gfm-fenced-code]:                            https://github.github.com/gfm/#fenced-code-block
[gfm-html-block]:                             https://github.github.com/gfm/#html-block
[gfm-html-inline]:                            https://github.github.com/gfm/#raw-html
[gfm-image]:                                  https://github.github.com/gfm/#images
[gfm-indented-code]:                          https://github.github.com/gfm/#indented-code-block
[gfm-inline-code]:                            https://github.github.com/gfm/#code-span
[gfm-link]:                                   https://github.github.com/gfm/#inline-link
[gfm-definition]:                             https://github.github.com/gfm/#link-reference-definition
[gfm-link-reference]:                         https://github.github.com/gfm/#reference-link
[gfm-list]:                                   https://github.github.com/gfm/#lists
[gfm-list-item]:                              https://github.github.com/gfm/#list-items
[gfm-list-task-item]:                         https://github.github.com/gfm/#task-list-items-extension-
[gfm-paragraph]:                              https://github.github.com/gfm/#paragraph
[gfm-setext-heading]:                         https://github.github.com/gfm/#setext-heading
[gfm-soft-line-break]:                        https://github.github.com/gfm/#soft-line-breaks
[gfm-strong]:                                 https://github.github.com/gfm/#can-open-strong-emphasis
[gfm-tab]:                                    https://github.github.com/gfm/#tabs
[gfm-table]:                                  https://github.github.com/gfm/#table
[gfm-text]:                                   https://github.github.com/gfm/#soft-line-breaks
[gfm-thematic-break]:                         https://github.github.com/gfm/#thematic-break

<!-- :end -->
