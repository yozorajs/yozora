import type { InlineMath } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

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
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = (): boolean => false
  protected readonly preferBackTick: boolean

  constructor(options?: IInlineMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBackTick ?? true
  }

  public weave(node: InlineMath): INodeMarkup {
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
        ? { opener: `$${value}$` }
        : { opener: '`$' + value + '$`' }
    }

    const backticks: string = '`'.repeat(backtickCnt - 1)
    return { opener: `${backticks}$ ${value} $${backticks}` }
  }
}
