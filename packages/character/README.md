<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.17/packages/character#readme">@yozora/character</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/character">
      <img
        alt="npm version"
        src="https://img.shields.io/npm/v/@yozora/character.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/character">
      <img
        alt="npm downloads"
        src="https://img.shields.io/npm/dm/@yozora/character.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/character">
      <img
        alt="npm license"
        src="https://img.shields.io/npm/l/@yozora/character.svg"
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
        src="https://img.shields.io/node/v/@yozora/character"
      />
    </a>
    <a href="https://github.com/vitest-dev/vitest">
      <img
        alt="Tested with Vitest"
        src="https://img.shields.io/badge/tested_with-vitest-6E9F18.svg"
      />
    </a>
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code style: Prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br />


<!-- :end -->

Character primitives used by Yozora tokenizers: code-point constants, character predicates,
source-position tracking, entity references, and Unicode case folding.

## Install

```bash
npm install --save @yozora/character
```

## Usage

```typescript
import {
  createNodePointGenerator,
  foldCase,
  isPunctuationCharacter,
} from '@yozora/character'

const points = [...createNodePointGenerator('Hello, 世界')]
const identifier = foldCase('Yozora')
const commaIsPunctuation = isPunctuationCharacter(','.codePointAt(0)!)
```

Key exports include:

- `AsciiCodePoint`, Unicode category enums, and `VirtualCodePoint`
- ASCII/Unicode whitespace, punctuation, control, digit, and letter predicates
- `createNodePointGenerator` and helpers for reading text from node-point intervals
- named and numeric entity-reference parsing
- `foldCase`, `stripChineseCharacters`, and `tightenChineseCharacters`

## Related

- [homepage][]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.17/packages/character#readme
