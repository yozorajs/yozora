import type { InlineMath } from '@yozora/ast'
import type { IMarkup, IMarkupWeaver } from '../types'

const symbolRegex = /(\$[`]+)/g

/**
 * Inline math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#inlinemath
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-math
 */
export class InlineMathMarkupWeaver implements IMarkupWeaver<InlineMath> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(node: InlineMath): IMarkup | string {
    const { value } = node

    let symbolCnt = 2
    for (let match: RegExpExecArray | null = null; ; ) {
      match = symbolRegex.exec(value)
      if (match == null) break

      const len: number = match[1].length ?? 0
      if (symbolCnt <= len) symbolCnt = len + 1
    }

    if (symbolCnt === 2) return '`$' + value + '$`'

    const symbol: string = '`'.repeat(symbolCnt - 1)
    return {
      opener: symbol + '$ ',
      closer: ' $' + symbol,
      content: value,
    }
  }
}
