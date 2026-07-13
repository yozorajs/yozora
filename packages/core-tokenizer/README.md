<!-- :begin use tokenizer/banner -->

<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.17/packages/core-tokenizer#readme">@yozora/core-tokenizer</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="npm version"
        src="https://img.shields.io/npm/v/@yozora/core-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="npm downloads"
        src="https://img.shields.io/npm/dm/@yozora/core-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="npm license"
        src="https://img.shields.io/npm/l/@yozora/core-tokenizer.svg"
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
        src="https://img.shields.io/node/v/@yozora/core-tokenizer"
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

[中文文档][homepage-zh]

Defines the shape of Yozora tokenizers and their lifecycle methods, as well as some utility
functions to assist in resolving tokens.

## Install

- npm

  ```bash
  npm install --save @yozora/core-tokenizer
  ```

## Usage

According to the parse strategy, there are two types of tokenizers: Block Tokenizer and Inline
Tokenizer.

### Block Tokenizer

The parsing steps of the block tokenizer are divided into two life cycles:

- `match-block`: Match a block node and get a `BlockToken`.

- `parse-block`: Parse `BlockToken` lists into Yozora AST nodes.

#### match-block phase

In the process of parsing block nodes, the content is read line by line. Block-level nodes have a
nested structure:

```markdown {2}
> This is a blockquote
> - This is a list item in blockquote
> - # This is a setext heading in the list item of the blockquote
> - > ...
```

As shown in the second line above, when parsing [ListItem][@yozora/tokenizer-list], it cannot get the
first character in the original document line directly, but waits for its ancestor elements along
the existing nested structure, such as the [Blockquote][@yozora/tokenizer-blockquote], to complete
matching before it gets an opportunity to match. To make tokenizers work with each other
transparently, the nested-structure parsing logic of the `match-block` phase is lifted into
[@yozora/core-parser][], using `IPhrasingContentLine` as the actual parsing unit of a line:

```typescript
export interface IPhrasingContentLine extends INodeInterval {
  /**
   * Array of INodePoint which contains all the contents of this line.
   */
  nodePoints: readonly INodePoint[]
  /**
   * The index of first non-blank character in the rest of the current line.
   */
  firstNonWhitespaceIndex: number
  /**
   * Visual width of the preceding indentation.
   */
  indentWidth: number
}
```

The lifecycle methods at this stage are subdivided into the following methods (see
[match-block][lifecycle-match-block] for the complete type definitions):

- `eatOpener`: (Required) Try to match a new block node.

- `eatAndInterruptPreviousSibling`: (Optional) Try to interrupt the previous sibling node and match
  a new block node.

- `eatContinuationText`: (Optional) Try to match the continuation text of the current block node;
  that is, consume the current `IPhrasingContentLine` with the current block node. There may be many
  kinds of results at this stage, distinguished by the returned `status`:

  - `notMatched`: Not matched.

  - `closing`: Matched, and this is the last line of the current block node. The current node is
    saturated and will close.

  - `opening`: Matched, and the current block node remains open.

  - `failedAndRollback`: Matching failed, and the content of the previous lines must be rolled back.
    It is assumed that rollback does not affect the previously satisfied nested structure.

  - `closingAndRollback`: Matching failed, but only the returned lines need to be rolled back. The
    current node remains valid and will close.

- `eatLazyContinuationText`: (Optional) Try to match lazy continuation text. The paragraph and table
  tokenizers currently implement this method. See
  https://github.github.com/gfm/#phase-1-block-structure step 3 for details.

- `onClose`: (Optional) Called before the current node closes to perform cleanup.

- `extractPhrasingContentLines`: (Optional) Convert a Block Token generated by the current tokenizer
  to `IPhrasingContentLine[]`. Override this method when matching this node type may require
  rollback.

- `buildBlockToken`: (Optional) Convert `IPhrasingContentLine[]` into a Block Token. Override this
  method when matching this node type may require rollback.

#### parse-block phase

This phase contains the following lifecycle method (see [parse-block][lifecycle-parse-block] for the
complete type definitions):

- `parse`: Convert a list of Block Tokens into Yozora AST nodes.

---

### Inline Tokenizer

The parsing steps of the inline tokenizer are divided into two life cycles:

- `match-inline`: Match inline content and get an `InlineToken`.
- `parse-inline`: Parse an `InlineToken` into a Yozora AST node.

#### match-inline phase

After a block node closes, matching inline nodes can begin, so inline matching receives continuous
text without the concept of lines. Inline nodes also have priorities; for example, links have a
higher priority than emphasis (see https://github.github.com/gfm/#example-529). To make tokenizers
work with each other transparently, priority-related logic is handled in [@yozora/core-parser][].
Each tokenizer provides four types of delimiters: `opener`, `both`, `closer`, and `full`. The
processor in [@yozora/core-parser][] completes the coordination work.

The lifecycle methods at this stage are subdivided into the following methods (see
[match-inline][lifecycle-match-inline] for the complete type definitions):

- `findDelimiter`: (Required) Find delimiters.
- `isDelimiterPair`: (Optional) Check whether the given two delimiters can pair.
- `processDelimiterPair`: (Optional) Process a delimiter pair, as in
  [@yozora/tokenizer-emphasis][].
- `processSingleDelimiter`: (Optional) Process a single delimiter, as in
  [@yozora/tokenizer-text][].

#### parse-inline phase

This phase contains the following lifecycle method (see [parse-inline][lifecycle-parse-inline] for
the complete type definitions):

- `parse`: Convert a list of Inline Tokens into Yozora AST nodes.

## Related

- [homepage][]

- Block Tokenizer Lifecycle

  - [match-block][lifecycle-match-block]
  - [parse-block][lifecycle-parse-block]

- Inline Tokenizer Lifecycle
  - [match-inline][lifecycle-match-inline]
  - [parse-inline][lifecycle-parse-inline]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.17/packages/core-tokenizer#readme
[homepage-zh]: ./README-zh.md
[lifecycle-match-block]:
  https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/match-block/hook.ts
[lifecycle-match-inline]:
  https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/match-inline/hook.ts
[lifecycle-parse-block]:
  https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/parse-block/hook.ts
[lifecycle-parse-inline]:
  https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/parse-inline/hook.ts
[@yozora/core-parser]: https://www.npmjs.com/package/@yozora/core-parser
[@yozora/tokenizer-blockquote]: https://www.npmjs.com/package/@yozora/tokenizer-blockquote
[@yozora/tokenizer-emphasis]: https://www.npmjs.com/package/@yozora/tokenizer-emphasis
[@yozora/tokenizer-list]: https://www.npmjs.com/package/@yozora/tokenizer-list
[@yozora/tokenizer-paragraph]: https://www.npmjs.com/package/@yozora/tokenizer-paragraph
[@yozora/tokenizer-text]: https://www.npmjs.com/package/@yozora/tokenizer-text
