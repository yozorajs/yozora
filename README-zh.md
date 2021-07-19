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
        src="https://github.com/yozorajs/yozora/workflows/Build/badge.svg?branch=main"
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

> 参见 [Yozora 文档][yozora-docs] （或 [备用地址][yozora-docs2]） 以获得更多信息。

<br />


## 🎉 什么是 "yozora" ?

***yozora*** 是日语「よぞら」的罗马音，意为“夜空”，取自*世界の終わり*乐队的
『*花鳥風月*』中的歌词。

Yozora 是一个单体项目，目的是实现一个高度可扩展的、可插拔式 Markdown 解析器。它
采用了中间件的思想，由核心算法 [@yozora/core-parser][] 调度分词器（如
[@yozora/tokenizer-autolink][]）完成解析工作，解析的目标是将 Markdown （及其扩展）
语法的字符串转成抽象语法树（AST）。

## ✨ Features

* 完整支持了 [GFM 规范][gfm-spec] 中提到的所有规则，并通过了几乎所有由规范中的示
  例改造成的测试用例（除了示例 https://github.github.com/gfm/#example-653，因为
  [渲染器][yozora-react] 不打算支持原生的 HTML Tag，所以懒得做标签过滤，如果有需
  要自行做一下过滤就好了）。

  可参见 [@yozora/parser-gfm] or [@yozora/parser-gfm-ex] 以获得进一步信息。

* 健壮性，所有代码都采用 Typescript 编写，拥有静态检查的保障；并使用了大量的测试
  用例进行测试。

* 干净，零第三方依赖。

* 高性能。

  - 解析复杂度为字符串长度乘以分词器列表长度，已经达到了理论复杂度的下界。
  - 解析器的 API 支持流式读入（采用生成器/迭代器进行输入）。
  - 在读入字符串时，会将其预处理成字符编码，在分词阶段通过扫描字符编码的方式完成
    匹配，理论上比正则表达式少一些常数。
  - 小心的处理数组连接操作，整个扫描阶段尽量复用数组，仅通过下标索引来圈定匹配范
    围，并应用了不少策略减少重复匹配/解析。
  
* 兼容性，解析器解析出的 AST 与 [Mdast][mdast-homepage] 中定义的相兼容。

* 可扩展性，易于创建自定义的分词器，且已实现了一些 [GFM][gfm-spec] 中未提到的数
  据类型的分词器，如 [@yozora/tokenizer-admonition][], [@yozora/tokenizer-footnote][]
  等，且已内置于 [@yozora/parser][] 中。


## Usage

* [@yozora/parser][]: （推荐）内置了所有分词器的 Markdown 解析器。

  ```typescript
  import YozoraParser from '@yozora/parser'

  const parser = new YozoraParser({ shouldReservePosition: true })
  parser.parse('source content')
  ```

* [@yozora/parser-gfm][]: 内置了所有 [GFM 规范][gfm-spec] 规范中提到的数据类型但
  不包括规范中的扩展数据类型（如 Table）对应的分词器。

  ```typescript
  import GfmParser from '@yozora/parser-gfm'

  const parser = new GfmParser({ shouldReservePosition: true })
  parser.parse('github flavor markdown contents')
  ```

* [@yozora/parser-gfm-ex][]: 内置了所有 [GFM 规范][gfm-spec] 规范中提到的数据类
  型及规范中提到的扩展数据类型对应的分词器。

  ```typescript
  import GfmExParser from '@yozora/parser-gfm-ex'

  const parser = new GfmExParser({ shouldReservePosition: true })
  parser.parse('github flavor markdown contents (with gfm extensions enabled)')
  ```


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
  [@yozora/tokenizer-autolink][]            | Resolve [GFM Autolinks][gfm-autolink]
  [@yozora/tokenizer-autolink-extension][]  | Resolve [GFM Autolinks (extension)][gfm-autolink-extension]
  [@yozora/tokenizer-blockquote][]          | Resolve [GFM blockquotes][gfm-blockquote]
  [@yozora/tokenizer-break][]               | Resolve [GFM hard line breaks][gfm-hard-line-break] and [GFM soft line breaks][gfm-soft-line-break]
  [@yozora/tokenizer-definition][]          | Resolve [GFM link reference definitions][gfm-link-reference]
  [@yozora/tokenizer-delete][]              | Resolve [GFM strikethrough (extension)][gfm-delete]
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
  [@yozora/tokenizer-list][]                | Resolve [GFM lists][gfm-list]
  [@yozora/tokenizer-list-item][]           | Resolve [GFM list items][gfm-list-item] and [GFM task list items][gfm-list-task-item]
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

