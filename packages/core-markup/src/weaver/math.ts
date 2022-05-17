import type { Math } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

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
  public readonly couldBeWrapped = false
  public readonly isBlockLevel = (): boolean => true
  protected readonly preferBackTick: boolean

  constructor(options?: IMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBackTick ?? true
  }

  public weave(node: Math): INodeMarkup {
    const { value } = node

    let backtickCnt = 0
    let nonCloserLikeSymbol = true
    for (let match: RegExpExecArray | null = null; ; ) {
      match = closerLikeSymbolRegex.exec(value)
      if (match == null) break

      nonCloserLikeSymbol = false
      const len: number = match[1].length
      if (backtickCnt < len) backtickCnt = len
    }

    if (backtickCnt === 0) {
      return nonCloserLikeSymbol && this.preferBackTick
        ? { opener: `$$${value}$$` }
        : { opener: '`$$' + value + '$$`' }
    }

    const backticks: string = '`'.repeat(backtickCnt - 1)
    return { opener: `${backticks}$$ ${value} $$${backticks}` }
  }
}
