import type { InlineMath } from '@yozora/ast'
import type { INodeMarkup, INodeMarkupWeaver } from '../types'

const symbolRegex = /(\$[`]+)/g

/**
 * Inline math content.
 *
 * @see https://github.com/yozorajs/yozora/tree/main/packages/ast#inlinemath
 * @see https://github.com/yozorajs/yozora/tree/main/tokenizers/inline-math
 */
export class InlineMathMarkupWeaver implements INodeMarkupWeaver<InlineMath> {
  public readonly couldBeWrapped = true
  public readonly isBlockLevel = false

  public weave(node: InlineMath): INodeMarkup | string {
    const { value } = node

    let symbolCnt = 0
    for (let match: RegExpExecArray | null = null; ; ) {
      match = symbolRegex.exec(value)
      if (match == null) break

      const len: number = match[1].length ?? 0
      if (symbolCnt < len) symbolCnt = len
    }

    if (symbolCnt === 0) return '`$' + value + '$`'

    const symbol: string = '`'.repeat(symbolCnt - 1)
    return {
      opener: symbol + '$ ',
      closer: ' $' + symbol,
      content: value,
    }
  }
}
