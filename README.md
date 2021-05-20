<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora#readme">Yozora</a>
  </h1>
  <div align="center">
    <a href="#license">
      <img
        alt="License"
        src="https://img.shields.io/github/license/guanghechen/yozora"
      />
    </a>
    <a href="https://github.com/guanghechen/yozora/tags">
      <img
        alt="Package Version"
        src="https://img.shields.io/github/v/tag/guanghechen/yozora?include_prereleases&sort=semver"
      />
    </a>
    <a href="https://github.com/guanghechen/yozora/search?l=typescript">
      <img
        alt="Github Top Language"
        src="https://img.shields.io/github/languages/top/guanghechen/yozora"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@yozora/core-tokenizer"
      />
    </a>
    <a href="https://github.com/guanghechen/yozora/actions/workflows/ci.yml">
      <img
        alt="CI Workflow"
        src="https://github.com/guanghechen/yozora/workflows/Build/badge.svg?branch=main"
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


> See [Yozora document][yozora-docs] for more details.

## What is "yozora" ?

The name ***yozora*** is the Roman sound of Japanese ***よぞら***, taken from the
lyrics of the song ***"花鳥風月"*** by the band ***Sekai no Owari***.

Yozora is a monorepo that contains a pluggable markdown parser kernel
[@yozora/core-parser][] and several implemented tokenizers such as
[@yozora/tokenizer-autolink][] for resolving the specific tokens..

## ✨ Features

* Robust, all codes written in typescript with strictly static type checking and 
  well tested with a continuously rich test cases.

* Tidy, no third-party dependencies (except for `tiny-invariant`, which also 
  may be removed in the future).

* Fast and efficient, timing complexity is the number of tokenizers multiplied by 
  the total string length processed. And supports streaming input through iterators.

* Compatibility, the parsed syntax tree is compatible with the one defined in 
  [Mdast][mdast-homepage].

