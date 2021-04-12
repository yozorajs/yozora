<header>
  <h1 align="center">
    <a href="https://github.com/guanghechen/yozora/tree/master/packages/ast-util#readme">@yozora/ast-util</a>
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

Utility functions to handle Yozora markdown ast

## Install

* npm

  ```bash
  npm install --save @yozora/ast-util
  ```

* yarn

  ```bash
  yarn add @yozora/ast-util
  ```

## Usage

Name                    | Description
:----------------------:|:-------------------------:
`calcHeadingToc`        | Generate heading toc, and update the referenced `Heading.identifier` simultaneously
`traverseAST`           | Traverse Yozora AST and perform a mutating operation for each matched node
`replaceAST`            | Traverse Yozora AST and perform a replacing operation for each matched node
`shallowCloneAst`       | Shallow clone the Yozora AST until the match reaches the termination condition.
`resolveUrlsForAst`     | Traverse Yozora AST and resolve urls for aim nodes
`defaultUrlResolver`    | Default url resolver


### Example

```typescript
import { ImageType, BlockquoteType } from '@yozora/ast'
import { traverseAST } from '@yozora/ast-util'

// traverse the Yozora AST and set the image title to the image alt
traverseAST(root, [ImageType], (node) => node.title = node.alt)

// traverse the Yozora AST and replace the image to two images.
replaceAST(root, [ImageType], (node) => [node, node])

// Generate heading toc, each toc node's identifier will with the prefix 'custom-identifier-prefix-'.
// The default prefix is 'heading-'
calcHeadingToc(root, 'custom-identifier-prefix-')

// shallow clone the Yozora AST until a blockquote type node with a blockquote 
// type parent and in addition it is not the first child of its parent encountered.
const root2 = shallowCloneAst(root, (node, parent, childIndex) => (
  parent.type === BlockquoteType && 
  childIndex > 0 && 
  node.type === BlockquoteType
))
```


## Related

[homepage]: https://github.com/guanghechen/yozora/tree/master/packages/ast-util#readme
