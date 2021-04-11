export {
  Blockquote,
  BlockquoteType,
  Break,
  BreakType,
  Code,
  CodeType,
  Definition,
  DefinitionType,
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
  Text,
  TextType,
  ThematicBreak,
  ThematicBreakType,
  YastAlignType,
} from '@yozora/ast'

/**
 * Parameters for constructing a gfm parser.
 */
export interface GfmParserProps {
  /**
   * Whether it is necessary to reserve the position in the YastNode produced.
   * @default false
   */
  readonly shouldReservePosition?: boolean
}
