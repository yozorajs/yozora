import type { Math } from '@yozora/ast'
import { MathType } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'
import { findMaxContinuousSymbol } from '../util'

const closerLikeSymbolRegex = /(\$\$[`]*)/g

export interface IMathMarkupWeaverOptions {
  readonly preferBackTick: boolean
}

/**
 * Math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#math
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/math
 */
export class MathMarkupWeaver implements INodeMarkupWeaver<Math> {
  public readonly type = MathType
  public readonly isBlockLevel = (): boolean => true
  protected readonly preferBackTick: boolean

  constructor(options?: IMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBackTick ?? true
  }

  public weave(node: Math): INodeMarkup {
    const { value } = node

    const backtickCnt = findMaxContinuousSymbol(value, closerLikeSymbolRegex)
    if (backtickCnt === 0) {
      return this.preferBackTick ? { opener: `$$${value}$$` } : { opener: '`$$' + value + '$$`' }
    }

    const backticks: string = '`'.repeat(backtickCnt - 1)
    return { opener: `${backticks}$$ ${value} $$${backticks}` }
  }
}
