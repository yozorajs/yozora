<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.17/packages/ast-util#readme">@yozora/ast-util</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/ast-util">
      <img
        alt="npm version"
        src="https://img.shields.io/npm/v/@yozora/ast-util.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/ast-util">
      <img
        alt="npm downloads"
        src="https://img.shields.io/npm/dm/@yozora/ast-util.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/ast-util">
      <img
        alt="npm license"
        src="https://img.shields.io/npm/l/@yozora/ast-util.svg"
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
        src="https://img.shields.io/node/v/@yozora/ast-util"
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

Utilities for collecting, transforming, searching, and annotating Yozora AST nodes.

## Install

```bash
npm install --save @yozora/ast-util
```

## Usage

| Area           | Main exports                                                                              |
| :------------- | :---------------------------------------------------------------------------------------- |
| Definitions    | `collectDefinitions`, `calcIdentifierSet`, `calcDefinitionMap`                            |
| Footnotes      | `collectFootnoteDefinitions`, `calcFootnoteDefinitionMap`, `replaceFootnotesInReferences` |
| Collection     | `collectNodes`, `collectInlineNodes`, `collectTexts`                                      |
| Traversal      | `traverseAst`, `searchNode`, `shallowCloneAst`                                            |
| Mutation       | `shallowMutateAstInPreorder`, `shallowMutateAstInPostorder` and their async variants      |
| Excerpts       | `calcExcerptAst`, `getExcerptAst`                                                         |
| Headings       | `calcHeadingToc`, `calcIdentifierFromNodes`                                               |
| Positions/URLs | `removePositions`, `resolveUrlsForAst`, `defaultUrlResolver`                              |

### Example

```typescript
import type { Root } from '@yozora/ast'
import {
  calcDefinitionMap,
  calcExcerptAst,
  calcHeadingToc,
} from '@yozora/ast-util'

declare const root: Root

const { definitionMap } = calcDefinitionMap(root)
const excerpt = calcExcerptAst(root, 200)
const toc = calcHeadingToc(root)
```

## Related

- [@yozora/ast][]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.17/packages/ast-util#readme
[@yozora/ast]: https://github.com/yozorajs/yozora/tree/v2.3.17/packages/ast#readme
