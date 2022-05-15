import {
  AdmonitionType,
  BlockquoteType,
  BreakType,
  CodeType,
  DefinitionType,
  DeleteType,
  EcmaImportType,
  EmphasisType,
  FootnoteDefinitionType,
  FootnoteReferenceType,
  FootnoteType,
  FrontmatterType,
  HeadingType,
  HtmlType,
  ImageReferenceType,
  ImageType,
  InlineCodeType,
  InlineMathType,
  LinkReferenceType,
  LinkType,
  ListItemType,
  ListType,
  MathType,
  ParagraphType,
  StrongType,
  TableType,
  TextType,
  ThematicBreakType,
} from '@yozora/ast'
import { MarkupWeaver } from './MarkupWeaver'
import type { IMarkupWeaver } from './types'
import { AdmonitionMarkupWeaver } from './weaver/admonition'
import { BlockquoteMarkupWeaver } from './weaver/blockquote'
import { BreakMarkupWeaver } from './weaver/break'
import { CodeMarkupWeaver } from './weaver/code'
import { DefinitionMarkupWeaver } from './weaver/definition'
import { DeleteMarkupWeaver } from './weaver/delete'
import { EcmaImportMarkupWeaver } from './weaver/ecmaImport'
import { EmphasisMarkupWeaver } from './weaver/emphasis'
import { FootnoteMarkupWeaver } from './weaver/footnote'
import { FootnoteDefinitionMarkupWeaver } from './weaver/footnoteDefinition'
import { FootnoteReferenceMarkupWeaver } from './weaver/footnoteReference'
import { FrontmatterMarkupWeaver } from './weaver/frontmatter'
import { HeadingMarkupWeaver } from './weaver/heading'
import { HtmlMarkupWeaver } from './weaver/html'
import { ImageMarkupWeaver } from './weaver/image'
import { ImageReferenceMarkupWeaver } from './weaver/imageReference'
import { InlineCodeMarkupWeaver } from './weaver/inlineCode'
import { InlineMathMarkupWeaver } from './weaver/inlineMath'
import { LinkMarkupWeaver } from './weaver/link'
import { LinkReferenceMarkupWeaver } from './weaver/linkReference'
import { ListMarkupWeaver } from './weaver/list'
import { ListItemMarkupWeaver } from './weaver/listItem'
import { MathMarkupWeaver } from './weaver/math'
import { ParagraphMarkupWeaver } from './weaver/paragraph'
import { StrongMarkupWeaver } from './weaver/strong'
import { TableMarkupWeaver } from './weaver/table'
import { TextMarkupWeaver } from './weaver/text'
import { ThematicBreakMarkupWeaver } from './weaver/thematicBreak'

export const defaultMarkupWeaver: IMarkupWeaver = new MarkupWeaver()
  .useWeaver(AdmonitionType, new AdmonitionMarkupWeaver())
  .useWeaver(BlockquoteType, new BlockquoteMarkupWeaver())
  .useWeaver(BreakType, new BreakMarkupWeaver())
  .useWeaver(CodeType, new CodeMarkupWeaver())
  .useWeaver(DefinitionType, new DefinitionMarkupWeaver())
  .useWeaver(DeleteType, new DeleteMarkupWeaver())
  .useWeaver(EcmaImportType, new EcmaImportMarkupWeaver())
  .useWeaver(EmphasisType, new EmphasisMarkupWeaver())
  .useWeaver(FootnoteType, new FootnoteMarkupWeaver())
  .useWeaver(FootnoteDefinitionType, new FootnoteDefinitionMarkupWeaver())
  .useWeaver(FootnoteReferenceType, new FootnoteReferenceMarkupWeaver())
  .useWeaver(FrontmatterType, new FrontmatterMarkupWeaver())
  .useWeaver(HeadingType, new HeadingMarkupWeaver())
  .useWeaver(HtmlType, new HtmlMarkupWeaver())
  .useWeaver(ImageType, new ImageMarkupWeaver())
  .useWeaver(ImageReferenceType, new ImageReferenceMarkupWeaver())
  .useWeaver(InlineCodeType, new InlineCodeMarkupWeaver())
  .useWeaver(InlineMathType, new InlineMathMarkupWeaver())
  .useWeaver(LinkType, new LinkMarkupWeaver())
  .useWeaver(LinkReferenceType, new LinkReferenceMarkupWeaver())
  .useWeaver(ListType, new ListMarkupWeaver())
  .useWeaver(ListItemType, new ListItemMarkupWeaver())
  .useWeaver(MathType, new MathMarkupWeaver())
  .useWeaver(ParagraphType, new ParagraphMarkupWeaver())
  .useWeaver(StrongType, new StrongMarkupWeaver())
  .useWeaver(TableType, new TableMarkupWeaver())
  .useWeaver(TextType, new TextMarkupWeaver())
  .useWeaver(ThematicBreakType, new ThematicBreakMarkupWeaver())
