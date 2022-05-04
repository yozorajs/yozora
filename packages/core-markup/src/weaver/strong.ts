import type { Strong } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Strong represents strong importance, seriousness, or urgency for its contents.
 *
 * @see https://github.com/syntax-tree/mdast#strong
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#strong
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/strong
 */
export class StrongMarkupWeaver implements IMarkupWeaver<Strong> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(): IMarkup | string {
    return {
      opener: '**',
      closer: '**',
    }
  }
}
