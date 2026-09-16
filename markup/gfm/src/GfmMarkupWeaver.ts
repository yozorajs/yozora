import { MarkupWeaver } from './MarkupWeaver'
import { BlockquoteWeaver } from './weaver/blockquote'
import { BreakWeaver } from './weaver/break'
import { CodeWeaver } from './weaver/code'
import { DefinitionWeaver } from './weaver/definition'
import { EmphasisWeaver } from './weaver/emphasis'
import { HeadingWeaver } from './weaver/heading'
import { HtmlWeaver } from './weaver/html'
import { ImageWeaver } from './weaver/image'
import { ImageReferenceWeaver } from './weaver/imageReference'
import { InlineCodeWeaver } from './weaver/inlineCode'
import { LinkWeaver } from './weaver/link'
import { LinkReferenceWeaver } from './weaver/linkReference'
import { ListWeaver } from './weaver/list'
import { ListItemWeaver } from './weaver/listItem'
import { ParagraphWeaver } from './weaver/paragraph'
import { RootWeaver } from './weaver/root'
import { StrongWeaver } from './weaver/strong'
import { TextWeaver } from './weaver/text'
import { ThematicBreakWeaver } from './weaver/thematicBreak'

export class GfmMarkupWeaver extends MarkupWeaver {
  constructor() {
    super()
    this.useWeaver(new RootWeaver())
      .useWeaver(new BlockquoteWeaver())
      .useWeaver(new BreakWeaver())
      .useWeaver(new CodeWeaver())
      .useWeaver(new DefinitionWeaver())
      .useWeaver(new EmphasisWeaver())
      .useWeaver(new HeadingWeaver())
      .useWeaver(new HtmlWeaver())
      .useWeaver(new ImageWeaver())
      .useWeaver(new ImageReferenceWeaver())
      .useWeaver(new InlineCodeWeaver())
      .useWeaver(new LinkWeaver())
      .useWeaver(new LinkReferenceWeaver())
      .useWeaver(new ListWeaver())
      .useWeaver(new ListItemWeaver())
      .useWeaver(new ParagraphWeaver())
      .useWeaver(new StrongWeaver())
      .useWeaver(new TextWeaver())
      .useWeaver(new ThematicBreakWeaver())
  }
}
