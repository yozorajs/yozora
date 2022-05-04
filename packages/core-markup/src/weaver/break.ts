import type { Break } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * Break represents a line break, such as in poems or addresses.
 *
 * @see https://github.com/syntax-tree/mdast#break
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#break
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/break
 */
export class BreakMarkupWeaver implements IMarkupWeaver<Break> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = false

  public weave(): IMarkup | string {
    return '\\\n'
  }
}
