import { GfmExMarkupWeaver } from '@yozora/markup-gfm-ex'
import { AdmonitionWeaver } from './weaver/admonition'
import { EcmaImportWeaver } from './weaver/ecmaImport'
import { FootnoteWeaver } from './weaver/footnote'
import { FootnoteDefinitionWeaver } from './weaver/footnoteDefinition'
import { FootnoteReferenceWeaver } from './weaver/footnoteReference'
import { FrontmatterWeaver } from './weaver/frontmatter'
import { InlineMathWeaver } from './weaver/inlineMath'
import { MathWeaver } from './weaver/math'

export class YozoraMarkupWeaver extends GfmExMarkupWeaver {
  constructor() {
    super()
    this.useWeaver(new AdmonitionWeaver())
      .useWeaver(new EcmaImportWeaver())
      .useWeaver(new FootnoteWeaver())
      .useWeaver(new FootnoteDefinitionWeaver())
      .useWeaver(new FootnoteReferenceWeaver())
      .useWeaver(new FrontmatterWeaver())
      .useWeaver(new InlineMathWeaver())
      .useWeaver(new MathWeaver())
  }
}
