<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora#readme">Yozora</a>
    <div align="center">
      <img alt="logo.png" src="./logo.png" width="400px" />
    </div>
  </h1>
  <div align="center">
    <a href="#license">
      <img
        alt="License"
        src="https://img.shields.io/github/license/yozorajs/yozora"
      />
    </a>
    <a href="https://github.com/yozorajs/yozora/tags">
      <img
        alt="Package Version"
        src="https://img.shields.io/github/v/tag/yozorajs/yozora?include_prereleases&sort=semver"
      />
    </a>
    <a href="https://github.com/yozorajs/yozora/search?l=typescript">
      <img
        alt="Github Top Language"
        src="https://img.shields.io/github/languages/top/yozorajs/yozora"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@yozora/core-tokenizer"
      />
    </a>
    <a href="https://github.com/yozorajs/yozora/actions/workflows/ci.yml">
      <img
        alt="CI Workflow"
        src="https://github.com/yozorajs/yozora/actions/workflows/ci.yml/badge.svg"
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
<br />

> See [Yozora document][yozora-docs] (or https://yozorajs.github.io) for more details.
>
> https://user-images.githubusercontent.com/42513619/129205123-6a1983c4-6a86-4c80-83d6-02bdbf70edbf.mp4

<br />


[中文文档](./README-zh.md)

## 🎉 Why named "yozora" ?

***Yozora*** is the Roman sound of Japanese 「よぞら」, taken from the lyrics in
『*花鳥風月*』 by the band *世界の終わり*.

This project is a monorepo that aims to implement a highly extensible, pluggable
Markdown parser. Based on the idea of middlewares, the core algorithm
[@yozora/core-parser][] will schedule tokenizers (such as [@yozora/tokenizer-autolink][])
to complete the parsing tasks. More accurately, *yozora* is an algorithm to
parse Markdown or its extended syntax contents into an abstract syntax tree (AST).


## ✨ Features

* 🔖 Fully support all the rules mentioned in the [GFM specification][gfm-spec],
  and has passed almost all test cases created based on the examples in the
  specification (except the one https://github.github.com/gfm/#example-653,
  as there is no plan to support native HTML tags in the [React Renderer][yozora-react],
  for the Yozora AST, so I'm a little lazy to do the tag filtering. If you need
  it, you can do the filtering by yourself).

  See [@yozora/parser-gfm] or [@yozora/parser-gfm-ex] for further information.

* 🚀 Robust. 

  - All codes are written in Typescript, with the guarantee of strictly static
    type checking.

  - Eslint and Prettier to constrain coding styles to avoid error-prone problems
    such as hack syntax and shadow variables.

  - Tested with Jest, and passed a large number of test cases.

* 💚 **Tidy**: No third-party dependencies.

* ⚡️ **Efficient**.

  - The parsing complexity is the length of source contents multiplied by the
    number of tokenizers, which has reached the lower bound of theoretical
    complexity.

  - The parser API supports streaming read-in (using generators /iterators for
    input), and supports parsing while read-in (Only block-level data is
    supported yet).

  - Carefully handle the array creation / concat operations. To reused the array
    as much as possible during the entire matching phase, only use the array
    index to delineate the matching range. And a lot of strategies applied to
    reduce duplicated matching / parsing operations.

* 🩹 **Compatibility**, the parsed syntax tree is compatible with the one defined in 
  [Mdast][mdast-homepage]. 
  
  Even if some data types are not compatible in the future, it is easy to
  traverse the AST for adaptation and modification through the API provided in
  [@yozora/ast-util][].

* 🎨 **Extendibility**, Yozora comes with a plug-in system, which allowed Yozora to
  schedule the tokenizers through an internal algorithms to complete the parsing
  tasks.
  
  - It's easy to create and integrate custom tokenizers. 
  - All tokenizers can be mounted or unmounted freely.

    Some tokenizers of the data types that not mentioned in [GFM][gfm-spec] have
    been implemented in this repository, such as [@yozora/tokenizer-admonition][],
    [@yozora/tokenizer-footnote][], etc. All of them are built into
    [@yozora/parser][] in default, you can uninstall them at will, if you don't
    like it.


## Usage

* [@yozora/parser][]: (**Recommended**) A Markdown parser with rich built-in tokenizers.

  ```typescript
  import YozoraParser from '@yozora/parser'

  const parser = new YozoraParser()
  parser.parse('source content')
  ```

* [@yozora/parser-gfm][]: A Markdown parser that supports [GFM specification][gfm-spec].
Built-in tokenizers that supports all grammars mentioned in
[GFM specification][gfm-spec] (**excluding** the extended grammar mentioned in the
specification, such as [table][@yozora/tokenizer-table]).

  ```typescript
  import GfmParser from '@yozora/parser-gfm'

  const parser = new GfmParser()
  parser.parse('github flavor markdown contents')
  ```

* [@yozora/parser-gfm-ex][]: A Markdown parser that supports [GFM specification][gfm-spec].
Built-in tokenizers that supports all grammars mentioned in
[GFM specification][gfm-spec] (**including** the extended grammar mentioned in the
specification, such as [table][@yozora/tokenizer-table]).

  ```typescript
  import GfmExParser from '@yozora/parser-gfm-ex'

  const parser = new GfmExParser()
  parser.parse('github flavor markdown contents (with gfm extensions enabled)')
  ```

* Content AST into markup content

  ```typescript
  import { DefaultMarkupWeaver } from '@yozora/markup-weaver'

  const weaver = new DefaultMarkupWeaver()
  weaver.weave({
    "type": "root",
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "text",
            "value": "emphasis: "
          },
          {
            "type": "strong",
            "children": [
              {
                "type": "text",
                "value": "foo \""
              },
              {
                "type": "emphasis",
                "children": [
                  {
                    "type": "text",
                    "value": "bar"
                  }
                ]
              },
              {
                "type": "text",
                "value": "\" foo"
              }
            ]
          }
        ]
      }
    ]
  })
  // => emphasis: **foo "*bar*" foo**
  ```


### Overview

* Parsers

  Parser                    | Description
  :-------------------------|:---------------------------------
  [@yozora/parser][]        | A markdown parser with rich built-in tokenizers
  [@yozora/parser-gfm][]    | A markdown parser with built-in tokenizers to fully support GFM (without GFM extensions)
  [@yozora/parser-gfm-ex][] | A markdown parser with built-in tokenizers to fully support GFM and GFM extensions

* Weavers

  Weaver                    | Description
  :-------------------------|:-------------------------------------
  [@yozora/markup-weaver][] | Weave AST into markup content.

* Tokenizers

  Tokenizer                                 | Description
  :-----------------------------------------|:----------------------------------------------------
  [@yozora/tokenizer-admonition][]          | Resolve admonitions
  [@yozora/tokenizer-autolink][]            | Resolve [GFM Autolinks][gfm-autolink]
  [@yozora/tokenizer-autolink-extension][]  | Resolve [GFM Autolinks (extension)][gfm-autolink-extension]
  [@yozora/tokenizer-blockquote][]          | Resolve [GFM blockquotes][gfm-blockquote]
  [@yozora/tokenizer-break][]               | Resolve [GFM hard line breaks][gfm-hard-line-break] and [GFM soft line breaks][gfm-soft-line-break]
  [@yozora/tokenizer-definition][]          | Resolve [GFM link reference definitions][gfm-link-reference]
  [@yozora/tokenizer-delete][]              | Resolve [GFM strikethrough (extension)][gfm-delete]
  [@yozora/tokenizer-ecma-import][]         | Resolve ECMAScript `import` statements
  [@yozora/tokenizer-emphasis][]            | Resolve [GFM emphasis and strong emphasis][gfm-emphasis]
  [@yozora/tokenizer-fenced-code][]         | Resolve [GFM fenced code blocks][gfm-fenced-code]
  [@yozora/tokenizer-footnote][]            | Resolve footnotes
  [@yozora/tokenizer-footnote-definition][] | Resolve footnote definitions
  [@yozora/tokenizer-footnote-reference][]  | Resolve footnote references
  [@yozora/tokenizer-heading][]             | Resolve [GFM ATX headings][gfm-atx-heading]
  [@yozora/tokenizer-html-block][]          | Resolve [GFM HTML blocks][gfm-html-block]
  [@yozora/tokenizer-html-inline][]         | Resolve [GFM raw HTML][gfm-html-inline]
  [@yozora/tokenizer-image][]               | Resolve [GFM images][gfm-image]
  [@yozora/tokenizer-image-reference][]     | Resolve [GFM reference images][gfm-image-reference]
  [@yozora/tokenizer-indented-code][]       | Resolve [GFM indented code blocks][gfm-indented-code]
  [@yozora/tokenizer-inline-code][]         | Resolve [GFM code spans][gfm-inline-code]
  [@yozora/tokenizer-inline-math][]         | Resolve inline formulas
  [@yozora/tokenizer-link][]                | Resolve [GFM links][gfm-link]
  [@yozora/tokenizer-link-reference][]      | Resolve [GFM reference links][gfm-link-reference]
  [@yozora/tokenizer-list][]                | Resolve [GFM lists][gfm-list] (with [GFM list items][gfm-list-item] and [GFM task list items][gfm-list-task-item])
  [@yozora/tokenizer-math][]                | Resolve block formulas
  [@yozora/tokenizer-paragraph][]           | Resolve [GFM paragraphs][gfm-paragraph]
  [@yozora/tokenizer-setext-heading][]      | Resolve [GFM setext headings][gfm-setext-heading]
  [@yozora/tokenizer-table][]               | Resolve [GFM tables][gfm-table]
  [@yozora/tokenizer-text][]                | Resolve [GFM textual contents][gfm-text]
  [@yozora/tokenizer-thematic-break][]      | Resolve [GFM thematic breaks][gfm-thematic-break]

* Utils

  Package                                   | Description
  :-----------------------------------------|:----------------------------------------------------
  [@yozora/ast][]                           | Yozora markdown ast types and constants
  [@yozora/ast-util][]                      | Utility functions to handle Yozora markdown ast
  [@yozora/character][]                     | Utility functions to handle characters encoded in ascii and unicode.
  [@yozora/core-parser][]                   | Types and utility functions for building a Yozora Parser. 
  [@yozora/core-tokenizer][]                | Types and utility functions for building a Yozora Tokenizer. 
  [@yozora/invariant][]                     | A simple invariant function

* Scaffolds

  Package                                   | Description
  :-----------------------------------------|:----------------------------------------------------
  [@yozora/eslint-config][]                 | Eslint configs for yozora tokenizers
  [@yozora/jest-for-tokenizer][]            | Jest util for testing yozora tokenizers
  [@yozora/template-tokenizer][]            | Templates for creating a Yozora tokenizer (`InlineTokenizer` / `BlockTokenizer`)


## 💡 FAQ

* How to use yozora with gatsby?

  - Try the [@yozora/gatsby-transformer][] and [@yozora/gatsby-images][]

* How to implemented custom tokenizer?


  - Use [@yozora/template-tokenizer][] to create a custom tokenizer with
    predefined boilerplates.

  - Check [@yozora/core-tokenizer][] for implementation details of tokenizer.

  - Check [@yozora/jest-for-tokenizer][] for information about testing the
    custom tokenizer.

  - Check [@yozora/core-parser] and [@yozora/parser] for information on how to
    integrate a custom tokenzier.

  It's also recommended to refer to the existing [tokenizers][github-tokenizers]
  implementation to create a custom one.
  

## 💬 Contact

* [Github issues](https://github.com/yozorajs/yozora/issues)


## 📄 License

Yozora is [MIT licensed](https://github.com/yozorajs/yozora/blob/main/LICENSE).


## Related

* [✨光和尘一直想要一个清爽博客][ghc-post-yozora]: Why this project was written.
* [@yozora/react-markdown][]: A library that renders Yozora AST into React components.
* [@yozora/html-markdown][]: A library that renders Yozora AST into html strings.

[ghc-post-yozora]: https://me.guanghechen.com/essay/tada/
[gfm-spec]: https://github.github.com/gfm/
[github-tokenizers]: https://github.com/yozorajs/yozora/tree/main/tokenizers
[src-NodePoint]: https://github.com/yozorajs/yozora/blob/main/packages/character/src/types.ts#L10
[yozora-docs]: https://yozora.guanghechen.com/
[yozora-docs2]: https://yozorajs.github.io/
[yozora-react]: https://github.com/yozorajs/yozora-react
[@yozora/gatsby-transformer]: https://github.com/yozorajs/gatsby-scaffolds/blob/main/packages/gatsby-transformer#readme
[@yozora/gatsby-images]: https://github.com/yozorajs/gatsby-scaffolds/blob/main/packages/gatsby-images#readme
[@yozora/html-markdown]: https://github.com/yozorajs/yozora-html/tree/main/packages/markdown
[@yozora/react-markdown]: https://github.com/yozorajs/yozora-react/tree/main/packages/markdown

<!-- :begin use tokenizer/definitions -->

[live-examples]: https://yozora.guanghechen.com/docs/package/root#live-examples
[docpage]: https://yozora.guanghechen.com/docs/package/root
[homepage]: https://github.com/yozorajs/yozora/tree/main/.#readme
[gfm-spec]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast

[@yozora/ast]:                                https://github.com/yozorajs/yozora/tree/main/packages/ast#readme
[@yozora/ast-util]:                           https://github.com/yozorajs/yozora/tree/main/packages/ast-util#readme
[@yozora/character]:                          https://github.com/yozorajs/yozora/tree/main/packages/character#readme
[@yozora/eslint-config]:                      https://github.com/yozorajs/yozora/tree/main/packages/eslint-config#readme
[@yozora/core-parser]:                        https://github.com/yozorajs/yozora/tree/main/packages/core-parser#readme
[@yozora/core-tokenizer]:                     https://github.com/yozorajs/yozora/tree/main/packages/core-tokenizer#readme
[@yozora/invariant]:                          https://github.com/yozorajs/yozora/tree/main/packages/invariant#readme
[@yozora/markup-weaver]:                      https://github.com/yozorajs/yozora/tree/main/packages/markup-weaver#readme
[@yozora/jest-for-tokenizer]:                 https://github.com/yozorajs/yozora/tree/main/packages/jest-for-tokenizer#readme
[@yozora/parser]:                             https://github.com/yozorajs/yozora/tree/main/packages/parser#readme
[@yozora/parser-gfm]:                         https://github.com/yozorajs/yozora/tree/main/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]:                      https://github.com/yozorajs/yozora/tree/main/packages/parser-gfm-ex#readme
[@yozora/template-tokenizer]:                 https://github.com/yozorajs/yozora/tree/main/packages/template-tokenizer#readme
[@yozora/tokenizer-admonition]:               https://github.com/yozorajs/yozora/tree/main/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]:                 https://github.com/yozorajs/yozora/tree/main/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]:       https://github.com/yozorajs/yozora/tree/main/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]:               https://github.com/yozorajs/yozora/tree/main/tokenizers/blockquote#readme
[@yozora/tokenizer-break]:                    https://github.com/yozorajs/yozora/tree/main/tokenizers/break#readme
[@yozora/tokenizer-definition]:               https://github.com/yozorajs/yozora/tree/main/tokenizers/definition#readme
[@yozora/tokenizer-delete]:                   https://github.com/yozorajs/yozora/tree/main/tokenizers/delete#readme
[@yozora/tokenizer-ecma-import]:              https://github.com/yozorajs/yozora/tree/main/tokenizers/ecma-import#readme
[@yozora/tokenizer-emphasis]:                 https://github.com/yozorajs/yozora/tree/main/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-block]:             https://github.com/yozorajs/yozora/tree/main/tokenizers/fenced-block#readme
[@yozora/tokenizer-fenced-code]:              https://github.com/yozorajs/yozora/tree/main/tokenizers/fenced-code#readme
[@yozora/tokenizer-footnote]:                 https://github.com/yozorajs/yozora/tree/main/tokenizers/footnote#readme
[@yozora/tokenizer-footnote-definition]:      https://github.com/yozorajs/yozora/tree/main/tokenizers/footnote-definition#readme
[@yozora/tokenizer-footnote-reference]:       https://github.com/yozorajs/yozora/tree/main/tokenizers/footnote-reference#readme
[@yozora/tokenizer-heading]:                  https://github.com/yozorajs/yozora/tree/main/tokenizers/heading#readme
[@yozora/tokenizer-html-block]:               https://github.com/yozorajs/yozora/tree/main/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]:              https://github.com/yozorajs/yozora/tree/main/tokenizers/html-inline#readme
[@yozora/tokenizer-image]:                    https://github.com/yozorajs/yozora/tree/main/tokenizers/image#readme
[@yozora/tokenizer-image-reference]:          https://github.com/yozorajs/yozora/tree/main/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]:            https://github.com/yozorajs/yozora/tree/main/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]:              https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]:              https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-math#readme
[@yozora/tokenizer-link]:                     https://github.com/yozorajs/yozora/tree/main/tokenizers/link#readme
[@yozora/tokenizer-link-reference]:           https://github.com/yozorajs/yozora/tree/main/tokenizers/link-reference#readme
[@yozora/tokenizer-list]:                     https://github.com/yozorajs/yozora/tree/main/tokenizers/list#readme
[@yozora/tokenizer-math]:                     https://github.com/yozorajs/yozora/tree/main/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:                https://github.com/yozorajs/yozora/tree/main/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:           https://github.com/yozorajs/yozora/tree/main/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]:                    https://github.com/yozorajs/yozora/tree/main/tokenizers/table#readme
[@yozora/tokenizer-text]:                     https://github.com/yozorajs/yozora/tree/main/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:           https://github.com/yozorajs/yozora/tree/main/tokenizers/thematic-break#readme

[@yozora/react-admonition]:                   https://github.com/yozorajs/yozora-react/tree/main/packages/admonition#readme
[@yozora/react-blockquote]:                   https://github.com/yozorajs/yozora-react/tree/main/packages/blockquote#readme
[@yozora/react-break]:                        https://github.com/yozorajs/yozora-react/tree/main/packages/break#readme
[@yozora/react-delete]:                       https://github.com/yozorajs/yozora-react/tree/main/packages/delete#readme
[@yozora/react-emphasis]:                     https://github.com/yozorajs/yozora-react/tree/main/packages/emphasis#readme
[@yozora/react-code]:                         https://github.com/yozorajs/yozora-react/tree/main/packages/code#readme
[@yozora/react-code-live]:                    https://github.com/yozorajs/yozora-react/tree/main/packages/code-live#readme
[@yozora/react-footnote-definitions]:         https://github.com/yozorajs/yozora-react/tree/main/packages/footnote-definitions#readme
[@yozora/react-footnote-reference]:           https://github.com/yozorajs/yozora-react/tree/main/packages/footnote-reference#readme
[@yozora/react-heading]:                      https://github.com/yozorajs/yozora-react/tree/main/packages/heading#readme
[@yozora/react-image]:                        https://github.com/yozorajs/yozora-react/tree/main/packages/image#readme
[@yozora/react-inline-code]:                  https://github.com/yozorajs/yozora-react/tree/main/packages/inline-code#readme
[@yozora/react-inline-math]:                  https://github.com/yozorajs/yozora-react/tree/main/packages/inline-math#readme
[@yozora/react-link]:                         https://github.com/yozorajs/yozora-react/tree/main/packages/link#readme
[@yozora/react-list]:                         https://github.com/yozorajs/yozora-react/tree/main/packages/list#readme
[@yozora/react-list-item]:                    https://github.com/yozorajs/yozora-react/tree/main/packages/list-item#readme
[@yozora/react-markdown]:                     https://github.com/yozorajs/yozora-react/tree/main/packages/markdown#readme
[@yozora/react-math]:                         https://github.com/yozorajs/yozora-react/tree/main/packages/math#readme
[@yozora/react-paragraph]:                    https://github.com/yozorajs/yozora-react/tree/main/packages/paragraph#readme
[@yozora/react-strong]:                       https://github.com/yozorajs/yozora-react/tree/main/packages/strong#readme
[@yozora/react-table]:                        https://github.com/yozorajs/yozora-react/tree/main/packages/table#readme
[@yozora/react-text]:                         https://github.com/yozorajs/yozora-react/tree/main/packages/text#readme
[@yozora/react-thematic-break]:               https://github.com/yozorajs/yozora-react/tree/main/packages/thematic-break#readme

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
[gfm-hard-line-break]:                        https://github.github.com/gfm/#hard-line-break
[gfm-html-block]:                             https://github.github.com/gfm/#html-block
[gfm-html-inline]:                            https://github.github.com/gfm/#raw-html
[gfm-image]:                                  https://github.github.com/gfm/#images
[gfm-image-reference]:                        https://github.github.com/gfm/#example-590
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
