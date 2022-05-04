import type { Emphasis } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Emphasis represents stress emphasis of its contents.
 *
 * @see https://github.com/syntax-tree/mdast#emphasis
 * @see https://github.github.com/gfm/#emphasis-and-strong-emphasis
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#emphasis
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/emphasis
 */
export class EmphasisMarkupWeaver implements IMarkupWeaver<Emphasis> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(): IMarkup | string {
    return {
      opener: '*',
      closer: '*',
    }
  }
}
