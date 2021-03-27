export {
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
  Link,
  LinkReference,
  LinkReferenceType,
  LinkType,
  List,
  ListItem,
  ListItemType,
  ListType,
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
export interface GFMParserProps {
  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   * @default false
   */
  readonly shouldReservePosition?: boolean
}
