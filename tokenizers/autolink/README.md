<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink#readme">@yozora/tokenizer-autolink</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-autolink">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/tokenizer-autolink.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-autolink">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/tokenizer-autolink.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/tokenizer-autolink">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/tokenizer-autolink.svg"
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
        src="https://img.shields.io/node/v/@yozora/tokenizer-autolink"
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

Tokenizer for processing [GFM autolinks][].

See [documentation][] for details.

## Install

* npm

  ```bash
  npm install --save @yozora/tokenizer-autolink
  ```

* yarn

  ```bash
  yarn add @yozora/tokenizer-autolink
  ```

## Usage

[@yozora/tokenizer-autolink][] is already built-in [@yozora/parser][],
[@yozora/parser-gfm] and [@yozora/parser-gfm-ex].

Please note that [@yozora/tokenizer-autolink-extension][] is also integrated in
[@yozora/parser][] and [@yozora/parser-gfm-ex], which will cause the parsing
results of some use cases to be inconsistent with the results of [@yozora/parser-gfm][].
See [GFM autolinks (extension)][] for details

* Use with [@yozora/parser]

  ```typescript
  import YozoraParser from '@yozora/parser'

  const parser = new YozoraParser({ shouldReservePosition: true })
  parser.parse('http://foo.bar.baz')
  parser.parse('<http://foo.bar.baz>')
  ```

* Use with [@yozora/parser-gfm-ex]

  ```typescript
  import GfmExParser from '@yozora/parser-gfm-ex'

  const parser = new GfmExParser({ shouldReservePosition: true })
  parser.parse('http://foo.bar.baz')
  parser.parse('<http://foo.bar.baz>')
  ```

* Use with [@yozora/parser-gfm]

  ```typescript
  import GfmParser from '@yozora/parser-gfm'

  const parser = new GfmParser({ shouldReservePosition: true })
  parser.parse('<http://foo.bar.baz>')
  ```

* Use from scratch

  ```typescript {2,8}
  import { DefaultYastParser } from '@yozora/core-parser'
  import AutolinkTokenizer from '@yozora/tokenizer-autolink'

  const parser = new DefaultYastParser({ shouldReservePosition: true })
  parser
    .useBlockFallbackTokenizer(new ParagraphTokenizer())
    .useInlineFallbackTokenizer(new TextTokenizer())
    .useTokenizer(new AutolinkTokenizer())
  parser.parse('<http://foo.bar.baz>')
  ```

### Syntax

[Autolinks][gfm-autolink] are [absolute URI][gfm-absolute-uri]s and
[email addresses][gfm-email-address] inside `<` and `>`. They are parsed as
links, with the URL or email address as the link label.

A [URI autolink][gfm-uri-autolink] consists of `<`, followed by an
[absolute URI][gfm-absolute-uri] followed by `>`. It is parsed as a link to the
URI, with the URI as the link’s label.

An [absolute URI][gfm-absolute-uri], for these purposes, consists of a [scheme][gfm-schema]
followed by a colon (`:`) followed by zero or more characters other than ASCII
[whitespace][gfm-whitespace] and control characters, `<`, and `>`. If the URI
includes these characters, they must be percent-encoded (e.g. `%20` for a space).

For purposes of this spec, a [scheme][gfm-schema] is any sequence of $2–32$
characters beginning with an ASCII letter and followed by any combination of
ASCII letters, digits, or the symbols plus (`+`), period (`.`), or hyphen (`-`).

An [email autolink][gfm-email-autolink] consists of `<`, followed by an
[email address][gfm-email-address], followed by `>`. The link’s label is the
email address, and the URL is `mailto:` followed by the email address.

An [email address][gfm-email-address], for these purposes, is anything that
matches the [non-normative regex from the HTML5 spec](https://html.spec.whatwg.org/multipage/forms.html#e-mail-state-(type=email)):

  ```javascript
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  ```

* See **[github flavor markdown spec][gfm-autolink]** for details.
* See **[Live Examples][live-examples]** for an intuitive impression.


### Options

Name        | Type        | Required  | Default
:----------:|:-----------:|:---------:|:--------------:
`priority`  | `number`    | `false`   | `10`


* `priority`: Priority of the tokenizer, determine the order of processing,
  high priority priority execution. interruptable. In addition, in the `match-block`
  stage, a high-priority tokenizer can interrupt the matching process of a
  low-priority tokenizer.

## Related


* [@yozora/parser][]
* [@yozora/parser-gfm][]
* [@yozora/parser-gfm-ex][]
* [Link | Yozora AST][node-type]
* [Documentation][documentation]

[node-type]: http://yozora.guanghechen.com/docs/package/ast#link
[documentation]: https://yozora.guanghechen.com/docs/package/tokenizer-autolink
[live-examples]: https://yozora.guanghechen.com/docs/package/tokenizer-autolink#live-examples

[GFM autolinks]: https://github.github.com/gfm/#autolinks
[GFM autolinks (extension)]: https://github.github.com/gfm/#autolinks-extension-


[@yozora/tokenizer-autolink]: https://github.com/guanghechen/yozora/tree/master/tokenizers/autolink#readme
[@yozora/parser]: https://github.com/guanghechen/yozora/tree/master/packages/parser#readme
[@yozora/parser-gfm]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]: https://github.com/guanghechen/yozora/tree/master/packages/parser-gfm-ex#readme

