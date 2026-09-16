import { GfmMarkupWeaver } from '@yozora/markup-gfm'
import { DeleteWeaver } from './weaver/delete'
import { LinkWeaver } from './weaver/link'
import { TableWeaver } from './weaver/table'

export class GfmExMarkupWeaver extends GfmMarkupWeaver {
  constructor() {
    super()
    this.useWeaver(new DeleteWeaver())
      .useWeaver(new LinkWeaver(), true)
      .useWeaver(new TableWeaver())
  }
}
