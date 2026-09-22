import type * as Ast from '@yozora/ast'

/**
 * Checked against source by the workspace typecheck, and against published
 * declarations by both NodeNext consumers in the entrypoint verification script.
 */
export type SharedExports = [
  Ast.NodeType,
  Ast.Node,
  Ast.Parent,
  Ast.Literal,
  Ast.Resource,
  Ast.Association,
  Ast.Reference,
  Ast.Alternative,
  Ast.Point,
  Ast.Position,
  Ast.AlignType,
  Ast.TableColumn,
  Ast.IEcmaImportNamedImport,
  Ast.TaskStatus,
  Ast.HtmlContentType,
]

export type NodeExports = [
  [Ast.Admonition, Ast.AdmonitionType],
  [Ast.Blockquote, Ast.BlockquoteType],
  [Ast.Break, Ast.BreakType],
  [Ast.Code, Ast.CodeType],
  [Ast.Definition, Ast.DefinitionType],
  [Ast.Delete, Ast.DeleteType],
  [Ast.EcmaImport, Ast.EcmaImportType],
  [Ast.Emphasis, Ast.EmphasisType],
  [Ast.FootnoteDefinition, Ast.FootnoteDefinitionType],
  [Ast.FootnoteReference, Ast.FootnoteReferenceType],
  [Ast.Footnote, Ast.FootnoteType],
  [Ast.Frontmatter, Ast.FrontmatterType],
  [Ast.Heading, Ast.HeadingType],
  [Ast.Html, Ast.HtmlType],
  [Ast.ImageReference, Ast.ImageReferenceType],
  [Ast.Image, Ast.ImageType],
  [Ast.InlineCode, Ast.InlineCodeType],
  [Ast.InlineMath, Ast.InlineMathType],
  [Ast.LinkReference, Ast.LinkReferenceType],
  [Ast.Link, Ast.LinkType],
  [Ast.ListItem, Ast.ListItemType],
  [Ast.List, Ast.ListType],
  [Ast.Math, Ast.MathType],
  [Ast.Paragraph, Ast.ParagraphType],
  [Ast.Root, Ast.RootType],
  [Ast.Strong, Ast.StrongType],
  [Ast.TableCell, Ast.TableCellType],
  [Ast.TableRow, Ast.TableRowType],
  [Ast.Table, Ast.TableType],
  [Ast.Text, Ast.TextType],
  [Ast.ThematicBreak, Ast.ThematicBreakType],
]

const node: Ast.Node = { type: 'extension' }
const point: Ast.Point = { line: 1, column: 1 }
const position: Ast.Position = { start: point, end: point }
const root: Ast.Root = { type: 'root', children: [] }
const text: Ast.Text = { type: 'text', value: 'text' }
const link: Ast.Link = { type: 'link', url: '/', children: [text] }
const image: Ast.Image = { type: 'image', url: '/', alt: '' }
const heading: Ast.Heading = { type: 'heading', depth: 6, children: [text] }
const listItem: Ast.ListItem = { type: 'listItem', children: [] }
const list: Ast.List = {
  type: 'list',
  ordered: false,
  marker: 45,
  spread: false,
  children: [listItem],
}
const row: Ast.TableRow = {
  type: 'tableRow',
  children: [{ type: 'tableCell', children: [text] }],
}
const table: Ast.Table = { type: 'table', columns: [{ align: null }], children: [row] }
const admonition: Ast.Admonition = {
  type: 'admonition',
  keyword: 'custom',
  title: [],
  children: [],
}
const ecmaImport: Ast.EcmaImport = {
  type: 'ecmaImport',
  moduleName: 'example',
  defaultImport: null,
  namedImports: [{ src: 'value', alias: null }],
}
const depths: Ast.Heading['depth'][] = [1, 2, 3, 4, 5, 6]
const alignments: Ast.AlignType[] = ['left', 'right', 'center', null]
const referenceTypes: Ast.Reference['referenceType'][] = ['full', 'collapsed', 'shortcut']

node.position = position
root.children.push(text)
text.value = 'updated'
link.title = 'title'
heading.depth = 1
position.indent = [1]

// @ts-expect-error A node must have a discriminant.
const missingType: Ast.Node = {}
// @ts-expect-error A parent must have children, even when empty.
const missingChildren: Ast.Parent = { type: 'root' }
// @ts-expect-error A text node must have a value, even when empty.
const missingValue: Ast.Text = { type: 'text' }
// @ts-expect-error A link must have a URL.
const missingUrl: Ast.Link = { type: 'link', children: [] }
// @ts-expect-error An image must have alternative text, even when empty.
const missingAlt: Ast.Image = { type: 'image', url: '/' }
// @ts-expect-error Associations require both the normalized and original identifiers.
const missingIdentifier: Ast.Association = { label: 'label' }
// @ts-expect-error Associations require both the normalized and original identifiers.
const missingLabel: Ast.Association = { identifier: 'label' }
// @ts-expect-error Source points require a line number.
const missingLine: Ast.Point = { column: 1 }
// @ts-expect-error Source points require a column number.
const missingColumn: Ast.Point = { line: 1 }
// @ts-expect-error Positions require both boundaries.
const missingStart: Ast.Position = { end: point }
// @ts-expect-error Positions require both boundaries.
const missingEnd: Ast.Position = { start: point }

// @ts-expect-error The discriminant remains readonly even when assigning the same value.
node.type = 'extension'
// @ts-expect-error Source point coordinates are readonly.
point.line = 2
// @ts-expect-error Source point coordinates are readonly.
point.column = 2
// @ts-expect-error The optional source offset is also readonly.
point.offset = 0

// @ts-expect-error A text node cannot use another node's discriminant.
const wrongTextType: Ast.Text['type'] = 'paragraph'
// @ts-expect-error Heading depth starts at one.
const zeroDepth: Ast.Heading['depth'] = 0
// @ts-expect-error Heading depth ends at six.
const excessiveDepth: Ast.Heading['depth'] = 7
// @ts-expect-error Only the three named alignments or null are supported.
const invalidAlignment: Ast.AlignType = 'justify'
// @ts-expect-error Reference kinds are a closed union.
const invalidReference: Ast.Reference['referenceType'] = 'partial'
// @ts-expect-error Lists contain list items.
list.children.push(text)
// @ts-expect-error Tables contain rows.
table.children.push(text)
// @ts-expect-error Table rows contain cells.
row.children.push(text)
