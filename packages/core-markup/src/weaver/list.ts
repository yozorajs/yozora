import type { List } from '@yozora/ast'
import { ListType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * List represents a list of items.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#list
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/list
 */
export class ListMarkupWeaver implements INodeMarkupWeaver<List> {
  public readonly type = ListType
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = (): boolean => true

  public weave(node: List): INodeMarkup {
    return { spread: node.spread }
  }
}
