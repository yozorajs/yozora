import { MarkupWeaver } from './MarkupWeaver'
import type { IMarkupWeaver } from './types'
import { AdmonitionWeaver } from './weaver/admonition'
import type { IBlockquoteWeaverProps } from './weaver/blockquote'
import { BlockquoteWeaver } from './weaver/blockquote'
import { BreakWeaver } from './weaver/break'
import { CodeWeaver } from './weaver/code'
import { DefinitionWeaver } from './weaver/definition'
import { DeleteWeaver } from './weaver/delete'
import { EcmaImportWeaver } from './weaver/ecmaImport'
import { EmphasisWeaver } from './weaver/emphasis'
import { FootnoteWeaver } from './weaver/footnote'
import { FootnoteDefinitionWeaver } from './weaver/footnoteDefinition'
import { FootnoteReferenceWeaver } from './weaver/footnoteReference'
import { FrontmatterWeaver } from './weaver/frontmatter'
import { HeadingWeaver } from './weaver/heading'
import { HtmlWeaver } from './weaver/html'
import { ImageWeaver } from './weaver/image'
import { ImageReferenceWeaver } from './weaver/imageReference'
import { InlineCodeWeaver } from './weaver/inlineCode'
import { InlineMathWeaver } from './weaver/inlineMath'
import { LinkWeaver } from './weaver/link'
import { LinkReferenceWeaver } from './weaver/linkReference'
import { ListWeaver } from './weaver/list'
import { ListItemWeaver } from './weaver/listItem'
import { MathWeaver } from './weaver/math'
import { ParagraphWeaver } from './weaver/paragraph'
import { RootWeaver } from './weaver/root'
import { StrongWeaver } from './weaver/strong'
import { TableWeaver } from './weaver/table'
import { TextWeaver } from './weaver/text'
import { ThematicBreakWeaver } from './weaver/thematicBreak'

export interface IDefaultMarkupWeaverProps extends IBlockquoteWeaverProps {}

export class DefaultMarkupWeaver extends MarkupWeaver implements IMarkupWeaver {
  constructor(props: IDefaultMarkupWeaverProps = {}) {
    super()
    this.useWeaver(new RootWeaver())
      .useWeaver(new AdmonitionWeaver())
      .useWeaver(new BlockquoteWeaver({ enableGithubCallout: props.enableGithubCallout }))
      .useWeaver(new BreakWeaver())
      .useWeaver(new CodeWeaver())
      .useWeaver(new DefinitionWeaver())
      .useWeaver(new DeleteWeaver())
      .useWeaver(new EcmaImportWeaver())
      .useWeaver(new EmphasisWeaver())
      .useWeaver(new FootnoteWeaver())
      .useWeaver(new FootnoteDefinitionWeaver())
      .useWeaver(new FootnoteReferenceWeaver())
      .useWeaver(new FrontmatterWeaver())
      .useWeaver(new HeadingWeaver())
      .useWeaver(new HtmlWeaver())
      .useWeaver(new ImageWeaver())
      .useWeaver(new ImageReferenceWeaver())
      .useWeaver(new InlineCodeWeaver())
      .useWeaver(new InlineMathWeaver())
      .useWeaver(new LinkWeaver())
      .useWeaver(new LinkReferenceWeaver())
      .useWeaver(new ListWeaver())
      .useWeaver(new ListItemWeaver())
      .useWeaver(new MathWeaver())
      .useWeaver(new ParagraphWeaver())
      .useWeaver(new StrongWeaver())
      .useWeaver(new TableWeaver())
      .useWeaver(new TextWeaver())
      .useWeaver(new ThematicBreakWeaver())
  }
}
