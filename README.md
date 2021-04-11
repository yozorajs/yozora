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
        src="https://github.com/guanghechen/yozora/workflows/Build/badge.svg?branch=master"
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


## Contact

  * [Github issues](https://github.com/guanghechen/yozora/issues)


## License

  Yozora is [MIT licensed](https://github.com/guanghechen/yozora/blob/master/LICENSE).


[gfm-spec]: https://github.github.com/gfm/
[yozora-docs]: https://yozora.guanghechen.com/docs

<!-- yozora package link definitions -->
[@yozora/ast]:                          https://github.com/guanghechen/yozora/tree/master/packages/ast#readme
[@yozora/core-parser]:                  https://github.com/guanghechen/yozora/tree/master/packages/core-parser#readme
[@yozora/parser]:                       https://github.com/guanghechen/yozora/tree/master/packages/parser#readme
[@yozora/parser-gfm]:                   https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]:                https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm-ex#readme
[@yozora/tokenizer-admonition]:         https://github.com/guanghechen/yozora/tree/master/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]:           https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]:         https://github.com/guanghechen/yozora/tree/master/tokenizers/blockquote#readme
[@yozora/tokenizer-break]:              https://github.com/guanghechen/yozora/tree/master/tokenizers/break#readme
[@yozora/tokenizer-definition]:         https://github.com/guanghechen/yozora/tree/master/tokenizers/definition#readme
[@yozora/tokenizer-delete]:             https://github.com/guanghechen/yozora/tree/master/tokenizers/delete#readme
[@yozora/tokenizer-emphasis]:           https://github.com/guanghechen/yozora/tree/master/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-code]:        https://github.com/guanghechen/yozora/tree/master/tokenizers/fenced-code#readme
[@yozora/tokenizer-heading]:            https://github.com/guanghechen/yozora/tree/master/tokenizers/heading#readme
[@yozora/tokenizer-html-block]:         https://github.com/guanghechen/yozora/tree/master/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]:        https://github.com/guanghechen/yozora/tree/master/tokenizers/html-inline#readme
[@yozora/tokenizer-image]:              https://github.com/guanghechen/yozora/tree/master/tokenizers/image#readme
[@yozora/tokenizer-image-reference]:    https://github.com/guanghechen/yozora/tree/master/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]:      https://github.com/guanghechen/yozora/tree/master/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]:        https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]:        https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-math#readme
[@yozora/tokenizer-link]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/link#readme
[@yozora/tokenizer-link-reference]:     https://github.com/guanghechen/yozora/tree/master/tokenizers/link-reference#readme
[@yozora/tokenizer-list]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/list#readme
[@yozora/tokenizer-list-item]:          https://github.com/guanghechen/yozora/tree/master/tokenizers/list-item#readme
[@yozora/tokenizer-math]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:          https://github.com/guanghechen/yozora/tree/master/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:     https://github.com/guanghechen/yozora/tree/master/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]:              https://github.com/guanghechen/yozora/tree/master/tokenizers/table#readme
[@yozora/tokenizer-text]:               https://github.com/guanghechen/yozora/tree/master/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:     https://github.com/guanghechen/yozora/tree/master/tokenizers/thematic-break#readme


<!-- gfm link definitions -->
[gfm-homepage]: https://github.github.com/gfm
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
