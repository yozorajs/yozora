import {
  BlockquoteWeaver,
  BreakWeaver,
  CodeWeaver,
  DefinitionWeaver,
  EmphasisWeaver,
  HeadingWeaver,
  HtmlWeaver,
  ImageReferenceWeaver,
  ImageWeaver,
  InlineCodeWeaver,
  LinkReferenceWeaver,
  LinkWeaver,
  ListItemWeaver,
  ListWeaver,
  MarkupWeaver,
  ParagraphWeaver,
  RootWeaver,
  StrongWeaver,
  TextWeaver,
  ThematicBreakWeaver,
} from '@yozora/markup'

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
