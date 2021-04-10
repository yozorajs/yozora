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

Yozora provides a parser ***[@yozora/parser-gfm][@yozora/parser-gfm]*** that
implements all the specifications mentioned in the
***[Github Flavor Markdown Spec][gfm-spec]***.

```typescript
import { createExGFMParser } from '@yozora/parser-gfm'

const exParser = createExGFMParser()
exParser.parse('markdown content')
```

See the [API doc][@yozora/parser-gfm] for more details.


### Overview

Tokenizer                                 | Description
:----------------------------------------:|:----------------------------------:
[@yozora/tokenizer-admonition][]          | admonition
[@yozora/tokenizer-autolink][]            | GFM autolinks
[@yozora/tokenizer-autolink-extension][]  | GFM autolinks (extension)
[@yozora/tokenizer-blockquote][]          | GFM hard line-break and soft line-break
[@yozora/tokenizer-break][]               | GFM blockquote
[@yozora/tokenizer-definition][]          | GFM definition
[@yozora/tokenizer-delete][]              | GFM delete (extension)
[@yozora/tokenizer-emphasis][]            | GFM emphasis and strong
[@yozora/tokenizer-fenced-code][]         | GFM fenced code blocks
[@yozora/tokenizer-heading][]             | GFM ATX headings
[@yozora/tokenizer-html-block][]          | GFM html block
[@yozora/tokenizer-html-inline][]         | GFM raw html
[@yozora/tokenizer-image][]               | GFM images
[@yozora/tokenizer-image-reference][]     | GFM reference images
[@yozora/tokenizer-indented-code][]       | GFM indented code blocks
[@yozora/tokenizer-inline-code][]         | GFM inline codes
[@yozora/tokenizer-inline-math][]         | Inline formulas
[@yozora/tokenizer-link][]                | GFM links
[@yozora/tokenizer-link-reference][]      | GFM reference links
[@yozora/tokenizer-list][]                | GFM list
[@yozora/tokenizer-list-item][]           | GFM list items and task list item (extension)
[@yozora/tokenizer-math][]                | Block formulas
[@yozora/tokenizer-paragraph][]           | GFM paragraphs
[@yozora/tokenizer-setext-heading][]      | GFM Setext headings
[@yozora/tokenizer-table][]               | GFM tables (extension)
[@yozora/tokenizer-text][]                | GFM literal textures
[@yozora/tokenizer-thematic-break][]      | GFM thematic breaks


## Contact

  * [Github issues](https://github.com/guanghechen/yozora/issues)


## License

  Yozora is [MIT licensed](https://github.com/guanghechen/yozora/blob/master/LICENSE).


[gfm-spec]: https://github.github.com/gfm/
[yozora-docs]: https://yozora.guanghechen.com/docs

[@yozora/core-parser]: https://github.com/guanghechen/yozora/tree/master/packages/core-parser
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm
[@yozora/tokenizer-admonition]: https://github.com/guanghechen/yozora/tree/master/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]: https://github.com/guanghechen/yozora/tree/master/tokenizers/blockquote#readme
[@yozora/tokenizer-break]: https://github.com/guanghechen/yozora/tree/master/tokenizers/break#readme
[@yozora/tokenizer-definition]: https://github.com/guanghechen/yozora/tree/master/tokenizers/definition#readme
[@yozora/tokenizer-delete]: https://github.com/guanghechen/yozora/tree/master/tokenizers/delete#readme
[@yozora/tokenizer-emphasis]: https://github.com/guanghechen/yozora/tree/master/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/fenced-code#readme
[@yozora/tokenizer-heading]: https://github.com/guanghechen/yozora/tree/master/tokenizers/heading#readme
[@yozora/tokenizer-html-block]: https://github.com/guanghechen/yozora/tree/master/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]: https://github.com/guanghechen/yozora/tree/master/tokenizers/html-inline#readme
[@yozora/tokenizer-image]: https://github.com/guanghechen/yozora/tree/master/tokenizers/image#readme
[@yozora/tokenizer-image-reference]: https://github.com/guanghechen/yozora/tree/master/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]: https://github.com/guanghechen/yozora/tree/master/tokenizers/inline-math#readme
[@yozora/tokenizer-link]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link#readme
[@yozora/tokenizer-link-reference]: https://github.com/guanghechen/yozora/tree/master/tokenizers/link-reference#readme
[@yozora/tokenizer-list]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list#readme
[@yozora/tokenizer-list-item]: https://github.com/guanghechen/yozora/tree/master/tokenizers/list-item#readme
[@yozora/tokenizer-math]: https://github.com/guanghechen/yozora/tree/master/tokenizers/math#readme
[@yozora/tokenizer-paragraph]: https://github.com/guanghechen/yozora/tree/master/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]: https://github.com/guanghechen/yozora/tree/master/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]: https://github.com/guanghechen/yozora/tree/master/tokenizers/table#readme
[@yozora/tokenizer-text]: https://github.com/guanghechen/yozora/tree/master/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]: https://github.com/guanghechen/yozora/tree/master/tokenizers/thematic-break#readme
