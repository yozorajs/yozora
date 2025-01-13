<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.11/packages/ast-util#readme">@yozora/ast-util</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/ast-util">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/ast-util.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/ast-util">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/ast-util.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/ast-util">
      <img
        alt="Npm License"
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
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code Style: prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br/>

Utility functions to handle Yozora markdown ast.

## Install

- npm

  ```bash
  npm install --save @yozora/ast-util
  ```

- yarn

  ```bash
  yarn add @yozora/ast-util
  ```

## Usage

|              Name              |                                               Description                                               |
| :----------------------------: | :-----------------------------------------------------------------------------------------------------: |
|      `calcDefinitionMap`       |                    Traverse yozora ast and generate a link reference definition map.                    |
|        `calcExcerptAst`        |                                 Calc excerpt ast from the original ast.                                 |
|  `calcFootnoteDefinitionMap`   |                  Traverse yozora ast and generate a footnote reference definition map.                  |
|        `calcHeadingToc`        |           Generate heading toc, and update the referenced `Heading.identifier` simultaneously           |
|      `collectDefinitions`      |                      Collect link reference definitions in a pre-order traversal.                       |
|  `collectFootnoteDefinitions`  |                    Collect footnote reference definitions in a pre-order traversal.                     |
|      `defaultUrlResolver`      |                                          Default url resolver                                           |
| `replaceFootnotesInReferences` | Replace inline footnotes into footnote references and footnote reference definitions (**irreversible**) |
|      `resolveUrlsForAst`       |                  Traverse Yozora AST and resolve urls for aim nodes (**irreversible**)                  |
|          `searchNode`          |                          Search a node from Yozora AST in pre-order traversing                          |
|       `shallowCloneAst`        |             Shallow clone the Yozora AST until the match reaches the termination condition.             |
| `shallowMutateAstInPostorder`  |                              Traverse AST and replace nodes in post-order.                              |
|  `shallowMutateAstInPreorder`  |                              Traverse AST and replace nodes in pre-order.                               |
|         `traverseAst`          |               Traverse Yozora AST and perform a mutating operation for each matched node                |

### Example

```typescript
import { ImageType, BlockquoteType } from '@yozora/ast'
import {
  collectDefinitions,
  collectFootnoteDefinitions,
  calcHeadingToc,
  replaceAST,
  traverseAst,
} from '@yozora/ast-util'

// Collect definitions.
collectDefinitions(
  root,               // Yozora ast root
  [DefinitionType],   // aim Yast types, optional
  [],                 // preset definitions, optional
)

// Collect footnote definitions.
collectFootnoteDefinitions(
  root,                     // Yozora ast root
  [FootnoteDefinitionType], // aim Yast types, optional
  [],                       // preset footnote definitions, optional
  true,                     // prefer reference type footnotes, optional.
)

// traverse the Yozora AST and set the image title to the image alt
traverseAst(
  root,                           // Yozora ast root
  [ImageType],                    // aim Yast types, required
  (node) => node.title = node.alt // mutating operation, required
)

// Generate heading toc, each toc node's identifier will with the prefix 'custom-identifier-prefix-'.
// The default prefix is 'heading-'
calcHeadingToc(root, 'custom-identifier-prefix-')

// shallow clone the Yozora AST until a blockquote type node with a blockquote
// type parent and in addition it is not the first child of its parent encountered.
const root2 = shallowCloneAst(
  root,
  (node, parent, childIndex) => (
    parent.type === BlockquoteType &&
    childIndex > 0 &&
    node.type === BlockquoteType
  )
)
```

## Related

- [@yozora/ast][]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.11/packages/ast-util#readme
[@yozora/ast]: https://github.com/yozorajs/yozora/tree/v2.3.11/packages/ast#readme
