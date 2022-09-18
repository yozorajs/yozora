<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/core-tokenizer#readme">@yozora/core-tokenizer</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/core-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/core-tokenizer.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/core-tokenizer">
      <img
        alt="Npm License"
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
    <a href="https://github.com/prettier/prettier">
      <img
        alt="Code Style: prettier"
        src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"
      />
    </a>
  </div>
</header>
<br/>


[中文文档][homepage-zh]

Defines the shape of Yozora Tokenizer and life cycle methods, as well as some
utility functions to assist in resolving tokens.


## Install

* npm

  ```bash
  npm install --save @yozora/core-tokenizer
  ```

* yarn

  ```bash
  yarn add @yozora/core-tokenizer
  ```


## Usage

According to the Parse Strategy, there are two types of tokenizers: Block
Tokenizer and Inline tokenizer.

### Block Tokenizer

The parsing steps of the block tokenizer are divided into three life cycles:

* `match-block`: match a block node and get a `BlockToken`

* `parse-block`: Parse `BlockTokens` into a YAST nodes

#### match-block phase

In the process of parsing block nodes, the content is read line by line. The
block-level node has a nested structure:

```markdown {2}
> This is a blockquote
> - This is a list item in blockquote
> - # This is a setext heading in the list item of the blockquote
> - > ...
```

As shown in the second line of the above code, when parsing
[ListItem][@yozora/tokenizer-list], it cannot get the first character in
the original document line, but wait for its ancestor elements along the
existing nesting structure (such as the above [Blockquote][@yozora/tokenizer-blockquote])
to complete the matching, and then gets a matching opportunity. In order to make
the tokenizers work with each other transparently, when designing the life cycle
methods of the block-level tokenizer in the `match-block` stage, the parsing
logic of the nested structure lifted into [@yozora/core-parser ][], and use a
special data structure called `PhrasingContentLine` as the actual parsing unit
of a line:

```typescript
export interface PhrasingContentLine {
  /**
   * Start index of interval in nodePoints.
   */
  startIndex: number
  /**
   * End index of interval in nodePoints.
   */
  endIndex: number
  /**
   * Array of NodePoint which contains all the contents of this line.
   */
  nodePoints: ReadonlyArray<NodePoint>
  /**
   * The index of first non-blank character in the rest of the current line
   */
  firstNonWhitespaceIndex: number
  /**
   * The precede space count, one tab equals four space.
   * @see https://github.github.com/gfm/#tabs
   */
  countOfPrecedeSpaces: number
}
```

The life cycle methods at this stage is subdivided into the following methods
(see [match-block][lifecycle-match-block] for the type definition details):

* `eatOpener`: (Required) Try to match a new block node.

* `eatAndInterruptPreviousSibling`: (optional) try to interrupt the previous
  sibling node and match a new block node.

* `eatContinuationText`: (Optional) Try to match the continuation text of current
  block node, that is, consume the current `PhrasingContentLine` with the current
  block node. There may be many kinds of results at this stage, which are
  distinguished according to the value of `status` in the returned result:

  - `notMatched`: Not matched.

  - `closing`: Matched and this is the last line of the current block node.
    That is, the current block node is in a saturated state and is closing.

  - `opening`: Matched, and not closing yet.

  - `failedAndRollback`: The match fails, and the content of the previous lines
    are to be rolled back. For convenience, it is assumed that the rollback
    operation does not affect the previously satisfied nested structure.

  - `closingAndRollback`: Matching failed, but only the last line needs to be
    rollback, the current node is still a valid one and will be closed soon.

* `eatLazyContinuationText`: (Optional) Try to match Laziness Continuation Text.
  Actually only the [@yozora/tokenizer-paragraph][] needs to implement this
  method, see https://github.github.com/gfm/#phase-1-block-structure step3
  for details.

* `onClose`: (Optional) Called when the current node is closed, used to perform
* some cleanup operations.

* `extractPhrasingContentLines`: (Optional) Convert a Block Token generated by
  the current tokenizer to `PhrasingContentLines[]`. This method is only needed
  when the matching node of this type may be rolled back.

* `buildBlockToken`: (Optional) Convert `PhrasingContentLines[]` into a Block Token.
  This method is only needed when the matching node of this type may be rolled back

#### parse-block phase

The life cycle methods at this stage is subdivided into the following methods
(see [parse-block][lifecycle-parse-block] for the complete type definition):

* `parseBlock`: Convert a Block Token into Yast Node

---

### Inline Tokenizer

The parsing step of the inline parser is divided into two life cycles

* `match-inline`: Match the inline contents and get an `InlineToken`
* `parse-inline`: Parse an `InlineToken` into a YAST node

#### match-inline phase

After a block node is closed, we can start matching inline nodes, so when we
match inline nodes, we get a continuous text without the concept of "line".
But inline nodes have priority. For example, link has a higher priority than
emphasis (see https://github.github.com/gfm/#example-529). In order to enable
unperceptual coordination between tokenizers, when designing the life cycle
function of the inline tokenizer in the `match-inline` phase, put priority-related
logic in [@yozora/core-parser][] In processing, each tokenizer only provides
four types of separators: `opener`, `both`, `closer`, `full`. Then the
processor in [@yozora/core-parser][] completes the coordination work.

The lifecycle methods at this stage is subdivided into the following methods
(see [match-inline][lifecycle-match-inline] for the complete type definition):

* `findDelimiter`: (Required) Find a delimiter
* `isDelimiterPair`: (Optional) Check whether the given two delimiters can match
* `processDelimiterPair`: (Optional) Process the matched two delimiters. Such as [@yozora/tokenizer-emphasis][] 
* `processSingleDelimiter`:  (Optional) Process a single delimiter. Such as [@yozora/tokenizer-text][] 

#### parser-inline phase

The lifecycle methods at this stage is subdivided into the following methods
(see [parse-inline][lifecycle-pase-inline] for the complete type definition):

* `processToken`: (Required) Convert an Inline Token to a YAST node.

## Related

* [homepage][]

* [@yozora/template-tokenizer][] For creating a Yozora Tokenizer.

* Block Tokenizer Lifecycle
  - [match-block][lifecycle-match-block]
  - [parse-block][lifecycle-parse-block]

* Inline Tokenizer Lifecycle
  - [match-inline][lifecycle-match-inline]
  - [parse-inline][lifecycle-parse-inline]


[homepage]: https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/core-tokenizer#readme
[homepage-zh]: https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/core-tokenizer/README-zh.md
[lifecycle-match-block]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/match-block.ts
[lifecycle-match-inline]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/match-inline.ts
[lifecycle-parse-block]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/parse-block.ts
[lifecycle-parse-inline]: https://github.com/yozorajs/yozora/blob/main/packages/core-tokenizer/src/types/lifecycle/parse-inline.ts
[@yozora/core-parser]: https://www.npmjs.com/package/@yozora/core-parser
[@yozora/template-tokenizer]: https://www.npmjs.com/package/@yozora/template-tokenizer
[@yozora/tokenizer-blockquote]: https://www.npmjs.com/package/@yozora/tokenizer-blockquote
[@yozora/tokenizer-emphasis]: https://www.npmjs.com/package/@yozora/tokenizer-emphasis
[@yozora/tokenizer-list]: https://www.npmjs.com/package/@yozora/tokenizer-list
[@yozora/tokenizer-paragraph]: https://www.npmjs.com/package/@yozora/tokenizer-paragraph
[@yozora/tokenizer-text]: https://www.npmjs.com/package/@yozora/tokenizer-text