* Fully support the [GFM specification][gfm-homepage] and passed all of the 600+ 
  examples mentioned in the specification (except https://github.github.com/gfm/#example-653).

  See [@yozora/parser-gfm] or [@yozora/parser-gfm-ex] for details.

* Implement additional grammars such as [Admonitions][@yozora/tokenizer-admonition], 
  [Footnotes][@yozora/tokenizer-footnote], [Formulas][@yozora/tokenizer-math], 
  etc., and are built into the parser [@yozora/parser][].


## Usage

* [@yozora/parser-gfm][] and [@yozora/parser-gfm-ex][]

  Yozora provides two parsers ***[@yozora/parser-gfm][@yozora/parser-gfm]***,
  ***[@yozora/parser-gfm-ex][@yozora/parser-gfm-ex]***  that implements all the
  specifications mentioned in the ***[Github Flavor Markdown Spec][gfm-spec]***.

  ```typescript
  import GfmExParser from '@yozora/parser-gfm-ex'

  const parser = new GfmExParser()
  parser.parse('github flavor markdown contents')
  ```

* [@yozora/parser][]

  ```typescript
  import YozoraParser from '@yozora/parser'

  const parser = new YozoraParser()
  parser.parse('markdown content')
  ```

  See the [API doc][@yozora/parser] for more details.


### Overview

* Parsers

  Parser                    | Description
  :-------------------------|:---------------------------------
  [@yozora/parser][]        | A markdown parser with rich built-in tokenizers
  [@yozora/parser-gfm][]    | A markdown parser with built-in tokenizers to fully support GFM (without GFM extensions)
  [@yozora/parser-gfm-ex][] | A markdown parser with built-in tokenizers to fully support GFM and GFM extensions

* Tokenizers

  Tokenizer                                 | Description
  :-----------------------------------------|:----------------------------------------------------
  [@yozora/tokenizer-admonition][]          | Resolve admonitions
  [@yozora/tokenizer-autolink][]            | Resolve [GFM Autolinks][]
  [@yozora/tokenizer-autolink-extension][]  | Resolve [GFM Autolinks (extension)][]
  [@yozora/tokenizer-blockquote][]          | Resolve [GFM blockquotes][]
  [@yozora/tokenizer-break][]               | Resolve [GFM hard line breaks][] and [GFM soft line breaks][]
  [@yozora/tokenizer-definition][]          | Resolve [GFM link reference definitions][]
  [@yozora/tokenizer-delete][]              | Resolve [GFM strikethrough (extension)][]
  [@yozora/tokenizer-emphasis][]            | Resolve [GFM emphasis and strong emphasis][]
  [@yozora/tokenizer-fenced-code][]         | Resolve [GFM fenced code blocks][]
  [@yozora/tokenizer-footnote][]            | Resolve footnotes
  [@yozora/tokenizer-footnote-definition][] | Resolve footnote definitions
  [@yozora/tokenizer-footnote-reference][]  | Resolve reference footnotes
  [@yozora/tokenizer-heading][]             | Resolve [GFM ATX headings][]
  [@yozora/tokenizer-html-block][]          | Resolve [GFM HTML blocks][]
  [@yozora/tokenizer-html-inline][]         | Resolve [GFM raw HTML][]
  [@yozora/tokenizer-image][]               | Resolve [GFM images][]
  [@yozora/tokenizer-image-reference][]     | Resolve [GFM reference images][]
  [@yozora/tokenizer-indented-code][]       | Resolve [GFM indented code blocks][]
  [@yozora/tokenizer-inline-code][]         | Resolve [GFM code spans][]
  [@yozora/tokenizer-inline-math][]         | Resolve inline formulas
  [@yozora/tokenizer-link][]                | Resolve [GFM links][]
  [@yozora/tokenizer-link-reference][]      | Resolve [GFM reference links][]
  [@yozora/tokenizer-list][]                | Resolve [GFM lists][]
  [@yozora/tokenizer-list-item][]           | Resolve [GFM list items][] and [GFM task list items][]
  [@yozora/tokenizer-math][]                | Resolve block formulas
  [@yozora/tokenizer-paragraph][]           | Resolve [GFM paragraphs][]
  [@yozora/tokenizer-setext-heading][]      | Resolve [GFM setext headings][]
  [@yozora/tokenizer-table][]               | Resolve [GFM tables][]
  [@yozora/tokenizer-text][]                | Resolve [GFM textual contents][]
  [@yozora/tokenizer-thematic-break][]      | Resolve [GFM thematic breaks][]


## FAQ

* How to use yozora with gatsby?

  - Try the [@guanghechen/gatsby-transformer-yozora][] and [@guanghechen/gatsby-yozora-images][]

* How to implemented custom tokenizer?

  - To be added... 
  
    You can refer to the implementation of existing tokenizers.


## Contact

  * [Github issues](https://github.com/guanghechen/yozora/issues)


## License

  Yozora is [MIT licensed](https://github.com/guanghechen/yozora/blob/main/LICENSE).


[gfm-spec]: https://github.github.com/gfm/
[yozora-docs]: https://yozora.guanghechen.com/docs
[@guanghechen/gatsby-transformer-yozora]: https://github.com/guanghechen/gatsby-scaffolds/blob/main/packages/gatsby-transformer-yozora#readme
[@guanghechen/gatsby-yozora-images]: https://github.com/guanghechen/gatsby-scaffolds/blob/main/packages/gatsby-yozora-images#readme

<!-- :begin use tokenizer/definitions -->

[live-examples]: https://yozora.guanghechen.com/docs/package/root#live-examples
[docpage]: https://yozora.guanghechen.com/docs/package/root
[homepage]: https://github.com/guanghechen/yozora/tree/main/.#readme
[gfm-homepage]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast

[@yozora/ast]:                                https://github.com/guanghechen/yozora/tree/main/packages/ast#readme
[@yozora/core-parser]:                        https://github.com/guanghechen/yozora/tree/main/packages/core-parser#readme
[@yozora/parser]:                             https://github.com/guanghechen/yozora/tree/main/packages/parser#readme
[@yozora/parser-gfm]:                         https://github.com/guanghechen/yozora/tree/main/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]:                      https://github.com/guanghechen/yozora/tree/main/packages/parser-gfm-ex#readme
[@yozora/tokenizer-admonition]:               https://github.com/guanghechen/yozora/tree/main/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]:                 https://github.com/guanghechen/yozora/tree/main/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]:       https://github.com/guanghechen/yozora/tree/main/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]:               https://github.com/guanghechen/yozora/tree/main/tokenizers/blockquote#readme
[@yozora/tokenizer-break]:                    https://github.com/guanghechen/yozora/tree/main/tokenizers/break#readme
[@yozora/tokenizer-definition]:               https://github.com/guanghechen/yozora/tree/main/tokenizers/definition#readme
[@yozora/tokenizer-delete]:                   https://github.com/guanghechen/yozora/tree/main/tokenizers/delete#readme
[@yozora/tokenizer-emphasis]:                 https://github.com/guanghechen/yozora/tree/main/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-block]:             https://github.com/guanghechen/yozora/tree/main/tokenizers/fenced-block#readme
[@yozora/tokenizer-fenced-code]:              https://github.com/guanghechen/yozora/tree/main/tokenizers/fenced-code#readme
[@yozora/tokenizer-footnote]:                 https://github.com/guanghechen/yozora/tree/main/tokenizers/footnote#readme
[@yozora/tokenizer-footnote-definition]:      https://github.com/guanghechen/yozora/tree/main/tokenizers/footnote-definition#readme
[@yozora/tokenizer-footnote-reference]:       https://github.com/guanghechen/yozora/tree/main/tokenizers/footnote-reference#readme
[@yozora/tokenizer-heading]:                  https://github.com/guanghechen/yozora/tree/main/tokenizers/heading#readme
[@yozora/tokenizer-html-block]:               https://github.com/guanghechen/yozora/tree/main/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]:              https://github.com/guanghechen/yozora/tree/main/tokenizers/html-inline#readme
[@yozora/tokenizer-image]:                    https://github.com/guanghechen/yozora/tree/main/tokenizers/image#readme
[@yozora/tokenizer-image-reference]:          https://github.com/guanghechen/yozora/tree/main/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]:            https://github.com/guanghechen/yozora/tree/main/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]:              https://github.com/guanghechen/yozora/tree/main/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]:              https://github.com/guanghechen/yozora/tree/main/tokenizers/inline-math#readme
[@yozora/tokenizer-link]:                     https://github.com/guanghechen/yozora/tree/main/tokenizers/link#readme
[@yozora/tokenizer-link-reference]:           https://github.com/guanghechen/yozora/tree/main/tokenizers/link-reference#readme
[@yozora/tokenizer-list]:                     https://github.com/guanghechen/yozora/tree/main/tokenizers/list#readme
[@yozora/tokenizer-list-item]:                https://github.com/guanghechen/yozora/tree/main/tokenizers/list-item#readme
[@yozora/tokenizer-math]:                     https://github.com/guanghechen/yozora/tree/main/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:                https://github.com/guanghechen/yozora/tree/main/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:           https://github.com/guanghechen/yozora/tree/main/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]:                    https://github.com/guanghechen/yozora/tree/main/tokenizers/table#readme
[@yozora/tokenizer-text]:                     https://github.com/guanghechen/yozora/tree/main/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:           https://github.com/guanghechen/yozora/tree/main/tokenizers/thematic-break#readme

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
