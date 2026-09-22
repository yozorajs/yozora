<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/markup#readme">@yozora/markup</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/markup">
      <img
        alt="npm version"
        src="https://img.shields.io/npm/v/@yozora/markup.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/markup">
      <img
        alt="npm downloads"
        src="https://img.shields.io/npm/dm/@yozora/markup.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/markup">
      <img
        alt="npm license"
        src="https://img.shields.io/npm/l/@yozora/markup.svg"
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
        src="https://img.shields.io/node/v/@yozora/markup"
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

Base classes, types, utilities, and node weavers for serializing Yozora AST nodes into Markdown.

## Install

```bash
npm install --save @yozora/markup
```

## Usage

`MarkupWeaver` has no node weavers registered by default. Register the node types your AST uses,
including `RootWeaver` for document-level escaping. This package only provides named exports.

```typescript
import { MarkupWeaver, ParagraphWeaver, RootWeaver, TextWeaver } from '@yozora/markup'

const weaver = new MarkupWeaver()
  .useWeaver(new RootWeaver())
  .useWeaver(new ParagraphWeaver())
  .useWeaver(new TextWeaver())

const paragraph = {
  type: 'paragraph',
  children: [{ type: 'text', value: 'Hello, Markdown!' }],
}

weaver.weave({ type: 'root', children: [paragraph] })
// => Hello, Markdown!
```

Implement `INodeWeaver` to support a custom node type and register it with `useWeaver`.

For a default set of node weavers, use the preset matching your parser:

- [@yozora/markup-gfm][] for `GfmParser`.
- [@yozora/markup-gfm-ex][] for `GfmExParser`.
- [@yozora/markup-yozora][] for `YozoraParser`.

The presets extend `MarkupWeaver` and re-export the base API. GFM Ex adds to GFM, and Yozora adds
its own node weavers to GFM Ex.

## Related

- [@yozora/ast][]
- [@yozora/markup-gfm][]
- [@yozora/markup-gfm-ex][]
- [@yozora/markup-yozora][]

[@yozora/ast]:           https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/packages/ast#readme
[@yozora/markup-gfm]:    https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/markup-gfm#readme
[@yozora/markup-gfm-ex]: https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/markup-gfm-ex#readme
[@yozora/markup-yozora]: https://github.com/yozorajs/yozora/tree/v3.0.0-alpha/markup/markup-yozora#readme
