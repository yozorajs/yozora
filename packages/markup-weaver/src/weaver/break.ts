import type { Break } from '@yozora/ast'
import { BreakType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * Break represents a line break, such as in poems or addresses.
 *
 * @see https://github.com/syntax-tree/mdast#break
 * @see https://github.github.com/gfm/#hard-line-breaks
 * @see https://github.github.com/gfm/#soft-line-breaks
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#break
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/break
 */
export class BreakWeaver implements INodeWeaver<Break> {
  public readonly type = BreakType
  public readonly isBlockLevel = (): boolean => false

  public weave(): INodeMarkup {
    return {
      opener: '\\',
    }
  }
}
