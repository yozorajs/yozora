<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme">@yozora/parser-gfm</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/parser-gfm">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/parser-gfm.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/parser-gfm">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/parser-gfm.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/parser-gfm">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/parser-gfm.svg"
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
        src="https://img.shields.io/node/v/@yozora/parser-gfm"
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

## Install

* npm

  ```bash
  npm install --save @yozora/parser-gfm
  ```

* yarn

  ```bash
  yarn add @yozora/parser-gfm
  ```

## Usage

See [@yozora/parser-gfm documentation](https://yozora.guanghechen.com/docs/package/parser-gfm) for details.

* GFM parser:

  ```typescript
  import { createGFMParser } from '@yozora/parser-gfm'

  const parser = createGFMParser({ shouldReservePosition: true })
  parser.parse('source content')
  ```

* GFM parser (extensions enabled):


  ```
  import { createExGFMParser } from '@yozora/parser-gfm'

  const parser = createExGFMParser({ shouldReservePosition: true })
  parser.parse('source content'
  ```

## Related

* Basic tokenizers:

  - [@yozora/tokenizer-autolink][] for resolving [Autolinks][autolinks].
  - [@yozora/tokenizer-blockquote][] for resolving [Block quotes][block-quotes].
  - [@yozora/tokenizer-break][] for resolving [Hard line breaks][hard-line-breaks] and [Soft line breaks][soft-line-breaks].
  - [@yozora/tokenizer-emphasis][] for resolving [Emphasis and strong emphasis][emphasis-and-strong-emphasis].
  - [@yozora/tokenizer-fenced-code][] for resolving [Fenced code blocks][fenced-code-blocks].
  - [@yozora/tokenizer-heading][] for resolving [ATX headings][atx-headings].
  - [@yozora/tokenizer-html-block][] for resolving [HTML blocks][html-blocks].
  - [@yozora/tokenizer-html-inline][] for resolving [Raw HTML][raw-html].
  - [@yozora/tokenizer-image][] for resolving [Images][images].
  - [@yozora/tokenizer-image-reference][] for resolving [Reference images][reference-images].
  - [@yozora/tokenizer-indented-code][] for resolving [Indented code blocks][indented-code-blocks].
  - [@yozora/tokenizer-inline-code][] for resolving [Code spans][code-spans].
  - [@yozora/tokenizer-link][] for resolving [Links][links].
  - [@yozora/tokenizer-link-definition][] for resolving [Link reference definitions][link-reference-definitions].
  - [@yozora/tokenizer-link-reference][] for resolving [Reference links][reference-links].
  - [@yozora/tokenizer-list][] for resolving [Lists][lists].
  - [@yozora/tokenizer-list-item][] for resolving [List items][list-items].
  - [@yozora/tokenizer-paragraph][] for resolving [Paragraphs][paragraphs].
  - [@yozora/tokenizer-setext-heading][] for resolving [Setext headings][setext-headings]
  - [@yozora/tokenizer-text][] for resolving [Textual content][textual-content]
  - [@yozora/tokenizer-thematic-break][] for resolving [Thematic break][thematic-break]

* Extension tokenizers:

  - [@yozora/tokenizer-autolink-extension][] for resolving [Autolinks (extension)](#autolinks-extension)
  - [@yozora/tokenizer-delete][] for resolving [Strikethrough (extension)](#strikethrough-extension)
  - [@yozora/tokenizer-list-item][] for resolving [Task list items (extension)](#task-list-items-extension)
  - [@yozora/tokenizer-table][] for resolving [Tables (extension)](#tables-extension)


[dcopage]: https://yozora.guanghechen.com/docs/package/parser-gfm
[homepage]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
[@yozora/tokenizer-autolink]:             https://github.com/guanghechen/yozora/tree/master/tokenizersautolink#readme
[@yozora/tokenizer-autolink-extension]:   https://github.com/guanghechen/yozora/tree/master/tokenizersautolink-extension#readme
[@yozora/tokenizer-blockquote]:           https://github.com/guanghechen/yozora/tree/master/tokenizersblockquote#readme
[@yozora/tokenizer-break]:                https://github.com/guanghechen/yozora/tree/master/tokenizersbreak#readme
[@yozora/tokenizer-delete]:               https://github.com/guanghechen/yozora/tree/master/tokenizersdelete#readme
[@yozora/tokenizer-emphasis]:             https://github.com/guanghechen/yozora/tree/master/tokenizersemphasis#readme
[@yozora/tokenizer-fenced-code]:          https://github.com/guanghechen/yozora/tree/master/tokenizersfenced-code#readme
[@yozora/tokenizer-heading]:              https://github.com/guanghechen/yozora/tree/master/tokenizersheading#readme
[@yozora/tokenizer-html-block]:           https://github.com/guanghechen/yozora/tree/master/tokenizershtml-block#readme
[@yozora/tokenizer-html-inline]:          https://github.com/guanghechen/yozora/tree/master/tokenizershtml-inline#readme
[@yozora/tokenizer-image]:                https://github.com/guanghechen/yozora/tree/master/tokenizersimage#readme
[@yozora/tokenizer-image-reference]:      https://github.com/guanghechen/yozora/tree/master/tokenizersimage-reference#readme
[@yozora/tokenizer-indented-code]:        https://github.com/guanghechen/yozora/tree/master/tokenizersindented-code#readme
[@yozora/tokenizer-inline-code]:          https://github.com/guanghechen/yozora/tree/master/tokenizersinline-code#readme
[@yozora/tokenizer-inline-formula]:       https://github.com/guanghechen/yozora/tree/master/tokenizersinline-formula#readme
[@yozora/tokenizer-link]:                 https://github.com/guanghechen/yozora/tree/master/tokenizerslink#readme
[@yozora/tokenizer-link-definition]:      https://github.com/guanghechen/yozora/tree/master/tokenizerslink-definition#readme
[@yozora/tokenizer-link-reference]:       https://github.com/guanghechen/yozora/tree/master/tokenizerslink-reference#readme
[@yozora/tokenizer-list]:                 https://github.com/guanghechen/yozora/tree/master/tokenizerslist#readme
[@yozora/tokenizer-list-item]:            https://github.com/guanghechen/yozora/tree/master/tokenizerslist-item#readme
[@yozora/tokenizer-paragraph]:            https://github.com/guanghechen/yozora/tree/master/tokenizersparagraph#readme
[@yozora/tokenizer-setext-heading]:       https://github.com/guanghechen/yozora/tree/master/tokenizerssetext-heading#readme
[@yozora/tokenizer-table]:                https://github.com/guanghechen/yozora/tree/master/tokenizerstable#readme
[@yozora/tokenizer-text]:                 https://github.com/guanghechen/yozora/tree/master/tokenizerstext#readme
[@yozora/tokenizer-thematic-break]:       https://github.com/guanghechen/yozora/tree/master/tokenizersthematic-break#readme

[autolinks]:                      https://yozora.guanghechen.com/docs/package/parser-gfm#autolinks
[block-quotes]:                   https://yozora.guanghechen.com/docs/package/parser-gfm#block-quotes
[hard-line-breaks]:               https://yozora.guanghechen.com/docs/package/parser-gfm#hard-line-breaks
[soft-line-breaks]:               https://yozora.guanghechen.com/docs/package/parser-gfm#soft-line-breaks
[emphasis-and-strong-emphasis]:   https://yozora.guanghechen.com/docs/package/parser-gfm#emphasis-and-strong-emphasis
[fenced-code-blocks]:             https://yozora.guanghechen.com/docs/package/parser-gfm#fenced-code-blocks
[atx-headings]:                   https://yozora.guanghechen.com/docs/package/parser-gfm#atx-headings
[html-blocks]:                    https://yozora.guanghechen.com/docs/package/parser-gfm#html-blocks
[raw-html]:                       https://yozora.guanghechen.com/docs/package/parser-gfm#raw-html
[images]:                         https://yozora.guanghechen.com/docs/package/parser-gfm#images
[reference-images]:               https://yozora.guanghechen.com/docs/package/parser-gfm#reference-images
[indented-code-blocks]:           https://yozora.guanghechen.com/docs/package/parser-gfm#indented-code-blocks
[code-spans]:                     https://yozora.guanghechen.com/docs/package/parser-gfm#code-spans
[links]:                          https://yozora.guanghechen.com/docs/package/parser-gfm#links
[link-reference-definitions]:     https://yozora.guanghechen.com/docs/package/parser-gfm#link-reference-definitions
[reference-links]:                https://yozora.guanghechen.com/docs/package/parser-gfm#reference-links
[lists]:                          https://yozora.guanghechen.com/docs/package/parser-gfm#lists
[list-items]:                     https://yozora.guanghechen.com/docs/package/parser-gfm#list-items
[paragraphs]:                     https://yozora.guanghechen.com/docs/package/parser-gfm#paragraphs
[setext-headings]:                https://yozora.guanghechen.com/docs/package/parser-gfm#setext-headings
[textual-content]:                https://yozora.guanghechen.com/docs/package/parser-gfm#textual-content
[thematic-break]:                 https://yozora.guanghechen.com/docs/package/parser-gfm#thematic-break
[autolinks-extension]:            https://yozora.guanghechen.com/docs/package/parser-gfm#autolinks-extension
[strikethrough-extension]:        https://yozora.guanghechen.com/docs/package/parser-gfm#strikethrough-extension
[task-list-items-extension]:      https://yozora.guanghechen.com/docs/package/parser-gfm#task-list-items-extension
[tables-extension]:               https://yozora.guanghechen.com/docs/package/parser-gfm#tables-extension
