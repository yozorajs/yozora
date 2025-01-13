<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/v2.3.11/packages/ast#readme">@yozora/ast</a>
  </h1>
  <div align="center">
    <a href="https://www.npmjs.com/package/@yozora/ast">
      <img
        alt="Npm Version"
        src="https://img.shields.io/npm/v/@yozora/ast.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/ast">
      <img
        alt="Npm Download"
        src="https://img.shields.io/npm/dm/@yozora/ast.svg"
      />
    </a>
    <a href="https://www.npmjs.com/package/@yozora/ast">
      <img
        alt="Npm License"
        src="https://img.shields.io/npm/l/@yozora/ast.svg"
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
        src="https://img.shields.io/node/v/@yozora/ast"
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

This package defined yozora markdown ast types and constants.

See [@yozora/ast documentation](https://yozora.guanghechen.com/docs/package/ast) for details.

## Install

- npm

  ```bash
  npm install --save @yozora/ast
  ```

- yarn

  ```bash
  yarn add @yozora/ast
  ```

## Core Types

### Node

```typescript
/**
 * Syntactic units of the yozora AST.
 * @see https://github.com/syntax-tree/unist#node
 */
export interface Node<T extends NodeType = NodeType> {
  /**
   * The variant of a node.
   */
  readonly type: T
  /**
   * Location of a node in a source document.
   * Must not be present if a node is generated.
   */
  position?: Position
}
```

### Parent

```typescript
/**
 * Nodes containing other nodes.
 * @see https://github.com/syntax-tree/mdast#parent
 */
export interface Parent<T extends NodeType = NodeType>
  extends Node<T> {
  /**
   * List representing the children of a node.
   */
  children: Node[]
}
```

### Alternative

```typescript
/**
 * Alternative represents a node with a fallback.
 * @see https://github.com/syntax-tree/mdast#alternative
 */
export interface Alternative {
  /**
   * Equivalent content for environments that cannot represent the
   * node as intended.
   */
  alt: string
}
```

### Association

```typescript
/**
 * An internal relation from one node to another.
 * @see https://github.com/syntax-tree/mdast#association
 */
export interface Association {
  /**
   * It can match an identifier field on another node.
   */
  identifier: string
  /**
   * The original value of the normalized identifier field.
   */
  label: string
}
```

### Literal

```typescript
/**
 * Nodes containing a value.
 */
export interface Literal<T extends NodeType = NodeType>
  extends Node<T> {
  /**
   * Literal value.
   */
  value: string
}
```

### Reference

```typescript
/**
 * A marker that is associated to another node.
 * @see https://github.com/syntax-tree/mdast#reference
 */
export interface Reference {
  /**
   * The explicitness of a reference:
   *  - shortcut: the reference is implicit, its identifier inferred from its content
   *  - collapsed: the reference is explicit, its identifier inferred from its content
   *  - full: the reference is explicit, its identifier explicitly set
   * @see https://github.com/syntax-tree/mdast#referencetype
   */
  referenceType: 'full' | 'collapsed' | 'shortcut'
}

```

### Resource

```typescript
/**
 * A reference to resource.
 * @see https://github.com/syntax-tree/mdast#resource
 */
export interface Resource {
  /**
   * A URL to the referenced resource.
   */
  url: string
  /**
   * Advisory information for the resource, such as would be
   * appropriate for a tooltip.
   */
  title?: string
}
```

### Point

```typescript
/**
 * One place in the source file.
 * @see https://github.com/syntax-tree/unist#point
 */
export interface Point {
  /**
   * Line in a source file.
   * @minimum 1
   */
  readonly line: number
  /**
   * Column column in a source file.
   * @minimum 1
   */
  readonly column: number
  /**
   * Character in a source file.
   * @minimum 0
   */
  readonly offset?: number
}
```

### Position

```typescript
/**
 * Location of a node in a source file.
 * @see https://github.com/syntax-tree/unist#position
 */
export interface Position {
  /**
   * Place of the first character of the parsed source region.
   */
  start: Point
  /**
   * Place of the first character after the parsed source region.
   */
  end: Point
  /**
   * start column at each index (plus start line) in the source region,
   * for elements that span multiple lines
   */
  indent?: number[]
}
```

### NodeType

```typescript
/**
 * Variant of a node of yozora AST.
 */
export type NodeType = string
```

### AlignType

```typescript
/**
 * AlignType represents how phrasing content is aligned
 * @see https://github.com/syntax-tree/mdast#aligntype
 */
export type AlignType = 'left' | 'right' | 'center' | null
```

## Yast nodes

### Admonition

```typescript
export const AdmonitionType = 'admonition'
export type AdmonitionType = typeof AdmonitionType

/**
 * Admonitions are block elements. The titles can include inline markdown and
 * the body can include any block markdown except another admonition.
 * @see https://github.com/elviswolcott/remark-admonitions
 */
export interface Admonition extends Parent<AdmonitionType> {
  /**
   * Keyword of an admonition.
   */
  keyword: 'note' | 'important' | 'tip' | 'caution' | 'warning' | string
  /**
   * Admonition title.
   */
  title: Node[]
}
```

### Blockquote

```typescript
export const BlockquoteType = 'blockquote'
export type BlockquoteType = typeof BlockquoteType

/**
 * Blockquote represents a section quoted from somewhere else.
 * @see https://github.com/syntax-tree/mdast#blockquote
 * @see https://github.github.com/gfm/#block-quotes
 */
export type Blockquote = Parent<BlockquoteType>
```

### Break

```typescript
export const BreakType = 'break'
export type BreakType = typeof BreakType

/**
 * Break represents a line break, such as in poems or addresses.
 * @see https://github.com/syntax-tree/mdast#break
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 */
export type Break = Node<BreakType>
```

### Code

```typescript
export const CodeType = 'code'
export type CodeType = typeof CodeType

/**
 * Code represents a block of preformatted text, such as ASCII art or computer
 * code.
 * @see https://github.com/syntax-tree/mdast#code
 * @see https://github.github.com/gfm/#code-fence
 */
export interface Code extends Literal<CodeType> {
  /**
   * Language of the codes
   */
  lang?: string
  /**
   * Meta info string
   */
  meta?: string
}
```

### Definition

```typescript
export const DefinitionType = 'definition'
export type DefinitionType = typeof DefinitionType

/**
 * Definition represents a resource.
 * @see https://github.com/syntax-tree/mdast#definition
 * @see https://github.github.com/gfm/#link-reference-definitions
 */
export interface Definition
  extends Node<DefinitionType>,
    Association,
    Resource {}
```

### Delete

```typescript
export const DeleteType = 'delete'
export type DeleteType = typeof DeleteType

/**
 * Delete represents contents that are no longer accurate or no longer relevant.
 * @see https://github.com/syntax-tree/mdast#delete
 * @see https://github.github.com/gfm/#strikethrough-extension-
 */
export type Delete = Parent<DeleteType>
```

### EcmaImport

````typescript
export const EcmaImportType = 'ecmaImport'
export type EcmaImportType = typeof EcmaImportType

/**
 * ECMAScript import statement (single-line).
 *
 * For example, the following ECMAScript import statements are supported:
 *
 *    ```typescript
 *    import '@yozora/parser'
 *    import Parser from '@yozora/parser'
 *    import Parser, { YozoraParserProps } from '@yozora/parser'
 *    import { YozoraParserProps } from '@yozora/parser'
 *    import { YozoraParser, YozoraParser as Parser } from '@yozora/parser'
 *    ```
 * But these are not supported case:
 *
 *    ```typescript
 *    import * as Parser '@yozora/parser'
 *    import {
 *      Parser
 *    } from '@yozora/parser'
 *    ```
 */
export interface EcmaImport extends Node<EcmaImportType> {
  /**
   * import Parser from '@yozora/parser'
   * ==> { moduleName: '@yozora/parser' }
   */
  moduleName: string
  /**
   * import Parser, { YozoraParserProps } from '@yozora/parser'
   * ==> { defaultImport: 'Parser' }
   */
  defaultImport: string | null
  /**
   * import { YozoraParserProps, YozoraParser as Parser } from '@yozora/parser'
   * ==>  {
   *        namedImports: [
   *          { src: 'YozoraParserProps', alias: null },
   *          { src: 'YozoraParser', alias: 'Parser' },
   *        ]
   *      }
   */
  namedImports: EcmaImportNamedImport[]
}

/**
 * import { YozoraParserProps, YozoraParser as Parser } from '@yozora/parser'
 * ==>  [
 *        { src: 'YozoraParserProps', alias: null },
 *        { src: 'YozoraParser', alias: 'Parser' },
 *      ]
 */
export type EcmaImportNamedImport = { src: string, alias: string | null }
````

### Emphasis

```typescript
export const EmphasisType = 'emphasis'
export type EmphasisType = typeof EmphasisType

/**
 * Emphasis represents stress emphasis of its contents.
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type Emphasis = Parent<EmphasisType>
```

### Footnote

```typescript
export const FootnoteType = 'footnote'
export type FootnoteType = typeof FootnoteType

/**
 * Footnote represents content relating to the document that is outside its flow.
 * @see https://github.com/syntax-tree/mdast#footnote
 */
export type Footnote = Parent<FootnoteType>
```

### FootnoteDefinition

```typescript
export const FootnoteDefinitionType = 'footnoteDefinition'
export type FootnoteDefinitionType = typeof FootnoteDefinitionType

/**
 * FootnoteDefinition represents content relating to the document that is
 * outside its flow.
 * @see https://github.com/syntax-tree/mdast#footnotedefinition
 */
export interface FootnoteDefinition
  extends Parent<FootnoteDefinitionType>, Association {}
```

### FootnoteReference

```typescript
export const FootnoteReferenceType = 'footnoteReference'
export type FootnoteReferenceType = typeof FootnoteReferenceType

/**
 * FootnoteReference represents a marker through association.
 *
 * Similar to imageReference and linkReference, the difference is that it has
 * only 'collapsed' reference type instead of 'full' and 'shortcut'
 * @see https://github.com/syntax-tree/mdast#footnotereference
 * @see https://github.com/syntax-tree/mdast#imagereference
 * @see https://github.com/syntax-tree/mdast#linkreference
 */
export interface FootnoteReference
  extends Node<FootnoteReferenceType>, Association {}
```

### Frontmatter (not supportted yet)

```typescript
export const FrontmatterType = 'frontmatter'
export type FrontmatterType = typeof FrontmatterType

/**
 * Frontmatter content represent out-of-band information about the document.
 * @see https://github.com/syntax-tree/mdast#frontmattercontent
 * @see https://github.com/syntax-tree/mdast#yaml
 * @see https://github.github.com/gfm/#code-fence
 */
export interface Frontmatter extends Literal<FrontmatterType> {
  /**
   * Language of the frontmatter
   * @default 'yaml'
   */
  lang: string
  /**
   * Meta info string
   */
  meta?: string
}
```

### Heading

```typescript
export const HeadingType = 'heading'
export type HeadingType = typeof HeadingType

/**
 * Heading represents a heading of a section.
 * @see https://github.com/syntax-tree/mdast#heading
 * @see https://github.github.com/gfm/#atx-heading
 */
export interface Heading extends Parent<HeadingType> {
  /**
   * level of heading
   */
  depth: 1 | 2 | 3 | 4 | 5 | 6
}
```

### Html

```typescript
export const HtmlType = 'html'
export type HtmlType = typeof HtmlType

/**
 * HTML (Literal) represents a fragment of raw HTML.
 * @see https://github.com/syntax-tree/mdast#html
 * @see https://github.github.com/gfm/#html-blocks
 * @see https://github.github.com/gfm/#raw-html
 */
export type Html = Literal<HtmlType>
```

### Image

```typescript
export const ImageType = 'image'
export type ImageType = typeof ImageType

/**
 * Image represents an image.
 * @see https://github.com/syntax-tree/mdast#image
 * @see https://github.github.com/gfm/#images
 */
export interface Image
  extends Node<ImageType>,
    Resource,
    Alternative {}
```

### ImageReference

```typescript
export const ImageReferenceType = 'imageReference'
export type ImageReferenceType = typeof ImageReferenceType

/**
 * ImageReference represents an image through association, or its original
 * source if there is no association.
 * @see https://github.github.com/gfm/#images
 * @see https://github.com/syntax-tree/mdast#imagereference
 */
export interface ImageReference
  extends Node<ImageReferenceType>,
    Association,
    Reference,
    Alternative {}
```

### InlineCode

```typescript
export const InlineCodeType = 'inlineCode'
export type InlineCodeType = typeof InlineCodeType

/**
 * InlineCode represents a fragment of computer code, such as a file name,
 * computer program, or anything a computer could parse.
 * @see https://github.com/syntax-tree/mdast#inline-code
 * @see https://github.github.com/gfm/#code-span
 */
export type InlineCode = Literal<InlineCodeType>
```

### InlineMath

```typescript
export const InlineMathType = 'inlineMath'
export type InlineMathType = typeof InlineMathType

/**
 * Inline math content.
 */
export type InlineMath = Literal<InlineMathType>
```

### Link

```typescript
export const LinkType = 'link'
export type LinkType = typeof LinkType

/**
 * Link represents a hyperlink.
 * @see https://github.com/syntax-tree/mdast#link
 * @see https://github.github.com/gfm/#inline-link
 */
export interface Link extends Parent<LinkType>, Resource {}
```

### LinkReference

```typescript
export const LinkReferenceType = 'linkReference'
export type LinkReferenceType = typeof LinkReferenceType

/**
 * LinkReference represents a hyperlink through association, or its original
 * source if there is no association.
 * @see https://github.com/syntax-tree/mdast#linkreference
 * @see https://github.github.com/gfm/#reference-link
 */
export interface LinkReference
  extends Parent<LinkReferenceType>,
    Association,
    Reference {}
```

### List

```typescript
export const ListType = 'list'
export type ListType = typeof ListType

/**
 * List represents a list of items.
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 */
export interface List extends Parent<ListType> {
  /**
   * Whether it is an ordered lit.
   */
  ordered: boolean
  /**
   * Marker type of the list.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ol#attr-type
   *
   * The 'i' and 'I' which represented the roman numerals are not supported yet.
   */
  orderType?: '1' | 'a' | 'A' | 'i' | 'I'
  /**
   * The starting number of a ordered list-item.
   */
  start?: number
  /**
   * Marker of a unordered list-item, or delimiter of an ordered list-item.
   */
  marker: number
  /**
   * Whether if the list is loose.
   * @see https://github.github.com/gfm/#loose
   */
  spread: boolean
  /**
   * Lists are container block.
   */
  children: ListItem[]
}
```

### ListItem

```typescript
export const ListItemType = 'listItem'
export type ListItemType = typeof ListItemType

/**
 * Status of a task list item.
 * @see https://github.github.com/gfm/#task-list-items-extension-
 */
export enum TaskStatus {
  /**
   * To do, not yet started.
   */
  TODO = 'todo',
  /**
   * In progress.
   */
  DOING = 'doing',
  /**
   * Completed.
   */
  DONE = 'done',
}

/**
 * ListItem represents an item in a List.
 * @see https://github.com/syntax-tree/mdast#listitem
 * @see https://github.github.com/gfm/#list-items
 */
export interface ListItem extends Parent<ListItemType> {
  /**
   * Status of a todo task.
   */
  status?: TaskStatus
}
```

### Math

```typescript
export const MathType = 'math'
export type MathType = typeof MathType

/**
 * Math content.
 */
export type Math = Literal<MathType>
```

### Paragraph

```typescript
export const ParagraphType = 'paragraph'
export type ParagraphType = typeof ParagraphType

/**
 * Paragraph represents a unit of discourse dealing with a particular
 * point or idea.
 * @see https://github.com/syntax-tree/mdast#paragraph
 * @see https://github.github.com/gfm/#paragraphs
 */
export type Paragraph = Parent<ParagraphType>
```

### Root

```typescript
export const RootType = 'root'
export type RootType = typeof RootType

/**
 * Root node of the AST.
 * @see https://github.com/syntax-tree/unist#root
 */
export type Root = Parent<RootType>
```

### Strong

```typescript
export const StrongType = 'strong'
export type StrongType = typeof StrongType

/**
 * Strong represents strong importance, seriousness, or urgency for its
 * contents.
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type Strong = Parent<StrongType>
```

### Table

```typescript
export const TableType = 'table'
export type TableType = typeof TableType

/**
 * Table column configs.
 */
export interface TableColumn {
  /**
   * An align field can be present. If present, it must be a list of alignTypes.
   * It represents how cells in columns are aligned.
   */
  align: AlignType
}

/**
 * @see https://github.github.com/gfm/#table
 * @see https://github.com/syntax-tree/mdast#table
 */
export interface Table extends Parent<TableType> {
  /**
   * Table column configuration items
   */
  columns: TableColumn[]
  /**
   * Table rows (include table headers)
   */
  children: TableRow[]
}
```

### TableCell

```typescript
export const TableCellType = 'tableCell'
export type TableCellType = typeof TableCellType

/**
 * TableCell represents a header cell in a Table, if its parent is a head,
 * or a data cell otherwise.
 * @see https://github.com/syntax-tree/mdast#tablecell
 * @see https://github.github.com/gfm/#tables-extension-
 */
export type TableCell = Parent<TableCellType>
```

### TableRow

```typescript
export const TableRowType = 'tableRow'
export type TableRowType = typeof TableRowType

/**
 * TableRow represents a row of cells in a table.
 * @see https://github.com/syntax-tree/mdast#tablerow
 * @see https://github.github.com/gfm/#tables-extension-
 */
export interface TableRow extends Parent<TableRowType> {
  /**
   * Table cells
   */
  children: TableCell[]
}
```

### Text

```typescript
export const TextType = 'text'
export type TextType = typeof TextType

/**
 * Text represents everything that is just text.
 * @see https://github.com/syntax-tree/mdast#text
 * @see https://github.github.com/gfm/#textual-content
 */
export type Text = Literal<TextType>
```

### ThematicBreak

```typescript
export const ThematicBreakType = 'thematicBreak'
export type ThematicBreakType = typeof ThematicBreakType

/**
 * ThematicBreak represents a thematic break, such as a scene change in
 * a story, a transition to another topic, or a new document.
 * @see https://github.com/syntax-tree/mdast#thematicbreak
 * @see https://github.github.com/gfm/#thematic-break
 */
export type ThematicBreak = Node<ThematicBreakType>
```

## Related

- [Github Flavor Markdown Spec][gfm-spec]
- [Mdast][mdast-homepage]

[homepage]: https://github.com/yozorajs/yozora/tree/v2.3.11/packages/ast#readme
[gfm-spec]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast
