import type { Break } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Break represents a line break, such as in poems or addresses.
 *
 * @see https://github.com/syntax-tree/mdast#break
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#break
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/break
 */
export class BreakMarkupWeaver implements INodeMarkupWeaver<Break> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = false

  public weave(): INodeMarkup | string {
    return '\\\n'
  }
}
