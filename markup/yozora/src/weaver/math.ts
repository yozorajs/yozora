import type { Math as MathNode } from '@yozora/ast'
import { MathType } from '@yozora/ast'
import type { INodeMarkup, INodeWeaver } from '@yozora/markup-gfm-ex'
import { findMaxContinuousSymbol, lineRegex } from '@yozora/markup-gfm-ex'

const closerLikeSymbolRegex = /(\${1,})/g

export interface IMathMarkupWeaverOptions {
  readonly preferBacktick?: boolean
}

/**
 * Math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/v3/packages/ast#math
 * @see https://github.com/yozorajs/yozora/tree/v3/tokenizers/tokenizer-math
 */
export class MathWeaver implements INodeWeaver<MathNode> {
  public readonly type = MathType
  public readonly isBlockLevel = (): boolean => true
  protected readonly preferBackTick: boolean

  constructor(options?: IMathMarkupWeaverOptions) {
    this.preferBackTick = options?.preferBacktick ?? false
  }

  public weave(node: MathNode): INodeMarkup {
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
