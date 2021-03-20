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


## Contact

  * [Github issues](https://github.com/guanghechen/yozora/issues)


## License

  Yozora is [MIT licensed](https://github.com/guanghechen/yozora/blob/master/LICENSE).


[gfm-spec]: https://github.github.com/gfm/
[yozora-docs]: https://yozora.guanghechen.com/docs
[@yozora/core-parser]: https://github.com/guanghechen/yozora/tree/master/packages/core-parser
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm
[@yozora/tokenizer-autolink]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink
