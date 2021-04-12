import type { DefaultYastParserProps } from '@yozora/core-parser'

export {
  Admonition,
  AdmonitionType,
  Blockquote,
  BlockquoteType,
  Break,
  BreakType,
  Code,
  CodeType,
  Definition,
  DefinitionType,
  Delete,
  DeleteType,
  Emphasis,
  EmphasisType,
  Heading,
  HeadingType,
  Html,
  HtmlType,
  Image,
  ImageReference,
  ImageReferenceType,
  ImageType,
  InlineCode,
  InlineCodeType,
  InlineMath,
  InlineMathType,
  Link,
  LinkReference,
  LinkReferenceType,
  LinkType,
  List,
  ListItem,
  ListItemType,
  ListType,
  Math,
  MathType,
  Paragraph,
  ParagraphType,
  Strong,
  StrongType,
  Table,
  TableCell,
  TableCellType,
  TableColumn,
  TableRow,
  TableRowType,
  TableType,
  Text,
  TextType,
  ThematicBreak,
  ThematicBreakType,
  YastAlignType,
} from '@yozora/ast'

/**
 * Parameters for constructing a gfm parser.
 */
export type YozoraParserProps = DefaultYastParserProps