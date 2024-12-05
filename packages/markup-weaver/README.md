<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.9/packages/markup-weaver#readme">@yozora/markup-weaver</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/markup-weaver">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/markup-weaver.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/markup-weaver">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/markup-weaver.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/markup-weaver">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/markup-weaver.svg"
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
        src="https://img.shields.io/node/v/@yozora/markup-weaver"
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

This package is designed to weave the markup-like AST into markup contents.

## Install

- npm

  ```bash
  npm install --save @yozora/markup-weaver
  ```

- yarn

  ```bash
  yarn add @yozora/markup-weaver
  ```

## Usage

[@yozora/markup-weaver][] provide a `DefaultMarkupWeaver` to weave markup-like AST into markup
contents.

BTW, You can convert a piece of text into markup AST via [@yozora/parser][] or at
https://yozora.guanghechen.com.

- Here is a simple example to weave AST into markup contents, note that `position` is optional.

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
      },
      {
        "type": "heading",
        "depth": 1,
        "children": [
          {
            "type": "text",
            "value": "Setext headings"
          }
        ]
      }
    ]
  })

  // =>
  // emphasis: **foo "*bar*" foo**
  // # Setext headings
  ```

- Use custom weaver

  ```typescript
  import type { Literal } from '@yozora/ast'
  import type { INodeMarkup, INodeWeaver } from '@yozora/markup-weaver'
  import { DefaultMarkupWeaver } from '@yozora/markup-weaver'

  type Mention = Literal<'mention'>
  class MentionWeaver implements INodeWeaver<Mention> {
    public readonly type = 'mention'
    public readonly isBlockLevel = (): boolean => false
    public weave(node: Mention): INodeMarkup {
      return { opener: '@' + node.value }
    }
  }

  const weaver = new DefaultMarkupWeaver()
  weaver.useWeaver(new MentionWeaver)

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

## Related

- [@yozora/ast][]
- [@yozora/parser][]
- [@yozora/parser-gfm][]
- [Github Flavor Markdown Spec][gfm-spec]
- [Mdast][mdast-homepage]

[doc-yozora]: https://yozora.guanghechen.com
[docpage]: https://yozora.guanghechen.com/docs/package/markup-weaver
[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.9/packages/markup-weaver#readme

<!-- yozora package link definitions -->

[@yozora/ast]: https://github.com/yozorajs/yozora/tree/v2.3.9/packages/ast#readme
[@yozora/markup-weaver]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/packages/markup-weaver#readme
[@yozora/parser]: https://github.com/yozorajs/yozora/tree/v2.3.9/packages/parser#readme
[@yozora/parser-gfm]: https://github.com/yozorajs/yozora/tree/v2.3.9/packages/parser-gfm#readme
[@yozora/parser-gfm-ex]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/packages/parser-gfm-ex#readme
[@yozora/tokenizer-admonition]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/admonition#readme
[@yozora/tokenizer-autolink]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/autolink#readme
[@yozora/tokenizer-autolink-extension]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/autolink-extension#readme
[@yozora/tokenizer-blockquote]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/blockquote#readme
[@yozora/tokenizer-break]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/break#readme
[@yozora/tokenizer-definition]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/definition#readme
[@yozora/tokenizer-delete]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/delete#readme
[@yozora/tokenizer-emphasis]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/emphasis#readme
[@yozora/tokenizer-fenced-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/fenced-code#readme
[@yozora/tokenizer-heading]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/heading#readme
[@yozora/tokenizer-html-block]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/html-block#readme
[@yozora/tokenizer-html-inline]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/html-inline#readme
[@yozora/tokenizer-image]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/image#readme
[@yozora/tokenizer-image-reference]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/image-reference#readme
[@yozora/tokenizer-indented-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/indented-code#readme
[@yozora/tokenizer-inline-code]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/inline-code#readme
[@yozora/tokenizer-inline-math]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/inline-math#readme
[@yozora/tokenizer-link]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/link#readme
[@yozora/tokenizer-link-reference]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/link-reference#readme
[@yozora/tokenizer-list]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/list#readme
[@yozora/tokenizer-math]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/math#readme
[@yozora/tokenizer-paragraph]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/paragraph#readme
[@yozora/tokenizer-setext-heading]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/setext-heading#readme
[@yozora/tokenizer-table]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/table#readme
[@yozora/tokenizer-text]: https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/text#readme
[@yozora/tokenizer-thematic-break]:
  https://github.com/yozorajs/yozora/tree/v2.3.9/tokenizers/thematic-break#readme

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
