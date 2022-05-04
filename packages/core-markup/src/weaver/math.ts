import type { Math } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

/**
 * Math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#math
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/math
 */
export class MathMarkupWeaver implements INodeMarkupWeaver<Math> {
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = true

  public weave(node: Math): string | INodeMarkup {
    return `$$${node.value}$$`
  }
}
