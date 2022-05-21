import type { InlineMath } from '@yozora/ast'
import { InlineMathType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'
import { findMaxContinuousSymbol } from '../util'

const closerLikeSymbolRegex = /\$([`]*)/g

export interface IInlineMathMarkupWeaverOptions {
  readonly preferBackTick: boolean
}

/**
 * Inline math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#inlinemath
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-math
 */
export class InlineMathMarkupWeaver implements INodeMarkupWeaver<InlineMath> {
  public readonly type = InlineMathType
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = (): boolean => false
  protected readonly preferBackTick: boolean

  constructor(options?: IInlineMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBackTick ?? true
  }

  public weave(node: InlineMath): INodeMarkup {
    const { value } = node

    const backtickCnt = findMaxContinuousSymbol(value, closerLikeSymbolRegex)
    if (backtickCnt === 0) {
      return this.preferBackTick ? { opener: `$${value}$` } : { opener: '`$' + value + '$`' }
    }

    const backticks: string = '`'.repeat(backtickCnt - 1)
    return { opener: `${backticks}$ ${value} $${backticks}` }
  }
}
