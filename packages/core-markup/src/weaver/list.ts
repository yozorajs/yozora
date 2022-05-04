import type { List } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

/**
 * List represents a list of items.
 *
 * @see https://github.com/syntax-tree/mdast#list
 * @see https://github.github.com/gfm/#list
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#list
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/list
 */
export class ListMarkupWeaver implements IMarkupWeaver<List> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = true

  public weave(): IMarkup | string {
    return {}
  }
}
