import type { Math } from '@yozora/ast'
import { MathType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '../types'
import { findMaxContinuousSymbol, lineRegex } from '../util'

const closerLikeSymbolRegex = /(\${1,})/g

export interface IMathMarkupWeaverOptions {
  readonly preferBacktick?: boolean
}

/**
 * Math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#math
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/math
 */
export class MathWeaver implements INodeWeaver<Math> {
  public readonly type = MathType
  public readonly isBlockLevel = (): boolean => true
  protected readonly preferBackTick: boolean

  constructor(options?: IMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBacktick ?? false
  }

  public weave(node: Math): INodeMarkup {
    const value = node.value.trim()
    const isMultipleLine: boolean = lineRegex.test(value)
    const dollarCnt: number = findMaxContinuousSymbol(value, closerLikeSymbolRegex)
    if (dollarCnt === 0) {
      return { opener: isMultipleLine ? `$$\n${value}\n$$` : `$$${value}$$` }
    }

    const dollars: string = '$'.repeat(dollarCnt + 1)
    return {
      opener: isMultipleLine
        ? `${dollars}\n${value}\n${dollars}`
        : `${dollars} ${value} ${dollars}`,
    }
  }
}
