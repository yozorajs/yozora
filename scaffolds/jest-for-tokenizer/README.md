<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.12/scaffolds/jest-for-tokenizer#readme">@yozora/jest-for-tokenizer</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/jest-for-tokenizer">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/jest-for-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/jest-for-tokenizer">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/jest-for-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/jest-for-tokenizer">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/jest-for-tokenizer.svg"
      />
    </a>
    <a href="https://github.com/nodejs/node">
      <img
        alt="Node.js Version"
        src="https://img.shields.io/node/v/@yozora/jest-for-tokenizer"
      />
    </a>
    <a href="https://github.com/facebook/jest">
      <img
        alt="Jest Version"
        src="https://img.shields.io/npm/dependency-version/@yozora/jest-for-tokenizer/peer/jest"
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

Jest util for testing yozora tokenizers.

## Install

- npm

  ```bash
  npm install --save-dev @yozora/jest-for-tokenizer
  ```

- yarn

  ```bash
  yarn add --dev @yozora/jest-for-tokenizer
  ```

## Usage

- Test with [@yozora/parser]

  ```typescript
  import { createTokenizerTester } from '@yozora/jest-for-tokenizer'
  import YozoraParser from '@yozora/parser'
  import CustomTokenizer from '../src'

  const parser = new YozoraParser({
    defaultParseOptions: {
      shouldReservePosition: true
    }
  })
    .useTokenizer(new CustomTokenizer())

  // Run official test cases
  createTokenizerTester(parser)
    .scan([
      'gfm/**/*.json',
      // The following cases are conflict when enabled GFM autolink (extension)
      // @see https://github.github.com/gfm/#autolinks-extension-
      '!gfm/**/#616.json',
      '!gfm/**/#619.json',
      '!gfm/**/#620.json',
    ])
    .scan('custom')
    .runTest()

  // Run custom test cases
  createTokenizerTester(parser)
    .scan('fixtures', __dirname)
    .runTest()
  ```

- Test with [@yozora/parser-gfm]

  ```typescript
  import { createTokenizerTester } from '@yozora/jest-for-tokenizer'
  import GfmParser from '@yozora/parser-gfm'
  import CustomTokenizer from '../src'

  const parser = new GfmParser({
    defaultParseOptions: {
      shouldReservePosition: true
    }
  })
    .useTokenizer(new CustomTokenizer())

  // Run official test cases
  createTokenizerTester(parser)
    .scan([
      'gfm/**/*.json',
      // The following cases only works when GFM extensions enabled.
      // @see https://github.github.com/gfm/#tables-extension-
      // @see https://github.github.com/gfm/#task-list-items-extension-
      // @see https://github.github.com/gfm/#strikethrough-extension-
      // @see https://github.github.com/gfm/#autolinks-extension-
      // @see https://github.github.com/gfm/#disallowed-raw-html-extension-
      '!gfm/autolink-extension/**/*',
      '!gfm/delete/**/*',
      '!gfm/list-item/task list items\\(extension\\)/**/*',
      '!gfm/table/**/*',
    ])
    .runTest()

  // Run custom test cases
  createTokenizerTester(parser)
    .scan('fixtures', __dirname)
    .runTest()
  ```

- Test with [@yozora/parser-gfm-ex]

  ```typescript
  import { createTokenizerTester } from '@yozora/jest-for-tokenizer'
  import GfmExParser from '@yozora/parser-gfm-ex'
  import CustomTokenizer from '../src'

  const parser = new GfmExParser({
    defaultParseOptions: {
      shouldReservePosition: true
    }
  })
    .useTokenizer(new CustomTokenizer())

  // Run official test cases
  createTokenizerTester(parser)
    .scan([
      'gfm/**/*.json',
      // The following cases are conflict when enabled GFM autolink (extension)
      // @see https://github.github.com/gfm/#example-616
      '!gfm/**/#616.json',
      '!gfm/**/#619.json',
      '!gfm/**/#620.json',
    ])
    .runTest()

  // Run custom test cases
  createTokenizerTester(parser)
    .scan('fixtures', __dirname)
    .runTest()
  ```

## Related

- [homepage][]
- [@yozora/parser][]
- [@yozora/parser-gfm][]
- [@yozora/parser-gfm-ex][]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.12/scaffolds/jest-for-tokenizer#readme
[@yozora/parser]: https://www.npmjs.com/package/@yozora/parser
[@yozora/parser-gfm]: https://www.npmjs.com/package/@yozora/parser-gfm
[@yozora/parser-gfm-ex]: https://www.npmjs.com/package/@yozora/parser-gfm-ex
