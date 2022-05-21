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
  .useWeaver(new AdmonitionMarkupWeaver())
  .useWeaver(new BlockquoteMarkupWeaver())
  .useWeaver(new BreakMarkupWeaver())
  .useWeaver(new CodeMarkupWeaver())
  .useWeaver(new DefinitionMarkupWeaver())
  .useWeaver(new DeleteMarkupWeaver())
  .useWeaver(new EcmaImportMarkupWeaver())
  .useWeaver(new EmphasisMarkupWeaver())
  .useWeaver(new FootnoteMarkupWeaver())
  .useWeaver(new FootnoteDefinitionMarkupWeaver())
  .useWeaver(new FootnoteReferenceMarkupWeaver())
  .useWeaver(new FrontmatterMarkupWeaver())
  .useWeaver(new HeadingMarkupWeaver())
  .useWeaver(new HtmlMarkupWeaver())
  .useWeaver(new ImageMarkupWeaver())
  .useWeaver(new ImageReferenceMarkupWeaver())
  .useWeaver(new InlineCodeMarkupWeaver())
  .useWeaver(new InlineMathMarkupWeaver())
  .useWeaver(new LinkMarkupWeaver())
  .useWeaver(new LinkReferenceMarkupWeaver())
  .useWeaver(new ListMarkupWeaver())
  .useWeaver(new ListItemMarkupWeaver())
  .useWeaver(new MathMarkupWeaver())
  .useWeaver(new ParagraphMarkupWeaver())
  .useWeaver(new StrongMarkupWeaver())
  .useWeaver(new TableMarkupWeaver())
  .useWeaver(new TextMarkupWeaver())
  .useWeaver(new ThematicBreakMarkupWeaver())
