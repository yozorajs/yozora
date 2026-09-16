<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/gfm-ex#readme">@yozora/markup-gfm-ex</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/markup-gfm-ex">
      <img
        alt="npm version"
        src="https://img.shields.io/npm/v/@yozora/markup-gfm-ex.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/markup-gfm-ex">
      <img
        alt="npm downloads"
        src="https://img.shields.io/npm/dm/@yozora/markup-gfm-ex.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/markup-gfm-ex">
      <img
        alt="npm license"
        src="https://img.shields.io/npm/l/@yozora/markup-gfm-ex.svg"
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
        src="https://img.shields.io/node/v/@yozora/markup-gfm-ex"
      />
    </a>
    <a href="https://github.com/vitest-dev/vitest">
      <img
        alt="Tested with Vitest"
        src="https://img.shields.io/badge/tested_with-vitest-6E9F18.svg"
      />
    </a>
    <a href="https://biomejs.dev/">
      <img
        alt="Code style: Biome"
        src="https://img.shields.io/badge/code_style-biome-60a5fa.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br />


<!-- :end -->

Serialize the nodes produced by `GfmExParser`, including tables, strikethrough, and task lists.

## Install

```bash
npm install --save @yozora/markup-gfm-ex
```

## Usage

- `GfmExMarkupWeaver` is the default export. The named `DefaultMarkupWeaver` export refers to the same
  implementation. `MarkupWeaver` remains the base class for custom registrations.

  ```typescript
  import { DefaultMarkupWeaver } from '@yozora/markup-gfm-ex'

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
      },
      {
        "type": "heading",
        "depth": 1,
        "children": [
          {
            "type": "text",
            "value": "Heading"
          }
        ]
      }
    ]
  })

  // =>
  // emphasis: **foo "*bar*" foo**
  // # Heading
  ```

- Register a custom node weaver:

  ```typescript
  import type { Literal } from '@yozora/ast'
  import type { INodeMarkup, INodeWeaver } from '@yozora/markup-gfm-ex'
  import { DefaultMarkupWeaver } from '@yozora/markup-gfm-ex'

  type Mention = Literal<'mention'>
  class MentionWeaver implements INodeWeaver<Mention> {
    public readonly type = 'mention'
    public readonly isBlockLevel = (): boolean => false
    public weave(node: Mention): INodeMarkup {
      return { opener: '@' + node.value }
    }
  }

  const weaver = new DefaultMarkupWeaver()
  weaver.useWeaver(new MentionWeaver())

  weaver.weave({
    "type": "root",
    "children": [
      {
        "type": "paragraph",
        "children": [
          {
            "type": "mention",
            "value": "guanghechen"
          }
        ]
      }
    ]
  })
  // => @guanghechen
  ```

GFM Ex extends [`@yozora/markup-gfm`](../gfm/README.md) with its additional node weavers.

## Related

- [@yozora/ast][]
- [@yozora/parser-yozora][]
- [@yozora/parser-gfm][]
- [GitHub Flavored Markdown Spec][gfm-spec]
- [mdast][mdast-homepage]

[doc-yozora]: https://yozora.guanghechen.com
[docpage]: https://yozora.guanghechen.com/docs/package/markup-gfm-ex
[homepage]: https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/gfm-ex#readme

<!-- yozora package link definitions -->

[@yozora/ast]:                                https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/packages/ast#readme
[@yozora/markup]:                             https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/markup#readme
[@yozora/markup-gfm]:                         https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/gfm#readme
[@yozora/markup-gfm-ex]:                      https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/gfm-ex#readme
[@yozora/markup-yozora]:                      https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/yozora#readme
[@yozora/parser-gfm]:                         https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/parsers/parser-gfm#readme
[@yozora/parser-gfm-ex]:                      https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/parsers/parser-gfm-ex#readme
[@yozora/parser-yozora]:                      https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/parsers/parser-yozora#readme
[@yozora/tokenizer-admonition]:               https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-admonition#readme
[@yozora/tokenizer-autolink]:                 https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-autolink#readme
[@yozora/tokenizer-autolink-extension]:       https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-autolink-extension#readme
[@yozora/tokenizer-blockquote]:               https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-blockquote#readme
[@yozora/tokenizer-break]:                    https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-break#readme
[@yozora/tokenizer-definition]:               https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-definition#readme
[@yozora/tokenizer-delete]:                   https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-delete#readme
[@yozora/tokenizer-emphasis]:                 https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-emphasis#readme
[@yozora/tokenizer-fenced-code]:              https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-fenced-code#readme
[@yozora/tokenizer-heading]:                  https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-heading#readme
[@yozora/tokenizer-html-block]:               https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-html-block#readme
[@yozora/tokenizer-html-inline]:              https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-html-inline#readme
[@yozora/tokenizer-image]:                    https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-image#readme
[@yozora/tokenizer-image-reference]:          https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-image-reference#readme
[@yozora/tokenizer-indented-code]:            https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-indented-code#readme
[@yozora/tokenizer-inline-code]:              https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-inline-code#readme
[@yozora/tokenizer-inline-math]:              https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-inline-math#readme
[@yozora/tokenizer-link]:                     https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-link#readme
[@yozora/tokenizer-link-reference]:           https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-link-reference#readme
[@yozora/tokenizer-list]:                     https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-list#readme
[@yozora/tokenizer-math]:                     https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-math#readme
[@yozora/tokenizer-paragraph]:                https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-paragraph#readme
[@yozora/tokenizer-setext-heading]:           https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-setext-heading#readme
[@yozora/tokenizer-table]:                    https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-table#readme
[@yozora/tokenizer-text]:                     https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-text#readme
[@yozora/tokenizer-thematic-break]:           https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/tokenizers/tokenizer-thematic-break#readme

<!-- gfm link definitions -->

[gfm-spec]: https://github.github.com/gfm
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
