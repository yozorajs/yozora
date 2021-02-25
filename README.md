<header>
  <h1 align="center"><span>Yozora<span></h1>
</header>


[![License](https://img.shields.io/github/license/guanghechen/yozora)](#license)
[![Tested With Jest](https://img.shields.io/badge/tested_with-jest-9c465e.svg)](https://github.com/facebook/jest)
[![Code Style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Package version](https://img.shields.io/github/v/tag/guanghechen/yozora?include_prereleases&sort=semver)](https://github.com/guanghechen/yozora/tags)
[![Github Top Language](https://img.shields.io/github/languages/top/guanghechen/yozora)](https://github.com/guanghechen/yozora/search?l=typescript)
[![Node Version](https://img.shields.io/node/v/@yozora/core-parser)](https://github.com/guanghechen/yozora)
[![CI Workflow](https://github.com/guanghechen/yozora/workflows/Build/badge.svg?branch=master)](https://github.com/guanghechen/yozora/actions/workflows/ci.yml)


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
[@yozora/core-parser]: https://yozora.guanghechen.com/docs/package/core-parser
[@yozora/parser-gfm]: https://yozora.guanghechen.com/docs/package/parser-gfm
[@yozora/tokenizer-autolink]: https://yozora.guanghechen.com/docs/package/tokenizer-autolink