* 如何在 gatsby 中使用 yozora？

  - 参见 [@yozora/gatsby-transformer][] 和 [@yozora/gatsby-images][]

* 如何实现自定义的分词器?

  - 使用脚手架工具 [@yozora/template-tokenizer][] 去创建一个由预定义模板生成的分
    词器项目（或单体项目中的一个包） ；

  - 参见 [@yozora/core-tokenizer][] 以获得分词器的生命周期函数细节；

  - 参见 [@yozora/jest-for-tokenizer][] 以获得测试自定义分词器相关的信息；

  - 参考 [@yozora/core-parser][] 和 [@yozora/parser][] 以获得如何使用自定义分词
    器的信息；

  另外，同样推荐参考现有的 [分词器][github-tokenizers]，以实现一个自定义的版本。
  

## 💬 Contact

* [Github issues](https://github.com/yozorajs/yozora/issues)


## 📄 License

Yozora 使用 [MIT 许可证](https://github.com/yozorajs/yozora/blob/main/LICENSE) 
进行授权。


[gfm-spec]: https://github.github.com/gfm/
[yozora-react]: https://github.com/yozorajs/yozora-react
[yozora-docs]: https://yozora.guanghechen.com/docs
[yozora-docs2]: https://yozorajs.github.io/docs
[@yozora/gatsby-transformer]: https://github.com/yozorajs/gatsby-scaffolds/blob/main/packages/gatsby-transformer#readme
[@yozora/gatsby-images]: https://github.com/yozorajs/gatsby-scaffolds/blob/main/packages/gatsby-images#readme

<!-- :begin use tokenizer/definitions -->

[live-examples]: https://yozora.guanghechen.com/docs/package/root#live-examples
[docpage]: https://yozora.guanghechen.com/docs/package/root
[homepage]: https://github.com/yozorajs/yozora/tree/main/.#readme
[github-tokenizers]: https://github.com/yozorajs/yozora/tree/main/tokenizers
[gfm-spec]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast

[@yozora/ast]:                                https://github.com/yozorajs/yozora/tree/main/packages/ast#readme
[@yozora/ast-util]:                           https://github.com/yozorajs/yozora/tree/main/packages/ast-util#readme
[@yozora/character]:                          https://github.com/yozorajs/yozora/tree/main/packages/character#readme
[@yozora/eslint-config]:                      https://github.com/yozorajs/yozora/tree/main/packages/eslint-config#readme
[@yozora/core-parser]:                        https://github.com/yozorajs/yozora/tree/main/packages/core-parser#readme
[@yozora/core-tokenizer]:                     https://github.com/yozorajs/yozora/tree/main/packages/core-tokenizer#readme
[@yozora/invariant]:                          https://github.com/yozorajs/yozora/tree/main/packages/invariant#readme
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
[@yozora/tokenizer-list-item]:                https://github.com/yozorajs/yozora/tree/main/tokenizers/list-item#readme
[@yozora/tokenizer-math]:                     https://github.com/yozorajs/yozora/tree/main/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:                https://github.com/yozorajs/yozora/tree/main/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:           https://github.com/yozorajs/yozora/tree/main/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]:                    https://github.com/yozorajs/yozora/tree/main/tokenizers/table#readme
[@yozora/tokenizer-text]:                     https://github.com/yozorajs/yozora/tree/main/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:           https://github.com/yozorajs/yozora/tree/main/tokenizers/thematic-break#readme

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
