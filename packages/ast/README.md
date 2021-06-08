<header>
  <h1 align="center">
    <a href="https://github.com/yozorajs/yozora/tree/main/packages/ast#readme">@yozora/ast</a>
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

* npm

  ```bash
  npm install --save @yozora/ast
  ```

* yarn

  ```bash
  yarn add @yozora/ast
  ```

## Core Types

### YastNode

```typescript
/**
 * Syntactic units of the yozora AST.
 * @see https://github.com/syntax-tree/unist#node
 */
export interface YastNode<T extends YastNodeType = YastNodeType> {
  /**
   * The variant of a node.
   */
  readonly type: T
  /**
   * Location of a node in a source document.
   * Must not be present if a node is generated.
   */
  position?: YastNodePosition
}
```

### YastParent

```typescript
/**
 * Nodes containing other nodes.
 * @see https://github.com/syntax-tree/mdast#parent
 */
export interface YastParent<T extends YastNodeType = YastNodeType>
  extends YastNode<T> {
  /**
   * List representing the children of a node.
   */
  children: YastNode[]
}
```

### YastAlternative

```typescript
/**
 * Alternative represents a node with a fallback.
 * @see https://github.com/syntax-tree/mdast#alternative
 */
export interface YastAlternative {
  /**
   * Equivalent content for environments that cannot represent the
   * node as intended.
   */
  alt: string
}
```

### YastAssociation

```typescript
/**
 * An internal relation from one node to another.
 * @see https://github.com/syntax-tree/mdast#association
 */
export interface YastAssociation {
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

### YastLiteral

```typescript
/**
 * Nodes containing a value.
 */
export interface YastLiteral<T extends YastNodeType = YastNodeType>
  extends YastNode<T> {
  /**
   * Literal value.
   */
  value: string
}
```

### YastReference

```typescript
/**
 * A marker that is associated to another node.
 * @see https://github.com/syntax-tree/mdast#reference
 */
export interface YastReference {
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

### YastResource

```typescript
/**
 * A reference to resource.
 * @see https://github.com/syntax-tree/mdast#resource
 */
export interface YastResource {
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

### YastNodePoint

```typescript
/**
 * One place in the source file.
 * @see https://github.com/syntax-tree/unist#point
 */
export interface YastNodePoint {
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

### YastNodePosition

```typescript
/**
 * Location of a node in a source file.
 * @see https://github.com/syntax-tree/unist#position
 */
export interface YastNodePosition {
  /**
   * Place of the first character of the parsed source region.
   */
  start: YastNodePoint
  /**
   * Place of the first character after the parsed source region.
   */
  end: YastNodePoint
  /**
   * start column at each index (plus start line) in the source region,
   * for elements that span multiple lines
   */
  indent?: number[]
}
```

### YastNodeType

```typescript
/**
 * Variant of a node of yozora AST.
 */
export type YastNodeType = string
```

### YastAlignType

```typescript
/**
 * AlignType represents how phrasing content is aligned
 * @see https://github.com/syntax-tree/mdast#aligntype
 */
export type YastAlignType = 'left' | 'right' | 'center' | null
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
export interface Admonition extends YastParent<AdmonitionType> {
  /**
   * Keyword of an admonition.
   */
  keyword: 'note' | 'important' | 'tip' | 'caution' | 'warning' | string
  /**
   * Admonition title.
   */
  title: YastNode[]
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
export type Blockquote = YastParent<BlockquoteType>
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
export type Break = YastNode<BreakType>
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
export interface Code extends YastLiteral<CodeType> {
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
  extends YastNode<DefinitionType>,
    YastAssociation,
    YastResource {}
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
export type Delete = YastParent<DeleteType>
```

### Emphasis

```typescript
export const EmphasisType = 'emphasis'
export type EmphasisType = typeof EmphasisType

/**
 * Emphasis represents stress emphasis of its contents.
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 */
export type Emphasis = YastParent<EmphasisType>
```

### Footnote

```typescript
export const FootnoteType = 'footnote'
export type FootnoteType = typeof FootnoteType

/**
 * Footnote represents content relating to the document that is outside its flow.
 * @see https://github.com/syntax-tree/mdast#footnote
 */
export type Footnote = YastParent<FootnoteType>
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
  extends YastParent<FootnoteDefinitionType>, YastAssociation {}
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
  extends YastNode<FootnoteReferenceType>, YastAssociation {}
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
export interface Frontmatter extends YastLiteral<FrontmatterType> {
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
export interface Heading extends YastParent<HeadingType> {
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
export type Html = YastLiteral<HtmlType>
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
  extends YastNode<ImageType>,
    YastResource,
    YastAlternative {}
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
  extends YastNode<ImageReferenceType>,
    YastAssociation,
    YastReference,
    YastAlternative {}
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
export type InlineCode = YastLiteral<InlineCodeType>
```

### InlineMath

```typescript
export const InlineMathType = 'inlineMath'
export type InlineMathType = typeof InlineMathType

/**
 * Inline math content.
 */
export type InlineMath = YastLiteral<InlineMathType>
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
export interface Link extends YastParent<LinkType>, YastResource {}
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
  extends YastParent<LinkReferenceType>,
    YastAssociation,
    YastReference {}
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
export interface List extends YastParent<ListType> {
  /**
   * Whether it is an ordered lit.
   */
  ordered: boolean
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
export interface ListItem extends YastParent<ListItemType> {
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
export type Math = YastLiteral<MathType>
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
export type Paragraph = YastParent<ParagraphType>
```

### Root

```typescript
export const RootType = 'root'
export type RootType = typeof RootType

/**
 * Root node of the AST.
 * @see https://github.com/syntax-tree/unist#root
 */
export type Root = YastParent<RootType>
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
export type Strong = YastParent<StrongType>
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
  align: YastAlignType
}

/**
 * @see https://github.github.com/gfm/#table
 * @see https://github.com/syntax-tree/mdast#table
 */
export interface Table extends YastParent<TableType> {
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
export type TableCell = YastParent<TableCellType>
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
export interface TableRow extends YastParent<TableRowType> {
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
export type Text = YastLiteral<TextType>
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
export type ThematicBreak = YastNode<ThematicBreakType>
```

## Related

* [Github Flavor Markdown Spec][gfm-spec]
* [Mdast][mdast-homepage]

[homepage]: https://github.com/yozorajs/yozora/tree/main/packages/ast#readme
[gfm-spec]: https://github.github.com/gfm
[mdast-homepage]: https://github.com/syntax-tree/mdast
