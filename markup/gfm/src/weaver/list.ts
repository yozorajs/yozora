import type { List } from '@yozora/ast'
import { ListType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'

/**
 * List represents a list of items.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/packages/ast#list
 * @see https://github.com/yozorajs/yozora/tree/release-2.x.x/tokenizers/list
 */
export class ListWeaver implements INodeWeaver<List> {
  public readonly type = ListType
  public readonly isBlockLevel = (): boolean => true

  public weave(node: List): INodeMarkup {
    return { spread: node.spread }
  }
}