<!-- placeholder:OuterGFMLinkDefinitions -->
[gfm-ascii-punctuation-character]:  https://github.github.com/gfm/#ascii-punctuation-character
[gfm-atx-heading]:                  https://github.github.com/gfm/#atx-heading
[gfm-autolink]:                     https://github.github.com/gfm/#autolinks
[gfm-autolink-extension]:           https://github.github.com/gfm/#autolinks-extension-
[gfm-blank-line]:                   https://github.github.com/gfm/#blank-line
[gfm-blockquote]:                   https://github.github.com/gfm/#block-quotes
[gfm-bullet-list]:                  https://github.github.com/gfm/#bullet-list
[gfm-container-block]:              https://github.github.com/gfm/#container-blocks
[gfm-character]:                    https://github.github.com/gfm/#character
[gfm-delete]:                       https://github.github.com/gfm/#strikethrough-extension-
[gfm-emphasis]:                     https://github.github.com/gfm/#can-open-emphasis
[gfm-fenced-code]:                  https://github.github.com/gfm/#fenced-code-block
[gfm-hard-line-break]:              https://github.github.com/gfm/#hard-line-break
[gfm-html-block]:                   https://github.github.com/gfm/#html-block
[gfm-html-inline]:                  https://github.github.com/gfm/#raw-html
[gfm-image]:                        https://github.github.com/gfm/#images
[gfm-image-description]:            https://github.github.com/gfm/#image-description
[gfm-indented-code]:                https://github.github.com/gfm/#indented-code-block
[gfm-info-string]:                  https://github.github.com/gfm/#info-string
[gfm-inline]:                       https://github.github.com/gfm/#inlines
[gfm-inline-code]:                  https://github.github.com/gfm/#code-span
[gfm-lazy-continuation-line]:       https://github.github.com/gfm/#lazy-continuation-line
[gfm-leaf-block]:                   https://github.github.com/gfm/#leaf-blocks
[gfm-line]:                         https://github.github.com/gfm/#line
[gfm-line-ending]:                  https://github.github.com/gfm/#line-ending
[gfm-link]:                         https://github.github.com/gfm/#inline-link
[gfm-link-destination]:             https://github.github.com/gfm/#link-destination
[gfm-definition]:                   https://github.github.com/gfm/#link-reference-definition
[gfm-link-label]:                   https://github.github.com/gfm/#link-label
[gfm-link-reference]:               https://github.github.com/gfm/#reference-link
[gfm-link-text]:                    https://github.github.com/gfm/#link-text
[gfm-link-title]:                   https://github.github.com/gfm/#link-title
[gfm-list]:                         https://github.github.com/gfm/#lists
[gfm-list-item]:                    https://github.github.com/gfm/#list-items
[gfm-list-task-item]:               https://github.github.com/gfm/#task-list-items-extension-
[gfm-non-whitespace-character]:     https://github.github.com/gfm/#non-whitespace-character
[gfm-ordered-list]:                 https://github.github.com/gfm/#ordered-list
[gfm-paragraph]:                    https://github.github.com/gfm/#paragraph
[gfm-paragraph-continuation-text]:  https://github.github.com/gfm/#paragraph-continuation-text
[gfm-punctuation-character]:        https://github.github.com/gfm/#punctuation-character
[gfm-setext-heading]:               https://github.github.com/gfm/#setext-heading
[gfm-soft-line-break]:              https://github.github.com/gfm/#soft-line-breaks
[gfm-space]:                        https://github.github.com/gfm/#space
[gfm-text]:                         https://github.github.com/gfm/#soft-line-breaks
[gfm-strong]:                       https://github.github.com/gfm/#can-open-strong-emphasis
[gfm-tab]:                          https://github.github.com/gfm/#tabs
[gfm-table]:                        https://github.github.com/gfm/#table
[gfm-thematic-break]:               https://github.github.com/gfm/#thematic-break
[gfm-unicode-whitespace]:           https://github.github.com/gfm/#unicode-whitespace
[gfm-unicode-whitespace-character]: https://github.github.com/gfm/#unicode-whitespace-character
[gfm-whitespace]:                   https://github.github.com/gfm/#whitespace
[gfm-whitespace-character]:         https://github.github.com/gfm/#whitespace-character
